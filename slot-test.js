// slot-test.js — #170: every universe keeps its own lineage across a reload.
//
// The engine has always autosaved to ONE localStorage key and read it back on boot, because it was
// written when one universe meant one page. In a field that means every universe boots as a copy of
// whichever one wrote last, so a REFRESH FLATTENS THE FIELD. Measured on a 21-hour overnight run:
// nine universes started from an identical germline and ended with nine different ones — mutation
// rates spread 0.049 to 0.071, 283 distinct atom expressions, none shared by all nine — and every
// bit of that was thrown away by a reload. It is why no run had ever accumulated.
//
// HOW TO TEST THIS WITHOUT FOOLING YOURSELF, because three earlier versions of this check did:
//   · not by fingerprint. fp is three continuously-drifting genes, so it moves in the seconds after
//     a reload whether or not the lineage was restored — it says "changed" for a perfect restore.
//   · not by nearest tick count. These universes sit within two ticks of each other, so "closest
//     match" is noise wearing a verdict.
//   · by reading what each slot ACTUALLY HOLDS. Decode the saved genome, take its own T, and compare
//     against that universe's tick count sampled right after boot, before it can run away from it.
//     Then check no OTHER slot's saved value explains it better.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// The engine's first autosave is at tick 1800, so a universe must get there before there is anything
// to restore. At ~20 ticks/second that is 90 seconds; the default gives headroom on a slow machine.
const WARM = Math.max(60, +(process.env.SECS || 150));

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

const savedSlots = page => page.evaluate(() => {
  const out = {};
  const b2s = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  for (const k of Object.keys(localStorage)) {
    if (k.indexOf('selection_') !== 0) continue;
    try {
      let raw = localStorage.getItem(k);
      if (raw[0] === '{') { const w = JSON.parse(raw); raw = w.genome || w.data || ''; }
      out[k.replace('selection_', '')] = JSON.parse(b2s(raw)).T | 0;
    } catch (e) { out[k.replace('selection_', '')] = -1; }
  }
  return out;
});

const liveTicks = page => page.evaluate(async () => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const one = async el => { const s = slotOf(el);
    try { const a = el.contentWindow && el.contentWindow.__field; if (!a) return [s, -1];
      const r = await Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 8000))]);
      return [s, r ? (r.totalTicks | 0) : -1]; } catch (e) { return [s, -1]; } };
  const o = [];
  for (const c of document.querySelectorAll('.cell')) o.push(await one(c.firstChild));
  for (const d of document.querySelectorAll('#below .deep')) o.push(await one(d));
  return o;
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));

  // #layers=0 so this is about STORAGE and not about depth; the layers are layers-test.js's job.
  await page.goto(base + '/#layers=0', { waitUntil: 'load' });
  await page.waitForTimeout(WARM * 1000);

  const before = await liveTicks(page);
  ck('the field is running', before.filter(x => x[1] > 0).length === 9, before.filter(x => x[1] > 0).length + '/9');
  ck('every universe was given its own slot name',
     before.every(x => /^(u\d+|collective)$/.test(x[0])), before.map(x => x[0]).join(' '));

  const saved = await savedSlots(page);
  const keys = Object.keys(saved);
  ck('each universe has written its OWN key, not one shared key',
     keys.length === 9 && !('genome' in saved), keys.sort().join(' '));
  ck('their saved genomes are at different points in their lives',
     new Set(Object.values(saved)).size > 1, JSON.stringify(saved));

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(9000);
  const after = await liveTicks(page);

  let own = 0, wrong = 0, unsaved = 0;
  const detail = [];
  for (const [slot, t] of after) {
    const sv = saved[slot];
    if (sv === undefined) { unsaved++; detail.push(slot + '=nosave'); continue; }
    const drift = t - sv;
    const plausible = drift >= 0 && drift < 4000;
    const better = Object.keys(saved).some(k => k !== slot && Math.abs(t - saved[k]) < Math.abs(drift));
    if (plausible && !better) { own++; detail.push(slot + '(' + sv + '->' + t + ')'); }
    else { wrong++; detail.push(slot + '=WRONG(' + sv + '->' + t + ')'); }
  }
  ck('every universe came back carrying ITS OWN saved genome', own === 9 && wrong === 0,
     own + ' own, ' + wrong + ' wrong, ' + unsaved + ' unsaved');
  ck('and no two came back identical — the field did not flatten',
     new Set(after.map(x => x[1])).size > 1, after.map(x => x[1]).join(' '));
  console.log('        ' + detail.join('  '));
  ck('no uncaught page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  // #reset must now clear EVERY slot, not the two keys it used to know about.
  // A DIFFERENT QUERY, not just a different hash. Going from '/#layers=0' to '/#reset' changes
  // only the fragment, which is a same-document navigation: index.html never re-runs and the reset
  // never fires. The first version of this check did exactly that and reported the code broken.
  await page.goto(base + '/?r=1#reset', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('selection_') === 0).length);
  ck('#reset clears every slot in the field', left === 0, left + ' left');

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message); process.exit(1); });
