// field-liveness.js - #435: WHICH MECHANISMS RUN IN A REAL FIELD? Opens a field (fresh, or a SAVED one from PROFILE with the PORT it
// ran on, since storage is per origin; use a copy, the field keeps saving into it), waits SECS, then reads every universe's
// liveness counters at once (__field.livenessForTest(), sim.worker.js: a copy of __liveness since that universe booted, drawing
// nothing). Sums each counter over the field and counts the universes it fired in. Writes OUT (json) and prints the never-list.
//   OUT=x.json SECS=1500 [PROFILE=dir PORT=n] [ENGINE=path] [HASH=#...] node lab/port/field-liveness.js
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const ENGINE = process.env.ENGINE ? path.resolve(process.env.ENGINE) : path.join(ROOT, 'engine.html');
const SECS = +(process.env.SECS || 1500), HASH = process.env.HASH || '', OUT = process.env.OUT || '';
const PROFILE = process.env.PROFILE || '', PORT = +(process.env.PORT || 0);
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium'].find(p=>fs.existsSync(p)) || '/opt/pw-browsers/chromium';
const server = http.createServer((req, res) => { const u0 = req.url.split('?')[0], u = (u0 === '/' ? '/index.html' : u0);
  fs.readFile((u === '/engine.html') ? ENGINE : path.join(ROOT, u), (e, b) => { if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
const readField = (page, ms) => page.evaluate(async ms => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const one = async el => { const s = slotOf(el);
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a || !a.livenessForTest) return [s, null];
      return [s, await Promise.race([a.livenessForTest(), new Promise(z => setTimeout(() => z(null), ms))])]; } catch (e) { return [s, { err: String(e && e.message) }]; } };
  const els = [];
  for (const c of document.querySelectorAll('.cell')) if (c.firstChild && c.firstChild.contentWindow) els.push(c.firstChild);
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) els.push(d);
  return Promise.all(els.map(one));
}, ms);
(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  const ctx = PROFILE ? await chromium.launchPersistentContext(PROFILE, { executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'], viewport: { width: 412, height: 915 } }) : null;
  const browser = PROFILE ? null : await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = PROFILE ? (ctx.pages()[0] || await ctx.newPage()) : await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
  await page.goto('http://127.0.0.1:' + server.address().port + '/' + HASH, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, SECS * 1000));
  const rows = (await readField(page, 120000)).filter(r => r[1] && r[1].c);
  const sum = {}, inU = {}; let U = 0; const ages = [];
  for (const [, L] of rows) { U++; ages.push(L.totalTicks | 0); for (const k in L.c) { sum[k] = (sum[k] || 0) + L.c[k]; if (L.c[k] > 0) inU[k] = (inU[k] || 0) + 1; } }
  ages.sort((a, b) => a - b);
  const names = Object.keys(sum).sort(), never = names.filter(k => !sum[k]);
  const out = { secs: SECS, profile: !!PROFILE, U, ages: { min: ages[0], median: ages[ages.length >> 1], max: ages[ages.length - 1] }, declared: names.length, never, sum, inU };
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('universes read ' + U + '; universe age (totalTicks) min ' + out.ages.min + ', median ' + out.ages.median + ', max ' + out.ages.max + '; counters ' + names.length + '; never in any universe ' + never.length);
  console.log('NEVER: ' + never.join(' '));
  if (ctx) await ctx.close(); if (browser) await browser.close(); server.close(); process.exit(0);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
