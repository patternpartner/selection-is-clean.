// #465: HOW DEEP DOES WHAT IS NEW SIT? (#461d's next measure.) A count of distinct functions, or of kinds, cannot tell open-ended
// building from a long search in a huge space: at eight inputs nearly every new function is a new kind whatever is happening. This
// asks a different question of the same payments. Every paid word carries the slots of the functions it was built on (its read
// keys, tK[kD*4..kD*4+3], the same lineage the drain pays down). A function's BUILD DEPTH is fixed at its first payment:
//   0 if the word was built on nothing read; otherwise 1 + the deepest function it was built on (a read function never paid
//   counts as depth 0, and is counted as such in `unpaidParents`).
// So depth d means a chain of d payments-of-new-functions, each built on the last. If the world only searches, new functions sit at a
// shallow depth whatever the count; if it builds on its own builds, the depth of what is new keeps rising. TASK_SHUFFLE=1 is the
// control (#376): same pools and draws, payments to a random creature.
// Read-only: the engine's own __taskOnPay hook, Maps in the probe, nothing drawn. The totals must equal probe-kinds.js's on the same
// seed (seed 11, 12,000 ticks: seen 117,496).
//   SEED=11 TASKS=1 MIND=20 TICKS=12000 EVERY=1000 node lab/port/probe-depth.js
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT, 'harness-env.js'))(globalThis);
const code = fs.readFileSync(process.env.INDEX || path.join(ROOT, 'engine.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module = require('module'); const m = new Module('/tmp/depth-sim.js'); m.filename = '/tmp/depth-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
m._compile(code + `
;globalThis.__D = function(ticks){ const dep = new Map(); let pays = 0, unpaidParents = 0, rooted = 0, maxD = 0;
  let win = [], hist = new Map();
  const onPay = (i, T, kD) => { pays++; const F = tKey[T] >>> 0; if (dep.has(F)) return;
    let d = -1;
    for (let q = 0; q < 4; q++) { const s = tK[kD * 4 + q]; if (s < 0) continue; const k = tKey[s] >>> 0; if (k === F) continue;
      let pd = dep.get(k); if (pd === undefined) { pd = 0; unpaidParents++; } if (pd > d) d = pd; }
    d = d < 0 ? 0 : d + 1; if (d === 0) rooted++; dep.set(F, d); if (d > maxD) maxD = d; win.push(d); hist.set(d, (hist.get(d) | 0) + 1); };
  __taskOnPay = onPay;
  const EVERY = +(process.env.EVERY || 1000), rows = [];
  for (let t = 1; t <= ticks; t++) { globalThis.__detMs += 5; try { loop(); } catch (e) { if ((globalThis.__err = (globalThis.__err | 0) + 1) < 3) process.stderr.write('ERR ' + String(e && e.stack || e).slice(0, 300) + String.fromCharCode(10)); }
    if (t % EVERY === 0) { let al = 0; for (let i = 0; i < N; i++) if (palive[i]) al++;
      const w = win.slice().sort((a, b) => a - b), n = w.length, q = p => n ? w[Math.min(n - 1, Math.floor(p * n))] : 0;
      let sum = 0; for (const x of w) sum += x;
      const row = { t, alive: al, inputs: TASK_OPEN ? tNin : 5, seen: tSeenN, found: dep.size, newWin: n, meanNew: +(n ? sum / n : 0).toFixed(2),
        p10: q(0.1), p50: q(0.5), p90: q(0.9), maxNew: n ? w[n - 1] : 0, maxEver: maxD, rootedWin: n ? +(w.filter(x => x === 0).length / n).toFixed(3) : 0, unpaidParents, pays };
      rows.push(row); process.stderr.write(JSON.stringify(row) + String.fromCharCode(10)); win = []; } }
  const H = {}; for (const [k, v] of [...hist].sort((a, b) => a[0] - b[0])) H[k] = v;
  return { seen: tSeenN, found: dep.size, rooted, maxEver: maxD, hist: H }; };
console.log(JSON.stringify(globalThis.__D(parseInt(process.env.TICKS || '2000', 10))));`, '/tmp/depth-sim.js');
