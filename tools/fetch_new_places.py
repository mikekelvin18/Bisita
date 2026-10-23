# Fetches satellite, elevation and photos for every place in tools/requests/places.json
# that doesn't have them yet. Runs on GitHub Actions (see .github/workflows/data.yml).
import json, os, subprocess, sys
from PIL import Image, ImageOps
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
req = json.load(open(os.path.join(B, "tools", "requests", "places.json")))
for r in req:
    if os.path.exists(os.path.join(B, "places", r["id"] + ".json")): continue
    print("satellite and elevation:", r["id"], flush=True)
    res = subprocess.run([sys.executable, os.path.join(B, "fetch_place.py"), r["id"], str(r["lat"]), str(r["lon"]), str(r["km"]),
                    json.dumps(r["months"]), os.path.join(B, "places")], check=False, capture_output=True, text=True)
    os.makedirs(os.path.join(B, "data"), exist_ok=True)
    with open(os.path.join(B, "data", "fetch-log.txt"), "a") as log:
        log.write(f"== {r['id']} exit {res.returncode}\n{res.stdout[-3000:]}\n{res.stderr[-6000:]}\n")
# photos: search Wikimedia Commons, then download the top freely licensed ones
sys.path.insert(0, os.path.join(B, "tools"))
import commons_photos as cp
photos = json.load(open(os.path.join(B, "photos.json"))) if os.path.exists(os.path.join(B, "photos.json")) else {}
need = [r for r in req if len(photos.get(r["id"], [])) < 3]
for r in need: cp.QUERY[r["id"]] = r["query"]
if need:
    cp.search([r["id"] for r in need])
    cp.fetch()
photos = json.load(open(os.path.join(B, "photos.json")))
for r in req:
    th = os.path.join(B, "thumbs", r["id"] + "-thumb.jpg")
    ph = photos.get(r["id"], [])
    if ph and not os.path.exists(th):
        im = ImageOps.fit(Image.open(os.path.join(B, ph[0]["src"])).convert("RGB"), (200, 200), Image.LANCZOS)
        im.save(th, quality=84)
for r in req:
    print(r["id"], "json" if os.path.exists(os.path.join(B, "places", r["id"] + ".json")) else "NO SATELLITE",
          len(photos.get(r["id"], [])), "photos", flush=True)
