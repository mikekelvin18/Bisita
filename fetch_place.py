import json, sys, math, io, os, urllib.request, re
import numpy as np, mgrs, rasterio
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.transform import from_bounds
from PIL import Image
pid, lat, lon, km, months = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), json.loads(sys.argv[5])
OUT=sys.argv[6]; os.makedirs(OUT, exist_ok=True)
OVR=sys.argv[7] if len(sys.argv)>7 else ''
BUCKET="https://sentinel-cogs.s3.us-west-2.amazonaws.com"
def get(u): return urllib.request.urlopen(u, timeout=60).read()
dlat=km/2/111.32; dlon=km/2/(111.32*math.cos(math.radians(lat)))
W,S,E,N=lon-dlon,lat-dlat,lon+dlon,lat+dlat
NPX=1024
m=mgrs.MGRS()
tiles=[]
for la,lo in [(lat,lon),(S,W),(N,E),(S,E),(N,W)]:
    t=m.toMGRS(la,lo,MGRSPrecision=0)
    if t not in tiles: tiles.append(t)
if OVR: tiles.insert(0,OVR)
def scenes(tile, yr, mo):
    z,b,sq=tile[:-3].lstrip('0'),tile[-3],tile[-2:]
    pre=f"sentinel-s2-l2a-cogs/{z}/{b}/{sq}/{yr}/{mo}/"
    x=get(f"{BUCKET}/?list-type=2&prefix={pre}&delimiter=/").decode()
    return re.findall(r"<Prefix>(sentinel-s2-l2a-cogs/[^<]+_L2A/)</Prefix>",x)
dst_t=from_bounds(W,S,E,N,NPX,NPX)
def read_tci(prefix):
    arr=np.zeros((3,NPX,NPX),np.uint8)
    with rasterio.open(f"/vsicurl/{BUCKET}/{prefix}TCI.tif") as src:
        for i in range(3):
            reproject(rasterio.band(src,i+1),arr[i],dst_transform=dst_t,dst_crs="EPSG:4326",resampling=Resampling.bilinear)
    return arr
cands=[]
for yr in (2025,2024):
    for mo in months:
        for t in tiles[:2]:
            try:
                for p in scenes(t,yr,mo):
                    name=p.rstrip('/').split('/')[-1]
                    meta=json.loads(get(f"{BUCKET}/{p}{name}.json"))
                    pr=meta.get('properties',{})
                    cands.append((pr.get('eo:cloud_cover',100), pr.get('s2:nodata_pixel_percentage',100), p))
            except Exception as e: print('list fail',t,yr,mo,e,file=sys.stderr)
    if sum(1 for c in cands if c[0]<3)>=4: break
cands.sort(key=lambda c:(c[0]+c[1]*0.5))
best=None
for cc,nd,p in cands[:14]:
    try: a=read_tci(p)
    except Exception as e: print('read fail',p,e,file=sys.stderr); continue
    blank=(a.sum(0)==0).mean()
    if best is None or blank<best[0]: best=(blank,cc,p,a)
    if blank<0.01: break
blank,cc,p,a=best
# fill blanks from same date on other tiles
if blank>0.01:
    date=p.split('_')[2]
    for t in tiles[1:]:
        z,b,sq=t[:-3].lstrip('0'),t[-3],t[-2:]
        for q in scenes(t,int(date[:4]),int(date[4:6])):
            if date in q:
                try:
                    a2=read_tci(q); mask=(a.sum(0)==0); a[:,mask]=a2[:,mask]
                except Exception as e: print('fill fail',e,file=sys.stderr)
    blank=(a.sum(0)==0).mean()
img=np.transpose(a,(1,2,0)).astype(float)
valid=img.sum(2)>0
hi=np.percentile(img[valid],99.0) if valid.any() else 255
lo=np.percentile(img[valid],0.5) if valid.any() else 0
img=np.clip((img-lo)/max(1,hi-lo),0,1)
img=np.clip(255*(img**0.92)*0.97,0,255).astype(np.uint8)
Image.fromarray(img).save(f"{OUT}/{pid}-sat.jpg",quality=82,optimize=True,progressive=True)
# elevation from terrarium tiles
z=max(8,min(14,int(math.log2(40075*math.cos(math.radians(lat))/(km/2)))))
def tile_xy(la,lo,z):
    n=2**z; x=(lo+180)/360*n; y=(1-math.asinh(math.tan(math.radians(la)))/math.pi)/2*n; return x,y
x0,y0=tile_xy(N,W,z); x1,y1=tile_xy(S,E,z)
tx=range(int(x0),int(x1)+1); ty=range(int(y0),int(y1)+1)
mos=np.zeros((256*len(ty),256*len(tx)),float)
for j,yy in enumerate(ty):
    for i,xx in enumerate(tx):
        t=np.array(Image.open(io.BytesIO(get(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{xx}/{yy}.png"))).convert('RGB'),float)
        mos[j*256:(j+1)*256,i*256:(i+1)*256]=t[...,0]*256+t[...,1]+t[...,2]/256-32768
G=256
out=np.zeros((G,G))
for r in range(G):
    la=N-(N-S)*r/(G-1)
    for c in range(G):
        lo=W+(E-W)*c/(G-1)
        px,py=tile_xy(la,lo,z); fx=(px-int(x0))*256; fy=(py-int(y0))*256
        ix=min(int(fx),mos.shape[1]-2); iy=min(int(fy),mos.shape[0]-2); dx=fx-ix; dy=fy-iy
        out[r,c]=(mos[iy,ix]*(1-dx)*(1-dy)+mos[iy,ix+1]*dx*(1-dy)+mos[iy+1,ix]*(1-dx)*dy+mos[iy+1,ix+1]*dx*dy)
out=np.maximum(out,0.0)
lo_,hi_=float(out.min()),float(out.max())
q=np.round((out-lo_)/max(1,hi_-lo_)*65535).astype(np.uint32)
rgb=np.zeros((G,G,3),np.uint8); rgb[...,0]=q>>8; rgb[...,1]=q&255
Image.fromarray(rgb).save(f"{OUT}/{pid}-dem.png")
date=p.split('_')[2]
info=dict(id=pid,bbox=[W,S,E,N],km=km,elevMin=round(lo_),elevMax=round(hi_),scene=p.rstrip('/').split('/')[-1],date=f"{date[:4]}-{date[4:6]}-{date[6:8]}",cloud=cc,blank=round(float(blank),4),demZoom=z)
json.dump(info,open(f"{OUT}/{pid}.json","w")); print(json.dumps(info))
