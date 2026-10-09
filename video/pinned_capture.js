// Real amp values (the value engine.html line ~3671 clamps into render register R[4]) of every living particle, every STEP ticks.
// SEED=776 TICKS=6000 STEP=100 node video/pinned_capture.js > out/pinned/amp.json
const su = require('./step_universe.js');
const SEED = +(process.env.SEED || 776), TICKS = +(process.env.TICKS || 6000), STEP = +(process.env.STEP || 100);
(async () => {
  const u = await su.open({ w: 704, h: 1280, seed: SEED }); const rec = []; let last = 0;
  while (last < TICKS) {
    await u.step(STEP);
    const r = await u.eval(() => { const a = []; for (let i = 0; i < N; i++) if (palive[i]) a.push(Math.round(amp[i] * 1000) / 1000); return { tick, a }; });
    rec.push(r); last = r.tick;
  }
  await u.close(); process.stdout.write(JSON.stringify({ seed: SEED, rec }));
})();
