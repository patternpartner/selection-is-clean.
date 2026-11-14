// mind-test.js — #296: the primitive mind is really inside every universe of a field opened with no token at all (it is
// the browser default), at the rate and mode a field asks for, and absent when the field is opened with #nomind. Read from each universe's own stat() (its mind's counters: parents seen, children
// written, training steps), not from the hash: a token in a URL that no engine ever latched would read like a mind.
//   node mind-test.js            (SECS=<seconds> to warm each field, default 60)
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium'].find(p=>require('fs').existsSync(p)) || '/opt/pw-browsers/chromium';
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
    // the mind is the browser default (#296): a field opened with no token at all must have it; #nomind must not
    // #431: under TASKS (every browser universe's world) the default mind writes drawn instructions and does not learn; learning is asked for
    for (const [hash, want] of [['#n=2,layers=1', 'draw'], ['#n=2,mindmode=learn', 'learn'], ['#n=2,mind=40,mindmode=uniform', 'uniform'], ['#n=2,nomind', 'off']]) {
      const ctx = await browser.newContext(), page = await ctx.newPage();
      await page.goto(base + '/index.html' + hash);
      await page.waitForTimeout(WARM * 1000);
      const ms = await minds(page);
      console.log('  ' + hash + ': ' + ms.map(([s, m, t]) => s + ' t' + t + ' ' + (m ? JSON.stringify({ mode: m.mode, p: m.p, seen: m.seen, wrote: m.uses, trained: m.trained }) : 'no report')).join(' | '));
      ck(hash + ': every universe answered', ms.length >= (hash.includes('layers=1') ? 6 : 3) && ms.every(([, m]) => m), ms.length + ' universes');
      if (want === 'draw') ck(hash + ': and it does not train', ms.every(([, m]) => m && (m.trained | 0) === 0));
      if (want === 'off') ck(hash + ': no universe has a mind', ms.every(([, m]) => m && m.mode === 'off'));
      else {
        ck(hash + ': every universe has a ' + want + ' mind', ms.every(([, m]) => m && m.mode === want));
        // activity only where there has been time for it: the layers run paced and a grown universe may be seconds old,
        // so they can have had no birth yet. Every universe must HAVE the mind (above); the ones past 1,000 ticks must use it.
        // #384: RUN IS COUNTED IN THE MIND'S OWN EXPERIENCE as well as in ticks. A mind is consulted per BIRTH, and under #383's
        // one-currency world a tick holds far more births and a field ticks about five times a second, not twenty. So in this rig's
        // window only 2 universes passed tick 1,000, while every mind in both fields had seen 450-2,448 parents and written
        // 173-963 children; on the old world a mind at tick 1,000 had seen 1,272-2,089. A universe counts as having run if it
        // passed 1,000 ticks OR its mind has seen 1,000 parents. The floor of three and every condition on it are unchanged.
        const ran = ms.filter(([, m, t]) => t >= 1000 || (m && m.seen >= 1000));
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
