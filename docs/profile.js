// Your profile: places you've been, a scratch-off national park passport, a world
// map with a pin on every country you've visited, your photos and the clubs you're
// working towards. For now everything is kept on this phone only; sign-in and the
// social side (who else has been here, club members) come later.
(() => {
const $ = (id) => document.getElementById(id);
const PLACES = window.PLACES || [];
const KEY = "bisita-profile";
const blank = () => ({ name: "", visited: {}, parks: {}, countries: {} });
let me = blank();
try { me = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) {} };
const today = () => new Date().toISOString().slice(0, 10);
const nice = (d) => { try { return new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" }); } catch (e) { return d; } };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- the 63 US national parks ----------
const PARKS = [
  ["Acadia","Maine"],["American Samoa","American Samoa"],["Arches","Utah"],["Badlands","South Dakota"],["Big Bend","Texas"],
  ["Biscayne","Florida"],["Black Canyon of the Gunnison","Colorado"],["Bryce Canyon","Utah"],["Canyonlands","Utah"],["Capitol Reef","Utah"],
  ["Carlsbad Caverns","New Mexico"],["Channel Islands","California"],["Congaree","South Carolina"],["Crater Lake","Oregon"],["Cuyahoga Valley","Ohio"],
  ["Death Valley","California and Nevada"],["Denali","Alaska"],["Dry Tortugas","Florida"],["Everglades","Florida"],["Gates of the Arctic","Alaska"],
  ["Gateway Arch","Missouri"],["Glacier","Montana"],["Glacier Bay","Alaska"],["Grand Canyon","Arizona"],["Grand Teton","Wyoming"],
  ["Great Basin","Nevada"],["Great Sand Dunes","Colorado"],["Great Smoky Mountains","Tennessee and North Carolina"],["Guadalupe Mountains","Texas"],["Haleakalā","Hawaiʻi"],
  ["Hawaiʻi Volcanoes","Hawaiʻi"],["Hot Springs","Arkansas"],["Indiana Dunes","Indiana"],["Isle Royale","Michigan"],["Joshua Tree","California"],
  ["Katmai","Alaska"],["Kenai Fjords","Alaska"],["Kings Canyon","California"],["Kobuk Valley","Alaska"],["Lake Clark","Alaska"],
  ["Lassen Volcanic","California"],["Mammoth Cave","Kentucky"],["Mesa Verde","Colorado"],["Mount Rainier","Washington"],["New River Gorge","West Virginia"],
  ["North Cascades","Washington"],["Olympic","Washington"],["Petrified Forest","Arizona"],["Pinnacles","California"],["Redwood","California"],
  ["Rocky Mountain","Colorado"],["Saguaro","Arizona"],["Sequoia","California"],["Shenandoah","Virginia"],["Theodore Roosevelt","North Dakota"],
  ["Virgin Islands","US Virgin Islands"],["Voyageurs","Minnesota"],["White Sands","New Mexico"],["Wind Cave","South Dakota"],["Wrangell–St. Elias","Alaska"],
  ["Yellowstone","Wyoming, Montana and Idaho"],["Yosemite","California"],["Zion","Utah"],
].map(([name, state]) => ({ id: name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, state }));
// Bisita places that are also US national parks count toward the passport
const PARK_OF_PLACE = { "grand-canyon": "grand-canyon", yosemite: "yosemite", yellowstone: "yellowstone", zion: "zion" };

// ---------- clubs ----------
const CLUBS = [
  { id: "parks", name: "All 63 US National Parks", kind: "parks", total: PARKS.length },
  { id: "wonders", name: "New 7 Wonders of the World", kind: "places", ids: ["great-wall", "petra", "christ-the-redeemer", "machu-picchu", "chichen-itza", "colosseum", "taj-mahal"] },
  { id: "nature", name: "New 7 Wonders of Nature", kind: "places", ids: ["amazon", "ha-long-bay", "iguazu", "jeju", "komodo", "puerto-princesa", "table-mountain"] },
  { id: "bisita", name: "Every Bisita place", kind: "places", ids: PLACES.map((p) => p.id) },
  { id: "continents", name: "All 7 continents", kind: "continents", total: 7 },
];
const CONTINENT = { "North America": "North America", "South America": "South America", Europe: "Europe", Africa: "Africa", Asia: "Asia", Oceania: "Oceania", Antarctica: "Antarctica" };

// ---------- markup ----------
const wrap = document.createElement("div");
wrap.innerHTML = `
<div id="profile" hidden role="dialog" aria-modal="true" aria-labelledby="pf-title">
  <div class="pf-in">
    <header class="pf-top">
      <h2 id="pf-title" class="sr">Your profile</h2>
      <button class="btn" id="pf-close" type="button">Close</button>
    </header>
    <section class="pf-hero">
      <div class="pf-avatar" id="pf-avatar" aria-hidden="true">?</div>
      <div class="pf-who">
        <input id="pf-name" type="text" placeholder="Your name" autocomplete="nickname" aria-label="Your name" maxlength="40">
        <p class="pf-note">Saved on this phone for now. Sign-in, sharing and clubs with other travelers come later.</p>
      </div>
    </section>
    <section class="pf-stats" id="pf-stats"></section>
    <nav class="pf-tabs" role="tablist" aria-label="Profile sections">
      <button role="tab" type="button" data-tab="map" aria-selected="true">Map</button>
      <button role="tab" type="button" data-tab="parks" aria-selected="false">Parks</button>
      <button role="tab" type="button" data-tab="places" aria-selected="false">Places</button>
      <button role="tab" type="button" data-tab="clubs" aria-selected="false">Clubs</button>
      <button role="tab" type="button" data-tab="photos" aria-selected="false">Photos</button>
    </nav>
    <section class="pf-pane" data-pane="map">
      <div class="pf-map"><canvas id="pf-map" width="1024" height="512" aria-label="World map of countries you have visited"></canvas></div>
      <div class="pf-row"><h3>Countries</h3><button class="btn small" id="pf-addc" type="button">Add a country</button></div>
      <div class="pf-chips" id="pf-countries"></div>
      <div class="pf-picker" id="pf-picker" hidden>
        <input id="pf-cq" type="search" placeholder="Type a country" aria-label="Find a country" autocomplete="off">
        <div id="pf-clist"></div>
      </div>
    </section>
    <section class="pf-pane" data-pane="parks" hidden>
      <div class="pf-row"><h3>US National Park passport</h3><span class="pf-count" id="pf-pcount"></span></div>
      <div class="pf-bar"><i id="pf-pbar"></i></div>
      <p class="pf-hint">Scratch a park's stamp when you visit it.</p>
      <div class="pf-parks" id="pf-parks"></div>
    </section>
    <section class="pf-pane" data-pane="places" hidden>
      <div class="pf-row"><h3>Bisita places</h3><span class="pf-count" id="pf-vcount"></span></div>
      <div id="pf-places"></div>
    </section>
    <section class="pf-pane" data-pane="clubs" hidden>
      <p class="pf-hint">Finish a set to join its club. Soon you'll see everyone else who made it.</p>
      <div id="pf-clubs"></div>
    </section>
    <section class="pf-pane" data-pane="photos" hidden>
      <div class="pf-empty">
        <div class="pf-grid" id="pf-photos"></div>
        <label class="btn primary pf-upload"><input type="file" accept="image/*" multiple id="pf-file" hidden>Add photos</label>
        <p class="pf-hint">A preview for now: photos aren't kept after you close Bisita. They'll be saved to your places once sign-in is ready.</p>
      </div>
    </section>
  </div>
</div>`;
document.body.appendChild(wrap.firstElementChild);

const css = document.createElement("style");
css.textContent = `
#me-btn { background: rgba(15,29,31,.86); }
#me-btn.named { background: var(--sand); border-color: var(--sand); color: #1d1408; }
#me-btn b { font-family: var(--display); font-weight: 400; font-size: 20px; }
body:not(.look):not(.in-place) #side { display: flex; }
body:not(.look) #side > :not(#me-btn):not(#whs-btn) { display: none; }
#profile { position: fixed; inset: 0; z-index: 12; background: var(--night); overflow-y: auto; overscroll-behavior: contain; }
.pf-in { max-width: 720px; margin: 0 auto; padding: calc(14px + env(safe-area-inset-top,0px)) max(16px, env(safe-area-inset-right,0px)) calc(40px + env(safe-area-inset-bottom,0px)) max(16px, env(safe-area-inset-left,0px)); }
.pf-top { display: flex; justify-content: flex-end; }
.pf-hero { display: flex; gap: 16px; align-items: center; margin: 8px 0 18px; }
.pf-avatar { flex: none; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; font-family: var(--display); font-size: 34px; color: #1d1408; background: var(--sand); box-shadow: 0 0 0 4px rgba(227,173,108,.22); }
.pf-who { min-width: 0; flex: 1; }
#pf-name { width: 100%; font: inherit; font-family: var(--display); font-size: 28px; color: var(--stone); background: none; border: 0; border-bottom: 1px dashed var(--line); padding: 2px 0; }
#pf-name:focus { outline: none; border-bottom-color: var(--sand); }
.pf-note { margin: 6px 0 0; font-size: 13px; color: var(--mist); line-height: 1.4; }
.pf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
.pf-stat { background: var(--deep); border: 1px solid var(--line); border-radius: 14px; padding: 10px 8px; text-align: center; }
.pf-stat b { display: block; font-family: var(--display); font-weight: 400; font-size: 26px; line-height: 1.1; color: var(--stone); font-variant-numeric: tabular-nums; }
.pf-stat span { display: block; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--mist); margin-top: 2px; }
.pf-tabs { position: sticky; top: 0; z-index: 2; display: flex; gap: 4px; padding: 6px 0; margin: 0 0 14px; background: var(--night); overflow-x: auto; scrollbar-width: none; }
.pf-tabs::-webkit-scrollbar { display: none; }
.pf-tabs button { flex: 1 0 auto; min-height: 44px; padding: 0 14px; border-radius: 22px; border: 1px solid var(--line); background: none; color: var(--mist); font: inherit; font-weight: 600; font-size: 15px; cursor: pointer; }
.pf-tabs button[aria-selected="true"] { background: var(--stone); color: var(--night); border-color: var(--stone); }
.pf-map { border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: #0b1a1f; }
.pf-map canvas { display: block; width: 100%; height: auto; }
.pf-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 18px 0 10px; }
.pf-row h3 { margin: 0; }
.btn.small { min-height: 40px; padding: 0 14px; font-size: 14px; }
.pf-count { font-size: 14px; color: var(--mist); font-variant-numeric: tabular-nums; }
.pf-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pf-chips button { min-height: 40px; padding: 0 12px 0 14px; border-radius: 20px; border: 1px solid var(--line); background: var(--deep); color: var(--stone); font: inherit; font-size: 14px; display: inline-flex; gap: 8px; align-items: center; cursor: pointer; }
.pf-chips button::after { content: "\\00d7"; color: var(--mist); font-size: 18px; }
.pf-picker { margin-top: 10px; }
#pf-cq { width: 100%; min-height: 48px; border-radius: 24px; border: 1px solid var(--line); background: var(--deep); color: var(--stone); padding: 0 18px; font: inherit; }
#pf-clist { max-height: 280px; overflow-y: auto; margin-top: 6px; }
#pf-clist button { display: block; width: 100%; text-align: left; min-height: 46px; padding: 0 14px; border: 0; border-bottom: 1px solid var(--line); background: none; color: var(--stone); font: inherit; cursor: pointer; }
.pf-bar { height: 8px; border-radius: 4px; background: var(--raise); overflow: hidden; }
.pf-bar i { display: block; height: 100%; width: 0; background: var(--sand); border-radius: 4px; transition: width .4s; }
.pf-hint { font-size: 14px; color: var(--mist); margin: 10px 0 14px; }
.pf-parks { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.pf-park { position: relative; aspect-ratio: 1 / 1.08; border-radius: 16px; overflow: hidden; background: var(--deep); border: 1px solid var(--line); touch-action: none; user-select: none; -webkit-user-select: none; }
.pf-stamp { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 12px; text-align: center; }
.pf-stamp .ring { width: 70px; height: 70px; border-radius: 50%; border: 3px double var(--sand); display: grid; place-items: center; transform: rotate(-12deg); color: var(--sand); font-weight: 700; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; line-height: 1.1; }
.pf-stamp b { font-size: 14px; font-weight: 600; line-height: 1.2; color: var(--stone); }
.pf-stamp small { font-size: 12px; color: var(--mist); }
.pf-park canvas { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity .5s; cursor: grab; }
.pf-park.done canvas { opacity: 0; pointer-events: none; }
.pf-park .undo { position: absolute; top: 6px; right: 6px; width: 32px; height: 32px; border-radius: 16px; border: 0; background: rgba(8,17,19,.6); color: var(--mist); font-size: 18px; cursor: pointer; display: none; }
.pf-park.done .undo { display: block; }
.pf-place { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.pf-place img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; flex: none; background: var(--raise); }
.pf-place div { flex: 1; min-width: 0; }
.pf-place b { display: block; font-weight: 600; } .pf-place small { color: var(--mist); font-size: 13px; }
.pf-check { flex: none; min-height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid var(--line); background: none; color: var(--mist); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.pf-check[aria-pressed="true"] { background: var(--sand); border-color: var(--sand); color: #1d1408; }
.pf-club { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; background: var(--deep); }
.pf-club.won { border-color: var(--sand); box-shadow: 0 0 0 3px rgba(227,173,108,.15); }
.pf-club .top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 8px; }
.pf-club b { font-weight: 600; font-size: 16px; } .pf-club span { font-size: 14px; color: var(--mist); font-variant-numeric: tabular-nums; }
.pf-club p { margin: 8px 0 0; font-size: 13px; color: var(--mist); }
.pf-club.won p { color: var(--sand); }
.pf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 14px; }
.pf-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; display: block; }
.pf-upload { width: 100%; justify-content: center; cursor: pointer; }
#been[aria-pressed="true"], #pop-been[aria-pressed="true"] { background: var(--sand); color: #1d1408; border-color: var(--sand); }
#pop-been { width: 100%; justify-content: center; margin-top: 8px; }
@media (max-width: 420px) { .pf-stat b { font-size: 22px; } .pf-stat span { font-size: 10px; } .pf-parks { grid-template-columns: 1fr 1fr; } }
`;
document.head.appendChild(css);

// ---------- top bar button ----------
const meBtn = document.createElement("button");
meBtn.className = "btn round"; meBtn.id = "me-btn"; meBtn.type = "button"; meBtn.setAttribute("aria-label", "Your profile");
const ME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
// lives at the top of the round buttons on the right, as your initials
$("side").insertBefore(meBtn, $("side").firstChild);
function badge() { const n = (me.name || "").trim(); meBtn.innerHTML = n ? `<b>${esc(n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</b>` : ME_SVG; meBtn.classList.toggle("named", !!n); }
badge();
meBtn.addEventListener("click", open);
$("pf-close").addEventListener("click", close);
addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("profile").hidden) close(); });
function open() { render(); $("profile").hidden = false; setTimeout(() => $("pf-close").focus(), 30); drawMap(); }
function close() { $("profile").hidden = true; meBtn.focus(); }

