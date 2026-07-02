// machine.js — a self-extending virtual machine, built as a machine.
//
// No particles. No world of organisms. No borrowed vocabulary. Programs run on a
// shared instruction set and compete for an execution budget; the ones that earn
// value are copied; and the instruction set EXTENDS ITSELF — new primitives are
// authored, promoted to opcodes, wired into programs, and kept only if they earn
// calls. That self-extension loop is the entire essence carried over from the
// original piece, with everything else (space, particles, ecology) dropped.
//
// The open question this exists to ask, in machine terms:
//   does authored, INPUT-READING structure win call-share over pure self-scalings,
//   and does the description length of the actively-run code ratchet under pricing?
//
// ── THE ONE DECISION NOT MADE HERE ──────────────────────────────────────────
// price() is the selection objective — what the machine is FOR. It is the crux of
// the whole project and it is deliberately a marked placeholder, not a default I
// picked. The placeholder rewards TRACKING an input-driven target, which is one
// specific bet (that prediction is what's valuable) chosen only so the loop has
// something to select on and so input-reading CAN win if the loop finds it. Swap
// it. See price() below.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';
const zlib = require('zlib');

// ── determinism ──
const SEED = (parseInt(process.env.SEED || '7', 10) | 0) >>> 0;
let _rngA = SEED;
function rnd() { _rngA |= 0; _rngA = _rngA + 0x6D2B79F5 | 0; let t = Math.imul(_rngA ^ _rngA >>> 15, 1 | _rngA); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const ri = (n) => (rnd() * n) | 0;

// ── config ──
const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '1000', 10);
const STREAM = !!process.env.JSONL;
const N = parseInt(process.env.POP || '400', 10);          // number of programs
const REGS = 8;                                            // register file per run
const PROG_LEN = 12;                                       // instructions per program
const CORE_OPCODES = 32;                                   // core instruction set size (ids 0..31); authored ops get id >= 32
// self-extension knobs (default ON; =0 to ablate for an A/B) — the same four levers as the original stack
const ATOM_PIPELINE = ((process.env.ATOM_PIPELINE ?? '1') | 0) !== 0;  // author + bind + wire new primitives
const ATOM_DURABLE  = ((process.env.ATOM_DURABLE  ?? '1') | 0) !== 0;  // keep authored call-sites across reproduction
const REACH         = ((process.env.REACH         ?? '1') | 0) !== 0;  // authored output drives an actuator channel
const RICH_GRAMMAR  = ((process.env.RICH_GRAMMAR  ?? '1') | 0) !== 0;  // grammar can read input channels + select/compose

// ── input channels (the abstract environment; NOT a physical world) ──
// A handful of ambient signals programs may read. Purely computational: oscillators
// of the tick clock plus a coupling channel fed by the population's own mean output.
// The grammar names them c,d,m,nx,ny,t,nb (kept from the original so the same
// input-reading detection applies) — here they are just channels, no spatial meaning.
let __reachFires = 0;                                      // telemetry: authored output -> actuator drives
let _probing = false;                                      // true during ablation probing: don't mutate uses/telemetry
let _coupling = 0;                                         // nb: last tick's population-mean output
function inputs(t) {
  const tt = t * 0.01;
  return {
    c: 0.5 + 0.5 * Math.sin(tt * 1.7),
    d: 0.5 + 0.5 * Math.cos(tt * 0.9),
    m: (t % 7) / 7,
    nx: Math.sin(tt),
    ny: Math.cos(tt * 0.5),
    t: tt,
    nb: _coupling,
  };
}

// ── the authored-primitive grammar (a shared library of "atoms") ──
// An atom is a short expression over registers/inputs, compiled to a function. Other
// atoms may call it via f(idx,a,b) (composition). This is the DISCRETE generator: it
// mints genuinely new callable structure, unlike the numeric drift of the programs.
const atoms = [];        // { expr, fn, uses, age }
const bound = [];        // indices into `atoms` promoted to opcodes; opcode id = CORE_OPCODES + position
const SELF = [];         // ids >= CORE that appear as a call-site somewhere (for reload/durability semantics)

