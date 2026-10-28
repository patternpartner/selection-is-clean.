// listen-test.js - #364: listening selects the voice. With the sound on, the world tries variants of its voice gene and keeps
// one heard to the end of its trial; the mute button undoes the variant playing and writes 'u' into voiceHist; closing the
// universe (controls(false)) is not a verdict and writes nothing. Read from the worker's own score and the universe's save.
//   node listen-test.js            (SECS=<seconds> of listening before the mute, default 60)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WARM = Math.max(30, +(process.env.SECS || 60));
const DEF = [3,2,2,3,0,0,1,0,4,3];

let pass = 0, fail = 0;
const ck = (n, ok, d) => { (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + n + (d !== undefined ? ('   ' + d) : '')); };
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); });
});
// the voice and its history out of a save (the engine's genome is base64 JSON)
const hist = async page => { const f = await page.evaluate(() => window.__field.save()); const j = JSON.parse(f);
  const g = typeof j.genome === 'string' ? JSON.parse(Buffer.from(j.genome, 'base64').toString('utf8')) : j.genome;
  return { vh: g.vh || [], vo: g.vo }; };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] });
  try {
    { const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/universe.html');
      await page.evaluate(() => window.__field.ready());
      const h0 = await hist(page);
      ck('unheard: the save carries no voice and no history', h0.vo === undefined && h0.vh.length === 0, JSON.stringify(h0));
      await page.click('#gsnd');
      await page.waitForTimeout(WARM * 1000);
      const s1 = await page.evaluate(() => window.__field.scoreForTest());
      console.log('  after ' + WARM + 's: t' + s1.tick + ' voice ' + JSON.stringify(s1.voice) + ' kept ' + s1.vk + ' undone ' + s1.vu);
      ck('listened to the end of a trial: a variant was kept', s1.vk >= 1 && s1.vu === 0, s1.vk + ' kept');
      ck('the voice playing is not the default', JSON.stringify(s1.voice) !== JSON.stringify(DEF), JSON.stringify(s1.voice));
      const hk = await hist(page), lastK = hk.vh.filter(e => e[1] === 'k').pop();
      ck('each keep is in the history', hk.vh.length === s1.vk && hk.vh.every(e => e[1] === 'k'), hk.vh.length + ' entries');
      await page.click('#gsnd');   // the mute: a verdict on the variant playing
      await page.waitForTimeout(3000);
      const s2 = await page.evaluate(() => window.__field.scoreForTest()), h2 = await hist(page), u = h2.vh[h2.vh.length - 1];
      console.log('  after the mute: voice ' + JSON.stringify(s2.voice) + ' kept ' + s2.vk + ' undone ' + s2.vu + ' last ' + JSON.stringify(u));
      ck('the mute undid the variant playing', s2.vu === 1 && u && u[1] === 'u' && JSON.stringify(u[2]) === JSON.stringify(s1.voice), JSON.stringify(u));
      ck('and the voice is back to the last one kept', JSON.stringify(s2.voice) === JSON.stringify(lastK ? lastK[2] : DEF), JSON.stringify(s2.voice));
      await ctx.close(); }
    { const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/universe.html');
      await page.evaluate(() => window.__field.ready());
      await page.click('#gsnd');
      await page.waitForTimeout(8000);
      const a = await page.evaluate(() => window.__field.scoreForTest());
      await page.evaluate(() => window.__field.controls(false));   // leaving, not a mute
      await page.waitForTimeout(3000);
      const b = await page.evaluate(() => window.__field.scoreForTest()), h = await hist(page);
      console.log('  leaving mid-trial: playing ' + JSON.stringify(a.voice) + ' then ' + JSON.stringify(b.voice) + ' hist ' + h.vh.length);
      ck('leaving is not a verdict: nothing undone or written', b.vu === 0 && h.vh.length === b.vk, b.vu + ' undone, ' + h.vh.length + ' written');
      ck('and the unjudged variant is put back', b.vk > 0 || JSON.stringify(b.voice) === JSON.stringify(DEF), JSON.stringify(b.voice));
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
