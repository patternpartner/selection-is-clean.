// sound-test.js - #363: the sound is a readout of the TASKS layer. Tapped on in a standalone universe it plays bars whose
// voices are paid functions (read back from the shell's own record of what it played, not from the audio graph); with
// #notasks it says so and plays nothing; and the field's controls(false) turns it off.
//   node sound-test.js            (SECS=<seconds> to let the world run after the tap, default 45)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WARM = Math.max(20, +(process.env.SECS || 45));

let pass = 0, fail = 0;
const ck = (n, ok, d) => { (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + n + (d !== undefined ? ('   ' + d) : '')); };

const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' });
    res.end(b); });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] });
  try {
    { const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/universe.html');
      await page.evaluate(() => window.__field.ready());
      const before = await page.textContent('#gsnd');
      ck('the sound starts off', /sound/.test(before) && before.includes('🔇'), before);
      await page.click('#gsnd');
      await page.waitForTimeout(WARM * 1000);
      const s = await page.evaluate(() => window.__field.soundForTest());
      const st = await page.evaluate(() => window.__field.stat());
      console.log('  last bar: ' + JSON.stringify(s) + '   world t' + (st && st.tick));
      ck('it has played a bar', !!s && s.epoch >= 0, s && s.epoch);
      ck('the bar has voices and notes (a TASKS world pays)', !!s && s.voices > 0 && s.voices <= 8 && s.notes > 0, s && (s.voices + ' voices ' + s.notes + ' notes'));
      ck('the bar length is inside its clamp', !!s && s.bar >= 1.6 && s.bar <= 4, s && s.bar);
      const label = await page.textContent('#gsnd');
      ck('the button reports voices', /voice/.test(label), label);
      await page.evaluate(() => window.__field.controls(false));
      const off = await page.textContent('#gsnd');
      ck('controls(false) turns it off', off.includes('🔇'), off);
      await ctx.close(); }
    { const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/universe.html#notasks');
      await page.evaluate(() => window.__field.ready());
      await page.click('#gsnd');
      await page.waitForTimeout(5000);
      const label = await page.textContent('#gsnd'), s = await page.evaluate(() => window.__field.soundForTest());
      ck('#notasks: says so and plays nothing', /no tasks/.test(label) && s === null, label + ' ' + JSON.stringify(s));
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
