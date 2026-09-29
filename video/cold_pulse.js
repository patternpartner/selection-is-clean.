// 'Cold Pulse': the song is the law. The real universe (engine.html#cleanart) is stepped three ticks per video frame and
// the song's sung words are carried out on it as physics, at the frame each word is sung:
//   every kick drum  a radial pulse from the centre        HEAVY  gravity switched on, stronger each time
//   STILL            every velocity set to zero            LOST   the picture goes dark; the world keeps running
//   FOUND            the light comes back, with the real count of who was born and who died in the dark
//   COLD / PULSE     damping, then one huge impulse       LIGHT DUST  strangers dropped in from the top edge
//   LOST TIME        thousands of ticks pass unfilmed      I      the camera picks one stranger and follows it
// Nothing is faked: every count on screen is read out of the engine. Writes out/cold/world.mp4 (the bare world, frame
// n = song time n/24) and out/cold/log.json (per frame: counts, the tracked stranger, and what the song did).
//   FFMPEG=<path> NODE_PATH=<playwright-core>/node_modules SEED=1 node video/cold_pulse.js      (SECS=60 for a preview)
const { spawn } = require('child_process');
const fs = require('fs');
const u = require('./step_universe.js');
const FPS = 24, TPF = 3, SEED = parseInt(process.env.SEED || '1', 10);
const SECS = parseFloat(process.env.SECS || '179.3');
const OUT = process.env.OUT || 'out/cold';
const K = JSON.parse(fs.readFileSync('video/stories/cold-pulse-kicks.json'));
const JUMP = 3000, DUST = 30;
// NOLAW=1: the twin. Same seed, same frames, same unfilmed jumps (so the ticks line up), and nothing the song does.
const NOLAW = process.env.NOLAW === '1';
// word, song time (vocal onsets from the demucs vocal stem's energy, checked against whisper on short clips)
const WORDS = [
  ['HEAVY', 32.1], ['HEAVY', 33.95], ['HEAVY', 34.65],
  ['STILL', 40.75], ['STILL', 42.75],
  ['LOST', 48.25], ['FOUND', 56.1],
  ['COLD', 65.6], ['PULSE', 66.6], ['COLD', 69.55], ['PULSE', 70.55],
  ['LIGHT', 73.5], ['DUST', 74.5], ['LOST', 77.45], ['TIME', 78.45],
  ['COLD', 81.05], ['PULSE', 82.05], ['I', 83.6],
  ['COLD', 141.95], ['PULSE', 143.25], ['LIGHT', 147.1], ['DUST', 148.2],
  ['LOST', 151.0], ['TIME', 152.05], ['COLD', 154.9], ['PULSE', 155.85],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const w = await u.open({ seed: SEED });
  await w.eval(() => {
    window.__law = { g: 0, still: 0, damp: 1, track: null };
    window.__alive = () => { let n = 0; for (let i = 0; i < N; i++) if (palive[i]) n++; return n; };
    window.__pulse = (f, R) => {   // radial impulse from the centre, fading to nothing at radius R
      const cx = W / 2, cy = H / 2; let n = 0;
      for (let i = 0; i < N; i++) { if (!palive[i]) continue; const dx = px[i] - cx, dy = py[i] - cy,
        d = Math.sqrt(dx * dx + dy * dy) + 1e-3; if (d > R) continue; const k = f * (1 - d / R);
        vx[i] += dx / d * k; vy[i] += dy / d * k; n++; }
      return n;
    };
    window.__line = (L) => {   // every living particle descended from lineage L (through budded child lineages)
      const set = new Set([L]), q = [L];
      while (q.length) { const e = lineageRegistry.get(q.pop()); if (!e) continue;
        for (const c of e.children) if (!set.has(c)) { set.add(c); q.push(c); } }
      let n = 0; for (let i = 0; i < N; i++) if (palive[i] && set.has(pLin[i])) n++;
      return n;
    };
    // compact() moves particles between slots every 45 ticks: re-find ours by lineage, exact age and position
    window.__follow = () => {
      const tr = window.__law.track; if (!tr || !tr.alive) return;
      tr.age++;
      let best = -1, bd = 1e9;
      for (let i = 0; i < N; i++) { if (!palive[i] || pLin[i] !== tr.lin || page[i] !== tr.age) continue;
        const d = Math.hypot(px[i] - tr.x, py[i] - tr.y); if (d < bd) { bd = d; best = i; } }
      if (best < 0 || bd > 60) { tr.alive = 0; tr.diedTick = tick; return; }
      tr.x = px[best]; tr.y = py[best];
    };
    window.__ticks = (n, free) => {
      const L = window.__law;
      for (let k = 0; k < n; k++) {
        if (!free) for (let i = 0; i < N; i++) { if (!palive[i]) continue;
          if (L.still) { vx[i] = 0; vy[i] = 0; } else { vy[i] += L.g; vx[i] *= L.damp; vy[i] *= L.damp; } }
        const q = window.__raf; window.__raf = []; const seen = new Set();
        for (const f of q) { if (seen.has(f)) continue; seen.add(f); f(performance.now()); }
        lastLoopTime = performance.now() + 1e12;   // the watchdog must not start a second chain while we film
        window.__follow();
      }
    };
  });
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', '704x1280', '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '12', '-preset', 'fast',
    '-pix_fmt', 'yuv420p', OUT + '/world.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const log = [];
  let ki = 0, wi = 0, dark = null, strangers = [];
  const nF = Math.round(SECS * FPS);
  for (let n = 0; n < nF; n++) {
    const t = n / FPS, ev = [];
    const law = await w.eval(() => window.__law);
    while (ki < K.kicks.length && K.kicks[ki] <= t) {
      const a = K.amp[ki++];
      if (!law.still && !NOLAW) {   // the beat breathes: out on one kick, in on the next, so it moves the world without hollowing it
        const f = (ki % 2 ? 0.35 : -0.3) * a;
        await w.eval((f) => { __pulse(f, 560); addShock(W / 2, H / 2, Math.abs(f) * 1.4, 150, 190, 230); }, f); ev.push(['kick', f]); }
    }
    while (wi < WORDS.length && WORDS[wi][1] <= t) {
      const word = WORDS[wi++][0];
      let text = '';
      if (NOLAW && word !== 'TIME') continue;
      if (word === 'HEAVY') text = await w.eval(() => { __law.g += 0.02; __law.still = 0;
        return 'gravity ' + __law.g.toFixed(3) + ' on ' + __alive() + ' lives'; });
      else if (word === 'STILL') text = await w.eval(() => { __law.still = 1; __law.g = 0; return 'velocity = 0 on ' + __alive() + ' lives'; });
      else if (word === 'LOST' && WORDS[wi] && WORDS[wi][0] === 'FOUND') {
        dark = await w.eval(() => { __law.still = 0; __law.g = 0; return { tick, alive: __alive() }; });
        text = 'the light goes out. the world does not.';
      } else if (word === 'FOUND') {
        const r = await w.eval((d) => { let born = 0, all = 0; const dt = tick - d.tick;
          for (let i = 0; i < N; i++) if (palive[i]) { all++; if (page[i] < dt) born++; }
          return { born, died: d.alive - (all - born), dt }; }, dark);
        text = 'in the dark: ' + r.born + ' born, ' + r.died + ' died';
      } else if (word === 'COLD') text = await w.eval(() => { __law.damp = 0.9; return 'every velocity x0.9, every tick'; });
      else if (word === 'PULSE') text = await w.eval(() => { __law.damp = 1; return 'impulse 6.0 through ' + __pulse(6, 1500) + ' lives'; });
      else if (word === 'LIGHT') text = '';
      else if (word === 'DUST') {
        const r = await w.eval((k) => { const got = [];
          for (let j = 0; j < k; j++) { const x = 30 + Math.random() * (W - 60), i = addParticle(x, 14 + Math.random() * 20, randomTendency(), true);
            if (i >= 0) { vy[i] = 2 + Math.random() * 2; vx[i] = (Math.random() - 0.5); got.push({ i, lin: pLin[i], x: px[i], y: py[i] }); } }
          return got; }, DUST);
        strangers = strangers.concat(r.map(s => s.lin));
        text = '+' + r.length + ' strangers';
      } else if (word === 'LOST') text = '';
      else if (word === 'TIME') { await w.eval((j) => __ticks(j, true), JUMP); text = '+' + JUMP.toLocaleString('en') + ' ticks, unfilmed'; }
      else if (word === 'I') {
        const r = await w.eval((ls) => {   // which stranger: the one whose line is biggest now; ties go to the oldest
          let best = null;
          for (let i = 0; i < N; i++) { if (!palive[i] || !ls.includes(pLin[i])) continue;
            const m = __line(pLin[i]); if (!best || m > best.m || (m === best.m && page[i] > best.age))
              best = { m, age: page[i], lin: pLin[i], x: px[i], y: py[i] }; }
          if (best) __law.track = { lin: best.lin, age: best.age, x: best.x, y: best.y, alive: 1, born: tick - best.age };
          return best; }, strangers);
        text = r ? 'one of the strangers' : 'no stranger survived';
      }
      ev.push(['word', word, text]);
    }
    await w.eval((n) => __ticks(n, false), TPF);
    const st = await w.eval(() => { const tr = __law.track;
      return { N: __alive(), tick, lin: lineageRegistry.size,
        tr: tr ? { x: tr.x, y: tr.y, alive: tr.alive, age: tr.age, line: __line(tr.lin), lin: tr.lin, diedTick: tr.diedTick } : null }; });
    const f = await w.grab();
    if (!ff.stdin.write(f)) await new Promise(r => ff.stdin.once('drain', r));
    log.push(Object.assign({ n, t: +t.toFixed(3), ev }, st));
    if (n % 480 === 0) fs.writeFileSync(OUT + '/log.partial.json', JSON.stringify(log));
    if (n % 240 === 0) console.log(t.toFixed(1), JSON.stringify(st), ev.length ? JSON.stringify(ev) : '');
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.writeFileSync(OUT + '/log.json', JSON.stringify({ seed: SEED, tpf: TPF, jump: JUMP, words: WORDS, log }));
  await w.close();
  console.log('done', nF);
})();
