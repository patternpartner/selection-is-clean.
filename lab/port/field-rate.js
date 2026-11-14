// field-rate.js - #383: NEW FUNCTIONS PER REAL HOUR ACROSS A RUNNING FIELD, the number a viewer gets.
//
// #381 and #382 judged a world per tick and per CPU-hour, one universe per node process. A viewer gets neither: they get a
// browser field (index.html), several universes sharing a fixed tick budget on a few workers, trading migrants, growing new
// universes of their own, all in real time. Both ships were held because a field check (slot-test's first save in 150 s)
// went the other way. This rig asks the field directly.
//
// It serves this tree over http (engine.html can be swapped with ENGINE=path, so two engines can be compared without copying the
// tree), opens the default field in a fresh browser profile (no saved universes: every run starts from founders), lets it run for
// SECS of wall clock, and every EVERY seconds reads each universe's lifetime paid-for bitmap through __field.seenForTest()
// (read off the engine's tSeen; nothing drawn, nothing written). It ORs every bitmap it has ever seen into one field-wide union,
// so a universe that dies or leaves still counts what it found, and a function carried by a migrant counts once.
//
//   F(t)  distinct functions ever paid anywhere in the field by wall time t (the union)  <- what #383 rules on
//   S(t)  the sum over universes of functions each found since its own boot (counts a function once per universe)
//   K(t)  total ticks run across the field; U(t) universes seen; A(t) creatures alive
//   D(t)  #402: the formula sizes of the functions that joined F since the last sample (n, mean, p50, p90, max, ge13, ge17)
//
// Output: one JSON line per sample to OUT, the last line carrying {final:true}. Usage:
//   OUT=x.jsonl SECS=1800 EVERY=60 [ENGINE=path/engine.html] [HASH=] node lab/port/field-rate.js
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const ENGINE = process.env.ENGINE ? path.resolve(process.env.ENGINE) : path.join(ROOT, 'engine.html');
const SECS = +(process.env.SECS || 1800), EVERY = +(process.env.EVERY || 60);
const OUT = process.env.OUT || '';
const HASH = process.env.HASH || '';
// RELOAD_AT=s reloads the page once at s seconds, as a viewer's tab kill does; the union carries on across it, and the first sample
// after it records, per universe, the T it booted with (bootT) and what its population snapshot restored (pop).
const RELOAD_AT = +(process.env.RELOAD_AT || 0);
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium'].find(p=>fs.existsSync(p)) || '/opt/pw-browsers/chromium';
const NF = 65536;

const server = http.createServer((req, res) => {
  const u0 = req.url.split('?')[0], u = (u0 === '/' ? '/index.html' : u0);
  const f = (u === '/engine.html') ? ENGINE : path.join(ROOT, u);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' });
    res.end(b); });
});

// #402: THE DEPTH OF WHAT IS NEW. F counts functions; it cannot tell a field that keeps finding more of the same from one that builds
// deeper on what it has. Each sample now carries D: the formula sizes (the engine's own grade, lab/port/sz5.js) of the functions that
// joined the union since the last sample - how many, their mean, median, 90th percentile and largest, and how many are of size 13+ and 17+.
const { sz5 } = require('./sz5.js'); let newSz = []; const armSets = {};   // #407: per-arm unions, for a field built with #arms
// #404: A FIELD LONGER THAN ONE LAUNCH. A background job ends at about 30 minutes, so nothing here was ever measured past that.
// CHAIN=file carries the union and the elapsed time from one launch (a "leg") to the next; with PROFILE and a fixed PORT each leg
// reloads the field the last one left. A sample's t is then seconds since the FIRST leg began, and leg is which launch it came from.
// What a leg loses: whatever each universe did after its last autosave (on the clock every 2 minutes, #384).
const PORT = +(process.env.PORT || 0), PROFILE = process.env.PROFILE || '', CHAIN = process.env.CHAIN || '';
let T_OFF = 0, LEG = 1;
const depth = () => { const a = newSz.slice().sort((x, y) => x - y); newSz = []; if (!a.length) return { n: 0 };
  return { n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p50: a[a.length >> 1], p90: a[Math.min(a.length - 1, Math.floor(a.length * 0.9))], max: a[a.length - 1],
    ge13: a.filter(z => z >= 13).length, ge17: a.filter(z => z >= 17).length }; };
