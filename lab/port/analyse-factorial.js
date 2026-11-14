// #430 - PREREG-factorial.md's screen over lab/port/out-factorial (fields f1-f6). Written and committed before the decision runs.
//   node lab/port/analyse-factorial.js [dir] [fields=f1,f2,...]
// Unit: a universe at its field's final sample (the collective excluded). y = log(1 + n), n = functions new to it since boot.
// OLS: y ~ field + kind + sum_f beta_f * off_f. beta_f < 0 means a universe without layer f found less.
const fs = require('fs'), path = require('path'); const D = process.argv[2] || path.join(__dirname, 'out-factorial');
const FIELDS = (process.argv[3] || 'f1,f2,f3,f4,f5,f6').split(',');
const LIST = ['NICHE_FRONTIER','NICHE_NDIM','NICHE_LOCAL','SPECIATE','COLO_SURV','COLO_PIONEER','DRAW_VM','GROUP_ROLES','SPATIAL_NICHE','NICHE_BUILD',
  'RED_QUEEN','FRONTIER_EXPAND','OPCODE_NOVELTY','NOVELTY_ARCHIVE','RICH_GRAMMAR','DECIDE_REAL','DECIDE','FORAGE_EYES','ATOM_DURABLE','REACH','REACH_MAIN',
  'REACH_NOK','ATOM_CREDIT','EXPR_CREDIT','EXPR_CREDIT_POP','ATOM_CREDIT_VERT','ATOM_NOVELTY_CREDIT','ATOM_REPRO','ATOM_ELIGIBILITY','ATOM_RECOMB',
  'ATOM_WRSENSE','DIMS_ATOM','UA_INHERIT','ATOM_NFD','ATOM_OBJ','ATOM_FRSENSE','REACH_GAIN','GROUP_COMMONS','MEME_TRANSFER',
  'MIND','MOTIF_SELECT','FOUND','REPL_PREY','TASK_TROPHP'];
const KNOWN = ['REPL_PREY', 'TASK_TROPHP', 'MOTIF_SELECT'];
const IDENT = ['COLO_SURV','DRAW_VM','GROUP_ROLES','EXPR_CREDIT_POP','ATOM_CREDIT_VERT','ATOM_WRSENSE','DIMS_ATOM','ATOM_NFD','ATOM_OBJ','ATOM_FRSENSE','GROUP_COMMONS'];
const kindOf = s => /^u\d/.test(s) ? 'u' : /^L1_/.test(s) ? 'L1' : /^L2_/.test(s) ? 'L2' : /^g\d/.test(s) ? 'g' : null;
const rows = [], used = [];
for (const f of FIELDS) { const p = path.join(D, f + '.jsonl'); if (!fs.existsSync(p)) continue;
  const L = fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r => r.F !== undefined); const z = L[L.length - 1];
  if (!z || !z.final || z.t < 1500) continue; used.push(f);
  for (const s of z.slots) { const k = kindOf(s[0]); if (!k) continue; const off = new Set(typeof s[8] === 'string' && s[8] ? s[8].split('+') : []);
    rows.push({ f, k, slot: s[0], n: s[3] | 0, ticks: s[1] | 0, alive: s[2] | 0, off }); } }
// design matrix: intercept, field dummies (first field the base), kind dummies (u the base), one column per layer
const fieldLv = used.slice(1), kindLv = ['L1', 'L2', 'g'];
const names = ['(intercept)'].concat(fieldLv.map(f => 'field ' + f), kindLv.map(k => 'kind ' + k), LIST);
const X = rows.map(r => [1].concat(fieldLv.map(f => r.f === f ? 1 : 0), kindLv.map(k => r.k === k ? 1 : 0), LIST.map(l => r.off.has(l) ? 1 : 0)));
const y = rows.map(r => Math.log(1 + r.n)); const n = rows.length, p = names.length;
function inv(A) { const m = A.length, M = A.map((r, i) => r.concat(Array.from({ length: m }, (_, j) => i === j ? 1 : 0)));
  for (let c = 0; c < m; c++) { let piv = c; for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null; [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c]; for (let j = 0; j < 2 * m; j++) M[c][j] /= d;
    for (let r = 0; r < m; r++) if (r !== c) { const fct = M[r][c]; if (fct) for (let j = 0; j < 2 * m; j++) M[r][j] -= fct * M[c][j]; } }
  return M.map(r => r.slice(m)); }
console.log('fields used: ' + used.join(' ') + ' (' + used.length + '); universes counted: ' + n + '; parameters: ' + p);
const offCount = LIST.map((l, j) => rows.filter(r => r.off.has(l)).length);
if (used.length < 5 || n < 120) { console.log('VERDICT: INCONCLUSIVE (floor: 5 fields and 120 universes)'); }
const XtX = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0)));
const XtY = Array.from({ length: p }, (_, a) => X.reduce((s, r, i) => s + r[a] * y[i], 0));
const Xi = inv(XtX); if (!Xi) { console.log('the design is singular (a layer was never off, or always off with another)'); process.exit(0); }
const beta = Xi.map(r => r.reduce((s, v, j) => s + v * XtY[j], 0));
const res = y.map((v, i) => v - X[i].reduce((s, x, j) => s + x * beta[j], 0)); const df = n - p, s2 = res.reduce((s, e) => s + e * e, 0) / Math.max(1, df);
const se = Xi.map((r, j) => Math.sqrt(Math.max(0, r[j] * s2)));
console.log('residual sd ' + Math.sqrt(s2).toFixed(3) + ' (log units), df ' + df);
for (let j = 1; j < 1 + fieldLv.length + kindLv.length; j++) console.log('  ' + names[j].padEnd(14) + ' ' + beta[j].toFixed(3) + ' (se ' + se[j].toFixed(3) + ')');
const off0 = 1 + fieldLv.length + kindLv.length; const out = [];
for (let j = 0; j < LIST.length; j++) { const b = beta[off0 + j], e = se[off0 + j], t = b / e; out.push({ l: LIST[j], b, e, t, nOff: offCount[j] }); }
console.log('\nlayer                  off in   beta    se      t     x (= exp beta)   reading');
for (const o of out.slice().sort((a, b) => a.t - b.t)) {
  const earns = o.b < 0 && o.t < -2.5, cand = o.t > -1 && (o.b - 2 * o.e) > -0.30;
  console.log('  ' + o.l.padEnd(20) + String(o.nOff).padStart(5) + '  ' + o.b.toFixed(3).padStart(7) + ' ' + o.e.toFixed(3).padStart(6) + ' ' + o.t.toFixed(2).padStart(6) + '   ' + Math.exp(o.b).toFixed(2).padStart(5) + '        ' +
    (earns ? 'EARNS ITS PLACE' : cand ? 'removal candidate' : 'unclear') + (KNOWN.includes(o.l) ? '   (#410: missed)' : '') + (IDENT.includes(o.l) ? '   (node: identical by 3,000)' : '')); }
const chk = out.filter(o => KNOWN.includes(o.l) && o.b < 0 && o.t < -2);
console.log('\ncheck (written before the run): of the three #410 found missed, ' + chk.length + ' have beta < 0 with t < -2 (' + chk.map(o => o.l).join(', ') + ') -> ' + (chk.length ? 'the screen can see' : 'TOO WEAK: it nominates nothing'));
if (chk.length && used.length >= 5 && n >= 120) { console.log('earns its place: ' + out.filter(o => o.b < 0 && o.t < -2.5).map(o => o.l).join(', '));
  console.log('removal candidates: ' + out.filter(o => o.t > -1 && (o.b - 2 * o.e) > -0.30).map(o => o.l).join(', ')); }