// tabs
const tabs = [...document.querySelectorAll(".pf-tabs button")];
tabs.forEach((b) => b.addEventListener("click", () => {
  tabs.forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
  document.querySelectorAll(".pf-pane").forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab));
  if (b.dataset.tab === "map") drawMap();
  if (b.dataset.tab === "parks") renderParks();
}));

// name and avatar
$("pf-name").addEventListener("input", () => { me.name = $("pf-name").value.trim(); save(); avatar(); });
function avatar() { badge(); const n = me.name || ""; $("pf-avatar").textContent = n ? n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?"; }

// ---------- countries ----------
// Each country's pin sits at the middle of the places we know there; the full
// World Heritage list (when loaded) gives every country a spot.
const COUNTRY_PTS = {};
function addPts(country, lat, lon) { (COUNTRY_PTS[country] = COUNTRY_PTS[country] || []).push([lat, lon]); }
PLACES.forEach((p) => p.country.split(/ and |, /).forEach((c) => addPts(c.trim(), p.lat, p.lon)));
fetch("unesco.json").then((r) => (r.ok ? r.json() : null)).then((d) => {
  if (!d || !d.sites) return;
  d.sites.forEach((s) => (s.countries || []).forEach((c) => addPts(c, s.lat, s.lon)));
  window.BISITA_UNESCO = d; if (!$("profile").hidden) { render(); drawMap(); }
}).catch(() => {});
function centroid(c) {
  const pts = COUNTRY_PTS[c]; if (!pts) return null;
  // average on the sphere so countries spanning the date line still work
  let x = 0, y = 0, z = 0; for (const [la, lo] of pts) { const a = la * Math.PI / 180, b = lo * Math.PI / 180; x += Math.cos(a) * Math.cos(b); y += Math.cos(a) * Math.sin(b); z += Math.sin(a); }
  return [Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI];
}
function whs(id) { const u = window.BISITA_UNESCO; if (!u || !/^whs-/.test(id)) return null; const k = id.slice(4); return u.sites.find((s) => s.id === k) || null; }
function myCountries() {
  const set = new Set(Object.keys(me.countries));
  for (const id of Object.keys(me.visited)) {
    const p = PLACES.find((q) => q.id === id); if (p && !/ and /.test(p.country)) set.add(p.country);
    const st = whs(id); if (st && st.countries && st.countries.length === 1) set.add(st.countries[0]);
  }
  return [...set].sort();
}
$("pf-addc").addEventListener("click", () => { const pk = $("pf-picker"); pk.hidden = !pk.hidden; if (!pk.hidden) { $("pf-cq").value = ""; listCountries(""); $("pf-cq").focus(); } });
$("pf-cq").addEventListener("input", () => listCountries($("pf-cq").value));
function listCountries(q) {
  const all = Object.keys(COUNTRY_PTS).sort(), have = new Set(myCountries()), t = q.trim().toLowerCase();
  const l = $("pf-clist"); l.innerHTML = "";
  all.filter((c) => !have.has(c) && (!t || c.toLowerCase().includes(t))).slice(0, 60).forEach((c) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = c;
    b.addEventListener("click", () => { me.countries[c] = today(); save(); $("pf-picker").hidden = true; render(); drawMap(); });
    l.appendChild(b);
  });
}

