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
module.exports = { npn5, kind5, HEAP };
if (require.main === module) {
  if (HEAP.length !== 119) { console.log('FAIL heap', HEAP.length); process.exit(1); }
  const s3 = new Set(); for (let t = 0; t < 256; t++) { let w = 0; for (let r = 0; r < 32; r++) if ((t >> (r & 7)) & 1) w |= 1 << r; s3.add(npn5(w >>> 0)); }
  const t0 = Date.now(), s4 = new Set(); for (let t = 0; t < 65536; t++) s4.add(npn5(((t | (t << 16)) >>> 0)));
  const ok = s3.size === 14 && s4.size === 222;
  console.log(`three-input classes ${s3.size} (expect 14), four-input classes ${s4.size} (expect 222), ${((Date.now() - t0) / 65536).toFixed(3)} ms a function: ${ok ? 'ok' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}
