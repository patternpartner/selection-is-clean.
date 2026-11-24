// #465: reads out-depth/{base,shuf}-{11,12,13}.err against PREREG-depth.md.
const fs = require('fs'), D = __dirname + '/out-depth465/' + (process.env.VER || 'v2') + '/';
const rows = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(l => l[0] === '{').map(JSON.parse) : [];
const F = process.env.FIELD || 'meanNew';
const m = (r, ts) => { const x = r.filter(y => ts.includes(y.t)); return x.length === ts.length ? x.reduce((s, y) => s + y[F], 0) / x.length : NaN; };
const res = {};
for (const arm of ['base', 'shuf']) for (const s of [11, 12, 13]) { const r = rows(`${D}${arm}-${s}.err`); if (!r.length) continue;
  const E = m(r, [3000, 4000]), L = m(r, [11000, 12000]); res[arm + s] = { E, L, ratio: L / E };
  console.log(arm, s, F + ' by 1000:', r.map(y => y[F]).join(' '), '| EARLY', E.toFixed(2), 'LATE', L.toFixed(2), 'L/E', (L / E).toFixed(2), '| found', r[r.length - 1].found, 'inputs', r[r.length - 1].inputs); }
const b = [11, 12, 13].map(s => res['base' + s]).filter(Boolean);
if (b.length === 3) { const rising = b.every(x => x.ratio >= 1.25), flat = b.filter(x => x.ratio >= 0.8 && x.ratio < 1.25).length >= 2;
  console.log('BASE:', rising ? 'RISING' : flat ? 'FLAT' : 'MIXED'); }
const sh = [11, 12, 13].map(s => [res['base' + s], res['shuf' + s]]);
if (sh.every(([x, y]) => x && y && !isNaN(y.L))) { const below = sh.filter(([x, y]) => y.L < x.L).length, smaller = sh.filter(([x, y]) => y.ratio < x.ratio).length;
  console.log('SHUFFLE: LATE below base on', below, 'of 3; rise smaller on', smaller, 'of 3 ->', below === 3 && smaller >= 2 ? 'SELECTED' : 'NOT SELECTED'); }
