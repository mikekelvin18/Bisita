# Strip of a place's downloaded photos for checking by eye: python3 -I tools/review.py out.jpg id...
import sys, os
from PIL import Image, ImageDraw
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = []
for pid in sys.argv[2:]:
    ims = [Image.open(f"{B}/places/{pid}-p{i}.jpg").convert("RGB") for i in range(5) if os.path.exists(f"{B}/places/{pid}-p{i}.jpg")]
    ims = [i.resize((int(160 * i.width / i.height), 160)) for i in ims]
    r = Image.new("RGB", (sum(i.width for i in ims) + 120, 160)); ImageDraw.Draw(r).text((4, 70), pid, fill="yellow"); x = 120
    for i in ims: r.paste(i, (x, 0)); x += i.width
    rows.append(r)
s = Image.new("RGB", (max(r.width for r in rows), 160 * len(rows)))
for k, r in enumerate(rows): s.paste(r, (0, 160 * k))
s.save(sys.argv[1], quality=80)
