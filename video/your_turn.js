// 'Your Turn' (song: Gravity and Glass): records one world for video/build_your_turn.py, with every birth logged so
// the film can give the world a voice - each birth a note, each birth that founds a new species a bell.
// addParticle and createLineage are wrapped (no random draws, no change to what they do) so a birth is caught at the
// moment it happens: where, which lineage (its colour), whether it had a parent, and whether it speciated.
// The world is aged PRE ticks unfilmed first (births are rare in a young world), then filmed TPF ticks a frame.
//   FFMPEG=<path> NODE_PATH=<playwright-core>/node_modules SEED=1 node video/your_turn.js
const { spawn } = require('child_process');
const fs = require('fs');
const u = require('./step_universe.js');
const SEED = parseInt(process.env.SEED || '1', 10), OUT = process.env.OUT || 'out/your-turn';
const PRE = parseInt(process.env.PRE || '4000', 10), TPF = 3, SECS = parseFloat(process.env.SECS || '180');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const w = await u.open({ seed: SEED });
  await w.eval(() => {
    window.__ev = []; window.__spec = 0;
    const C = createLineage;
    createLineage = function (p, src) { const l = C.apply(this, arguments); if (src === 'speciate') window.__spec++; return l; };
    const A = addParticle;
    addParticle = function (x, y, tv, born, pa, pb) {
      const s0 = window.__spec;
      const i = A.apply(this, arguments);
      if (i >= 0) { const e = lineageRegistry.get(pLin[i]);
        window.__ev.push([+px[i].toFixed(1), +py[i].toFixed(1), e ? +e.hue.toFixed(1) : 0, pa >= 0 ? 1 : 0, window.__spec > s0 ? 1 : 0]); }
      return i;
    };
  });
  await w.step(PRE);
  await w.eval(() => { window.__ev = []; });
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', '704x1280', '-r', '24', '-i', '-', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    OUT + '/world.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const log = [];
  const nF = Math.round(SECS * 24);
  for (let n = 0; n < nF; n++) {
    const r = await w.eval((k) => {
      for (let j = 0; j < k; j++) {
        const q = window.__raf; window.__raf = []; const seen = new Set();
        for (const f of q) { if (seen.has(f)) continue; seen.add(f); f(performance.now()); }
        lastLoopTime = performance.now() + 1e12;
      }
      let a = 0; for (let i = 0; i < N; i++) if (palive[i]) a++;
      const ev = window.__ev; window.__ev = [];
      return { tick, N: a, lin: lineageRegistry.size, b: ev };
    }, TPF);
    const f = await w.grab();
    if (!ff.stdin.write(f)) await new Promise(r => ff.stdin.once('drain', r));
    log.push(r);
    if (n % 480 === 0) { console.log(n / 24, r.tick, r.N, r.b.length); fs.writeFileSync(OUT + '/log.partial.json', JSON.stringify(log)); }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(OUT + '/log.json', JSON.stringify({ seed: SEED, pre: PRE, tpf: TPF, log }));
  await w.close();
  console.log('done', log.reduce((s, r) => s + r.b.length, 0), 'births');
})();