// the world map: land drawn from the same Earth picture the globe uses
const land = new Image(); land.src = "earth-land.png"; land.onload = () => drawMap();
function drawMap() {
  const cv = $("pf-map"); if (!cv || $("profile").hidden) return;
  const g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.fillStyle = "#0b1a1f"; g.fillRect(0, 0, W, H);
  // faint grid
  g.strokeStyle = "rgba(95,166,180,.10)"; g.lineWidth = 1;
  for (let lo = -150; lo <= 180; lo += 30) { const x = (lo + 180) / 360 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let la = -60; la <= 60; la += 30) { const y = (90 - la) / 180 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (land.complete && land.naturalWidth) {
    const off = document.createElement("canvas"); off.width = W; off.height = H; const o = off.getContext("2d");
    o.drawImage(land, 0, 0, W, H); o.globalCompositeOperation = "source-in"; o.fillStyle = "#2b4a47"; o.fillRect(0, 0, W, H);
    // the land picture is white land on black sea: keep only the land
    const id = o.getImageData(0, 0, W, H), src = document.createElement("canvas"); src.width = W; src.height = H;
    const s = src.getContext("2d"); s.drawImage(land, 0, 0, W, H); const m = s.getImageData(0, 0, W, H).data;
    for (let i = 0; i < m.length; i += 4) id.data[i + 3] = m[i] > 127 ? 255 : 0;
    o.putImageData(id, 0, 0); g.drawImage(off, 0, 0);
  }
  const P = (la, lo) => [(lo + 180) / 360 * W, (90 - la) / 180 * H];
  // places you've been: small dots
  for (const id of Object.keys(me.visited)) { const p = PLACES.find((q) => q.id === id) || whs(id); if (!p) continue; const [x, y] = P(p.lat, p.lon); g.fillStyle = "rgba(233,227,214,.9)"; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  // countries: sand pins
  for (const c of myCountries()) {
    const ct = centroid(c); if (!ct) continue; const [x, y] = P(ct[0], ct[1]);
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, y + 2, 7, 3, 0, 0, 7); g.fill();
    g.fillStyle = "#e3ad6c"; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x - 12, y - 14, x - 9, y - 28, x, y - 28); g.bezierCurveTo(x + 9, y - 28, x + 12, y - 14, x, y); g.fill();
    g.fillStyle = "#1d1408"; g.beginPath(); g.arc(x, y - 19, 4, 0, 7); g.fill();
  }
}

