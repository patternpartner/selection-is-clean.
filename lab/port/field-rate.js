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
const { sz5 } = require('./sz5.js'); let newSz = [];
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
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  await page.goto(base + '/' + HASH, { waitUntil: 'load' });
  const sample = async (final, at) => {
    const rows = await readField(page, final ? 120000 : 60000);
    let S = 0, K = 0, A = 0, U = 0, sw = null, off = 0, bad = 0, n5 = 0, M = 0, MA = 0;
    const slots = [];
    for (const [s, r] of rows) {
      if (!r || r.err) { bad++; continue; }
      if (r.off) { off++; continue; }
      U++; K += r.totalTicks | 0; A += r.alive | 0; if (r.in5) n5++; M += r.mig | 0; MA += r.migA | 0;
      const ps = perSlot[s] || (perSlot[s] = { found: 0, ticks: 0 });
      ps.found = Math.max(ps.found, (r.n | 0) - (r.boot | 0)); ps.ticks = r.totalTicks | 0;
      if (!sw) sw = r.sw;
      const b = Buffer.from(r.b64, 'base64');
      if (r.in5) { for (let j = 0; j + 3 < b.length; j += 4) { const Fk = b.readUInt32LE(j); if (!union5.has(Fk)) { union5.add(Fk); F++; newSz.push(sz5(Fk)); } } slots.push([s, r.totalTicks | 0, r.alive | 0, r.n | 0, r.boot | 0, r.bootT === undefined ? null : r.bootT, r.pop && r.pop.restored !== undefined ? r.pop.restored : null]); continue; }   // #392: canonical truth tables
      for (let j = 0; j < b.length; j++) { const x = b[j]; if (!x) continue;
        for (let k = 0; k < 8; k++) if ((x >> k) & 1) { const T = j * 8 + k; if (!union[T]) { union[T] = 1; F++; } } }
      slots.push([s, r.totalTicks | 0, r.alive | 0, r.n | 0, r.boot | 0, r.bootT === undefined ? null : r.bootT, r.pop && r.pop.restored !== undefined ? r.pop.restored : null]);
    }
    for (const s in perSlot) S += perSlot[s].found;
    emit({ t: T_OFF + at, leg: LEG, read: Math.round((Date.now() - t0) / 1000) - at, F, D: depth(), S, K, A, U, n5, M, MA, off, bad, sw, slots, errs: errs.length, final: !!final });
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
