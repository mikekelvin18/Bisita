# Finds and downloads freely licensed Wikimedia Commons photos for each place.
#   python3 -I tools/commons_photos.py search            -> candidates/<id>.json (+ small previews)
#   python3 -I tools/commons_photos.py fetch picks.json  -> places/<id>-pN.jpg, places/<id>-pN-s.jpg, photos.json
import json, os, sys, re, html, time, urllib.request, urllib.parse
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "UnknownAppPrototype/0.1 (https://github.com/mikekelvin18; prototype photo gallery)"}
FREE = re.compile(r"^(CC BY(-SA)? [0-9.]+|CC0|Public domain|PD.*|CC BY-SA [0-9.]+ .*)$", re.I)

def get(url, tries=6):
    for t in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                time.sleep(0.5); return r.read()
        except Exception as e:
            if t == tries - 1: raise
            wait = 2 ** (t + 1)
            if getattr(e, "code", 0) == 429: wait = max(wait, int(e.headers.get("Retry-After") or 0), 15)
            time.sleep(wait)

def api(**q):
    q.update(format="json", formatversion="2")
    return json.loads(get(API + "?" + urllib.parse.urlencode(q)))

def up(thumb, width):
    # thumb.wikimedia.org is blocked here; the same path works on upload.wikimedia.org
    u = thumb.split("?")[0].replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/")
    return re.sub(r"/\d+px-", f"/{width}px-", u)

def clean(s): return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()

def info(query, limit=40, width=1280):
    d = api(action="query", generator="search", gsrnamespace=6, gsrsearch=query, gsrlimit=limit,
            prop="imageinfo", iiprop="url|size|extmetadata|mime", iiurlwidth=width)
    out = []
    for pg in (d.get("query") or {}).get("pages", []):
        ii = (pg.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
        g = lambda k: clean((m.get(k) or {}).get("value"))
        out.append(dict(title=pg["title"], idx=pg.get("index", 99), w=ii.get("width"), h=ii.get("height"), mime=ii.get("mime"),
                        thumb=ii.get("thumburl"), page=ii.get("descriptionurl"), author=g("Artist") or g("Credit"),
                        license=g("LicenseShortName"), licenseUrl=g("LicenseUrl"), desc=g("ImageDescription")[:200]))
    return sorted(out, key=lambda x: x["idx"])

def usable(c):
    return c["mime"] == "image/jpeg" and c["w"] and c["w"] >= 1600 and 1.2 <= c["w"] / c["h"] <= 2.2 and FREE.match(c["license"] or "") and c["author"]

QUERY = {"swiss-alps": "Matterhorn", "giza": "Giza pyramid", "galapagos": "Galapagos", "iguazu": "Iguazu", "niagara": "Niagara Falls",
         "zhangjiajie": "Zhangjiajie", "great-wall": "Great Wall", "torres-del-paine": "Torres del Paine", "fiordland": "Milford Sound"}

def search(only=()):
    js = open(os.path.join(B, "site", "places.js")).read()
    places = [dict(id=a, name=b) for a, b in re.findall(r'id: "([^"]+)", name: "([^"]+)"', js)]
    os.makedirs(os.path.join(B, "candidates"), exist_ok=True)
    for p in places:
        if only and p["id"] not in only: continue
        q = QUERY.get(p["id"], p["name"])
        seen, cands = set(), []
        for s in (f'"{q}" incategory:Featured_pictures_on_Wikimedia_Commons', f'"{q}" incategory:Quality_images', f'"{q}" filetype:bitmap'):
            try: res = info(s)
            except Exception as e: print("search failed", p["id"], e); continue
            for c in res:
                if c["title"] not in seen and usable(c): seen.add(c["title"]); cands.append(c)
            if len(cands) >= 16: break
        json.dump(cands[:16], open(os.path.join(B, "candidates", p["id"] + ".json"), "w"), indent=1)
        print(p["id"], len(cands))

SKIP = re.compile(r"(?!)")  # picks are made by hand, see candidates/

def fetch(n=5):
    # Downloads the top candidates (Featured pictures first, then Quality images) at 960px
    # and makes the square-thumb copy locally, which keeps requests to Wikimedia low.
    from PIL import Image
    out = json.load(open(os.path.join(B, "photos.json"))) if os.path.exists(os.path.join(B, "photos.json")) else {}
    for f in sorted(os.listdir(os.path.join(B, "candidates"))):
        pid = f[:-5]
        if len(out.get(pid, [])) >= n: continue
        cands = [c for c in json.load(open(os.path.join(B, "candidates", f))) if not SKIP.search(c["title"] + " " + c["desc"])]
        out[pid] = []
        for c in cands:
            if len(out[pid]) >= n: break
            k = len(out[pid]); big = os.path.join(B, "places", f"{pid}-p{k}.jpg"); small = big[:-4] + "-s.jpg"
            try: open(big, "wb").write(get(up(c["thumb"], 960)))
            except Exception as e: print("failed", pid, c["title"], e); continue
            im = Image.open(big).convert("RGB"); im.thumbnail((240, 240)); im.save(small, quality=82)
            out[pid].append({k2: c[k2] for k2 in ("title", "page", "author", "license", "licenseUrl", "w", "h")} | {"src": f"places/{pid}-p{k}.jpg", "small": f"places/{pid}-p{k}-s.jpg"})
            json.dump(out, open(os.path.join(B, "photos.json"), "w"), indent=1)
        print(pid, len(out[pid]), flush=True)

if __name__ == "__main__":
    search(sys.argv[2:]) if sys.argv[1] == "search" else fetch()