// ---------- national park passport (scratch-off) ----------
function parkVisited(id) { return !!me.parks[id] || Object.entries(PARK_OF_PLACE).some(([pl, pk]) => pk === id && me.visited[pl]); }
function parkDate(id) { return me.parks[id] || Object.entries(PARK_OF_PLACE).map(([pl, pk]) => (pk === id ? me.visited[pl] : null)).find(Boolean); }
function renderParks() {
  const box = $("pf-parks"); box.innerHTML = "";
  PARKS.forEach((pk) => {
    const done = parkVisited(pk.id);
    const card = document.createElement("div"); card.className = "pf-park" + (done ? " done" : "");
    card.innerHTML = `<div class="pf-stamp"><div class="ring">Visited<br>${done ? esc(nice(parkDate(pk.id))) : ""}</div><b>${esc(pk.name)}</b><small>${esc(pk.state)}</small></div><canvas aria-hidden="true"></canvas><button class="undo" type="button" aria-label="Unmark ${esc(pk.name)}">&times;</button>`;
    card.setAttribute("role", "group"); card.setAttribute("aria-label", `${pk.name}, ${done ? "visited" : "not visited yet. Scratch to mark it visited"}`);
    box.appendChild(card);
    if (!done) scratchable(card, pk);
    card.querySelector(".undo").addEventListener("click", () => { delete me.parks[pk.id]; save(); render(); renderParks(); });
  });
  const n = PARKS.filter((p) => parkVisited(p.id)).length;
  $("pf-pcount").textContent = `${n} of ${PARKS.length}`; $("pf-pbar").style.width = (n / PARKS.length * 100) + "%";
}
function scratchable(card, pk) {
  const cv = card.querySelector("canvas");
  requestAnimationFrame(() => {
    const r = card.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr);
    const g = cv.getContext("2d"), W = cv.width, H = cv.height;
    // a brushed, foil-like cover with the park's name on it
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#c9a476"); gr.addColorStop(0.5, "#e8cfa2"); gr.addColorStop(1, "#b58e60");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.18; g.strokeStyle = "#fff"; for (let i = -H; i < W; i += 6 * dpr) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); } g.globalAlpha = 1;
    g.fillStyle = "#3b2a14"; g.textAlign = "center"; g.font = `600 ${14 * dpr}px Figtree, system-ui, sans-serif`;
    const words = pk.name.split(" "), lines = []; let line = "";
    for (const w of words) { if ((line + " " + w).trim().length > 16) { lines.push(line.trim()); line = w; } else line += " " + w; } lines.push(line.trim());
    lines.forEach((l, i) => g.fillText(l, W / 2, H * 0.42 + (i - (lines.length - 1) / 2) * 18 * dpr));
    g.font = `500 ${11 * dpr}px Figtree, system-ui, sans-serif`; g.fillStyle = "rgba(59,42,20,.75)"; g.fillText("Scratch when you visit", W / 2, H * 0.78);
    let down = false, moves = 0;
    const at = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr]; };
    const rub = (e) => { const [x, y] = at(e); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(x, y, 18 * dpr, 0, 7); g.fill(); g.globalCompositeOperation = "source-over"; if (++moves % 8 === 0) check(); };
    const check = () => {
      const d = g.getImageData(0, 0, W, H).data; let clear = 0, n = 0;
      for (let i = 3; i < d.length; i += 4 * 16) { n++; if (d[i] < 20) clear++; }
      if (clear / n > 0.45) { me.parks[pk.id] = today(); save(); card.classList.add("done"); card.querySelector(".ring").innerHTML = `Visited<br>${esc(nice(me.parks[pk.id]))}`; card.setAttribute("aria-label", `${pk.name}, visited`); render(); renderParksCount(); if (navigator.vibrate) navigator.vibrate(20); }
    };
    cv.addEventListener("pointerdown", (e) => { down = true; cv.setPointerCapture(e.pointerId); rub(e); });
    cv.addEventListener("pointermove", (e) => { if (down) rub(e); });
    cv.addEventListener("pointerup", () => { down = false; check(); });
    cv.addEventListener("pointercancel", () => (down = false));
    // keyboard: Enter or Space marks it
    card.tabIndex = 0; card.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !card.classList.contains("done")) { e.preventDefault(); me.parks[pk.id] = today(); save(); renderParks(); render(); } });
  });
}
function renderParksCount() { const n = PARKS.filter((p) => parkVisited(p.id)).length; $("pf-pcount").textContent = `${n} of ${PARKS.length}`; $("pf-pbar").style.width = (n / PARKS.length * 100) + "%"; }

