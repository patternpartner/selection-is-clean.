// #461: KINDS, not counts. A function's KIND is its NPN class: the functions reachable from it by permuting its inputs, negating any
// of them, and negating the output are one circuit under other labels. A count of distinct functions cannot tell a world finding new
// circuits from one finding the same circuits relabelled; a count of kinds can. Exact for functions of at most five inputs (a 32-bit
// truth table, bit r = output on row r, variable k = bit k of r). There are 616,126 NPN classes of five-input functions, so this space
// of kinds is finite; kinds of wider functions are not measured here.
//   node lab/port/kinds.js   (self-test: all 2^16 four-input functions must fall into 222 classes, all 256 three-input into 14)
'use strict';
// rows r with bit i = 1 and bit j = 0 (i < j): the low halves of the pairs a swap of variables i and j exchanges
const SW = []; for (let i = 0; i < 5; i++) { SW.push([]); for (let j = 0; j < 5; j++) { let m = 0; if (i < j) for (let r = 0; r < 32; r++) if (((r >> i) & 1) && !((r >> j) & 1)) m |= 1 << r; SW[i].push(m >>> 0); } }
const NM = []; for (let v = 0; v < 5; v++) { let m = 0; for (let r = 0; r < 32; r++) if (!((r >> v) & 1)) m |= 1 << r; NM.push(m >>> 0); }
function swapVars(x, i, j) { if (i === j) return x >>> 0; if (i > j) { const t = i; i = j; j = t; } const d = (1 << j) - (1 << i), M = SW[i][j]; const t = ((x >>> d) ^ x) & M; return (x ^ t ^ (t << d)) >>> 0; }
function negVar(x, v) { const d = 1 << v, M = NM[v]; const t = ((x >>> d) ^ x) & M; return (x ^ t ^ (t << d)) >>> 0; }
// Heap's algorithm over five positions: 119 single swaps visit all 120 orders
const HEAP = (() => { const out = [], c = [0, 0, 0, 0, 0]; let i = 1; while (i < 5) { if (c[i] < i) { out.push(i % 2 === 0 ? [0, i] : [c[i], i]); c[i]++; i = 1; } else { c[i] = 0; i++; } } return out; })();
// the class representative: the smallest table over the whole orbit (3,840 input relabellings, each with and without output negation)
function npn5(F) { F >>>= 0; let best = 0xFFFFFFFF;
  for (let n = 0; n < 32; n++) { let g = F; for (let v = 0; v < 5; v++) if ((n >> v) & 1) g = negVar(g, v);
    let a = g; if (a < best) best = a; let b = (~a) >>> 0; if (b < best) best = b;
    for (const [i, j] of HEAP) { a = swapVars(a, i, j); if (a < best) best = a; b = (~a) >>> 0; if (b < best) best = b; } }
  return best >>> 0; }
