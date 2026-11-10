// field-phase.js - #396: WHERE A FIELD'S TIME GOES. #395b found a 16% cheaper tick in node gave a browser field no more ticks.
// This opens the default field, lets it warm up for WARM seconds, asks every universe to start timing its own loop
// (__field.phaseForTest(), sim.worker.js: performance.now() around loop and its largest phases, and the wall time between loops),
// and SECS later reads the totals. Per universe: ticks, ms inside loop per tick, the phases' shares, and gap - the time between one
// tick ending and the next starting, which is the wait for the worker thread (its other universes, pace delays, messages).
//   OUT=x.json WARM=120 SECS=120 [ENGINE=path] [HASH=#...] node lab/port/field-phase.js
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const ENGINE = process.env.ENGINE ? path.resolve(process.env.ENGINE) : path.join(ROOT, 'engine.html');
const WARM = +(process.env.WARM || 120), SECS = +(process.env.SECS || 120), HASH = process.env.HASH || '', OUT = process.env.OUT || '';
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium'].find(p=>fs.existsSync(p)) || '/opt/pw-browsers/chromium';
const server = http.createServer((req, res) => { const u0 = req.url.split('?')[0], u = (u0 === '/' ? '/index.html' : u0);
  fs.readFile((u === '/engine.html') ? ENGINE : path.join(ROOT, u), (e, b) => { if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
const readField = (page, ms) => page.evaluate(async ms => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const poolOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]pool=[^x]*x(\d+)/); return m ? +m[1] : -1; };
  const one = async el => { const s = slotOf(el);
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a || !a.phaseForTest) return [s, poolOf(el), null];
      return [s, poolOf(el), await Promise.race([a.phaseForTest(), new Promise(z => setTimeout(() => z(null), ms))])]; } catch (e) { return [s, -1, { err: String(e && e.message) }]; } };
  const els = [];
  for (const c of document.querySelectorAll('.cell')) if (c.firstChild && c.firstChild.contentWindow) els.push(c.firstChild);
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) els.push(d);
  return Promise.all(els.map(one));
}, ms);
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
  await page.goto('http://127.0.0.1:' + server.address().port + '/' + HASH, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, WARM * 1000));
  const inst = await readField(page, 60000);
  await new Promise(r => setTimeout(r, SECS * 1000));
  const rows = (await readField(page, 120000)).filter(r => r[2] && r[2].n !== undefined).map(([slot, pool, p]) => ({ slot, pool, ticks: p.n, alive: p.alive, pace: p.pace,
    wallS: +(p.ms / 1000).toFixed(1), loopMs: p.n ? +(p.loop / p.n).toFixed(1) : null, gapMs: p.n > 1 ? +(p.gap / (p.n - 1)).toFixed(1) : null,
    loopShare: +(p.loop / p.ms).toFixed(3), f: Object.fromEntries(Object.entries(p.f).map(([k, v]) => [k, p.loop ? +(v / p.loop).toFixed(3) : 0])) }));
  const tot = rows.reduce((a, r) => ({ ticks: a.ticks + r.ticks, loop: a.loop + r.loopMs * r.ticks, alive: a.alive + r.alive }), { ticks: 0, loop: 0, alive: 0 });
  const fsum = {}; for (const r of rows) for (const k in r.f) fsum[k] = (fsum[k] || 0) + r.f[k] * r.loopMs * r.ticks;
  const pools = {}; for (const r of rows) { const q = pools[r.pool] || (pools[r.pool] = { universes: 0, busy: 0 }); q.universes++; q.busy += r.loopShare; }
  const out = { warm: WARM, secs: SECS, installedOn: inst.filter(r => r[2] && r[2].installed).length, universes: rows.length, ticks: tot.ticks, alive: tot.alive,
    meanLoopMs: +(tot.loop / Math.max(1, tot.ticks)).toFixed(1), threadSecondsInLoop: +(tot.loop / 1000).toFixed(1),
    phaseShareOfLoop: Object.fromEntries(Object.entries(fsum).map(([k, v]) => [k, +(v / Math.max(1, tot.loop)).toFixed(3)])),
    workerBusyShare: Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, { universes: v.universes, inLoop: +v.busy.toFixed(3) }])), rows };
  const s = JSON.stringify(out); if (OUT) fs.writeFileSync(OUT, s + '\n'); console.log(JSON.stringify({ ...out, rows: undefined }, null, 1));
  await browser.close(); server.close();
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
