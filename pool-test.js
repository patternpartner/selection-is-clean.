// pool-test.js — #162: several universes per worker.
//
// The field's memory was per-ISOLATE heap slack, not data and not code (OEE-NOTES, "where the
// field's memory actually goes"). So a shell no longer means a worker: cells sharing a pool slot
// share one SharedWorker, one connection and one universe each. That moves the engine from "one
// scope per isolate" to "several scopes per isolate", and everything this rig checks is something
// that used to be true FOR FREE and now has to be arranged:
//
//   · a universe's canvas, size, genome, localStorage and location are its own
//   · two universes in one isolate cannot see or overwrite each other's germline
//   · the drawing still reaches the page from a shared worker
//   · a browser without SharedWorker still gets the old one-worker-one-universe layout
//   · a RELOAD does not leave the previous page's universes running in a worker the new page joins
//
// That last one is the trap in SharedWorker: it outlives the document that made it. The check is
// the wire — every universe announces itself on the BroadcastChannel, so a zombie from a previous
// load shows up as a peer nobody can account for.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// How long each section is given to settle. The full run wants 25s so peer discovery, the relay and
// several hundred ticks per universe are all real; the smoke pass passes a smaller SECS, and every
// wait below scales off it with a floor, so a short run still gets past boot rather than testing
// nothing quickly.
const SECS = Math.max(6, +(process.env.SECS || 25));
const SETTLE   = SECS * 1000;
const FALLBACK = Math.max(8000, SECS * 800);
const SOLO     = Math.max(8000, SECS * 600);
const RELOAD   = Math.max(6000, SECS * 500);

let pass = 0, fail = 0;
const ck = (name, ok, detail) => { (ok ? pass++ : fail++);
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + name + (detail !== undefined ? ('   ' + detail) : '')); };

const serve = () => http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u === '/' ? '/index.html' : u)] || 'application/octet-stream' });
    res.end(b);
  });
});

const statAll = (page) => page.evaluate(async () => {
  const out = [];
  for (const c of document.querySelectorAll('.cell')) {
    try { const a = c.firstChild.contentWindow.__field; out.push(a ? await a.stat() : null); }
    catch (e) { out.push(null); }
  }
  return out;
});