const memo = new Map();
function kind5(F) { F >>>= 0; let k = memo.get(F); if (k === undefined) { k = npn5(F); memo.set(F, k); } return k; }
// #461c: A KIND AT ANY WIDTH. A function's Walsh coefficients W_S (S a set of inputs) are permuted by permuting inputs and change sign
// under negating an input or the output, so anything built from |W_S| and the SIZE of S, sorted, is unchanged by every relabelling:
// an NPN invariant. The signature here is (1) the sorted multiset of (|S|, |W_S|) and (2) for each input, the sorted multiset of
// (|S|, |W_S|) over the S that contain it, the profiles themselves sorted. It can only UNDERCOUNT kinds (two kinds may share it).
// Calibrated against the exact classes (self-test): 218 of the 222 four-input kinds, about 95% of five-input kinds, never split.
// (The sorted magnitudes alone gave 15 of 222: far too coarse.) Width-free: only the inputs a function depends on enter (an input is
// depended on iff a nonzero coefficient contains it), magnitudes scaled to that many inputs, so a circuit embedded in more inputs
// keeps its signature. words: the truth table, 2^m bits in max(1, 2^(m-5)) 32-bit words.
function walshSig(words, m) { const N = 1 << m, W = new Int32Array(N);
  for (let r = 0; r < N; r++) W[r] = ((words[r >>> 5] >>> (r & 31)) & 1) ? -1 : 1;
  for (let h = 1; h < N; h <<= 1) for (let i = 0; i < N; i += h << 1) for (let j = i; j < i + h; j++) { const a = W[j], b = W[j + h]; W[j] = a + b; W[j + h] = a - b; }
  let dep = 0; for (let S = 0; S < N; S++) if (W[S] !== 0) dep |= S;
  const vars = []; for (let v = 0; v < m; v++) if ((dep >> v) & 1) vars.push(v); const k = vars.length, scale = 1 << (m - k);
  const pc = x => { let c = 0; while (x) { c++; x &= x - 1; } return c; };
  const all = [], prof = vars.map(() => []);
  for (let S = 0; S < N; S++) { if (S & ~dep) continue; const e = pc(S) * 1000000 + Math.abs(W[S]) / scale; all.push(e); for (let q = 0; q < k; q++) if ((S >> vars[q]) & 1) prof[q].push(e); }
  all.sort((x, y) => x - y); const ps = prof.map(a => { a.sort((x, y) => x - y); return a.join('.'); }); ps.sort();
  let h = (2166136261 ^ k) >>> 0; const mix = str => { for (let c = 0; c < str.length; c++) { h = Math.imul(h ^ str.charCodeAt(c), 16777619) >>> 0; } };
  mix(all.join(',')); mix('|' + ps.join('/')); return k + ':' + h.toString(36); }
module.exports = { npn5, kind5, HEAP, walshSig };
if (require.main === module) {
  if (HEAP.length !== 119) { console.log('FAIL heap', HEAP.length); process.exit(1); }
  const s3 = new Set(); for (let t = 0; t < 256; t++) { let w = 0; for (let r = 0; r < 32; r++) if ((t >> (r & 7)) & 1) w |= 1 << r; s3.add(npn5(w >>> 0)); }
  const t0 = Date.now(), s4 = new Set(); for (let t = 0; t < 65536; t++) s4.add(npn5(((t | (t << 16)) >>> 0)));
  const ok = s3.size === 14 && s4.size === 222;
  console.log(`three-input classes ${s3.size} (expect 14), four-input classes ${s4.size} (expect 222), ${((Date.now() - t0) / 65536).toFixed(3)} ms a function: ${ok ? 'ok' : 'FAIL'}`);
  // the width-free signature against the exact classes: it must never split a class (it is invariant), and how much it merges
  const w4 = new Map(); let split = 0; for (let t = 0; t < 65536; t++) { const w = ((t | (t << 16)) >>> 0), c = npn5(w), g = walshSig([w], 5); if (!w4.has(c)) w4.set(c, g); else if (w4.get(c) !== g) split++; }
  const g4 = new Set(w4.values()).size;
  let s5 = 0, c5 = new Map(); for (let q = 0; q < 200000; q++) { const w = (Math.random() * 4294967296) >>> 0, c = npn5(w), g = walshSig([w], 5); if (!c5.has(c)) c5.set(c, g); else if (c5.get(c) !== g) s5++; }
  const g5 = new Set(c5.values()).size;
  // embedding: a four-input circuit written into six inputs gets the signature it has at five
  let emb = 0; for (let q = 0; q < 2000; q++) { const t = (Math.random() * 65536) | 0, w = ((t | (t << 16)) >>> 0); if (walshSig([w, w], 6) !== walshSig([w], 5)) emb++; }
  const ok2 = split === 0 && s5 === 0 && emb === 0;
  console.log(`Walsh signature: four inputs ${g4} signatures for 222 classes (${(222 / g4).toFixed(3)} classes a signature); five inputs, 200,000 random functions: ${c5.size} classes, ${g5} signatures (${(c5.size / g5).toFixed(3)}); classes split ${split + s5}, embedding mismatches ${emb}: ${ok2 ? 'ok' : 'FAIL'}`);
  process.exit(ok && ok2 ? 0 : 1);
}