const SELF_VARS = ['a', 'b', 'u', 's'];                    // register / internal
const INPUT_VARS = ['c', 'd', 'm', 'nx', 'ny', 't', 'nb']; // read the environment
const FUNCS_RICH = ['Math.sin', 'Math.cos', 'Math.tanh', 'Math.abs', 'Math.sign', 'Math.atan2', 'Math.hypot', 'Math.min', 'Math.max', 'Math.exp', 'Math.log1p'];
const FUNCS_PLAIN = ['Math.sin', 'Math.cos', 'Math.tanh', 'Math.abs'];

function randExpr(depth) {
  const funcs = RICH_GRAMMAR ? FUNCS_RICH : FUNCS_PLAIN;
  const vars = RICH_GRAMMAR ? SELF_VARS.concat(INPUT_VARS) : SELF_VARS;
  if (depth <= 0 || rnd() < 0.35) {
    if (rnd() < 0.45) return (rnd() * 4 - 2).toFixed(2);
    return vars[ri(vars.length)];
  }
  const r = rnd();
  if (r < 0.30) { const fn = funcs[ri(funcs.length)]; return fn + '(' + randExpr(depth - 1) + ')'; }
  if (r < 0.55) { const op = ['+', '-', '*'][ri(3)]; return '(' + randExpr(depth - 1) + op + randExpr(depth - 1) + ')'; }
  if (r < 0.70 && bound.length >= 0) { return 'f(' + ri(Math.max(1, atoms.length + 1)) + ',' + randExpr(depth - 1) + ',' + randExpr(depth - 1) + ')'; }
  if (r < 0.85) { return 'Math.atan2(' + randExpr(depth - 1) + ',' + randExpr(depth - 1) + ')'; }
  return '((' + randExpr(depth - 1) + ')>(' + randExpr(depth - 1) + ')?(' + randExpr(depth - 1) + '):(' + randExpr(depth - 1) + '))';
}

let _uaFuel = 0;
function uaCall(idx, a, b, ctx) {
  const at = atoms[((idx % atoms.length) + atoms.length) % atoms.length];
  if (!at || !at.fn || _uaFuel <= 0) return 0;
  _uaFuel--;
  if (!_probing) at.uses++;
  const f = (i, x, y) => uaCall(i, +x || 0, +y || 0, ctx);
  const r = at.fn(a, b, at.uses, ctx.c, ctx.d, ctx.m, 0, f, ctx.nx, ctx.ny, ctx.t, ctx.nb);
  return isFinite(r) ? r : 0;
}
function compile(expr) {
  try { return new Function('a', 'b', 'u', 'c', 'd', 'm', 's', 'f', 'nx', 'ny', 't', 'nb', 'const r=(' + expr + ');return isFinite(r)?r:0;'); }
  catch (e) { return null; }
}
function author() {
  if (atoms.length >= 48) return -1;
  const expr = randExpr(3);
  const fn = compile(expr);
  if (!fn) return -1;
  atoms.push({ expr, fn, uses: 0, age: 0 });
  return atoms.length - 1;
}

// ── programs: sequences of [op, si, di, k] over a REGS-wide register file ──
function randInstr() { return [ri(CORE_OPCODES + bound.length), ri(REGS), ri(REGS), +(rnd() * 2 - 1).toFixed(3)]; }
function randProg() { const p = []; for (let i = 0; i < PROG_LEN; i++) p.push(randInstr()); return p; }
function cloneProg(p) { return p.map(ins => ins.slice()); }

