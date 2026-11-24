// #466: HOW MANY ENCOUNTERS A CREATURE RUNS A TICK. processGrid (the pair loop: entrainment, the pair VM, the cluster VM, neighbour
// models) is about half of a field universe's tick (field-phase.js, 27 universes), and task ops run only in the SOLO VM; the pair VM
// carries predation (op 155 needs a partner). Reads pIntCount (encounters this tick, capped at INTERACTION_CAP=10 or __CAP_K) after
// each loop, and the wall time. Draws nothing.   SEED=11 TASKS=1 MIND=20 TICKS=4000 EVERY=500 [CAP_K=n] node lab/port/probe-pairs.js
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT, 'harness-env.js'))(globalThis);
if (process.env.CAP_K !== undefined) globalThis.__CAP_K = +process.env.CAP_K;
const code = fs.readFileSync(process.env.INDEX || path.join(ROOT, 'engine.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module = require('module'); const m = new Module('/tmp/pairs-sim.js'); m.filename = '/tmp/pairs-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
m._compile(code + `
;(function(ticks){ const EVERY = +(process.env.EVERY || 500); let s = 0, n = 0, atCap = 0, zero = 0, t0 = Date.now(), prey0 = 0;
  for (let t = 1; t <= ticks; t++) { globalThis.__detMs += 5; try { loop(); } catch (e) {}
    for (let i = 0; i < N; i++) if (palive[i]) { const c = pIntCount[i]; s += c; n++; if (c >= (globalThis.__CAP_K ?? INTERACTION_CAP)) atCap++; if (c === 0) zero++; }
    if (t % EVERY === 0) { const L = (globalThis.__liveness && globalThis.__liveness['repl.prey']) || 0;
      process.stderr.write(JSON.stringify({ t, alive: n / EVERY | 0, meanInt: +(s / n).toFixed(2), atCap: +(atCap / n).toFixed(3), zero: +(zero / n).toFixed(3), msPerTick: +((Date.now() - t0) / EVERY).toFixed(1), seen: tSeenN }) + String.fromCharCode(10));
      s = n = atCap = zero = 0; t0 = Date.now(); } }
  console.log(JSON.stringify({ seen: tSeenN })); })(parseInt(process.env.TICKS || '2000', 10));`, '/tmp/pairs-sim.js');
