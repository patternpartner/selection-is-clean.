// #424 - a tournament long pair, read leg by leg, and (where the rig recorded each universe's switches, slot [7]) a per-switch reading.
//   node lab/port/analyse-tourney.js [name=tl1]
// Per leg: each field's new functions, the ratio, the tournament's adoptions, and how many universes run each switch at the leg's end.
// Per switch (legs with slot [7]): for each universe, its rate of new functions per tick over intervals between samples in which its
// switches did not change, averaged; then for each switch, the median rate of universes with it ON against those with it OFF. A
// randomized design (first switchboards were random) read as one, which is NOT what the tournament itself decides by.
const fs = require('fs'), path = require('path'); const D = path.join(__dirname, 'out-tourney'), NAME = process.argv[2] || 'tl1';
const MECH = ['RED_QUEEN','NICHE_BUILD','NICHE_LOCAL','FRONTIER_EXPAND','OPCODE_NOVELTY','NOVELTY_ARCHIVE','RICH_GRAMMAR','MOTIF_SELECT','REPL_PREY','TASK_DRAIN','FOUND'];
const KNOWN = ['MOTIF_SELECT','REPL_PREY','TASK_DRAIN'];   // #410: missed when off
const load = x => fs.readFileSync(path.join(D, NAME + '-' + x + '.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).filter(r => r.F !== undefined);
const B = load('base'), T = load('tour'); const legs = Math.min(Math.max(...B.map(r => r.leg)), Math.max(...T.map(r => r.leg)));
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : NaN; };
const endOf = (L, g) => { const S = L.filter(r => r.leg === g); return S[S.length - 1]; };
console.log('leg  base new   tour new   ratio  cumulative   adoptions  switches ON at the leg end (of universes reporting)');
let pb = 0, pt = 0;
for (let g = 1; g <= legs; g++) { const b = endOf(B, g), t = endOf(T, g); const nb = b.F - pb, nt = t.F - pt; pb = b.F; pt = t.F;
  console.log(String(g).padStart(3) + '  ' + String(nb).padStart(8) + '  ' + String(nt).padStart(9) + '   ' + (nt / nb).toFixed(2) + '   ' + (t.F / b.F).toFixed(2).padStart(9) + '   ' +
    String(t.TOUR ? t.TOUR.adopt : '-').padStart(9) + '  ' + (t.SWB ? MECH.map(k => k.slice(0, 6) + ' ' + t.SWB[k]).join(', ') + '  (of ' + t.SWBN + ')' : '-')); }
const z = T[T.length - 1]; if (z && z.SWB) { const v = k => z.SWB[k]; const known = med(KNOWN.map(v)), rest = med(MECH.filter(k => !KNOWN.includes(k)).map(v));
  console.log('\nreadout 1 (written before the run): the three #410 found missed end ON in a median ' + known + ' universes; the other eight ' + rest + ' -> ' + (known > rest ? 'the judge leans the right way' : 'the judge does not see them'));
  console.log('readout 2: below 50% at the end: ' + (MECH.filter(k => v(k) < z.SWBN / 2).join(', ') || 'none') + '; at 90% or more: ' + (MECH.filter(k => v(k) >= 0.9 * z.SWBN).join(', ') || 'none')); }
// per-switch reading from slot [7]
const rows = T.filter(r => r.slots && r.slots.some(s => typeof s[7] === 'string'));
if (rows.length > 1) { const per = {};
  for (let i = 1; i < rows.length; i++) { const a = rows[i - 1], b = rows[i]; if (a.leg !== b.leg) continue; const A = {}; for (const s of a.slots) A[s[0]] = s;
    for (const s of b.slots) { const p = A[s[0]]; if (!p || typeof s[7] !== 'string' || s[7] !== p[7] || s[0] === 'collective') continue; const dk = s[1] - p[1], dn = s[3] - p[3]; if (dk < 50) continue;
      const q = per[s[0]] || (per[s[0]] = { sw: s[7], k: 0, n: 0 }); if (q.sw !== s[7]) { q.sw = s[7]; q.k = 0; q.n = 0; } q.k += dk; q.n += dn; } }
  const U = Object.entries(per).filter(([, q]) => q.k >= 300).map(([s, q]) => ({ s, sw: q.sw, r: q.n / q.k }));
  console.log('\nper switch, ' + U.length + ' universes with a steady switchboard (rate = new functions per tick; median of universes ON / OFF):');
  for (let j = 0; j < MECH.length; j++) { const on = U.filter(u => u.sw[j] === '1').map(u => u.r), off = U.filter(u => u.sw[j] === '0').map(u => u.r);
    console.log('  ' + MECH[j].padEnd(16) + ' on ' + String(on.length).padStart(2) + ' median ' + med(on).toFixed(3) + '   off ' + String(off.length).padStart(2) + ' median ' + (off.length ? med(off).toFixed(3) : '  -  ') +
      '   ratio off/on ' + (off.length && on.length ? (med(off) / med(on)).toFixed(2) : '-') + (KNOWN.includes(MECH[j]) ? '   (#410: missed)' : '')); } }
else console.log('\n(no per-universe switch records yet: slot [7] starts with leg 6)');