// core opcode semantics: R[di] = op(R[si], R[si+1], k, inputs)
function runProg(prog, ctx, mute) {
  const R = new Float64Array(REGS);
  R[0] = ctx.nx; R[1] = ctx.ny; R[2] = ctx.t;             // seed a few registers from inputs so reads matter
  let out = 0;
  _uaFuel = 64;
  for (let i = 0; i < prog.length; i++) {
    const ins = prog[i]; const op = ins[0] | 0, si = ins[1] % REGS, di = ins[2] % REGS, k = ins[3];
    const a = R[si], b = R[(si + 1) % REGS];
    let v;
    if (op >= CORE_OPCODES) {                              // authored opcode: call the bound atom
      if (mute && mute.has(op)) { v = a; }                 // ablation: neutralise this authored op (passthrough), no reach
      else {
      const bi = bound[op - CORE_OPCODES];
      const at = (bi != null) ? atoms[bi] : null;
      if (at && at.fn) { if (!_probing) at.uses++; const f = (idx, x, y) => uaCall(idx, +x || 0, +y || 0, ctx); v = at.fn(a, b, at.uses, ctx.c, ctx.d, ctx.m, 0, f, ctx.nx, ctx.ny, ctx.t, ctx.nb); v = isFinite(v) ? v : 0;
        if (REACH) { if (!_probing) __reachFires++; out += Math.max(-2, Math.min(2, v)) * k * 0.2; } }   // authored output drives the actuator channel
      else v = a;
      }
    } else {
      switch (op % 20) {
        case 0: v = a + b; break;
        case 1: v = a - b; break;
        case 2: v = a * k; break;
        case 3: v = Math.abs(b) > 1e-6 ? a / b : a; break;
        case 4: v = Math.sin(a); break;
        case 5: v = Math.cos(a); break;
        case 6: v = Math.tanh(a); break;
        case 7: v = Math.abs(a); break;
        case 8: v = Math.min(a, b); break;
        case 9: v = Math.max(a, b); break;
        case 10: v = Math.atan2(a, b); break;
        case 11: v = Math.hypot(a, b); break;
        case 12: v = Math.sign(a) * k; break;
        case 13: v = a > b ? a : k; break;                 // select
        case 14: v = ctx.t; break;                         // read clock
        case 15: v = ctx.nb; break;                        // read coupling
        case 16: v = Math.exp(Math.max(-8, Math.min(2, a))); break;
        case 17: v = Math.log1p(Math.abs(a)); break;
        case 18: v = a * b; break;
        default: v = a + k; break;
      }
    }
    R[di] = isFinite(v) ? v : 0;
    out = R[0];
  }
  return isFinite(out) ? out : 0;
}

// ── PRICE — the selection objective. PLACEHOLDER. This is the crux; swap it. ──
// PRICE_MODE selects the objective. Two are provided, and their contrast is a
// falsification control, not a menu of purposes:
//   'track' (default) — value = how well output tracks an INPUT-DRIVEN target.
//            Input-reading has a real edge, so it CAN win if the loop finds it.
//   'const'           — value = how well output holds a FIXED target (0.5).
//            Reading inputs gives NO edge. This is the control: if senseAct_gaining
//            stays high here, the input-share signal is NOT the objective talking
//            (it's grammar bias / automatic adoption). If it collapses, it WAS.
const PRICE_MODE = process.env.PRICE_MODE || 'track';
function price(out, ctx) {
  const target = PRICE_MODE === 'const' ? 0.5 : (Math.sin(ctx.t) * 0.8 + ctx.nb * 0.2);
  const err = out - target;
  return 1 / (1 + err * err);                              // in (0,1], best at perfect match
}

// ── population ──
let progs = [], val = new Float64Array(N), csites = new Float64Array(N);  // csites: authored call-sites carried (durability telemetry)
for (let i = 0; i < N; i++) progs.push(randProg());

