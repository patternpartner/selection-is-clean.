// 'The Observer': records one world as a time-lapse tape for video/build_observer.py. The watcher's gaze is the engine's
// real attention input (#135: mx/my -> the attention field, where living costs less and which evolved code can read).
// The gaze rests at one spot (0.35 W, 0.4 H) from the start until tick GAZE_OFF, then leaves the world (mx = -9e3,
// the engine's own "never touched" value). One frame every TPF ticks; per frame the log keeps how many are alive, how
// many stand under the gaze (within R px), the mean attention they feel, and ATTENTION_GAIN - which is a law the world
// can rewrite for itself (#183), so the tape records if it does.
//   FFMPEG=<path> NODE_PATH=<playwright-core>/node_modules SEED=1 OUT=out/observer/s1 node video/observer_tape.js
const { spawn } = require('child_process');
const fs = require('fs');
const u = require('./step_universe.js');
const SEED = parseInt(process.env.SEED || '1', 10), OUT = process.env.OUT || 'out/observer/s' + SEED;
const TICKS = parseInt(process.env.TICKS || '24000', 10), TPF = 6;
const GAZE_OFF = parseInt(process.env.GAZE_OFF || '15000', 10);   // GAZE_OFF=0: the same world, never watched
const GX = 704 * 0.35, GY = 1280 * 0.4, R = 220;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const w = await u.open({ seed: SEED });
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', '704x1280', '-r', '24', '-i', '-', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    OUT + '/tape.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const log = [];
  for (let f = 0; f * TPF < TICKS; f++) {
    const on = f * TPF < GAZE_OFF;
    const s = await w.eval(([on, n, GX, GY, R]) => {
      if (on) { mx = GX; my = GY; } else { mx = -9e3; my = -9e3; }
      for (let k = 0; k < n; k++) {
        const q = window.__raf; window.__raf = []; const seen = new Set();
        for (const f of q) { if (seen.has(f)) continue; seen.add(f); f(performance.now()); }
        lastLoopTime = performance.now() + 1e12;
      }
      let a = 0, near = 0, at = 0;
      for (let i = 0; i < N; i++) if (palive[i]) { a++; at += attentionAt(i); if (Math.hypot(px[i] - GX, py[i] - GY) < R) near++; }
      return { tick, a, near, attn: +(at / Math.max(1, a)).toFixed(4), gain: +ATTENTION_GAIN.toFixed(4), lin: lineageRegistry.size };
    }, [on, TPF, GX, GY, R]);
    s.gaze = on ? 1 : 0;
    const fr = await w.grab();
    if (!ff.stdin.write(fr)) await new Promise(r => ff.stdin.once('drain', r));
    log.push(s);
    if (f % 250 === 0) { console.log(JSON.stringify(s)); fs.writeFileSync(OUT + '/log.partial.json', JSON.stringify(log)); }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(OUT + '/log.json', JSON.stringify({ seed: SEED, tpf: TPF, gazeOff: GAZE_OFF, gaze: [GX, GY], R, log }));
  await w.close();
  console.log('done');
})();
