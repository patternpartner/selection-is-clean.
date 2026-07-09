// ADAPTIVENESS ABLATION HARNESS — the decisive test the OEE notes kept deferring.
//
// "uses>0" proves an authored atom was CALLED, not that it CONTRIBUTES. This knocks a proven atom out
// (its expression -> constant 0, recompiled, via harness-oee.js's __ablate hook) and measures whether
// fitness actually drops — against a CONTROL knockout of a bound-but-unused atom, so the comparison
// isolates "this atom is load-bearing" from "perturbing any atom hurts".
//
// Design (Pe unchanged; all via the existing GENOME= resume path + ABLATE env hook):
//   1. AUTHOR: one full-engine run authors a genome; dump it + its {provenExpr, controlExpr} targets.
//   2. CONTINUE: for each seed x {none, proven, control}, boot a FRESH population from that genome,
//      apply the knockout, run C ticks, record late-window mean fitness (meanAmp) and population (N).
//   3. VERDICT: proven-knockout must lower fitness MORE than control-knockout (and than intact) for the
//      atom to be judged fitness-adaptive. Paired across seeds.
//
// Env: AUTH_SEED (7)  AUTH_TICKS (60000)  CONT_TICKS (20000)  SEEDS (comma list, default 11,13,17,19,23)
//      CONC (parallel children, default 4)
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const HARNESS = path.join(__dirname, 'harness-oee.js');
const TMP = process.env.TMPDIR || '/tmp';
const GENOME_FILE = path.join(TMP, 'ablate-genome-' + process.pid + '.json');
// Lean engine: the atom-authoring pipeline only. NOVELTY_ARCHIVE (O(N.sample.DIMS) k-NN) and GENO_PARASITE
// dominate runtime (~52s/1000 ticks with them, ~19s without) and are IRRELEVANT to whether an authored atom
// is load-bearing for fitness — the question this harness asks. Dropping them keeps the experiment tractable.
const ENGINE = { MEME_TRANSFER:'1', GROUP_COMMONS:'1', RICH_GRAMMAR:'1', REACH:'1', ATOM_PIPELINE:'1', ATOM_DURABLE:'1' };
const AUTH_SEED = process.env.AUTH_SEED || '7';
const AUTH_TICKS = process.env.AUTH_TICKS || '60000';
const CONT_TICKS = process.env.CONT_TICKS || '20000';
const SEEDS = (process.env.SEEDS || '11,13,17,19,23').split(',').map(s=>s.trim());
const CONC = parseInt(process.env.CONC || '4', 10);
const SAMPLE = '1000';

function run(env) {
  return new Promise((resolve, reject) => {
    execFile('node', [HARNESS], { env: { ...process.env, ...env }, maxBuffer: 1<<28 },
      (err, stdout) => {
        if (err) return reject(new Error(err.message + '\n' + stdout.slice(-500)));
        try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error('bad JSON: ' + stdout.slice(-500))); }
      });
  });
}
// late-window (last third) mean of a series key
function lateMean(series, key) {
  const t2 = Math.floor(2 * series.length / 3);
  let s=0,c=0; for (let i=t2;i<series.length;i++){ const v=series[i][key]; if(typeof v==='number'){s+=v;c++;} }
  return c ? s/c : 0;
}
function mean(a){ return a.reduce((x,y)=>x+y,0)/a.length; }
function sd(a){ const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))); }

async function pool(jobs, conc) {
  const out = new Array(jobs.length); let i = 0;
  async function worker(){ while(i<jobs.length){ const idx=i++; out[idx]=await jobs[idx](); } }
  await Promise.all(Array.from({length:Math.min(conc,jobs.length)}, worker));
  return out;
}

