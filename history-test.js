// history-test.js - #367: each universe keeps a history across reloads, and the field's harvest carries it. A standalone universe
// gathers rows (the worker's histRow) every 250 ticks; a reload adds a 'boot' marker and keeps the rows before it; a field's harvest
// file has every universe's rows.   node history-test.js   (SECS=<seconds> per wait, default 60)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WARM = Math.max(40, +(process.env.SECS || 60));
let pass = 0, fail = 0;
const ck = (n, ok, d) => { (ok ? pass++ : fail++); console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + n + (d !== undefined ? ('   ' + d) : '')); };
const server = http.createServer((req, res) => { const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => { if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    { const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/universe.html'); await page.evaluate(() => window.__field.ready());
      await page.waitForTimeout(WARM * 1000);
      const h1 = await page.evaluate(() => window.__field.history()), data1 = h1.filter(r => r[0] !== 'boot');
      console.log('  first session: ' + h1.length + ' entries, last ' + JSON.stringify(h1[h1.length - 1]));
      ck('a boot marker, then rows', h1.length >= 3 && h1[0][0] === 'boot' && data1.length >= 2, h1.length);
      ck('each row has its 20 fields and a living population', data1.every(r => r.length === 20 && r[2] > 0), data1.map(r => r[2]).join(' '));
      ck('rows are at least 250 ticks apart', data1.every((r, i) => i === 0 || r[0] - data1[i - 1][0] >= 250));
      ck('a TASKS world is paid and has functions', data1[data1.length - 1][7] > 0 && data1[data1.length - 1][8] > 0, 'paid ' + data1[data1.length - 1][7] + ', functions ' + data1[data1.length - 1][8]);
      await page.reload(); await page.evaluate(() => window.__field.ready()); await page.waitForTimeout(25000);
      const h2 = await page.evaluate(() => window.__field.history());
      const boots = h2.filter(r => r[0] === 'boot').length;
      ck('a reload keeps the rows and marks itself', boots === 2 && h2.length > h1.length && JSON.stringify(h2.slice(0, h1.length)) === JSON.stringify(h1), boots + ' boots, ' + h2.length + ' entries');
      await ctx.close(); }
    { const ctx = await browser.newContext({ acceptDownloads: true }), page = await ctx.newPage();
      await page.goto(base + '/index.html#n=2'); await page.waitForTimeout(WARM * 1000);
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('#harvest')]);
      const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')), us = j.universes.filter(u => u.genome);
      console.log('  harvest: ' + us.map(u => u.at + ' ' + (u.history ? u.history.length : 'none')).join(', '));
      ck('the harvest carries every answering universe\'s history', us.length >= 2 && us.every(u => Array.isArray(u.history) && u.history.length >= 2), us.length + ' universes');
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
