// score-296b.js - the #296b deciding run (pre-registered in OEE-NOTES #296b before the first decision run): the primitive
// mind in the real engine, MIND=20, against a null band of four mind-off runs per seed (the control and NULLSHIFT 1-3),
// on unseen seeds 301-303 at 20,000 ticks, on the retire-or-prove template's grid-free measures.
//   node score-296b.js <dir>      (<dir> holds <arm>.<seed>.json from harness-oee.js and a .done beside each)
// Arms: null0 null1 null2 null3 (mind off), M (MIND=20, MIND_SEED=1), U (MIND=20, MIND_MODE=2, MIND_SEED=1: uniformly
// random rewrites at the same rate, no model). M is ruled on; U is scored the same way and reported.
'use strict';
const fs = require('fs'), path = require('path');
const D = process.argv[2] || '.', SEEDS = [301, 302, 303], NULLS = ['null0', 'null1', 'null2', 'null3'];
const rd = f => { try { return fs.existsSync(f.replace(/\.json$/, '.done')) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; } catch (e) { return null; } };
const m = R => { const v = R.verdict.diversity_trend, p = R.verdict.program_trend, e = R.establishment || {};
  return { cE: v.centredEntropyRatio, sp: v.spread_late, f: e.estFrac, ph: p.sigH_late, eff: e.effN_late, alive: e.alive_late, uses: R.mind ? R.mind.uses | 0 : 0 }; };
function rule(arm) { const rows = [];
  for (const s of SEEDS) { const Ns = NULLS.map(a => rd(path.join(D, a + '.' + s + '.json'))), A = rd(path.join(D, arm + '.' + s + '.json'));
    if (!A || Ns.some(x => !x)) { console.log('  ' + s + ' pending'); rows.push({ pending: true }); continue; }
    const n = Ns.map(m), a = m(A), mx = f => Math.max(...n.map(x => x[f])), mn = f => Math.min(...n.map(x => x[f]));
    const counted = a.uses > 0 && JSON.stringify(A.series) !== JSON.stringify(Ns[0].series), better = [], worse = [];
    if (a.cE > mx('cE') + 0.05) better.push('centredEntropyRatio'); if (a.sp > mx('sp') * 1.10) better.push('spread');
    if (mx('f') > 0 && a.f > mx('f') * 1.25) better.push('establishment'); if (a.ph > mx('ph') * 1.10) better.push('programEntropy');
    if (a.cE < mn('cE') - 0.05) worse.push('centredEntropyRatio'); if (a.sp < mn('sp') * 0.90) worse.push('spread');
    if (a.f < mn('f') * 0.75) worse.push('establishment'); if (a.ph < mn('ph') * 0.90) worse.push('programEntropy');
    if (n.every(x => x.alive > 20) && a.alive < 5) worse.push('crash'); if (a.eff < mn('eff') * 0.75) worse.push('sweep(effN)');
    console.log('  ' + s + ' nulls [cE, spread, est, progH, effN, alive] ' + JSON.stringify(n.map(x => [x.cE, x.sp, x.f, x.ph, x.eff, x.alive])));
    console.log('  ' + s + ' ' + arm + ' ' + JSON.stringify([a.cE, a.sp, a.f, a.ph, a.eff, a.alive]) + ' mind wrote ' + a.uses + ' | counted ' + counted + ' better ' + JSON.stringify(better) + ' worse ' + JSON.stringify(worse));
    rows.push({ counted, better, worse }); }
  if (rows.some(r => r.pending)) return 'pending';
  const c = rows.filter(r => r.counted), n = c.length, b = c.filter(r => r.better.length).length, w = c.filter(r => r.worse.length).length;
  const B = b * 3 >= 2 * n, W = w * 3 >= 2 * n;
  return n < 3 ? 'INCONCLUSIVE (' + n + ' counted)' : B && W ? 'SPLIT - stays an off-by-default switch' : W ? 'WORSE - DELETE (or DORMANT with a named follow-up)'
    : B ? 'BETTER, and not WORSE - KEEP, claimed at the rung measured' : c.every(r => !r.better.length && !r.worse.length) ? 'NEITHER: inside the band on every counted seed - KEEP (it runs and changes the world) but no effect shown' : 'KEEP (not WORSE)'; }
console.log('== M: the mind, MIND=20'); console.log('VERDICT M: ' + rule('M'));
console.log('== U: uniform random rewrites at the same rate (reported, no ruling)'); console.log('U: ' + rule('U'));