(async () => {
  const server = serve();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // ── the pooled field ──────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/#n=8', { waitUntil: 'load' });
    await page.waitForTimeout(SETTLE);

    const srcs = await page.evaluate(() =>
      [...document.querySelectorAll('.cell')].map(c => c.firstChild.getAttribute('src')));
    ck('nine cells built', srcs.length === 9, srcs.length);

    const slots = [...new Set(srcs.map(s => (s.match(/pool=([^#&]*)/) || [])[1]))];
    ck('cells are packed onto fewer workers than cells', slots.length >= 1 && slots.length < 9, slots.length + ' slots for 9 cells');
    ck('every cell was given a slot', srcs.every(s => /\?pool=/.test(s)));

    const stats = await statAll(page);
    const live = stats.filter(s => s && s.totalTicks > 0);
    ck('every universe answers and is ticking', live.length === 9, live.length + '/9');
    ck('no universe reports a caught error', live.every(s => !(s.errs > 0)), live.map(s => s.errs).join(','));
    ck('universes hold separate scopes', new Set(live.map(s => s.totalTicks)).size > 1,
       live.map(s => s.totalTicks).join(' '));
    ck('universes still find each other on the wire', live.every(s => s.peers > 1),
       'peers ' + live.map(s => s.peers).join(','));

    // #163 MUST NOT FIRE AT ALL IN AN UNPACED FIELD, and this check is the reason the rule is
    // "only a universe that was deliberately slowed". The first version gated on the raw clock
    // ratio, and this check caught it: an unpaced field refused 14% of its own heritable traffic at
    // 25 seconds, 35% at 60, 58% at 150 and still climbing — because universes NEVER run at parity.
    // Their tick rates diverge as their populations do (measured spread 1938 to 3860 at 150s), so
    // the invariant was working perfectly on the wrong question and quietly halving gene flow into
    // whichever universe carried the most particles. Natural speed variation is ecology; this system
    // has evolved under it since it had a network. Only PACE is imposed from outside, and only pace
    // is gated. Nothing here is paced, so the count must be zero — not small, zero.
    const refused = live.reduce((a, s) => a + (s.paced | 0), 0);
    const landed  = live.reduce((a, s) => a + (s.migrantAccepted | 0), 0);
    ck('the clock gate does not fire in an unpaced field', landed > 0 && refused === 0,
       refused + ' refused vs ' + landed + ' accepted');

    // each universe's canvas is its own, and cell-sized rather than viewport-sized
    const sizes = await page.evaluate(() => [...document.querySelectorAll('.cell')].map(c => {
      try { const cv = c.firstChild.contentWindow.document.getElementById('c'); return cv.width + 'x' + cv.height; }
      catch (e) { return '?'; } }));
    ck('every cell has its own sized canvas', sizes.every(v => /^\d+x\d+$/.test(v)), sizes[0]);
    ck('canvases are cell-sized, not one shared viewport', sizes.every(v => v !== '412x915'), sizes[0]);

    // the drawing must actually REACH the page from a shared worker
    const shot = await page.locator('#grid').screenshot();
    const tones = new Set(); for (let i = 0; i < shot.length; i += 997) tones.add(shot[i]);
    ck('the field is painted, not blank', tones.size > 8, tones.size + ' distinct bytes sampled');

    // TWO UNIVERSES IN ONE ISOLATE MUST NOT SHARE A GERMLINE. Pick two cells on the same slot and
    // move one universe's gene; the other's fingerprint must not move with it.
    const pair = await page.evaluate((srcs) => {
      const bySlot = {};
      srcs.forEach((s, i) => { const k = (s.match(/pool=([^#&]*)/) || [])[1]; (bySlot[k] = bySlot[k] || []).push(i); });
      for (const k in bySlot) if (bySlot[k].length >= 2) return bySlot[k].slice(0, 2);
      return null;
    }, srcs);
    if (!pair) { ck('two cells share a worker', false, 'no slot had two cells'); }
    else {
      const before = (await statAll(page)).map(s => s && s.fp);
      const moved = await page.evaluate(async (i) => {
        const c = document.querySelectorAll('.cell')[i];
        return await c.firstChild.contentWindow.__field.setGeneForTest('mutationRate', 0.4242);
      }, pair[0]);
      ck('a gene can be set in one pooled universe', moved === true, String(moved));
      const after = (await statAll(page)).map(s => s && s.fp);
      ck('the universe we moved did change', before[pair[0]] !== after[pair[0]]);
      ck('its worker-mate did NOT change with it', before[pair[1]] === after[pair[1]],
         'slot-mate cells ' + pair.join(' & '));
      const others = after.filter((_, i) => i !== pair[0]);
      ck('no other universe changed either', others.every((v, i) => v === before.filter((_, j) => j !== pair[0])[i]));
    }

    // save still produces a real file from a pooled universe
    const file = await page.evaluate(async () => {
      try { return await document.querySelector('.cell').firstChild.contentWindow.__field.save(); } catch (e) { return null; }
    });
    // save() resolves with the JSON TEXT (universe.html keeps the filename for the download path,
    // which only a real button press takes), so this checks the payload, not a file object.
    ck('a pooled universe can still export its genome',
       typeof file === 'string' && /"type":\s*"selection-genome"/.test(file) && file.length > 500,
       typeof file === 'string' ? (file.length + ' chars') : String(file));

    // ═══ #164 — OPENING A UNIVERSE HANDS IT ITS WORKER ══════════════════════════════════════
    // Only cells SHARING the open one's worker stand down; the rest of the field is untouched. The
    // first version stood all eight down and measured the open cell gaining 36 ticks/s while the
    // field lost 136 — one universe cannot absorb four workers' worth. This asserts the corrected
    // shape: worker-mates slow, non-mates do not.
    {
      const sample = async () => await page.evaluate(async () => { const o = [];
        for (const c of document.querySelectorAll('.cell')) {
          try { const a = c.firstChild.contentWindow.__field; const st = a ? await a.stat() : null;
                o.push(st ? st.totalTicks | 0 : 0); } catch (e) { o.push(0); } } return o; });
      await page.locator('.cell').first().locator('.tap').tap();
      await page.waitForTimeout(1500);
      const t0 = await sample();
      await page.waitForTimeout(Math.max(10000, SETTLE / 2));
      const t1 = await sample();
      const d = t0.map((v, i) => t1[i] - v);
      const slot = i => i % (new Set(srcs.map(x => (x.match(/pool=([^#&]*)/) || [])[1])).size);
      const mates = d.filter((_, i) => i > 0 && slot(i) === slot(0));
      const others = d.filter((_, i) => i > 0 && slot(i) !== slot(0));
      const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      ck('the open universe outruns its worker-mates', mates.length > 0 && d[0] > mean(mates) * 1.5,
         'open ' + d[0] + ' vs mates ' + mates.join(','));
      ck('universes on OTHER workers are left alone', others.length > 0 && mean(others) > mean(mates) * 1.5,
         'others mean ' + Math.round(mean(others)) + ' vs mates mean ' + Math.round(mean(mates)));
      await page.locator('#back').tap().catch(() => {});
      await page.waitForTimeout(1500);
      const r0 = await sample();
      await page.waitForTimeout(Math.max(8000, SETTLE / 3));
      const r1 = await sample();
      const back = r0.map((v, i) => r1[i] - v).filter((_, i) => i > 0 && slot(i) === slot(0));
      ck('closing it puts the worker-mates back to full', back.every(v => v > 0) &&
         mean(back) > mean(mates) * 1.5, 'mates after close ' + back.join(','));
    }

    ck('no uncaught page errors in the pooled field', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── the fallback: a browser with no SharedWorker at all ───────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    await ctx.addInitScript(() => { try { delete window.SharedWorker; } catch (e) {} 
                                    try { Object.defineProperty(window,'SharedWorker',{get(){return undefined;}}); } catch(e){} });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/#n=4', { waitUntil: 'load' });
    await page.waitForTimeout(FALLBACK);
    const live = (await statAll(page)).filter(s => s && s.totalTicks > 0);
    ck('a browser without SharedWorker still runs the whole field', live.length === 5, live.length + '/5');
    ck('the fallback field reports no caught errors', live.every(s => !(s.errs > 0)));
    ck('no uncaught page errors in the fallback', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── a standalone universe.html has no pool slot and must be untouched ─────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/universe.html', { waitUntil: 'load' });
    await page.waitForTimeout(SOLO);
    const s = await page.evaluate(async () => { try { return await window.__field.stat(); } catch (e) { return null; } });
    ck('a standalone universe runs on its own dedicated worker', !!(s && s.totalTicks > 0), s && s.totalTicks);
    ck('the standalone universe reports no caught errors', !!s && !(s.errs > 0));
    ck('no uncaught page errors standalone', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── RELOADS MUST NOT ACCUMULATE UNIVERSES ─────────────────────────────────────────────────
  // A SharedWorker dies only when its last port closes, so a reload can hand the new page a worker
  // still running the old page's universes. Nothing on the page can see them — but the WIRE can:
  // every universe announces itself on the BroadcastChannel, so a zombie is a peer nobody built.
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    await page.goto(base + '/#n=8', { waitUntil: 'load' });
    await page.waitForTimeout(RELOAD);
    const first = (await statAll(page)).filter(Boolean).map(s => s.peers);
    for (let i = 0; i < 3; i++) { await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(RELOAD); }
    const after = (await statAll(page)).filter(Boolean).map(s => s.peers);
    const worst = Math.max.apply(null, after.concat([0]));
    ck('one load sees eight peers', Math.max.apply(null, first.concat([0])) <= 9, 'peers ' + first.join(','));
    ck('three reloads later it still sees eight, not thirty-two', worst <= 9, 'peers ' + after.join(','));
    await ctx.close();
  }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message + '\n' + (e.stack || '')); process.exit(1); });
