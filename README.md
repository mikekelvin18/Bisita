# Bisita

Hold up your phone and see the world's famous places in their real direction, even the ones on the far side of the Earth, below your feet. Tap one for photos, a 3D flyover and the story of the place.

Live site: https://mikekelvin18.github.io/bisita/

## How it's built

- `site/index.html` is the app (three.js, no build tools). `site/places.js` holds the 30 places and their facts.
- `places/` has each place's Copernicus Sentinel-2 satellite image, its elevation map (AWS Terrain Tiles) and its Wikimedia Commons photos. `fetch_place.py` and `tools/commons_photos.py` made them.
- `python3 build.py` writes `dist/` (the version used for the Claude preview) and `docs/` (the website GitHub Pages serves).
- `test/*.js` are Playwright checks: serve `dist/` on port 8765 and run `node test/layers.js shots`.

Moving the view with the phone and showing the camera only work on a real website over HTTPS, so open the live site on a phone.

## Credits

Photos: see [CREDITS.md](CREDITS.md). Satellite images contain modified Copernicus Sentinel-2 data. Elevation: Terrain Tiles on AWS (SRTM, USGS and other sources). Globe image: NASA Blue Marble. three.js: MIT license (`three-LICENSE`).
