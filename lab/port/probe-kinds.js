// #461: KINDS IN A RUNNING WORLD. Watches every payment through the engine's read-only __taskOnPay hook and reports, every EVERY ticks:
// - found5: distinct functions of at most five inputs ever paid (the count this project reports, restricted to where kinds are exact);
// - kinds: their distinct NPN classes (lab/port/kinds.js), and how many are new this window;
// - steps: distinct BUILDING STEPS, pairs (kind read -> kind made) over every paid word built on a read function of at most five
//   inputs (the word's read keys), and how many are new this window. A new step is a new way of building on another's work.
// It draws nothing and the hook writes nothing; the world must reproduce digest.js's counts on the same seed (checked: seen).
//   SEED=11 TASKS=1 MIND=20 TICKS=12000 EVERY=2000 node lab/port/probe-kinds.js
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT, 'harness-env.js'))(globalThis);
const { kind5, walshSig } = require('./kinds.js'); globalThis.__kind5 = kind5; globalThis.__wsig = walshSig;
const code = fs.readFileSync(process.env.INDEX || path.join(ROOT, 'engine.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module = require('module'); const m = new Module('/tmp/kinds-sim.js'); m.filename = '/tmp/kinds-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
m._compile(code + `
;globalThis.__K = function(ticks){ const found = new Set(), kinds = new Set(), steps = new Set(); let pays = 0, built = 0;
  const sigOf = new Map(), kindsW = new Set(), stepsW = new Set(); let builtW = 0;
  __taskOnPay = (i, T, kD) => { pays++; if (TASK_OPEN) { const key = tKey[T] >>> 0, m = oM[T]; let g = sigOf.get(key);
      if (g === undefined) { g = globalThis.__wsig(m <= 5 ? [oF[0]] : oF.subarray(0, 1 << (m - 5)), Math.max(5, m)); sigOf.set(key, g); kindsW.add(g); }
      for (let q = 0; q < 4; q++) { const s = tK[kD * 4 + q]; if (s < 0) continue; const gi = sigOf.get(tKey[s] >>> 0); if (gi === undefined) continue; builtW++; stepsW.add(gi + '>' + g); } }
    if (!TASK_OPEN || oM[T] !== 5) return; const F = tKey[T] >>> 0; if (!found.has(F)) { found.add(F); kinds.add(globalThis.__kind5(F)); }
    const kOut = globalThis.__kind5(F); for (let q = 0; q < 4; q++) { const s = tK[kD * 4 + q]; if (s < 0 || oM[s] !== 5) continue; built++; steps.add(globalThis.__kind5(tKey[s] >>> 0) + ':' + kOut); } };
  const EVERY = +(process.env.EVERY || 2000); let k0 = 0, s0 = 0, f0 = 0, kw0 = 0, sw0 = 0, fw0 = 0;
  for (let t = 1; t <= ticks; t++) { globalThis.__detMs += 5; try { loop(); } catch (e) { if ((globalThis.__err = (globalThis.__err | 0) + 1) < 3) process.stderr.write('ERR ' + String(e && e.stack || e).slice(0, 300) + String.fromCharCode(10)); }
    if (t % EVERY === 0) { let al = 0; for (let i = 0; i < N; i++) if (palive[i]) al++;
      process.stderr.write(JSON.stringify({ t, alive: al, inputs: tNin, seen: tSeenN, found5: found.size, found5Win: found.size - f0, kinds: kinds.size, kindsWin: kinds.size - k0,
        fnPerKind: +(found.size / Math.max(1, kinds.size)).toFixed(2), steps: steps.size, stepsWin: steps.size - s0, built,
        allFound: sigOf.size, allFoundWin: sigOf.size - fw0, allKinds: kindsW.size, allKindsWin: kindsW.size - kw0, allFnPerKind: +(sigOf.size / Math.max(1, kindsW.size)).toFixed(2), allSteps: stepsW.size, allStepsWin: stepsW.size - sw0, builtW }) + String.fromCharCode(10)); f0 = found.size; k0 = kinds.size; s0 = steps.size; fw0 = sigOf.size; kw0 = kindsW.size; sw0 = stepsW.size; } }
  return { seen: tSeenN, found5: found.size, kinds: kinds.size, steps: steps.size, allFound: sigOf.size, allKinds: kindsW.size, allSteps: stepsW.size }; };
console.log(JSON.stringify(globalThis.__K(parseInt(process.env.TICKS || '2000', 10))));`, '/tmp/kinds-sim.js');
