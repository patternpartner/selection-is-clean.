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
      const txt = b2s(raw);
      // T is the saved tick count, which only MOVES at an autosave boundary (every 900 ticks), so it
      // is far too coarse to ask "are these nine universes different" with. fp is a cheap rolling
      // hash of the whole saved blob: it differs whenever the genomes differ at all. See the check
      // that uses it for why that distinction went red on completely correct code.
      let h = 2166136261 >>> 0;
      for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      out[k.replace('selection_', '')] = { T: JSON.parse(txt).T | 0, fp: h >>> 0, n: txt.length };
    } catch (e) { out[k.replace('selection_', '')] = { T: -1, fp: -1, n: 0 }; }
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
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) o.push(await one(d));
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

  // #201 — THE FIELD IS NO LONGER A FIXED NINE, and every count below had to learn that. During
  // the warm-up the nine universes found real peers of their own, on their own, and the shell
  // adopts them: this rig has seen the page come back with twelve. So "built" and "grown" are
  // separated here, and every pre-#201 assertion is scoped to the BUILT nine — which is what each
  // of them was always about. The grown ones are reported rather than asserted on, because how
  // many appear in 150 seconds is a fact about the machine's speed, and this rig's own history is
  // a list of assertions that named a number the machine picked.
  const BUILT = x => /^(u\d+|collective)$/.test(x);
  const GROWN = x => /^g\d+$/.test(x);
  const before = await liveTicks(page);
  const builtBefore = before.filter(x => BUILT(x[0]));
  const grownBefore = before.filter(x => GROWN(x[0]));
  ck('the field is running', builtBefore.filter(x => x[1] > 0).length === 9,
     builtBefore.filter(x => x[1] > 0).length + '/9 built' +
     (grownBefore.length ? (', and the field GREW ' + grownBefore.length + ' more on its own: ' +
       grownBefore.map(x => x[0] + '(' + x[1] + ')').join(' ')) : ', none grown in this window'));
  ck('every universe has its own slot name, built or grown',
     before.every(x => BUILT(x[0]) || GROWN(x[0])), before.map(x => x[0]).join(' '));

  // WHAT IS UNDER TEST is that a saved universe comes back as ITSELF — not that all nine manage to
  // save inside the rig's window. The engine's first autosave is at tick 1800, so how many have
  // saved by now is a number the MACHINE chooses: under load, three fell short of 1800 in 110
  // seconds and this check went red on code that was completely correct. That is the same shape as
  // the "one load sees eight peers" failure two commits ago — an assertion naming a number the
  // system picked. So: the keys must be PER-SLOT and never the shared one, a healthy majority must
  // have saved (a field where nothing persists is still a failure), and the restore check below
  // judges only the ones that actually had something to restore.
  const savedAll = await savedSlots(page);
  // Scoped to the built universes. A grown one has not been RESTORED from anything — it was
  // founded — so it does not belong in a check about whether a save round-trips, and leaving it in
  // broke that check in two ways at once: it added candidate T values to the nearest-match test
  // (a daughter saved at T2880 "explained" u1's 2877 better than u1's own T2700 did, and four
  // universes were reported as carrying the wrong genome), and it put keys in the count that have
  // no frame to come back in.
  const saved = {}; for (const k of Object.keys(savedAll)) if (BUILT(k)) saved[k] = savedAll[k];
  const grownSaved = Object.keys(savedAll).filter(GROWN);
  const keys = Object.keys(saved);
  const names = before.map(x => x[0]);
  ck('every key written is a per-universe slot, never the shared one',
     keys.length > 0 && !('genome' in saved) && keys.every(k => names.indexOf(k) >= 0),
     keys.sort().join(' '));
  ck('most of the field got far enough to save', keys.length >= 5,
     keys.length + '/9 built saved' + (grownSaved.length ? (', plus ' + grownSaved.length + ' grown: ' + grownSaved.join(' ')) : ''));
  // THE SAME FAILURE SHAPE THE COMMENT ABOVE NAMES, in the check right next to it. This asked whether
  // the nine saved T values differed - and T only moves every 900 ticks, so it was asking whether the
  // nine tabs happened to land on DIFFERENT autosave boundaries, which is a fact about how the machine
  // scheduled them. Measured: on #193's engine three tabs sat at 1800 and six at 2700 and it passed;
  // on #194's all nine reached 2700 and it failed, with nothing about either engine's storage
  // different. What it MEANS to check is that each slot holds its own genome rather than one shared
  // one, so it now compares a hash of the whole saved blob - which differs whenever the genomes do,
  // and is not a number the machine picks.
  const fps = Object.values(saved).map(v => v.fp);
  ck('their saved genomes are genuinely different genomes',
     new Set(fps).size === fps.length,
     Object.entries(saved).map(([k, v]) => k + '(T' + v.T + ' #' + v.fp.toString(16).slice(0, 6) + ')').join(' '));

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(9000);
  const after = await liveTicks(page);

  let own = 0, wrong = 0, unsaved = 0;
  const detail = [];
  for (const [slot, t] of after.filter(x => BUILT(x[0]))) {
    // savedSlots now returns {T, fp, n} per slot rather than a bare T (see the check above), so this
    // reads .T. It compared the object directly for one commit and every slot came back "WRONG" with
    // [object Object] in the diagnostic - a reminder that changing a helper's return shape is a change
    // to every consumer of it.
    const svr = saved[slot];
    if (svr === undefined) { unsaved++; detail.push(slot + '=nosave'); continue; }
    const sv = svr.T;
    const drift = t - sv;
    const plausible = drift >= 0 && drift < 4000;
    const better = Object.keys(saved).some(k => k !== slot && Math.abs(t - saved[k].T) < Math.abs(drift));
    if (plausible && !better) { own++; detail.push(slot + '(' + sv + '->' + t + ')'); }
    else { wrong++; detail.push(slot + '=WRONG(' + sv + '->' + t + ')'); }
  }
  ck('every universe that HAD saved came back carrying its own genome',
     own === keys.length && wrong === 0,
     own + ' own, ' + wrong + ' wrong, ' + unsaved + ' had nothing saved yet');
  ck('and no two came back identical — the field did not flatten',
     new Set(after.map(x => x[1])).size > 1, after.map(x => x[1]).join(' '));
  console.log('        ' + detail.join('  '));
  ck('no uncaught page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  // ═══ #201 — THE FIELD GROWS A UNIVERSE ══════════════════════════════════════════════════════
  // Everything above this line is about nine universes the PAGE built. This is about one the page
  // did not build: a universe founded by a peer, on the same BroadcastChannel every migrant
  // crosses, adopted by the shell into a slot the shell names.
  //
  // ON ITS OWN CONTEXT, and a new page is not that. BroadcastChannel is multicast across every
  // page of a browser context, and a SharedWorker keeps running after page.close() until its last
  // port drops — so a founding the test did not post still arrives, and a dying universe can
  // write a selection_ key back after #reset has cleared them. Three alone runs, same binary:
  // the nine-slot restore rows were green every time, and the red rows were an extra packet
  // ("3 founded" against two posts; "2 founded" against #nofound's one) plus one reset that
  // left a key. A second browser context hears nothing and shares no storage. Measured.
  // pool-test already isolates its sections this way for the same zombie.
  //
  // The packet is posted rather than waited for. A real founding needs a cluster rich enough to
  // raise FOUND_NEED, which on this build arrives around tick 4,700 — four minutes of rig time with
  // no guarantee. What is under test here is the ADOPTION side: that a well-formed founding
  // produces a real universe in a fresh slot, that the shell names that slot itself, and that the
  // brakes hold. That the engine EMITS such a packet is substrate-test.js's job, and it measures it
  // on the engine's own path rather than on a stand-in.
  //
  // The germline sent is a REAL one lifted out of a sibling's slot, so the daughter has to boot from
  // it: a grown universe that cannot answer stat() is not a universe.
  const donorKey = 'selection_' + Object.keys(saved)[0];
  const sentBlob = await page.evaluate(k => localStorage.getItem(k), donorKey);
  await page.close();

  // The shell is what this section measures. The universe on the page is on the same channel,
  // and once a cluster can pay it founds at FOUND_RATE 0.5. Calling pace() after load is too
  // late: the worker has already ticked. Stamp pace=5000 onto the init hash before the engine
  // boots, so the boot tick is the only one inside this window (attemptFound sits on the
  // 60-tick cadence). Measured without it: "1 grown · 2 refused · 3 founded", and sometimes
  // the slot held the universe's germline instead of the one this rig sent.
  const slowChild = () => {
    const stamp = (port) => {
      if (!port || port.__paced) return;
      port.__paced = true;
      const orig = port.postMessage.bind(port);
      port.postMessage = function (msg, transfer) {
        try {
          if (msg && msg.type === 'init' && String(msg.hash || '').indexOf('pace=') < 0) {
            const h = String(msg.hash || '');
            msg.hash = h ? (h + ',pace=5000') : '#pace=5000';
            if (msg.hash.charAt(0) !== '#') msg.hash = '#' + msg.hash;
          }
        } catch (e) {}
        return transfer === undefined ? orig(msg) : orig(msg, transfer);
      };
    };
    const SW = window.SharedWorker;
    if (typeof SW === 'function') {
      const Wrapped = function (url, opts) { const sw = new SW(url, opts); stamp(sw.port); return sw; };
      Wrapped.prototype = SW.prototype;
      window.SharedWorker = Wrapped;
    }
    const Wk = window.Worker;
    if (typeof Wk === 'function') {
      const WrappedW = function (url, opts) { const w = new Wk(url, opts); stamp(w); return w; };
      WrappedW.prototype = Wk.prototype;
      window.Worker = WrappedW;
    }
  };
  const ctx201 = await browser.newContext({ viewport: { width: 412, height: 915 } });
  await ctx201.addInitScript(slowChild);
  const p201 = await ctx201.newPage();
  const errs201 = []; p201.on('pageerror', e => errs201.push(e.message));
  await p201.goto(base + '/?g=1#layers=0,n=1', { waitUntil: 'load' });
  await p201.waitForTimeout(1000);
  await p201.evaluate(b => {
    const ch = new BroadcastChannel('selection-pe-network');
    ch.postMessage({ v: 1, tab: 'rig201', born: 0, type: 'found', data: { g: b, t: 1, d: 0.5, n: 4 } });
    // ...and a second immediately behind it, which the minimum gap must refuse.
    ch.postMessage({ v: 1, tab: 'rig201', born: 0, type: 'found', data: { g: b, t: 2, d: 0.5, n: 4 } });
  }, sentBlob);
  await p201.waitForTimeout(1500);
  const grown = await p201.evaluate(() => ({
    slots: [...document.querySelectorAll('#below .deep, #below .grown')]
      .map(d => (d.getAttribute('src') || '').match(/[?&]slot=(g\d+)/))
      .filter(Boolean).map(m => m[1]),
    stored: Object.keys(localStorage).filter(k => /^selection_g\d+$/.test(k)),
    mine: (function(){ const f = [...document.querySelectorAll('#below .deep, #below .grown')]
        .map(d => (d.getAttribute('src') || '').match(/[?&]slot=(g\d+)/)).filter(Boolean);
      return f.length === 1 ? localStorage.getItem('selection_' + f[0][1]) : null; })(),
    readout: (document.getElementById('grown') || {}).textContent || '' }));
  // NOT a particular name. The shell takes the first free index. This context starts empty, so
  // that index is usually g0, and on a context that already holds daughters it is not. Either way
  // the name is the shell's. What matters is that exactly one universe was grown HERE and that
  // its slot holds the germline this rig sent.
  const mySlot = grown.slots.length === 1 ? grown.slots[0] : null;
  ck('#201 a founding on the wire opens a REAL new universe',
     mySlot !== null && /^g\d+$/.test(mySlot),
     'grown slot: [' + grown.slots.join(' ') + '] — the shell names it from the first free index, so nothing on the channel can name a storage key, collide with a built one, or overwrite a sibling daughter');
  ck('#201 the daughter is stored under the germline it was founded from',
     !!mySlot && !!sentBlob && grown.mine === sentBlob,
     'slot ' + mySlot + ' holds ' + ((grown.mine || '').length) + ' of ' + (sentBlob || '').length + ' bytes sent; grown keys present: ' + grown.stored.join(' '));
  ck('#201 the minimum gap refuses the second founding',
     /1 grown/.test(grown.readout) && /1 refused/.test(grown.readout) && /2 founded/.test(grown.readout),
     JSON.stringify(grown.readout));
  // AND IT IS ACTUALLY RUNNING. A frame with a src is not a universe; a frame whose __field answers
  // is. POLLED rather than slept on: this rig already sits close to smoke.sh's per-rig timeout and a
  // fixed twenty-second wait for a universe that usually answers in four is budget spent on nothing.
  let grownTicks = -9;
  for (let t = 0; t < 12; t++) {
    grownTicks = await p201.evaluate(async (want) => {
      for (const d of document.querySelectorAll('#below .deep, #below .grown')) {
        if (!(d.getAttribute('src') || '').includes('slot=' + want)) continue;
        try { const a = d.contentWindow && d.contentWindow.__field; if (!a) return -1;
          const r = await Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 4000))]);
          return r ? (r.totalTicks | 0) : -2; } catch (e) { return -3; }
      }
      return -4;
    }, mySlot);
    if (grownTicks > 0) break;
    await p201.waitForTimeout(2000);
  }
  ck('#201 and the grown universe is running its own lineage', grownTicks > 0,
     grownTicks + ' ticks — founded from a sibling germline, booted into its own slot, its own worker and its own place on the channel');
  ck('#201 no uncaught page errors while growing', errs201.length === 0, errs201.slice(0, 2).join(' | '));
  await ctx201.close();

  // THE FORCE-OFF PATH, in its own context for the same reason. #nofound must adopt nothing
  // and still COUNT, because "the field stopped growing" and "nothing ever founded" are different
  // facts and only one of them is about the creatures.
  const ctxOff = await browser.newContext({ viewport: { width: 412, height: 915 } });
  await ctxOff.addInitScript(slowChild);
  const off = await ctxOff.newPage();
  await off.goto(base + '/?off=1#layers=0,n=1,nofound', { waitUntil: 'load' });
  // The count stays exactly the one packet this page posts. `heard` is the tab id of every
  // founding on this channel, so a miss names who sent it. The pass text is unchanged.
  await off.evaluate(() => {
    window.__heard = [];
    new BroadcastChannel('selection-pe-network').onmessage = (ev) => {
      const m = ev && ev.data;
      if (m && m.type === 'found') window.__heard.push(String(m.tab || '?'));
    };
  });
  await off.waitForTimeout(1000);
  await off.evaluate(() => { new BroadcastChannel('selection-pe-network')
    .postMessage({ v: 1, tab: 'rig201b', born: 0, type: 'found', data: { g: 'QUFB', t: 1 } }); });
  await off.waitForTimeout(1000);
  const offState = await off.evaluate(() => ({
    frames: [...document.querySelectorAll('#below .deep, #below .grown')]
      .filter(d => /[?&]slot=g\d+/.test(d.getAttribute('src') || '')).length,
    readout: (document.getElementById('grown') || {}).textContent || '',
    heard: window.__heard || [] }));
  ck('#201 #nofound adopts nothing and still counts what it heard',
     offState.frames === 0 && /0 grown/.test(offState.readout) && /1 founded/.test(offState.readout),
     JSON.stringify(offState));
  await ctxOff.close();

  // The page that loads #reset then STARTS a clean field, and that field is allowed to found.
  // The 3s wait is there so a worker that outlived page.close() can write a key back. On this
  // machine the clean field itself adopts a daughter inside that window (selection_g0, and no u*
  // key — a built universe's first save is tick 1800). Pace the reset page's workers the same
  // way the adoption pages are paced, so the only founding that can land in 3s is one this page
  // did not boot. The pass text is still "no selection_ key left".
  await ctx.addInitScript(slowChild);
  const rp = await ctx.newPage();
  // #reset must now clear EVERY slot, not the two keys it used to know about.
  // A DIFFERENT QUERY, not just a different hash. Going from '/#layers=0' to '/#reset' changes
  // only the fragment, which is a same-document navigation: index.html never re-runs and the reset
  // never fires. The first version of this check did exactly that and reported the code broken.
  // This stays in the FIELD's context: the slots under test are the ones that page wrote, grown
  // daughters included. The adoption pages above are other contexts and cannot put a key here.
  await rp.goto(base + '/?r=1#reset', { waitUntil: 'load' });
  await rp.waitForTimeout(3000);
  const left = await rp.evaluate(() => ({
    keys: Object.keys(localStorage).filter(k => k.indexOf('selection_') === 0),
    frames: [...document.querySelectorAll('iframe')].map(f => f.getAttribute('src') || '').filter(s => /slot=g\d+/.test(s)),
    readout: (document.getElementById('grown') || {}).textContent || ''
  }));
  const leftKeys = left.keys;
  ck('#reset clears every slot in the field, grown ones included', leftKeys.length === 0,
     leftKeys.length + ' left' + (leftKeys.length ? (': ' + leftKeys.join(' ')) : '')
     + (left.frames.length ? (' frames ' + left.frames.join(' ')) : '')
     + (left.readout ? (' readout ' + JSON.stringify(left.readout)) : ''));

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message); process.exit(1); });
