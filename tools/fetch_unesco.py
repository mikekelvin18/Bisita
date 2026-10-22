# Builds data/unesco.json: every UNESCO World Heritage Site, from Wikidata (CC0),
# with a Wikimedia Commons photo and its credit. Runs on GitHub Actions.
import json, os, re, sys, time, html, urllib.request, urllib.parse
UA = {"User-Agent": "Bisita/1.0 (https://github.com/mikekelvin18/Bisita)"}
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "unesco.json")

def get(url, data=None, tries=6):
    for t in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r: return r.read()
        except Exception as e:
            if t == tries - 1: raise
            time.sleep(2 ** (t + 2))

Q = """
SELECT ?item ?id ?itemLabel ?coord ?country ?countryLabel ?image ?start ?critLabel WHERE {
  ?item p:P1435 ?st . ?st ps:P1435 wd:Q9259 .
  FILTER NOT EXISTS { ?st pq:P582 ?ended }
  ?item wdt:P757 ?id .
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item wdt:P17 ?country }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P2614 ?crit }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}"""
rows = json.loads(get("https://query.wikidata.org/sparql", urllib.parse.urlencode({"query": Q, "format": "json"}).encode()))["results"]["bindings"]
print(len(rows), "rows", file=sys.stderr)
v = lambda r, k: r.get(k, {}).get("value")
sites = {}
for r in rows:
    raw = v(r, "id") or ""
    base = re.match(r"^(\d+)", raw)
    if not base: continue
    sid = base.group(1); main = raw == sid
    s = sites.setdefault(sid, {"id": sid, "items": {}, "countries": {}, "crit": set()})
    q = v(r, "item").rsplit("/", 1)[1]
    it = s["items"].setdefault(q, {"main": main, "name": v(r, "itemLabel"), "coord": None, "image": None, "start": None})
    if v(r, "coord") and not it["coord"]:
        m = re.match(r"Point\(([-\d.eE]+) ([-\d.eE]+)\)", v(r, "coord"))
        if m: it["coord"] = (round(float(m.group(2)), 4), round(float(m.group(1)), 4))
    if v(r, "image") and not it["image"]: it["image"] = urllib.parse.unquote(v(r, "image").rsplit("/", 1)[1])
    if v(r, "start") and not it["start"]: it["start"] = v(r, "start")[:4]
    if v(r, "countryLabel"): s["countries"][v(r, "countryLabel")] = 1
    if v(r, "critLabel"): s["crit"].add(v(r, "critLabel").strip("() ").lower())
out = []
for sid, s in sites.items():
    its = sorted(s["items"].values(), key=lambda i: (not i["main"], i["coord"] is None, i["image"] is None))
    best = its[0]
    coord = next((i["coord"] for i in its if i["coord"]), None)
    if not coord: continue
    name = best["name"]
    if re.match(r"^Q\d+$", name or ""): name = next((i["name"] for i in its if not re.match(r"^Q\d+$", i["name"] or "")), name)
    nat = s["crit"] & {"vii", "viii", "ix", "x"}; cul = s["crit"] & {"i", "ii", "iii", "iv", "v", "vi"}
    cat = "mixed" if nat and cul else "natural" if nat else "cultural" if cul else ""
    out.append({"id": sid, "name": name, "lat": coord[0], "lon": coord[1], "countries": list(s["countries"])[:4],
                "year": next((i["start"] for i in its if i["start"]), None), "cat": cat,
                "image": next((i["image"] for i in its if i["image"]), None)})
# photo credits from Commons, 50 files at a time
API = "https://commons.wikimedia.org/w/api.php"
clean = lambda x: html.unescape(re.sub(r"<[^>]+>", "", x or "")).strip()
files = [o["image"] for o in out if o["image"]]
meta = {}
for i in range(0, len(files), 50):
    chunk = files[i:i + 50]
    q = {"action": "query", "format": "json", "formatversion": "2", "prop": "imageinfo", "iiprop": "url|extmetadata",
         "iiurlwidth": "640", "titles": "|".join("File:" + f for f in chunk)}
    d = json.loads(get(API + "?" + urllib.parse.urlencode(q)))
    norm = {n["to"]: n["from"] for n in d.get("query", {}).get("normalized", [])}
    for pg in d.get("query", {}).get("pages", []):
        ii = (pg.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
        g = lambda k: clean((m.get(k) or {}).get("value"))
        title = norm.get(pg["title"], pg["title"])
        meta[title.replace("File:", "", 1)] = {"thumb": ii.get("thumburl"), "page": ii.get("descriptionurl"),
            "author": g("Artist")[:120], "license": g("LicenseShortName"), "licenseUrl": g("LicenseUrl")}
    time.sleep(1)
FREE = re.compile(r"^(CC BY(-SA)?( \d\.\d)?.*|CC0.*|Public domain.*|PD.*)$", re.I)
for o in out:
    m = meta.get(o.pop("image") or "")
    if m and m.get("thumb") and FREE.match(m.get("license") or ""): o["photo"] = m
out.sort(key=lambda o: int(o["id"]))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"source": "Wikidata (CC0) and Wikimedia Commons", "fetched": time.strftime("%Y-%m-%d"), "sites": out},
          open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "sites;", sum(1 for o in out if "photo" in o), "with photos;",
      {c: sum(1 for o in out if o["cat"] == c) for c in ("cultural", "natural", "mixed", "")}, file=sys.stderr)
