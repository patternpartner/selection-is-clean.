// layers-test.js — #165/#166: the cube. What you see is one face.
//
// `#layers=K` puts K more layers of the same count underneath the surface: universes with no cell,
// drawing nothing (#dark), running slow (#pace), on the same wire as everything above them. The
// default nine on top with two layers below is twenty-seven universes.
//
// The load-bearing claim is that a layer is an ORDINARY universe that happens not to be visible.
// Not quieter, not deafer, not cut off — the broadcast is dual in both directions and the only
// difference is that you cannot see it. That is what most of this file checks, because an earlier
// version got it wrong in exactly that way: the #163 clock gate made anything paced refuse its
// neighbours, so the depths were deaf and nothing said so.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SECS = Math.max(10, +(process.env.SECS || 40));

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

const readAll = page => page.evaluate(async () => {
  const grab = async el => { try { const a = el.contentWindow && el.contentWindow.__field;
    return a ? await a.stat() : null; } catch (e) { return null; } };
  const surface = [], deep = [];
  for (const c of document.querySelectorAll('.cell')) surface.push(await grab(c.firstChild));
  for (const d of document.querySelectorAll('#below .deep')) deep.push(await grab(d));
  return { surface, deep, depthText: (document.getElementById('depth') || {}).textContent || '' };
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // ── the cube ──────────────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, acceptDownloads: true });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/#n=8,layers=2,turn=0', { waitUntil: 'load' });  // turn=0: this rig turns it by hand
    await page.waitForTimeout(SECS * 1000);
    const { surface, deep, depthText } = await readAll(page);

    const liveS = surface.filter(s => s && s.totalTicks > 0);
    const liveD = deep.filter(s => s && s.totalTicks > 0);
    ck('the surface is nine universes', surface.length === 9, surface.length);
    ck('two layers of nine run underneath', deep.length === 18, deep.length);
    ck('every universe on the surface is ticking', liveS.length === 9, liveS.length + '/9');
    ck('every universe underneath is ticking', liveD.length === 18, liveD.length + '/18');
    ck('nothing anywhere reports a caught error',
       liveS.concat(liveD).every(s => !(s.errs > 0)));

    // deeper is slower, and by roughly the ratio the paces set (400ms vs 800ms)
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    const L1 = mean(liveD.slice(0, 9).map(s => s.totalTicks));
    const L2 = mean(liveD.slice(9).map(s => s.totalTicks));
    ck('the second layer runs slower than the first', L2 > 0 && L1 > L2 * 1.4,
       Math.round(L1) + ' vs ' + Math.round(L2) + ' ticks');
    ck('the layers run slower than the surface',
       mean(liveS.map(s => s.totalTicks)) > L1 * 2, Math.round(mean(liveS.map(s => s.totalTicks))) + ' on top');

    // THE BROADCAST IS DUAL. Everyone sees everyone, traffic moves in both directions, and nothing
    // is refused — a layer is an ordinary universe that happens not to be visible.
    ck('the surface sees every universe, including the ones below',
       liveS.every(s => s.peers >= 26), 'peers ' + liveS.map(s => s.peers).join(','));
    ck('the depths see every universe too',
       liveD.every(s => s.peers >= 26), 'peers ' + liveD.slice(0, 3).map(s => s.peers).join(','));
    ck('the surface is taking material in', mean(liveS.map(s => s.migrantAccepted)) > 0,
       Math.round(mean(liveS.map(s => s.migrantAccepted))) + ' each');
    ck('the depths are taking material in too', mean(liveD.map(s => s.migrantAccepted)) > 0,
       Math.round(mean(liveD.map(s => s.migrantAccepted))) + ' each');
    ck('nobody refuses a neighbour on clock grounds',
       liveS.concat(liveD).every(s => (s.paced | 0) === 0),
       'refused ' + liveS.concat(liveD).reduce((a, s) => a + (s.paced | 0), 0));

    ck('the depths are alive, not merely present', liveD.every(s => (s.N | 0) > 0),
       liveD.map(s => s.N | 0).slice(0, 4).join(',') + '...');
    ck('the readout says what is underneath', /\d+\/18 below/.test(depthText), depthText);

    // ═══ #167 — TURNING THE CUBE ════════════════════════════════════════════════════════════
    // The face is not just what you can see: it is what runs LIT and at full pace while everything
    // else runs dark and slow. So turning the cube is how the tick budget circulates, and every
    // layer gets its turn instead of the top nine always winning.
    //
    // The check that matters most is the last one. An iframe cannot be reparented — moving one in
    // the DOM reloads it, which would reboot that universe from the shared storage slot and destroy
    // the lineage it has been growing. A rotation that quietly did that would look FINE: nine lit
    // universes, ticking, populated, and every one of them newborn. So: ticks may never go down.
    const tickSample = async () => {
      const r = await readAll(page);
      return r.surface.concat(r.deep).map(x => (x && x.totalTicks) | 0);
    };
    const t0 = await tickSample();
    const shape = () => page.evaluate(() => ({
      front: document.getElementById('below').classList.contains('front'),
      faces: document.querySelectorAll('#below .deep.face').length,
      gridHidden: document.getElementById('grid').style.visibility === 'hidden',
      txt: document.getElementById('depth').textContent }));

    const s0 = await shape();
    ck('the surface is the face to begin with', !s0.front && s0.faces === 0 && /surface/.test(s0.txt), s0.txt.trim());

    await page.locator('#depth').tap();
    await page.waitForTimeout(2500);
    const s1 = await shape();
    ck('one tap brings a layer to the face', s1.front && s1.faces === 9, 'faces ' + s1.faces);
    ck('and the surface goes behind it', s1.gridHidden === true);
    ck('the readout says which face is up', /layer 1/.test(s1.txt), s1.txt.trim());

    // the new face must actually be running, not merely visible
    const a = await tickSample();
    await page.waitForTimeout(Math.max(12000, SECS * 300));
    const b = await tickSample();
    const rate = b.map((v, i) => v - a[i]);
    const faceRate = rate.slice(9, 18), deepRate = rate.slice(18);
    const mn = arr => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
    ck('the face that came up is the one now running', mn(faceRate) > mn(deepRate) * 2,
       'face ' + Math.round(mn(faceRate)) + ' vs the layer still under it ' + Math.round(mn(deepRate)));

    // ASSERT THE FLAGS, NOT THE RATE. This check failed on a real bug and I nearly dismissed it as a
    // transition: the surface went dark but its PACE stayed 0, so turning the cube ADDED a lit face
    // instead of moving one. A universe can be paced two ways — the hash, which the engine re-reads
    // on every hashchange, and the field API — and the field had set them to disagree, so the
    // hashchange arrived last and undid the API call. A tick rate is noisy enough to argue with; a
    // flag is not, which is why this reads the flags now.
    const flags = await page.evaluate(async () => {
      const grab = async el => { try { const a = el.contentWindow && el.contentWindow.__field;
        const s = a ? await a.stat() : null; return s ? { pace: s.pace | 0, dark: !!s.dark } : null;
      } catch (e) { return null; } };
      const surf = [], dp = [];
      for (const c of document.querySelectorAll('.cell')) surf.push(await grab(c.firstChild));
      for (const d of document.querySelectorAll('#below .deep')) dp.push(await grab(d));
      return { surf, L1: dp.slice(0, 9), L2: dp.slice(9) };
    });
    ck('the layer it replaced went dark AND slow',
       flags.surf.every(f => f && f.dark === true && f.pace > 0),
       'surface ' + flags.surf.map(f => f ? (f.pace + (f.dark ? 'D' : '-')) : '?').join(' '));
    ck('the new face is lit AND at full pace',
       flags.L1.every(f => f && f.dark === false && f.pace === 0),
       'layer 1 ' + flags.L1.map(f => f ? (f.pace + (f.dark ? 'D' : '-')) : '?').join(' '));
    ck('the layer still underneath is untouched',
       flags.L2.every(f => f && f.dark === true && f.pace > 0),
       'layer 2 ' + flags.L2.map(f => f ? (f.pace + (f.dark ? 'D' : '-')) : '?').join(' '));
    ck('exactly one face is lit at a time',
       flags.surf.concat(flags.L1, flags.L2).filter(f => f && !f.dark).length === 9,
       flags.surf.concat(flags.L1, flags.L2).filter(f => f && !f.dark).length + ' lit');

    await page.locator('#depth').tap(); await page.waitForTimeout(2000);
    await page.locator('#depth').tap(); await page.waitForTimeout(2500);
    const s3 = await shape();
    ck('turning through the layers comes back to the surface',
       !s3.front && s3.faces === 0 && /surface/.test(s3.txt), s3.txt.trim());

    const t1 = await tickSample();
    ck('NO universe was rebooted by a rotation', t1.every((v, i) => v >= t0[i]),
       t1.filter((v, i) => v < t0[i]).length + ' went backwards');

    // ═══ #168 — HARVEST ═════════════════════════════════════════════════════════════════════
    // The only way a long run produces anything comparable. A universe's own save button lives on an
    // OPENED surface cell, and the layers have no controls at all — so without this, eight hours
    // yields a counter saying eighteen things were alive, which is what you knew before you started.
    // Every universe, labelled by where it lives, in one file.
    const dl = page.waitForEvent('download', { timeout: 180000 });
    await page.locator('#harvest').tap();
    let file = null;
    try { const d = await dl; const fp = require('path').join(require('os').tmpdir(), 'lt_harvest.json');
          await d.saveAs(fp); file = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) {}
    ck('harvest produces a file', !!(file && file.type === 'selection-field'), file && file.type);
    ck('it holds every universe in the cube', !!file && file.universes.length === 27,
       file && file.universes.length);
    ck('every one of them carried a genome out',
       !!file && file.universes.filter(u => u.genome).length === 27,
       file && file.universes.filter(u => u.genome).length + '/27');
    const at = {}; if (file) file.universes.forEach(u => { const k = String(u.at).split('/')[0]; at[k] = (at[k] || 0) + 1; });
    ck('and says where each one lived',
       at.surface === 8 && at.collective === 1 && at.layer1 === 9 && at.layer2 === 9, JSON.stringify(at));
    ck('a harvested layer records the pace and darkness it ran at',
       !!file && file.universes.filter(u => /layer2/.test(u.at)).every(u => u.pace > 0 && u.dark === true));

    ck('no uncaught page errors with layers', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── #dark: the same universe, drawing and not drawing ─────────────────────────────────────
  // Drawing is 40% of a tick, which is what makes a universe nobody is looking at the cheapest
  // thing this field can run. Both arms are unpaced, so the difference is the render and nothing
  // else. One-sided: dark must be faster, by any margin a slow machine still shows.
  {
    const run = async hash => {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
      const page = await ctx.newPage();
      await page.goto(base + '/universe.html' + hash, { waitUntil: 'load' });
      await page.waitForTimeout(Math.max(15000, SECS * 400));
      const s = await page.evaluate(async () => { try { return await window.__field.stat(); } catch (e) { return null; } });
      await ctx.close(); return s;
    };
    const lit = await run('');
    const dark = await run('#dark');
    ck('a dark universe still runs the simulation', !!(dark && dark.totalTicks > 0), dark && dark.totalTicks);
    ck('a dark universe ticks faster than a lit one', !!lit && dark.totalTicks > lit.totalTicks * 1.15,
       dark.totalTicks + ' dark vs ' + lit.totalTicks + ' lit');
    ck('a dark universe keeps a population', (dark.N | 0) > 0, 'N ' + dark.N);
  }

  // ── THE LINK IS THE CUBE ──────────────────────────────────────────────────────────────────
  // This check exists because the first version failed it silently and cost a night. The layers were
  // opt-in, a bare GitHub Pages link carries no hash, and a twenty-one hour run came back as nine
  // universes with nothing underneath. Nothing in the app said anything was missing — it just ran
  // the old field perfectly. A bare url must BE the cube, with no flag and no condition.
  const bare = async (hash, gb) => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    if (gb !== 'real') await ctx.addInitScript(g => { try {
      if (g === null) { delete navigator.deviceMemory;
        Object.defineProperty(navigator, 'deviceMemory', { get: () => undefined, configurable: true }); }
      else Object.defineProperty(navigator, 'deviceMemory', { get: () => g, configurable: true });
    } catch (e) {} }, gb === undefined ? null : gb);
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/' + (hash || ''), { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => ({
      cells: document.querySelectorAll('.cell').length,
      deep: document.querySelectorAll('#below .deep').length,
      shown: (document.getElementById('depth') || {}).style.display }));
    r.errs = errs; await ctx.close(); return r;
  };
  {
    // A bare url must be the cube on anything that can hold one — no hash, ever. Only the DEPTH
    // adapts, and the rung that matters is 4, which is what the author's 6GB phone reports.
    const big = await bare('', 8);
    ck('a bare url on an 8GB machine is the full cube', big.cells === 9 && big.deep === 18,
       big.cells + '+' + big.deep);
    ck('and it shows the depth readout without being asked', big.shown === 'block', String(big.shown));
    ck('no page errors on a bare url', big.errs.length === 0, big.errs.slice(0, 2).join(' | '));
    const phone = await bare('', 4);
    ck('a bare url on a 6GB phone (it reports 4) is still a cube', phone.cells === 9 && phone.deep === 9,
       phone.cells + '+' + phone.deep);
    const quiet = await bare('', undefined);
    ck('a browser that will not report its memory still gets a cube', quiet.deep === 9, quiet.deep);
    const small = await bare('', 2);
    ck('a genuinely small device gets the nine and nothing under them', small.deep === 0, small.deep);
    const forced = await bare('#layers=2', 4);
    ck('#layers=2 forces full depth on a device that under-reports', forced.deep === 18, forced.deep);
    const off = await bare('#layers=0', 8);
    ck('#layers=0 gives the old nine', off.deep === 0 && off.shown !== 'block', off.deep);
    const four = await bare('#n=4', 8);
    ck('an explicit count still gets its layers', four.cells === 5 && four.deep === 10,
       four.cells + '+' + four.deep);
  }

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  await browser.close(); server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  error: ' + e.message); process.exit(1); });