(async () => {
  console.error(`[author] seed=${AUTH_SEED} ticks=${AUTH_TICKS} …`);
  await run({ ...ENGINE, SEED: AUTH_SEED, TICKS: AUTH_TICKS, SAMPLE, DUMP_GENOME: GENOME_FILE });
  const dumped = JSON.parse(fs.readFileSync(GENOME_FILE, 'utf8'));
  const T = dumped.targets || {};
  console.error(`[author] targets: provenExpr=${JSON.stringify(T.provenExpr)} (uses=${T.provenUses}) ` +
                `controlExpr=${JSON.stringify(T.controlExpr)} (uses=${T.controlUses}) nBound=${T.nBound}`);
  if (!T.provenExpr || T.provenUses <= 0) { console.log(JSON.stringify({ error: 'no proven atom to ablate', targets: T }, null, 1)); return; }
  const haveControl = T.controlExpr && T.controlExpr !== T.provenExpr;
  const conditions = [ ['none', ''], ['proven', T.provenExpr] ];
  if (haveControl) conditions.push(['control', T.controlExpr]);

  // build the continuation job matrix
  const specs = [];
  for (const seed of SEEDS) for (const [mode, expr] of conditions) specs.push({ seed, mode, expr });
  const jobs = specs.map(sp => async () => {
    const r = await run({ ...ENGINE, GENOME: GENOME_FILE, SEED: sp.seed, TICKS: CONT_TICKS, SAMPLE,
      ABLATE: sp.mode, ABLATE_EXPR: sp.expr });
    const series = r.series || [];
    return { ...sp, amp: lateMean(series, 'meanAmp'), N: lateMean(series, 'N'),
      neutralised: r.ablation ? r.ablation.atomsNeutralised : 0, driverErr: r.driverErr };
  });
  console.error(`[continue] ${jobs.length} runs (${SEEDS.length} seeds x ${conditions.length} conditions), conc=${CONC} …`);
  const results = await pool(jobs, CONC);

  // aggregate per condition
  const byMode = {};
  for (const r of results) { (byMode[r.mode] = byMode[r.mode] || []).push(r); }
  const summary = {};
  for (const mode of Object.keys(byMode)) {
    const amps = byMode[mode].map(r=>r.amp), Ns = byMode[mode].map(r=>r.N);
    summary[mode] = { meanAmp:+mean(amps).toFixed(4), sdAmp:+sd(amps).toFixed(4), meanN:+mean(Ns).toFixed(1),
      neutralised: mode==='none'?0:byMode[mode][0].neutralised };
  }
  // paired per-seed effects: intact - ablated (positive = knockout HURT fitness)
  const paired = (mode) => SEEDS.map(seed => {
    const none = results.find(r=>r.seed===seed&&r.mode==='none');
    const abl = results.find(r=>r.seed===seed&&r.mode===mode);
    return (none&&abl)? none.amp-abl.amp : null;
  }).filter(x=>x!==null);
  const provenHits = paired('proven');
  const controlHits = haveControl ? paired('control') : [];
  const provenDrop = mean(provenHits);
  const controlDrop = haveControl ? mean(controlHits) : null;
  const provenHurtsMoreCount = haveControl ? provenHits.filter((d,i)=>d>controlHits[i]).length : provenHits.filter(d=>d>0).length;

  const verdict = {
    target: { provenExpr: T.provenExpr, provenUses: T.provenUses, controlExpr: T.controlExpr||null },
    perCondition: summary,
    provenKnockout_meanFitnessDrop: +provenDrop.toFixed(4),
    controlKnockout_meanFitnessDrop: controlDrop===null?null:+controlDrop.toFixed(4),
    seedsProvenHurtMore: provenHurtsMoreCount + '/' + provenHits.length,
    // Adaptive iff the proven knockout reliably lowers fitness AND does so more than the control knockout.
    ADAPTIVE: provenDrop > 0 && (controlDrop===null ? provenHurtsMoreCount === provenHits.length
                                                    : provenDrop > controlDrop && provenHurtsMoreCount > provenHits.length/2),
    note: 'ADAPTIVE=true means the most-proven authored atom is load-bearing for fitness, not merely executed.'
  };
  console.log(JSON.stringify({ config:{AUTH_SEED,AUTH_TICKS,CONT_TICKS,SEEDS,conditions:conditions.map(c=>c[0])}, verdict, raw: results }, null, 1));
  try { fs.unlinkSync(GENOME_FILE); } catch(e){}
})().catch(e => { console.error('ABLATE HARNESS FAILED:', e.message); process.exit(1); });
