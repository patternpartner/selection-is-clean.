// grown-test.js — #297: a universe the field grew comes back after a reload, with its own lineage and its own mind,
// instead of being dropped while two new ones are grown into two new slots. Reported by the user ("it always got to 2
// grown quickly then stayed at that"): the cap explains the two; the reload explains the rest.
//   node grown-test.js
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const ck = (n, ok, d) => { (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + n + (d !== undefined ? ('   ' + d) : '')); };
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u === '/' ? '/index.html' : u)] || 'application/octet-stream' });
    res.end(b); });
});
// the grown frames on the page: their slots, and what each answers
const grownNow = page => page.evaluate(async () => {
  const o = [];
  for (const f of document.querySelectorAll('#below .grown')) { const m = (f.getAttribute('src') || '').match(/[?&]slot=(g\d+)/);
    let st = null; try { const a = f.contentWindow && f.contentWindow.__field; if (a) st = await Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 8000))]); } catch (e) {}
    o.push({ slot: m ? m[1] : '?', ticks: st ? st.totalTicks | 0 : -1, mind: st && st.mind ? st.mind.mode : null, restored: !!(st && st.mind && st.mind.restored) }); }
  return { frames: o, readout: (document.getElementById('grown') || {}).textContent || '',
           slots: Object.keys(localStorage).filter(k => /^selection_g\d+$/.test(k)).sort() }; });

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const ctx = await browser.newContext(), page = await ctx.newPage();
    // a real germline and a real mind, lifted from a running universe's own save file
    await page.goto(base + '/index.html#n=1,layers=0,nofound'); await page.waitForTimeout(8000);
    const file = await page.evaluate(async () => { const f = document.querySelector('.cell').firstChild; return await f.contentWindow.__field.save(); });
    const sv = JSON.parse(file);
    ck('a universe file to grow from', !!(sv.genome && sv.mind), Object.keys(sv).join(','));
    // three daughters in storage from "earlier sessions" (g0 oldest, g7 newest); minds beside two of them
    await page.evaluate(s => { localStorage.setItem('selection_g0', s.genome); localStorage.setItem('selection_g3', s.genome); localStorage.setItem('selection_g7', s.genome);
      localStorage.setItem('mind_g7', s.mind); localStorage.setItem('mind_g3', s.mind); }, sv);

    // reload with a cap of two: the two newest come back, the oldest stays where it is, untouched
    await page.goto('about:blank'); await page.goto(base + '/index.html#n=1,layers=0,foundcap=2'); await page.waitForTimeout(20000);
    const g = await grownNow(page);
    console.log('  ' + JSON.stringify(g));
    ck('the newest grown universes come back after a reload, up to the cap', g.frames.map(f => f.slot).join(',') === 'g7,g3', g.frames.map(f => f.slot).join(','));
    ck('and they are running', g.frames.every(f => f.ticks > 0), g.frames.map(f => f.slot + ' t' + f.ticks).join(' '));
    ck('each with its own mind, the saved one', g.frames.every(f => f.mind === 'learn' && f.restored), g.frames.map(f => f.slot + ' ' + f.mind + (f.restored ? ' (restored)' : '')).join(' '));
    ck('the field says so', /^2 grown/.test(g.readout), g.readout);
    ck('nothing new was grown into a new slot, and the older one is left as it was', g.slots.join(',') === 'selection_g0,selection_g3,selection_g7', g.slots.join(','));

    // a harvest now carries the grown universes too, and loads them back into their own slots
    const h = await page.evaluate(async () => {
      const f = Array.from(document.querySelectorAll('#below .grown')).find(x => /slot=g7/.test(x.getAttribute('src')));
      const t = await f.contentWindow.__field.save(); return JSON.parse(t); });
    ck('a grown universe answers the field\'s save with its genome and its mind', !!(h.genome && h.mind));
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
