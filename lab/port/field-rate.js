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

const union = new Uint8Array(NF);
let F = 0;
const perSlot = {};   // slot -> {max n-boot, last ticks}
const emit = o => { const s = JSON.stringify(o); if (OUT) fs.appendFileSync(OUT, s + '\n'); else console.log(s); };

const readField = page => page.evaluate(async () => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const one = async el => { const s = slotOf(el);
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a || !a.seenForTest) return [s, null];
      const r = await Promise.race([a.seenForTest(), new Promise(z => setTimeout(() => z(null), 15000))]);
      return [s, r]; } catch (e) { return [s, { err: String(e && e.message) }]; } };
  const els = [];
  for (const c of document.querySelectorAll('.cell')) if (c.firstChild && c.firstChild.contentWindow) els.push(c.firstChild);
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) els.push(d);
  const o = [];
  for (const el of els) o.push(await one(el));
  return o;
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  await page.goto(base + '/' + HASH, { waitUntil: 'load' });
  const sample = async final => {
    const rows = await readField(page);
    let S = 0, K = 0, A = 0, U = 0, sw = null, off = 0, bad = 0;
    const slots = [];
    for (const [s, r] of rows) {
      if (!r || r.err) { bad++; continue; }
      if (r.off) { off++; continue; }
      U++; K += r.totalTicks | 0; A += r.alive | 0;
      const ps = perSlot[s] || (perSlot[s] = { found: 0, ticks: 0 });
      ps.found = Math.max(ps.found, (r.n | 0) - (r.boot | 0)); ps.ticks = r.totalTicks | 0;
      if (!sw) sw = r.sw;
      const b = Buffer.from(r.b64, 'base64');
      for (let j = 0; j < b.length; j++) { const x = b[j]; if (!x) continue;
        for (let k = 0; k < 8; k++) if ((x >> k) & 1) { const T = j * 8 + k; if (!union[T]) { union[T] = 1; F++; } } }
      slots.push([s, r.totalTicks | 0, r.alive | 0, r.n | 0, r.boot | 0]);
    }
    for (const s in perSlot) S += perSlot[s].found;
    emit({ t: Math.round((Date.now() - t0) / 1000), F, S, K, A, U, off, bad, sw, slots, errs: errs.length, final: !!final });
  };
  while (Date.now() - t0 < SECS * 1000) {
    await page.waitForTimeout(Math.max(1000, Math.min(EVERY * 1000, SECS * 1000 - (Date.now() - t0))));
    try { await sample(Date.now() - t0 >= SECS * 1000); } catch (e) { emit({ t: Math.round((Date.now() - t0) / 1000), sampleErr: String(e && e.message) }); }
  }
  if (errs.length) emit({ pageErrors: errs.slice(0, 5) });
  await browser.close(); server.close();
})().catch(e => { emit({ fatal: String(e && e.stack || e) }); process.exit(1); });