function bindAtom(idx) {
  if (idx < 0 || bound.length >= 32) return -1;
  bound.push(idx);
  return CORE_OPCODES + bound.length - 1;
}
function spliceCallsite(prog, opId) {
  if (prog.length >= PROG_LEN + 8) return;
  prog.splice(ri(prog.length + 1), 0, [opId, ri(REGS), ri(REGS), +(rnd() * 1.2 - 0.6).toFixed(3)]);
}
function mutate(prog) {
  const p = cloneProg(prog);
  // point mutation on instructions
  if (p.length && rnd() < 0.7) { const j = ri(p.length); p[j] = randInstr(); }
  if (rnd() < 0.15 && p.length < PROG_LEN + 8) p.splice(ri(p.length + 1), 0, randInstr());
  if (rnd() < 0.10 && p.length > 4) p.splice(ri(p.length), 1);
  // ATOM PIPELINE: author -> bind -> wire a call-site, in one step (the loop closed at the source)
  if (ATOM_PIPELINE && rnd() < 0.02) {
    const ai = author();
    if (ai >= 0) { const opId = bindAtom(ai); if (opId >= 0) { spliceCallsite(p, opId); if (SELF.indexOf(opId) < 0) SELF.push(opId); } }
  }
  // DURABILITY: guarantee established authored opcodes retain a call-site through reproduction
  if (ATOM_DURABLE && SELF.length) {
    const have = new Set(); for (const ins of p) if (ins[0] >= CORE_OPCODES) have.add(ins[0]);
    for (const opId of SELF) { if (p.length >= PROG_LEN + 8) break; if (!have.has(opId) && rnd() < 0.5) spliceCallsite(p, opId); }
  }
  return p;
}

