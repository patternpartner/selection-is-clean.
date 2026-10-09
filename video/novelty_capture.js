// Pass A of "The Clock": the REAL universe (engine.html, seed SEED) stepped STEP ticks per record. Each record logs the living count,
// lineages, and which trait cells (harness-novelty's grid: first 3 trait axes, 10 bins over [-1.5,1.5], 3+ members) are occupied, and
// saves a JPEG of the world. SEED=1 TICKS=40000 STEP=40 OUT=out/clock/s1 node video/novelty_capture.js
const su = require('./step_universe.js'); const fs = require('fs');
const SEED = +(process.env.SEED || 1), TICKS = +(process.env.TICKS || 40000), STEP = +(process.env.STEP || 40), OUT = process.env.OUT || ('out/clock/s' + SEED);
(async () => {
  fs.mkdirSync(OUT + '/f', { recursive: true });
  const u = await su.open({ w: 704, h: 1280, seed: SEED });
  const log = fs.createWriteStream(OUT + '/log.jsonl'); let n = 0, last = 0; const t0 = Date.now();
  while (last < TICKS) {
    await u.step(STEP);
    const r = await u.eval(() => {
      const BINS = 10, RANGE = 1.5, M = 3, cells = new Map();
      for (let i = 0; i < N; i++) {
        if (!palive[i]) continue;
        const k = [0, 1, 2].map(d => { const v = tend[i * DIMS + d]; return Math.min(BINS - 1, Math.max(0, Math.floor((v + RANGE) / (2 * RANGE) * BINS))); });
        const key = k[0] * 100 + k[1] * 10 + k[2]; cells.set(key, (cells.get(key) || 0) + 1);
      }
      const occ = []; for (const [k, c] of cells) if (c >= M) occ.push(k);
      let ext = 0; for (const v of lineageRegistry.values()) if (v.extinct) ext++;
      return { tick, N, lin: lineageRegistry.size, ext, occ, img: c.toDataURL('image/jpeg', 0.85) };
    });
    fs.writeFileSync(`${OUT}/f/${String(n).padStart(5, '0')}.jpg`, Buffer.from(r.img.split(',')[1], 'base64')); delete r.img;
    log.write(JSON.stringify(r) + '\n'); last = r.tick; n++;
    if (n % 50 === 0) console.log('seed', SEED, 'rec', n, 'tick', r.tick, 'N', r.N, 'cells', r.occ.length, 'sec', Math.round((Date.now() - t0) / 1000));
  }
  log.end(); await u.close(); console.log('done', SEED, n, 'sec', Math.round((Date.now() - t0) / 1000));
})();
