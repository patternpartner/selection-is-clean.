// mind-test.js — #296: the primitive mind is really inside the field's universes when the field is opened with
// #mind, and absent when it is not. Read from each universe's own stat() (its mind's counters: parents seen, children
// written, training steps), not from the hash: a token in a URL that no engine ever latched would read like a mind.
//   node mind-test.js            (SECS=<seconds> to warm each field, default 60)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const WARM = Math.max(20, +(process.env.SECS || 60));

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

// every universe in the page (surface cells, the collective, the layers below and any grown one), with its mind report
const minds = page => page.evaluate(async () => {
  const one = async el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/), s = m ? m[1] : '?';
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a) return [s, null];
      const r = await Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 8000))]);
      return [s, r ? (r.mind || null) : null, r ? (r.totalTicks | 0) : -1]; } catch (e) { return [s, null, -1]; } };
  const o = []; for (const c of document.querySelectorAll('.cell')) o.push(await one(c.firstChild));
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) o.push(await one(d));   // the layers below and any grown universe
  return o;
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    for (const [hash, want] of [['#n=2,layers=1,mind', 'learn'], ['#n=2,mind=40,mindmode=uniform', 'uniform'], ['#n=2', 'off']]) {
      const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/index.html' + hash);
      await page.waitForTimeout(WARM * 1000);
      const ms = await minds(page);
      console.log('  ' + hash + ': ' + ms.map(([s, m, t]) => s + ' t' + t + ' ' + (m ? JSON.stringify({ mode: m.mode, p: m.p, seen: m.seen, wrote: m.uses, trained: m.trained }) : 'no report')).join(' | '));
      ck(hash + ': every universe answered', ms.length >= (hash.includes('layers=1') ? 6 : 3) && ms.every(([, m]) => m), ms.length + ' universes');
      if (want === 'off') ck(hash + ': no universe has a mind', ms.every(([, m]) => m && m.mode === 'off'));
      else {
        ck(hash + ': every universe has a ' + want + ' mind', ms.every(([, m]) => m && m.mode === want));
        // activity only where there has been time for it: the layers run paced and a grown universe may be seconds old,
        // so they can have had no birth yet. Every universe must HAVE the mind (above); the ones past 1,000 ticks must use it.
        const ran = ms.filter(([, m, t]) => t >= 1000);
        ck(hash + ': every universe past 1,000 ticks has seen parents and written children', ran.length >= 3 && ran.every(([, m]) => m && m.seen > 0 && m.uses > 0),
           ran.map(([s, m]) => s + ' ' + (m ? m.seen + '/' + m.uses : '-')).join(' '));
        if (want === 'learn') ck(hash + ': and is learning', ran.every(([, m]) => m && m.trained > 0 && m.lossOp > 0 && m.lossOp < m.uniformOp),
           ran.map(([s, m]) => s + ' ' + (m ? m.lossOp + '<' + m.uniformOp : '-')).join(' '));
        if (hash.includes('mind=40')) ck(hash + ': at the rate the field asked for', ms.every(([, m]) => m && m.p === 0.4));
      }
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