// ---------- places, clubs, stats ----------
function setVisited(id, on) { if (on) me.visited[id] = me.visited[id] || today(); else delete me.visited[id]; save(); syncBeen(); }
function renderPlaces() {
  const box = $("pf-places"); box.innerHTML = "";
  [...PLACES].sort((a, b) => (!!me.visited[b.id] - !!me.visited[a.id]) || a.name.localeCompare(b.name)).forEach((p) => {
    const row = document.createElement("div"); row.className = "pf-place";
    row.innerHTML = `<img alt="" loading="lazy" src="places/${p.id}-thumb.jpg"><div><b>${esc(p.name)}</b><small>${esc(p.country)}${me.visited[p.id] ? " · " + esc(nice(me.visited[p.id])) : ""}</small></div>`;
    const b = document.createElement("button"); b.type = "button"; b.className = "pf-check";
    b.setAttribute("aria-pressed", me.visited[p.id] ? "true" : "false"); b.textContent = me.visited[p.id] ? "Been" : "Mark";
    b.setAttribute("aria-label", `${me.visited[p.id] ? "Unmark" : "Mark"} ${p.name} as visited`);
    b.addEventListener("click", () => { setVisited(p.id, !me.visited[p.id]); render(); });
    row.appendChild(b); box.appendChild(row);
  });
  $("pf-vcount").textContent = `${Object.keys(me.visited).filter((id) => PLACES.some((p) => p.id === id)).length} of ${PLACES.length}`;
}
function clubProgress(c) {
  if (c.kind === "parks") return [PARKS.filter((p) => parkVisited(p.id)).length, PARKS.length];
  if (c.kind === "continents") { const set = new Set(); for (const id of Object.keys(me.visited)) { const p = PLACES.find((q) => q.id === id); if (p && CONTINENT[p.region]) set.add(p.region); } return [set.size, 7]; }
  return [c.ids.filter((id) => me.visited[id]).length, c.ids.length];
}
function renderClubs() {
  const box = $("pf-clubs"); box.innerHTML = "";
  CLUBS.forEach((c) => {
    const [n, t] = clubProgress(c), won = n >= t;
    const el = document.createElement("div"); el.className = "pf-club" + (won ? " won" : "");
    el.innerHTML = `<div class="top"><b>${esc(c.name)}</b><span>${n} of ${t}</span></div><div class="pf-bar"><i style="width:${n / t * 100}%"></i></div><p>${won ? "You're in this club. Members list coming soon." : `${t - n} to go`}</p>`;
    box.appendChild(el);
  });
}
function render() {
  $("pf-name").value = me.name || ""; avatar();
  const parks = PARKS.filter((p) => parkVisited(p.id)).length;
  const u = window.BISITA_UNESCO;
  const heritage = PLACES.filter((p) => me.visited[p.id] && /World Heritage/.test(p.status)).length + Object.keys(me.visited).filter((id) => /^whs-/.test(id)).length;
  const stats = [["Countries", myCountries().length], ["Places", Object.keys(me.visited).length], ["Parks", parks], ["Heritage", heritage]];
  $("pf-stats").innerHTML = stats.map(([l, n]) => `<div class="pf-stat"><b>${n}</b><span>${l}</span></div>`).join("");
  const ch = $("pf-countries"); ch.innerHTML = "";
  const cs = myCountries();
  if (!cs.length) ch.innerHTML = '<p class="pf-hint" style="margin:0">No countries yet. Mark a place as visited, or add a country.</p>';
  cs.forEach((c) => { const b = document.createElement("button"); b.type = "button"; b.textContent = c; b.setAttribute("aria-label", `Remove ${c}`); b.addEventListener("click", () => { delete me.countries[c]; save(); render(); drawMap(); }); ch.appendChild(b); });
  renderPlaces(); renderClubs(); renderParksCount();
}

