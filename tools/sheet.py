# Contact sheet of a place's candidates: python3 -I tools/sheet.py <id>
import re, json, os, sys, io, urllib.request, time
from PIL import Image, ImageDraw
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "UnknownAppPrototype/0.1 (https://github.com/mikekelvin18; prototype photo gallery)"}
pid = sys.argv[1]; cands = json.load(open(f"{B}/candidates/{pid}.json"))[:12]
os.makedirs(f"{B}/prev", exist_ok=True)
W, H = 330, 220; cols = 4; rows = (len(cands) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * H), "black"); d = ImageDraw.Draw(sheet)
for i, c in enumerate(cands):
    f = f"{B}/prev/{pid}-{i}.jpg"
    if not os.path.exists(f):
        for t in range(4):
            try:
                data = urllib.request.urlopen(urllib.request.Request(re.sub(r"/\d+px-", "/250px-", c["thumb"].split("?")[0].replace("//thumb.", "//upload.")), headers=UA), timeout=60).read(); open(f, "wb").write(data); time.sleep(2); break
            except Exception as e: time.sleep(15 * (t + 1))
    try: im = Image.open(f).convert("RGB")
    except Exception: continue
    im.thumbnail((W, H)); x, y = (i % cols) * W, (i // cols) * H
    sheet.paste(im, (x, y)); d.rectangle((x, y, x + 28, y + 18), fill="black"); d.text((x + 4, y + 3), str(i), fill="yellow")
sheet.save(f"{B}/prev/{pid}-sheet.jpg", quality=80)
