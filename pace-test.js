// pace-test.js — #163: a floor on the milliseconds between ticks.
//
// The field's tick budget is fixed (measured: four workers buy about five times one universe, and
// that is the whole machine), so past a handful of universes the only question left is who gets the
// ticks. PACE is the answer as a rate cap: local to the universe carrying it, no central scheduler,
// and budget nobody claims flows to whoever wants it. This checks it does what it says and that a
// paced universe is slowed rather than broken.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SECS = Math.max(8, +(process.env.SECS || 20));

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

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const run = async (hash) => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/universe.html' + hash, { waitUntil: 'load' });
    await page.waitForTimeout(SECS * 1000);
    const s = await page.evaluate(async () => { try { return await window.__field.stat(); } catch (e) { return null; } });
    await ctx.close();
    return { s, errs };
  };

  const free  = await run('');
  const paced = await run('#pace=250');

  ck('an unpaced universe runs', !!(free.s && free.s.totalTicks > 0), free.s && free.s.totalTicks);
  ck('a paced universe runs',    !!(paced.s && paced.s.totalTicks > 0), paced.s && paced.s.totalTicks);
  // 250ms between ticks is at most 4 ticks/s. The floor is a FLOOR — a slow machine may be slower
  // still — so the assertion is one-sided, which is the only side the flag promises.
  const cap = 4 * SECS * 1.35;   // headroom for boot ticks before the flag is read
  ck('pace caps the tick rate', paced.s.totalTicks < cap, paced.s.totalTicks + ' < ' + Math.round(cap));
  ck('pace actually slows it down', paced.s.totalTicks * 2 < free.s.totalTicks,
     paced.s.totalTicks + ' vs ' + free.s.totalTicks + ' free');
  // Slowed, not broken: it still has a population, still keeps a genome, still reports no caught error.
  ck('a paced universe is alive, not stalled', (paced.s.N | 0) > 0, 'N ' + paced.s.N);
  ck('a paced universe reports no caught error', !(paced.s.errs > 0), paced.s.errs);
  ck('no uncaught page errors', free.errs.length === 0 && paced.errs.length === 0,
     free.errs.concat(paced.errs).slice(0, 2).join(' | '));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message); process.exit(1); });
