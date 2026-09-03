// layers-test.js — #165/#166: the cube. What you see is one face.
//
// `#layers=K` puts K more layers of the same count underneath the surface: universes with no cell,
// drawing nothing (#dark), running slow (#pace), on the same wire as everything above them. The
// default nine on top with two layers below is twenty-seven universes.
//
// The load-bearing claim is that a layer is an ORDINARY universe that happens not to be visible.
// Not quieter, not deafer, not cut off — the broadcast is dual in both directions and the only
// difference is that you cannot see it. That is what most of this file checks, because an earlier
// version got it wrong in exactly that way: the #163 clock gate made anything paced refuse its
// neighbours, so the depths were deaf and nothing said so.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SECS = Math.max(10, +(process.env.SECS || 40));

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

const readAll = page => page.evaluate(async () => {
  const grab = async el => { try { const a = el.contentWindow && el.contentWindow.__field;
    return a ? await a.stat() : null; } catch (e) { return null; } };
  const surface = [], deep = [];
  for (const c of document.querySelectorAll('.cell')) surface.push(await grab(c.firstChild));
  for (const d of document.querySelectorAll('#below .deep')) deep.push(await grab(d));
  return { surface, deep, depthText: (document.getElementById('depth') || {}).textContent || '' };
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // ── the cube ──────────────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/#n=8,layers=2', { waitUntil: 'load' });
    await page.waitForTimeout(SECS * 1000);
    const { surface, deep, depthText } = await readAll(page);

    const liveS = surface.filter(s => s && s.totalTicks > 0);
    const liveD = deep.filter(s => s && s.totalTicks > 0);
    ck('the surface is nine universes', surface.length === 9, surface.length);
    ck('two layers of nine run underneath', deep.length === 18, deep.length);
    ck('every universe on the surface is ticking', liveS.length === 9, liveS.length + '/9');
    ck('every universe underneath is ticking', liveD.length === 18, liveD.length + '/18');
    ck('nothing anywhere reports a caught error',
       liveS.concat(liveD).every(s => !(s.errs > 0)));

    // deeper is slower, and by roughly the ratio the paces set (400ms vs 800ms)
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    const L1 = mean(liveD.slice(0, 9).map(s => s.totalTicks));
    const L2 = mean(liveD.slice(9).map(s => s.totalTicks));
    ck('the second layer runs slower than the first', L2 > 0 && L1 > L2 * 1.4,
       Math.round(L1) + ' vs ' + Math.round(L2) + ' ticks');
    ck('the layers run slower than the surface',
       mean(liveS.map(s => s.totalTicks)) > L1 * 2, Math.round(mean(liveS.map(s => s.totalTicks))) + ' on top');

    // THE BROADCAST IS DUAL. Everyone sees everyone, traffic moves in both directions, and nothing
    // is refused — a layer is an ordinary universe that happens not to be visible.
    ck('the surface sees every universe, including the ones below',
       liveS.every(s => s.peers >= 26), 'peers ' + liveS.map(s => s.peers).join(','));
    ck('the depths see every universe too',
       liveD.every(s => s.peers >= 26), 'peers ' + liveD.slice(0, 3).map(s => s.peers).join(','));
    ck('the surface is taking material in', mean(liveS.map(s => s.migrantAccepted)) > 0,
       Math.round(mean(liveS.map(s => s.migrantAccepted))) + ' each');
    ck('the depths are taking material in too', mean(liveD.map(s => s.migrantAccepted)) > 0,
       Math.round(mean(liveD.map(s => s.migrantAccepted))) + ' each');
    ck('nobody refuses a neighbour on clock grounds',
       liveS.concat(liveD).every(s => (s.paced | 0) === 0),
       'refused ' + liveS.concat(liveD).reduce((a, s) => a + (s.paced | 0), 0));

    ck('the depths are alive, not merely present', liveD.every(s => (s.N | 0) > 0),
       liveD.map(s => s.N | 0).slice(0, 4).join(',') + '...');
    ck('the readout says what is underneath', /\d+\/18 below/.test(depthText), depthText);
    ck('no uncaught page errors with layers', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── #dark: the same universe, drawing and not drawing ─────────────────────────────────────
  // Drawing is 40% of a tick, which is what makes a universe nobody is looking at the cheapest
  // thing this field can run. Both arms are unpaced, so the difference is the render and nothing
  // else. One-sided: dark must be faster, by any margin a slow machine still shows.
  {
    const run = async hash => {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
      const page = await ctx.newPage();
      await page.goto(base + '/universe.html' + hash, { waitUntil: 'load' });
      await page.waitForTimeout(Math.max(15000, SECS * 400));
      const s = await page.evaluate(async () => { try { return await window.__field.stat(); } catch (e) { return null; } });
      await ctx.close(); return s;
    };
    const lit = await run('');
    const dark = await run('#dark');
    ck('a dark universe still runs the simulation', !!(dark && dark.totalTicks > 0), dark && dark.totalTicks);
    ck('a dark universe ticks faster than a lit one', !!lit && dark.totalTicks > lit.totalTicks * 1.15,
       dark.totalTicks + ' dark vs ' + lit.totalTicks + ' lit');
    ck('a dark universe keeps a population', (dark.N | 0) > 0, 'N ' + dark.N);
  }

  // ── no layers means no layers ─────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    await page.goto(base + '/#n=8', { waitUntil: 'load' });
    await page.waitForTimeout(8000);
    const n = await page.evaluate(() => ({
      deep: document.querySelectorAll('#below .deep').length,
      shown: (document.getElementById('depth') || {}).style.display }));
    ck('the default field has nothing underneath it', n.deep === 0, n.deep);
    ck('and does not show a depth readout', n.shown !== 'block', String(n.shown));
    await ctx.close();
  }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message); process.exit(1); });