const union = new Uint8Array(NF), union5 = new Set();   // #392: five-input worlds report canonical truth tables
let F = 0;
if (CHAIN && fs.existsSync(CHAIN)) { const c = JSON.parse(fs.readFileSync(CHAIN, 'utf8')); T_OFF = c.elapsed | 0; LEG = (c.legs | 0) + 1;
  const b = Buffer.from(c.tables, 'base64'); for (let j = 0; j + 3 < b.length; j += 4) union5.add(b.readUInt32LE(j)); F = union5.size; }
const perSlot = {};   // slot -> {max n-boot, last ticks}
const emit = o => { const s = JSON.stringify(o); if (OUT) fs.appendFileSync(OUT, s + '\n'); else console.log(s); };

// #383 amendment: every universe is asked AT ONCE, with one timeout for the lot. The first version asked them one at a time with
// 15 s each, and in a busy field one sample took six minutes, so a sample's time no longer said when it was read.
const readField = (page, ms) => page.evaluate(async ms => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const one = async el => { const s = slotOf(el);
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a || !a.seenForTest) return [s, null];
      const r = await Promise.race([a.seenForTest(), new Promise(z => setTimeout(() => z(null), ms))]);
      return [s, r]; } catch (e) { return [s, { err: String(e && e.message) }]; } };
  const els = [];
  for (const c of document.querySelectorAll('.cell')) if (c.firstChild && c.firstChild.contentWindow) els.push(c.firstChild);
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) els.push(d);
  return Promise.all(els.map(one));
}, ms);

