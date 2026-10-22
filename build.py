import json, glob, os, shutil
B=os.path.dirname(os.path.abspath(__file__)); D=os.path.join(B,'dist')
shutil.rmtree(D, ignore_errors=True); os.makedirs(D+'/places')
views={}
for f in glob.glob(B+'/places/*.json'):
    d=json.load(open(f)); views[d['id']]={k:d[k] for k in ('km','elevMin','elevMax','date','bbox')}
    for suf in ('-sat.jpg','-dem.png'): shutil.copy(B+'/places/'+d['id']+suf, D+'/places/')
for f in glob.glob(B+'/thumbs/*.jpg'): shutil.copy(f, D+'/places/')
for f in ('three.min.js','places.js','earth.jpg','earth-bump.jpg','earth-land.png'): shutil.copy(B+'/site/'+f, D)
photos=json.load(open(B+'/photos.json')) if os.path.exists(B+'/photos.json') else {}
for ph in photos.values():
    for x in ph: shutil.copy(B+'/'+x['src'], D+'/places/'); shutil.copy(B+'/'+x['small'], D+'/places/')
html=open(B+'/site/index.html').read().replace('__PLACE_VIEWS__', json.dumps(views, separators=(',',':'))).replace('__PLACE_PHOTOS__', json.dumps(photos, separators=(',',':')))
open(D+'/index.html','w').write(html)
ids=[p for p in views]; print(len(ids), 'places')

# The same app as a normal website (GitHub Pages serves the docs/ folder). A real
# site can ask for the phone's motion sensors and camera, which the preview can't.
W=os.path.join(B,'docs'); shutil.rmtree(W, ignore_errors=True); shutil.copytree(D, W)
head='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="theme-color" content="#081113">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
page=html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
cut=page.index('<style>'); page=head+page[:cut]+page[cut:]
open(W+'/index.html','w').write(page)
open(W+'/.nojekyll','w').close()
# photo credits, one line per photo
lines=['# Photo credits','','Photos from Wikimedia Commons, used under their licenses.','']
for pid in sorted(photos):
    for x in photos[pid]: lines.append(f"- {pid}: [{x['title'].replace('File:','')}]({x['page']}) by {x['author']}, [{x['license']}]({x['licenseUrl']})")
open(os.path.join(B,'CREDITS.md'),'w').write('\n'.join(lines)+'\n')
print('docs/ written')
