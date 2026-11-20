// #464: THE ECOLOGY OF A COMPUTING WORLD, counted the way the field's history rows count it (sim.worker.js histRow): living creatures,
// how many carry predation (op 155) and how many read the world's inputs (INPUT, TASK_OP0) in their RUNNING program (pProg), and the
// world's own counters for births, predation events (repl.prey) and payments. Reads state and counters only; draws nothing.
// The user's phone field (#463b) showed predators at 75-100% of the living and input readers falling to about 10%; this asks whether
// that is the core world (#459) or the computing world either way.  SEED=11 TASKS=1 MIND=20 TICKS=12000 EVERY=2000 [TASK_CORE=0] node lab/port/probe-ecology.js
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT, 'harness-env.js'))(globalThis);
const code = fs.readFileSync(process.env.INDEX || path.join(ROOT, 'engine.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module = require('module'); const m = new Module('/tmp/eco-sim.js'); m.filename = '/tmp/eco-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
m._compile(code + `
;globalThis.__E = function(ticks){ const EVERY = +(process.env.EVERY || 2000); let b0 = 0, k0 = 0, p0 = 0;
  for (let t = 1; t <= ticks; t++) { globalThis.__detMs += 5; try { loop(); } catch (e) { if ((globalThis.__err = (globalThis.__err | 0) + 1) < 3) process.stderr.write('ERR ' + String(e && e.stack || e).slice(0, 300) + String.fromCharCode(10)); }
    if (t % EVERY === 0) { let al = 0, pr = 0, inp = 0; for (let i = 0; i < N; i++) { if (!palive[i]) continue; al++; const p = pProg[i]; if (!p) continue;
        for (let q = 0; q < p.length; q++) if (p[q][0] === 155) { pr++; break; } for (let q = 0; q < p.length; q++) if (p[q][0] === TASK_OP0) { inp++; break; } }
      const L = __liveness, b = L['repl.birth'] | 0, k = L['repl.prey'] | 0, pd = tEv.paid;
      process.stderr.write(JSON.stringify({ t, alive: al, predators: pr, predPct: +(100 * pr / Math.max(1, al)).toFixed(1), readers: inp, readPct: +(100 * inp / Math.max(1, al)).toFixed(1),
        births: b - b0, takes: k - k0, paid: pd - p0, takesPerPay: +((k - k0) / Math.max(1, pd - p0)).toFixed(1), seen: tSeenN, inputs: tNin }) + String.fromCharCode(10)); b0 = b; k0 = k; p0 = pd; } }
  return { seen: tSeenN }; };
console.log(JSON.stringify(globalThis.__E(parseInt(process.env.TICKS || '2000', 10))));`, '/tmp/eco-sim.js');