(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  // #404: with PROFILE the browser keeps its storage in that directory, so the next launch (same PORT, so the same origin) reloads the
  // same universes - their creatures, lifetime records and ground - the way a viewer's tab does after being killed.
  const browser = PROFILE ? null : await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = PROFILE ? await chromium.launchPersistentContext(PROFILE, { executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'], viewport: { width: 412, height: 915 } })
                      : await browser.newContext({ viewport: { width: 412, height: 915 } });
  // FREEZE PROBE (JANK=1): the user's overnight field kept ticking while its page stopped answering, so the page's MAIN THREAD
  // was blocked. Installed before any frame loads, top window only: every long task (>50 ms, with the frame it came from), every gap
  // over 150 ms in a 50 ms timer, every animation-frame gap over 250 ms. Read-only. In this mode the samples between the first and the
  // last read only small stats, because the union reads themselves post every universe's lifetime record to this same thread.
  const JANK = !!process.env.JANK;
  if (JANK) await ctx.addInitScript(() => { if (window.top !== window) return; const J = window.__jank = { lt: [], gaps: [], raf: [] };
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) { const a = e.attribution && e.attribution[0]; J.lt.push([Math.round(e.startTime), Math.round(e.duration), (a && (a.containerSrc || a.containerName)) || '']); } }).observe({ type: 'longtask', buffered: true }); } catch (e) { J.noLT = String(e); }
    let last = performance.now(); setInterval(() => { const n = performance.now(), g = n - last; if (g > 150) J.gaps.push([Math.round(last), Math.round(g)]); last = n; }, 50);
    let lr = performance.now(); const f = () => { const n = performance.now(); if (n - lr > 250) J.raf.push([Math.round(lr), Math.round(n - lr)]); lr = n; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  await page.goto(base + '/' + HASH, { waitUntil: 'load' });
  const jank = async () => { const q0 = Date.now(); await page.evaluate(() => 0); const lat = Date.now() - q0;
    const j = await page.evaluate(() => { const J = window.__jank; if (!J) return null; return { lt: J.lt.splice(0), gaps: J.gaps.splice(0), raf: J.raf.splice(0), noLT: J.noLT }; });
    if (!j) return { lat }; const by = {}; for (const [, d, src] of j.lt) { const k = (src.match(/slot=([^&#]*)/) || [, src ? 'frame' : 'page'])[1]; by[k] = (by[k] || 0) + d; }
    const top = Object.entries(by).sort((x, y) => y[1] - x[1]).slice(0, 5);
    return { lat, lt: { n: j.lt.length, sum: j.lt.reduce((x, y) => x + y[1], 0), max: j.lt.reduce((x, y) => Math.max(x, y[1]), 0), top }, gap: { n: j.gaps.length, max: j.gaps.reduce((x, y) => Math.max(x, y[1]), 0), n1s: j.gaps.filter(g => g[1] >= 1000).length }, raf: { n: j.raf.length, max: j.raf.reduce((x, y) => Math.max(x, y[1]), 0) }, noLT: j.noLT }; };
  const smallRead = () => page.evaluate(async () => { const els = [...document.querySelectorAll('.cell')].map(c => c.firstChild).filter(Boolean).concat([...document.querySelectorAll('#below .deep, #below .grown')]);
    const rs = await Promise.all(els.map(el => { try { const a = el.contentWindow && el.contentWindow.__field; return a ? Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 30000))]) : null; } catch (e) { return null; } }));
    let K = 0, A = 0, U = 0; for (const r of rs) if (r) { U++; K += r.totalTicks | 0; A += r.N | 0; } return { K, A, U }; });
  const sample = async (final, at) => {
    if (JANK && !final) { const J = await jank(); const q = await smallRead(); emit({ t: T_OFF + at, leg: LEG, J, K: q.K, N: q.A, U: q.U, errs: errs.length }); return; }
    const J0 = JANK ? await jank() : undefined;
    // JANK: at the last sample, how big the saved population snapshots are (gzipped blobs in IndexedDB, one per universe). The raw
    // string each worker posts to this page at every save is several times that.
    if (JANK && final && J0) J0.idb = await page.evaluate(() => new Promise(res => { try { const r = indexedDB.open('selection_pop', 1);
      r.onsuccess = () => { try { const q = r.result.transaction('pop', 'readonly').objectStore('pop').getAll(); q.onsuccess = () => { const z = q.result.map(v0 => { const v = (v0 && v0.b) ? v0.b : v0; return v && v.size !== undefined ? v.size : (typeof v === 'string' ? v.length : 0); }); /* #426: a record may be {g, b} */ res({ n: z.length, total: z.reduce((x, y) => x + y, 0), max: z.reduce((x, y) => Math.max(x, y), 0) }); }; q.onerror = () => res(null); } catch (e) { res(null); } };
      r.onerror = () => res(null); } catch (e) { res(null); } }));
    const rows = await readField(page, final ? 120000 : 60000);
    let S = 0, K = 0, A = 0, U = 0, sw = null, off = 0, bad = 0, n5 = 0, M = 0, MA = 0;
    const SWB = {}, TOUR = { adopt: 0, decide: 0, U: 0 }; let SWBN = 0;   // #424: how many universes run each switch, and the tournament's counts
    const slots = [], tally = {}, lost = [];
    for (const [s, r] of rows) {
      if (!r || r.err) { bad++; continue; }
      if (r.off) { off++; continue; }
      U++; K += r.totalTicks | 0; A += r.alive | 0; if (r.in5) n5++; M += r.mig | 0; MA += r.migA | 0;
      const ps = perSlot[s] || (perSlot[s] = { found: 0, ticks: 0 });
      ps.found = Math.max(ps.found, (r.n | 0) - (r.boot | 0)); ps.ticks = r.totalTicks | 0;
      if (!sw) sw = r.sw;
      if (r.swb) { SWBN++; for (const k in r.swb) SWB[k] = (SWB[k] || 0) + (r.swb[k] ? 1 : 0); }
      if (r.tour) { TOUR.U++; TOUR.adopt += r.tour.adopt | 0; TOUR.decide += r.tour.decide | 0; TOUR.prop = (TOUR.prop | 0) + (r.tour.prop | 0); }
      // #407: a field built with #arms tells each universe's arm; each arm keeps its own union (what ITS universes found) and depth
      let AK = null; if (r.arm && Object.keys(r.arm).length === 1) { /* #430: one knob is an arm; a factorial's sets go in slot [8] */ const key = Object.entries(r.arm).map(([k, v]) => k + '=' + v).join(','); AK = armSets[key] || (armSets[key] = { set: new Set(), sz: [] });
        const T = tally[key] || (tally[key] = { U: 0, K: 0, A: 0, ground: {} }); T.U++; T.K += r.totalTicks | 0; T.A += r.alive | 0; T.ground[r.ground] = (T.ground[r.ground] || 0) + 1; if (r.chk) { const c = JSON.stringify(r.chk); T.chk = T.chk || {}; T.chk[c] = (T.chk[c] || 0) + 1; } }
      if (r.pop && r.pop.restored === 0 && r.pop.why) lost.push(s + ':' + r.pop.why);
      const b = Buffer.from(r.b64, 'base64');
      if (r.in5) { for (let j = 0; j + 3 < b.length; j += 4) { const Fk = b.readUInt32LE(j); if (!union5.has(Fk)) { union5.add(Fk); F++; newSz.push(sz5(Fk)); } if (AK && !AK.set.has(Fk)) { AK.set.add(Fk); AK.sz.push(sz5(Fk)); } } slots.push([s, r.totalTicks | 0, r.alive | 0, r.n | 0, r.boot | 0, r.bootT === undefined ? null : r.bootT, r.pop && r.pop.restored !== undefined ? r.pop.restored : null, r.swb ? Object.values(r.swb).join('') : null, r.arm ? Object.keys(r.arm).join('+') : null]); continue; }   // #392: canonical truth tables; #424: [7] this universe's switches, in MECH_DECLARED order
      for (let j = 0; j < b.length; j++) { const x = b[j]; if (!x) continue;
        for (let k = 0; k < 8; k++) if ((x >> k) & 1) { const T = j * 8 + k; if (!union[T]) { union[T] = 1; F++; } } }
      slots.push([s, r.totalTicks | 0, r.alive | 0, r.n | 0, r.boot | 0, r.bootT === undefined ? null : r.bootT, r.pop && r.pop.restored !== undefined ? r.pop.restored : null]);
    }
    for (const s in perSlot) S += perSlot[s].found;
    const arms = {}; for (const key in tally) { const a = armSets[key], z = a.sz.slice().sort((x, y) => x - y); a.sz = [];
      arms[key] = { F: a.set.size, new: z.length, mean: z.length ? +(z.reduce((x, y) => x + y, 0) / z.length).toFixed(2) : null, ge17: z.filter(v => v >= 17).length, U: tally[key].U, K: tally[key].K, A: tally[key].A, ground: tally[key].ground, chk: tally[key].chk }; }
    emit({ t: T_OFF + at, leg: LEG, J: J0, read: Math.round((Date.now() - t0) / 1000) - at, F, D: depth(), arms: Object.keys(arms).length ? arms : undefined, SWB: SWBN ? SWB : undefined, SWBN: SWBN || undefined, TOUR: TOUR.U ? TOUR : undefined, lost: lost.length ? lost : undefined, S, K, A, U, n5, M, MA, off, bad, sw, slots, errs: errs.length, final: !!final });
  };
  // samples are scheduled at EVERY, 2 EVERY, ... SECS from page load; t is the scheduled time, read is how long the reads took
  let reloaded = false;
  for (let at = EVERY; at <= SECS; at += EVERY) {
    const wait = t0 + at * 1000 - Date.now(); if (wait > 0) await page.waitForTimeout(wait);
    if (RELOAD_AT && !reloaded && at > RELOAD_AT) { reloaded = true; await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(5000); emit({ t: at, reloaded: true }); }
    try { await sample(at >= SECS, at); } catch (e) { emit({ t: at, sampleErr: String(e && e.message) }); }
  }
  if (errs.length) emit({ pageErrors: errs.slice(0, 5) });
  if (CHAIN) { const u = new Uint32Array(union5.size); let q = 0; for (const Fk of union5) u[q++] = Fk;
    fs.writeFileSync(CHAIN, JSON.stringify({ elapsed: T_OFF + SECS, legs: LEG, n: u.length, tables: Buffer.from(u.buffer).toString('base64') })); }
  if (browser) await browser.close(); else await ctx.close(); server.close();
})().catch(e => { emit({ fatal: String(e && e.stack || e) }); process.exit(1); });
