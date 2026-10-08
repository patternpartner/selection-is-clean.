// Pass A of the nature documentary: the REAL universe (engine.html), stepped 3 ticks per captured frame, every frame saved as a
// JPEG at 704x1280 with the engine's own numbers logged beside it. One pass, because the engine is not deterministic across
// stepping patterns (wall-clock gates) so frames and numbers must come from the same run.
// SEED=5 TICKS=8000 OUT=out/doc/s5 NODE_PATH=... node video/doc_capture.js
const su = require('./step_universe.js'); const fs = require('fs');
const SEED = +(process.env.SEED || 5), TICKS = +(process.env.TICKS || 8000), OUT = process.env.OUT || ('out/doc/s' + SEED);
(async () => {
  fs.mkdirSync(OUT + '/f', { recursive: true });
  const u = await su.open({ w: 704, h: 1280, seed: SEED });
  const log = fs.createWriteStream(OUT + '/log.jsonl');
  let n = 0, lastTick = 0;
  while (lastTick < TICKS) {
    await u.step(3);
    const r = await u.eval(() => {
      const bins = []; for (let b = 0; b < 12; b++) bins.push([0, 0, 0]);
      for (let i = 0; i < N; i++) {
        const r = pR[i], g = pG[i], bl = pB[i]; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); if (mx - mn < 25) continue;
        let h; const d = mx - mn; if (mx === r) h = ((g - bl) / d + 6) % 6; else if (mx === g) h = (bl - r) / d + 2; else h = (r - g) / d + 4;
        const k = Math.floor(h * 2) % 12; bins[k][0]++; bins[k][1] += px[i]; bins[k][2] += py[i];
      }
      let ext = 0; for (const v of lineageRegistry.values()) if (v.extinct) ext++;
      const cnt = (a, t) => { let s = 0; for (let i = 0; i < a.length; i++) if (a[i] > t) s++; return s; };
      return { tick, N, lin: lineageRegistry.size, ext, f1: cnt(field, 0.05), f2: cnt(field2, 0.05), mem: cnt(fieldMemory, 0), ncl: clusters.length,
        bins: bins.map(b => b[0] ? [b[0], Math.round(b[1] / b[0]), Math.round(b[2] / b[0])] : [0, 0, 0]),
        img: c.toDataURL('image/jpeg', 0.92) };
    });
    fs.writeFileSync(`${OUT}/f/${String(n).padStart(5, '0')}.jpg`, Buffer.from(r.img.split(',')[1], 'base64')); delete r.img;
    log.write(JSON.stringify(r) + '\n'); lastTick = r.tick; n++;
    if (n % 200 === 0) console.log('seed', SEED, 'frame', n, 'tick', r.tick, 'N', r.N, 'lin', r.lin);
  }
  log.end(); await u.close(); console.log('done', SEED, n);
})();
