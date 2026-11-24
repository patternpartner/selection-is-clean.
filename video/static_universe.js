// Records the real universe (engine.html#cleanart, seeded, stepped TPF ticks a record) as positions only: every living
// creature's permanent id, x, y and size, and every birth's parent. For 'Only What Moves' (build_only_what_moves.py),
// which draws each creature as a patch of static it carries with it.
// addParticle and compact are wrapped to keep a permanent id per creature (compact() moves the living down to the lowest
// free slots every 45 ticks, in slot order); neither wrapper draws a random number or changes what the engine does.
// Usage: SEED=1 W=540 H=960 TPF=3 RECORDS=4000 OUT=out/only/run1 node video/static_universe.js
const { chromium } = require('playwright');
const fs = require('fs');
const SEED = +(process.env.SEED || 1), W = +(process.env.W || 540), H = +(process.env.H || 960);
const TPF = +(process.env.TPF || 3), RECORDS = +(process.env.RECORDS || 4000), OUT = process.env.OUT || 'out/only/run1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  await p.addInitScript((seed) => {
    let s = seed >>> 0 || 1;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    window.__raf = [];
    window.requestAnimationFrame = (cb) => { window.__raf.push(cb); return window.__raf.length; };
  }, SEED);
  await p.goto('file://' + process.cwd() + '/engine.html#cleanart', { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => window.__raf.length > 0, null, { timeout: 60000 });
  const info = await p.evaluate(() => {
    window.__uid = new Int32Array(CAP); window.__next = 1; window.__births = [];
    const A = addParticle;
    addParticle = function (x, y, tv, born, pa, pb) {
      const i = A.apply(this, arguments);
      if (i >= 0) { __uid[i] = __next++; __births.push([__uid[i], pa >= 0 && pa < CAP ? __uid[pa] : 0, tick]); }
      return i;
    };
    const Cp = compact;
    compact = function () {
      const keep = []; for (let r = 0; r < N; r++) if (palive[r]) keep.push(__uid[r]);
      const res = Cp.apply(this, arguments);
      for (let w = 0; w < keep.length; w++) __uid[w] = keep[w];
      return res;
    };
    window.__rec = () => {
      let n = 0; for (let i = 0; i < N; i++) if (palive[i]) { if (!__uid[i]) { __uid[i] = __next++; __births.push([__uid[i], -1, tick]); } n++; }
      const f = new Float32Array(n * 4); let j = 0;
      for (let i = 0; i < N; i++) if (palive[i]) { f[j++] = __uid[i]; f[j++] = px[i]; f[j++] = py[i]; f[j++] = pSz[i]; }
      const u8 = new Uint8Array(f.buffer); let bin = '';
      for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return { tick, n, b64: btoa(bin) };
    };
    return { W: c.width, H: c.height, N };
  });
  console.log('world', JSON.stringify(info));
  const fd = fs.openSync(OUT + '/frames.bin', 'w');
  const t0 = Date.now();
  for (let r = 0; r < RECORDS; r++) {
    const rec = await p.evaluate((n) => {
      for (let k = 0; k < n; k++) {
        const q = window.__raf; window.__raf = [];
        const seen = new Set();
        for (const f of q) { if (seen.has(f)) continue; seen.add(f); f(performance.now()); }
        lastLoopTime = performance.now() + 1e12;
      }
      return __rec();
    }, r === 0 ? 0 : TPF);
    const hdr = Buffer.alloc(8); hdr.writeInt32LE(rec.tick, 0); hdr.writeInt32LE(rec.n, 4);
    fs.writeSync(fd, hdr); fs.writeSync(fd, Buffer.from(rec.b64, 'base64'));
    if (r % 200 === 0) {
      console.log(`rec ${r} tick ${rec.tick} alive ${rec.n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      fs.writeFileSync(OUT + '/births.json', JSON.stringify(await p.evaluate(() => __births)));
    }
  }
  fs.closeSync(fd);
  fs.writeFileSync(OUT + '/births.json', JSON.stringify(await p.evaluate(() => __births)));
  fs.writeFileSync(OUT + '/meta.json', JSON.stringify({ SEED, W: info.W, H: info.H, TPF, RECORDS }));
  fs.writeFileSync(OUT + '/.done', '');
  console.log('done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await b.close();
})();
