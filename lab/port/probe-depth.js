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
  // SHADOW LINEAGE (#465b): the engine keeps lineage only through PAID functions (a read word carries its slot, and an unpaid word has
  // none), so a chain through an unpaid word is cut. The shadow keeps, per register, the depth of the deepest FUNCTION read into it
  // (-1 none), through every READ (neighbour or ground), NAND and COPY. A function's depth is fixed the first time any creature
  // PUBLISHES it, paid or not: 0 if built on nothing read, else 1 + that. A word whose function is already known takes its known depth,
  // so passing one function back and forth does not deepen it (a first version counted hops and read 65-350 at 600 ticks).
  // Dirty or trivial words carry -1. It wraps the engine's own functions; oCanon only rewrites the scratch oF, which every engine
  // reader writes first. Nothing drawn; the totals must not move.
  const pd = new Int32Array(CAP * 4).fill(-1), dOut = new Int32Array(CAP).fill(-1), gDep = new Int32Array(FIELD_W * FIELD_H).fill(-1);
  const fdep = new Map(), tdep = new Map(); let twin = [], pubWin = [], tmax = 0; const thist = new Map();
  const _op = taskOpN, _mv = taskMove, _bi = taskBirth;
  taskBirth = function (i) { _bi(i); pd.fill(-1, i * 4, i * 4 + 4); dOut[i] = -1; };
  taskMove = function (w, r) { _mv(w, r); for (let q = 0; q < 4; q++) pd[w * 4 + q] = pd[r * 4 + q]; dOut[w] = dOut[r]; };
  taskOpN = function (t, src, dst, i) { const kD = i * 4 + (Math.abs(dst | 0) & 3), kS = i * 4 + (Math.abs(src | 0) & 3);
    if (t === 0) { _op(t, src, dst, i); pd[kD] = -1; return; }
    if (t === 1) { _op(t, src, dst, i); if (kS !== kD && pd[kS] > pd[kD]) pd[kD] = pd[kS]; return; }
    if (t === 2) { _op(t, src, dst, i); pd[kD] = pd[kS]; return; }
    if (t === 3) { const a = taskNeighbour(i, Math.abs(src | 0) & 7), g0 = tEv.gReads | 0, h0 = tEv.readHits; _op(t, src, dst, i);
      if ((tEv.gReads | 0) !== g0) { pd[kD] = gDep[sunCell(i)]; return; }
      if (a >= 0 && tLastE[a] === tEpoch) pd[kD] = (tEv.readHits !== h0) ? dOut[a] : -1; return; }
    const s0 = tSeenN, w0 = tEv.gWrites | 0, n0 = tEv.gNew | 0; _op(t, src, dst, i);
    const D = kD * OWM, WD = oWD, b = i * OWM; let dirty = 0; for (let x = 0; x < WD; x++) dirty |= oLJ[b + x];
    let fd = -1, key = 0;
    if (dirty === 0) { const m = oCanon(oW, D); key = (m === 5 && (oF[0] === 0 || oF[0] === 0xFFFFFFFF)) ? 0 : (oKey(m) >>> 0);
      if (key !== 0) { fd = fdep.get(key); if (fd === undefined) { fd = pd[kD] < 0 ? 0 : pd[kD] + 1; fdep.set(key, fd); pubWin.push(fd); } } }
    dOut[i] = fd;
    if ((tEv.gWrites | 0) !== w0 || (tEv.gNew | 0) !== n0) gDep[sunCell(i)] = fd;
    if (tSeenN !== s0) { const F = tKey[tLastK[i]] >>> 0; if (!tdep.has(F)) { const d = fdep.has(F) ? fdep.get(F) : fd; tdep.set(F, d); twin.push(d); if (d > tmax) tmax = d; thist.set(d, (thist.get(d) | 0) + 1); } } };
  const EVERY = +(process.env.EVERY || 1000), rows = [];
  for (let t = 1; t <= ticks; t++) { globalThis.__detMs += 5; try { loop(); } catch (e) { if ((globalThis.__err = (globalThis.__err | 0) + 1) < 3) process.stderr.write('ERR ' + String(e && e.stack || e).slice(0, 300) + String.fromCharCode(10)); }
    if (t % EVERY === 0) { let al = 0; for (let i = 0; i < N; i++) if (palive[i]) al++;
      const w = win.slice().sort((a, b) => a - b), n = w.length, q = p => n ? w[Math.min(n - 1, Math.floor(p * n))] : 0;
      let sum = 0; for (const x of w) sum += x;
      const row = { t, alive: al, inputs: TASK_OPEN ? tNin : 5, seen: tSeenN, found: dep.size, newWin: n, meanNew: +(n ? sum / n : 0).toFixed(2),
        p10: q(0.1), p50: q(0.5), p90: q(0.9), maxNew: n ? w[n - 1] : 0, maxEver: maxD, rootedWin: n ? +(w.filter(x => x === 0).length / n).toFixed(3) : 0, unpaidParents, pays, troph: Math.round(tEv.troph || 0), income: Math.round(tEv.income || 0) };
      { const w2 = twin.slice().sort((a, b) => a - b), n2 = w2.length, q2 = p => n2 ? w2[Math.min(n2 - 1, Math.floor(p * n2))] : 0; let s2 = 0; for (const x of w2) s2 += x;
        let s3 = 0; for (const x of pubWin) s3 += x;
        Object.assign(row, { tNew: n2, tMean: +(n2 ? s2 / n2 : 0).toFixed(2), tP50: q2(0.5), tP90: q2(0.9), tMaxNew: n2 ? w2[n2 - 1] : 0, tMaxEver: tmax,
          tRooted: n2 ? +(w2.filter(x => x === 0).length / n2).toFixed(3) : 0, pubNew: pubWin.length, pubMean: +(pubWin.length ? s3 / pubWin.length : 0).toFixed(2), pubKnown: fdep.size }); twin = []; pubWin = []; }
      rows.push(row); process.stderr.write(JSON.stringify(row) + String.fromCharCode(10)); win = []; } }
  const H = {}; for (const [k, v] of [...hist].sort((a, b) => a[0] - b[0])) H[k] = v;
  const TH = {}; for (const [k, v] of [...thist].sort((a, b) => a[0] - b[0])) TH[k] = v;
  return { seen: tSeenN, found: dep.size, rooted, maxEver: maxD, hist: H, tFound: tdep.size, tMaxEver: tmax, tHist: TH }; };
console.log(JSON.stringify(globalThis.__D(parseInt(process.env.TICKS || '2000', 10))));`, '/tmp/depth-sim.js');