// photos: a local preview only
$("pf-file").addEventListener("change", () => {
  const g = $("pf-photos");
  [...$("pf-file").files].forEach((f) => { const im = document.createElement("img"); im.alt = f.name; im.src = URL.createObjectURL(f); g.prepend(im); });
});

// ---------- "I've been here" on each place ----------
let current = null;
function beenButton(id, where, cls) {
  const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (cls ? " " + cls : ""); b.id = id;
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>I\'ve been here</span>';
  where.appendChild(b); return b;
}
const been = beenButton("been", document.querySelector("#panel .motion"));
been.addEventListener("click", () => { if (current) setVisited(current.id, !me.visited[current.id]); });
const popBody = document.querySelector(".pop-body");
const popBeen = popBody ? beenButton("pop-been", popBody) : null;
if (popBeen) popBeen.addEventListener("click", () => { if (popPlace) setVisited(popPlace.id, !me.visited[popPlace.id]); });
let popPlace = null;
function syncBeen() {
  for (const [b, p] of [[been, current], [popBeen, popPlace]]) {
    if (!b || !p) continue; const on = !!me.visited[p.id];
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.querySelector("span").textContent = on ? `Been here · ${nice(me.visited[p.id])}` : "I've been here";
  }
}
addEventListener("bisita:place", (e) => { current = e.detail; syncBeen(); });
addEventListener("bisita:pop", (e) => { popPlace = e.detail; syncBeen(); });
})();
