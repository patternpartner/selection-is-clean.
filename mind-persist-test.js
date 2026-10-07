// mind-persist-test.js — #296: a universe's mind is saved with it and comes back after a reload ("if we save the field we
// should also save the mind at the same time. No resets"), it travels in a universe's save file, the field and an opened
// universe both show what it is doing, and #reset clears it. Read from the universe's own stat() and the page's storage.
//   node mind-persist-test.js      (MAXS=<seconds> to wait for the first autosave, default 420)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MAXS = +(process.env.MAXS || 420);

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
// the first cell's universe: its stat(), and (optionally) its save file
const first = (page, what) => page.evaluate(async (what) => {
  const f = document.querySelector('.cell') && document.querySelector('.cell').firstChild, a = f && f.contentWindow && f.contentWindow.__field;
  if (!a) return null; const p = what === 'save' ? a.save() : a.stat();
  return await Promise.race([p, new Promise(z => setTimeout(() => z(null), 8000))]); }, what);

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const ctx = await browser.newContext(), page = await ctx.newPage();
    // two universes and their collective, no layers, nothing grown: the smallest real field
    await page.goto(base + '/index.html#n=2,layers=0,nofound');
    let st = null; const t0 = Date.now();
    while (Date.now() - t0 < MAXS * 1000) { await page.waitForTimeout(5000); st = await first(page, 'stat'); if (st && st.mind && st.mind.savedAt > 0) break; }
    ck('the mind saved itself at the universe\'s autosave', !!(st && st.mind && st.mind.savedAt > 0), st && st.mind ? 'savedAt ' + st.mind.savedAt + ', tick ' + st.totalTicks : 'no stat');
    const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('mind_') === 0).map(k => [k, localStorage.getItem(k).length]));
    ck('into the universe\'s own key, beside its genome (mind_u0)', keys.some(([k, n]) => k === 'mind_u0' && n > 10000), JSON.stringify(keys));
    ck('and small enough for a field of eighteen', keys.every(([, n]) => n < 120000), keys.map(([k, n]) => k + ' ' + Math.round(n / 1000) + 'k').join(' '));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind_u0') || 'null'));
    const fieldLine = await page.evaluate(() => { const e = document.getElementById('minds'); return e && e.style.display !== 'none' ? e.textContent : ''; });
    ck('the field shows what its minds are doing', /minds? · learned from .* parents · wrote .* children/.test(fieldLine), fieldLine);
    const file = await first(page, 'save'); let fj = null; try { fj = JSON.parse(file); } catch (e) {}
    ck('a universe\'s save file carries its mind', !!(fj && fj.genome && fj.mind && JSON.parse(fj.mind).v === 1), fj ? Object.keys(fj).join(',') : 'no file');

    // reload: the same mind must come back, not a newborn one
    await page.reload(); await page.waitForTimeout(12000);
    const st2 = await first(page, 'stat');
    ck('after a reload the mind is the saved one, not a newborn', !!(st2 && st2.mind && st2.mind.restored), st2 && st2.mind ? JSON.stringify({ restored: st2.mind.restored, seen: st2.mind.seen, trained: st2.mind.trained }) : 'no stat');
    ck('and it carries on counting from where it was saved', !!(st2 && st2.mind && saved && st2.mind.seen >= saved.seen && st2.mind.trained >= saved.nTrain && st2.mind.uses >= saved.uses),
       saved && st2 && st2.mind ? 'saved seen ' + saved.seen + ' trained ' + saved.nTrain + ' -> now ' + st2.mind.seen + ' / ' + st2.mind.trained : '');

    // an opened universe shows its own mind's line
    // (the HUD is written every 600 ticks, so this waits for it)
    const up = await ctx.newPage(); await up.goto(base + '/universe.html?slot=u0'); let hud = '';
    for (let w = 0; w < 24 && !/^mind/.test(hud); w++) { await up.waitForTimeout(5000); hud = await up.evaluate(() => (document.getElementById('gen') || {}).textContent || ''); }
    ck('an opened universe\'s HUD shows its mind, first', /^mind: learned from \d+ · wrote \d+ children/.test(hud), (hud.match(/^mind:[^|]*/) || [hud.slice(0, 80)])[0]);
    await up.close();

    // a harvest loaded back: every universe gets its own mind back (the field's load button, #230)
    const one = JSON.parse(await first(page, 'save'));
    await page.evaluate((u) => { localStorage.removeItem('mind_u0');
      localStorage.setItem('fieldPendingLoad', JSON.stringify({ type: 'selection-field', version: 1, hash: '#n=2,layers=0,nofound',
        universes: [{ at: 'surface/0', genome: u.genome, mind: u.mind }] })); }, one);
    await page.goto('about:blank'); await page.goto(base + '/index.html#n=2,layers=0,nofound'); await page.waitForTimeout(12000);
    const back = await page.evaluate(() => (localStorage.getItem('mind_u0') || '').length), st3 = await first(page, 'stat');
    ck('a harvest loaded back restores each universe\'s mind', back > 10000 && !!(st3 && st3.mind && st3.mind.restored),
       'mind_u0 ' + back + ' chars, restored ' + !!(st3 && st3.mind && st3.mind.restored));

    // #reset: a brand-new field has newborn minds
    await page.goto('about:blank'); await page.goto(base + '/index.html#reset'); await page.waitForTimeout(3000);   // a real load, not a hash change
    const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('mind_') === 0).length);
    ck('#reset clears every saved mind', left === 0, left + ' left');
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