// ── metrics (the four families, substrate-native) ──
function pdepth(e) { let d = 0, mx = 0; for (let i = 0; i < e.length; i++) { const ch = e[i]; if (ch === '(') mx = Math.max(mx, ++d); else if (ch === ')') d--; } return mx; }
const SENSE = /\b(nx|ny|nb|c|d|m|t)\b/, COMPOSE = /\bf\s*\(/;
// LOAD-BEARING use: the honest test raw-`uses` can't do. Take the best program, and for
// each authored opcode it calls, neutralise that opcode (passthrough) and measure how much
// the program's PRICE drops across a spread of input contexts. A drop => the authored
// primitive is doing real work under the current objective; no drop => it's dead weight the
// automatic-adoption plumbing kept anyway. Probing doesn't mutate uses/telemetry.
function loadBearing(best, tick) {
  const ctxs = []; for (let j = 0; j < 24; j++) ctxs.push(inputs(tick + j * 137));
  const ops = new Set(); for (const ins of best) if ((ins[0] | 0) >= CORE_OPCODES) ops.add(ins[0] | 0);
  const was = _probing; _probing = true;
  let pFull = 0; for (const cx of ctxs) pFull += price(runProg(best, cx, null), cx); pFull /= ctxs.length;
  let lb = 0, maxDrop = 0, sumDrop = 0;
  for (const op of ops) {
    const mute = new Set([op]);
    let pA = 0; for (const cx of ctxs) pA += price(runProg(best, cx, mute), cx); pA /= ctxs.length;
    const drop = pFull - pA;
    if (drop > 1e-4) lb++;
    if (drop > maxDrop) maxDrop = drop;
    sumDrop += drop;
  }
  _probing = was;
  return { authoredOpsInBest: ops.size, loadBearingOps: lb, priceDropSum: +sumDrop.toFixed(4), priceDropMax: +maxDrop.toFixed(4) };
}
function score(tick, best) {
  const used = new Set();
  for (const p of progs) for (const ins of p) used.add(ins[0] | 0);
  for (const ins of best) used.add(ins[0] | 0);
  let usedCore = 0, usedBound = 0; for (const op of used) (op >= CORE_OPCODES ? usedBound++ : usedCore++);
  let boundLive = 0; for (let k = 0; k < bound.length; k++) { const opId = CORE_OPCODES + k; if (used.has(opId) && atoms[bound[k]] && atoms[bound[k]].uses > 0) boundLive++; }
  let adopted = 0, usesTot = 0, usesMax = 0, depthMax = 0, depthSum = 0, comp = 0, senseAtoms = 0, senseUses = 0;
  const active = [];
  for (const a of atoms) { const u = a.uses | 0; usesTot += u; if (u > usesMax) usesMax = u;
    if (u > 0) { adopted++; active.push(a.expr); const dp = pdepth(a.expr); depthSum += dp; if (dp > depthMax) depthMax = dp;
      if (COMPOSE.test(a.expr)) comp++; if (SENSE.test(a.expr)) { senseAtoms++; senseUses += u; } } }
  const parts = [];
  for (const ins of best) parts.push(ins.map(x => typeof x === 'number' ? (+x).toFixed(3) : String(x)).join(','));
  for (const e of active) parts.push(e);
  const src = parts.join('\n');
  let mdl = 0; try { mdl = zlib.gzipSync(src).length; } catch (e) {}
  const lb = loadBearing(best, tick);
  return { tick, isaUsedDistinct: used.size, isaUsedCore: usedCore, isaUsedBound: usedBound,
    boundDeclared: bound.length, boundLive, atoms: atoms.length, atomsAdopted: adopted,
    usesTot, usesMax, depthMax, depthMean: adopted ? +(depthSum / adopted).toFixed(2) : 0, composites: comp,
    senseAtoms, senseUseShare: usesTot > 0 ? +(senseUses / usesTot).toFixed(3) : 0, reachFires: __reachFires,
    authoredOpsInBest: lb.authoredOpsInBest, loadBearingOps: lb.loadBearingOps, priceDropSum: lb.priceDropSum, priceDropMax: lb.priceDropMax,
    vmLen: best.length, mdlBytes: mdl };
}

// ── run: evaluate -> price -> reproduce, with self-extension in the copy step ──
const series = [];
const t0 = Date.now();
let bestProg = progs[0];
for (let tick = 0; tick <= TICKS; tick++) {
  const ctx = inputs(tick);
  let sum = 0, bi = 0, bv = -1;
  for (let i = 0; i < N; i++) { const out = runProg(progs[i], ctx); const v = price(out, ctx); val[i] = v; sum += out; if (v > bv) { bv = v; bi = i; } }
  _coupling = sum / N;                                     // feed nb for next tick (pure computational coupling)
  bestProg = progs[bi];
  for (const a of atoms) a.age++;
  // reproduction: tournament — replace a random program with a mutated copy of a fitter one
  const K = Math.max(8, (N * 0.25) | 0);
  for (let r = 0; r < K; r++) {
    const x = ri(N), y = ri(N);
    const winner = val[x] >= val[y] ? x : y, loser = val[x] >= val[y] ? y : x;
    progs[loser] = mutate(progs[winner]);
  }
  if (tick % SAMPLE === 0) { const m = score(tick, bestProg); series.push(m); if (STREAM) process.stdout.write(JSON.stringify(m) + '\n'); }
}
const dt = Date.now() - t0;

// ── verdict (same shape as harness-score.js) ──
function slope(s, key) { const n = s.length; if (n < 2) return 0; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (let i = 0; i < n; i++) { const y = s[i][key] || 0; sx += i; sy += y; sxx += i * i; sxy += i * y; } const d = n * sxx - sx * sx; return d === 0 ? 0 : (n * sxy - sx * sy) / d; }
function wmean(s, key, lo, hi) { let a = 0, c = 0; for (let i = lo; i < hi && i < s.length; i++) { a += s[i][key] || 0; c++; } return c ? a / c : 0; }
function stdev(s, key) { const mu = wmean(s, key, 0, s.length); let v = 0; for (const r of s) v += ((r[key] || 0) - mu) ** 2; return Math.sqrt(v / Math.max(1, s.length)); }
const nS = series.length, t1 = (nS / 3) | 0, t2 = (2 * nS / 3) | 0, first = series[0] || {}, last = series[nS - 1] || {};
const mdlStd = stdev(series, 'mdlBytes');
const scoreboard = {
  ISA: { usedDistinct_early: +wmean(series, 'isaUsedDistinct', 0, t1).toFixed(1), usedDistinct_late: +wmean(series, 'isaUsedDistinct', t2, nS).toFixed(1), usedBound_max: Math.max(0, ...series.map(r => r.isaUsedBound || 0)), boundLive_max: Math.max(0, ...series.map(r => r.boundLive || 0)) },
  MINT: { atomsAdopted_max: Math.max(0, ...series.map(r => r.atomsAdopted || 0)), usesMax_max: Math.max(0, ...series.map(r => r.usesMax || 0)), depthMean_early: +wmean(series, 'depthMean', 0, t1).toFixed(2), depthMean_late: +wmean(series, 'depthMean', t2, nS).toFixed(2), depthMax_max: Math.max(0, ...series.map(r => r.depthMax || 0)), composites_max: Math.max(0, ...series.map(r => r.composites || 0)) },
  BEHAVIOUR: { senseAtoms_max: Math.max(0, ...series.map(r => r.senseAtoms || 0)), senseUseShare_early: +wmean(series, 'senseUseShare', 0, t1).toFixed(3), senseUseShare_late: +wmean(series, 'senseUseShare', t2, nS).toFixed(3), reachFires_total: last.reachFires || 0 },
  MDL: { bytes_early: +wmean(series, 'mdlBytes', 0, t1).toFixed(1), bytes_late: +wmean(series, 'mdlBytes', t2, nS).toFixed(1), bytes_slopePerSample: +slope(series, 'mdlBytes').toFixed(4), ratchets: slope(series, 'mdlBytes') * nS > mdlStd && mdlStd > 0 },
  LOADBEARING: { loadBearingOps_max: Math.max(0, ...series.map(r => r.loadBearingOps || 0)), loadBearingOps_late: +wmean(series, 'loadBearingOps', t2, nS).toFixed(2), authoredOpsInBest_max: Math.max(0, ...series.map(r => r.authoredOpsInBest || 0)), priceDropSum_late: +wmean(series, 'priceDropSum', t2, nS).toFixed(4), priceDropMax_max: Math.max(0, ...series.map(r => r.priceDropMax || 0)) },
};
const signals = {
  mint_active: scoreboard.MINT.atomsAdopted_max > 0,
  authored_opcodes_running: scoreboard.ISA.boundLive_max > 0,
  mint_deepening: scoreboard.MINT.depthMean_late > scoreboard.MINT.depthMean_early,
  senseAct_gaining: scoreboard.BEHAVIOUR.senseUseShare_late > scoreboard.BEHAVIOUR.senseUseShare_early,
  mdl_ratchets: scoreboard.MDL.ratchets,
  // the honest one: does the mint keep primitives that actually do work under the objective?
  mint_load_bearing: scoreboard.LOADBEARING.loadBearingOps_max > 0,
};
console.log(JSON.stringify({
  config: { SEED, TICKS, POP: N, PRICE_MODE, stack: { ATOM_PIPELINE, ATOM_DURABLE, REACH, RICH_GRAMMAR } },
  timing_ms: { run: dt, perKtick: +((dt / TICKS) * 1000).toFixed(1) },
  scoreboard, signals,
  notes: [
    'No particles, no ecology — programs over a shared instruction set, priced and copied.',
    'price() is a PLACEHOLDER objective (input-tracking). It is the crux and is meant to be swapped.',
    'senseAct_gaining asks if input-reading atoms win call-share; mdl_ratchets asks if active code accretes irreducible structure.',
  ],
  series: STREAM ? '(streamed)' : series,
}, null, 1));
