// CONFABULATION ASSAY, Tier-1 case — does the cluster-reflex → VM pathway (reflexThreat/reflexTrend,
// gated by the evolvable clusterReflexWeight) actually move fitness, or is it a second instance of
// "executed but inert" (the whole-bank ablation's finding, generalized)? Unlike selfRecognition/
// reflexCohesion (proven pure ornaments by static reachability alone — see OEE-NOTES — no simulation
// run needed), this pathway IS reachable: it writes vmRegs[4]/[5] every cluster-VM tick, gated by
// crw>0.001, and clusterReflexWeight defaults to 0.15 (well above the gate) and is evolvable from
// there. Reachability alone doesn't prove adaptiveness — that's exactly the atom bank's lesson —
// so this ablates the channel itself and compares fitness across matched seeds, same method as
// harness-ablate-bank.js: pin (here, permanently gate-close) vs intact, from the SAME boot.
//
// Text-patches ONE line (verified unique against the current file before running) rather than adding
// a new toggle to index.html — this studies an EXISTING, unmodified mechanism from outside it.
//
// Env: SEEDS (default 11,13,17,19,23 — the project's standard 5-seed ablation set)
//      TICKS (default 20000)  SAMPLE (default 1000)  CONC (default 3)  INDEX (path to index.html)
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const SEEDS = (process.env.SEEDS || '11,13,17,19,23').split(',').map(s => s.trim());
const TICKS = process.env.TICKS || '20000';
const SAMPLE = process.env.SAMPLE || '1000';
const CONC = parseInt(process.env.CONC || '3', 10);
const INDEX = process.env.INDEX || path.join(__dirname, 'index.html');
const LEAF = path.join(__dirname, 'harness-reflex-leaf.js');

function run(env) {
  return new Promise((resolve, reject) => {
    execFile('node', [LEAF], { env: { ...process.env, ...env }, maxBuffer: 1 << 28 }, (err, out) => {
      if (err) return reject(new Error(err.message + '\n' + out.slice(-400)));
      try { resolve(JSON.parse(out)); } catch (e) { reject(new Error('bad JSON: ' + out.slice(-400))); }
    });
  });
}
function lateMean(series, key) {
  const t2 = Math.floor(2 * series.length / 3);
  let s = 0, c = 0;
  for (let i = t2; i < series.length; i++) { const v = series[i][key]; if (typeof v === 'number') { s += v; c++; } }
  return c ? s / c : 0;
}
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function sd(a) { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); }
async function pool(jobs, conc) {
  const out = new Array(jobs.length); let i = 0;
  async function w() { while (i < jobs.length) { const idx = i++; out[idx] = await jobs[idx](); } }
  await Promise.all(Array.from({ length: Math.min(conc, jobs.length) }, w));
  return out;
}

(async () => {
  const specs = [];
  for (const seed of SEEDS) for (const mode of ['intact', 'ablated']) specs.push({ seed, mode });
  const jobs = specs.map(sp => async () => {
    const r = await run({ SEED: sp.seed, TICKS, SAMPLE, INDEX, ABLATE_REFLEX: sp.mode === 'ablated' ? '1' : '0' });
    const s = r.series || [];
    return { ...sp, amp: lateMean(s, 'meanAmp'), occupiedKinds: lateMean(s, 'occupiedKinds'), diversityHbits: lateMean(s, 'diversityHbits'), loopErrors: r.loopErrors, driverErr: r.driverErr, crwFinal: r.crwFinal };
  });
  console.error(`[ablate-reflex] ${jobs.length} runs (${SEEDS.length} seeds x [intact, ablated]), conc=${CONC} …`);
  const results = await pool(jobs, CONC);

  const ampBy = m => results.filter(r => r.mode === m).map(r => r.amp);
  const perSeedDrop = SEEDS.map(seed => {
    const i = results.find(r => r.seed === seed && r.mode === 'intact');
    const a = results.find(r => r.seed === seed && r.mode === 'ablated');
    return (i && a) ? i.amp - a.amp : null;
  }).filter(x => x !== null);
  const dropMean = mean(perSeedDrop), dropSd = sd(perSeedDrop), positive = perSeedDrop.filter(d => d > 0).length;
  const majority = Math.ceil(2 * perSeedDrop.length / 3);
  const beatsNoise = Math.abs(dropMean) > dropSd, consistent = positive >= majority || (perSeedDrop.length - positive) >= majority;
  let label;
  if (dropMean > 0 && beatsNoise && positive >= majority) label = 'REFLEX_LOAD_BEARING';
  else if (beatsNoise && consistent) label = 'REFLEX_ADAPTIVE_BUT_INVERTED (ablation IMPROVED fitness — check sign)';
  else label = 'REFLEX_EXECUTED_BUT_INERT';

  console.log(JSON.stringify({
    config: { SEEDS, TICKS, SAMPLE },
    intact_meanAmp: +mean(ampBy('intact')).toFixed(4),
    ablated_meanAmp: +mean(ampBy('ablated')).toFixed(4),
    perSeed_intactMinusAblated: perSeedDrop.map(d => +d.toFixed(4)),
    effect_mean: +dropMean.toFixed(4), effect_sd: +dropSd.toFixed(4),
    beatsOwnNoise: beatsNoise, positiveInSeeds: positive + '/' + perSeedDrop.length + ' (need >=' + majority + ')',
    VERDICT: label,
    note: 'REFLEX_LOAD_BEARING = removing the cluster-reflex→VM channel (reflexThreat/reflexTrend via clusterReflexWeight) robustly lowers fitness — the pathway has real selective grip, unlike selfRecognition/reflexCohesion (proven pure ornaments by static reachability, no run needed). REFLEX_EXECUTED_BUT_INERT = it does not — reachable and wired, same as the atom bank, still no grip. Gate closed permanently in the ablated arm (crw>0.001 forced false) regardless of what clusterReflexWeight itself evolves to.',
    raw: results
  }, null, 1));
})().catch(e => { console.error('REFLEX ABLATION FAILED:', e.message); process.exit(1); });
