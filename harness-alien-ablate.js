// SWING #46 ABLATION — does ALIEN GRIP actually change which atoms survive, or is it another
// currency that's tracked but never shapes anything (the same failure mode it was built to fix)?
//
// Every instance runs coupled — real peers are the whole point, alien prediction has nothing to grip
// without them — sharing ONE channel so they all experience the same traffic environment. Matched
// seeds, each appearing TWICE in the same cohort: once with __ALIEN_SELECT=1 (grip protects proven
// predictors from mutation/cull), once with __ALIEN_SELECT=0 (pre-#46: hits bump the dead `uses`
// counter, no protection). Holding the cohort's peer traffic constant and only flipping each
// instance's OWN gate isolates the causal question cleanly: does MY gate change MY bank's fate.
//
// Headline measure: meanAtomAge (bank/__sample() field) — the direct behavioural signature of
// protection actually happening, independent of the alien bookkeeping itself (which trivially reads
// zero under OFF by construction). Also reports totAtoms/boundOps/liveAtoms and the usual
// diversity/fitness axes as secondary — the whole thesis is this is a currency decoupled from local
// fitness, so a null there isn't evidence against it the way a null on meanAtomAge would be.
//
// Env: SEEDS (comma list, matched pairs — default 11,13,17,19)  TICKS (default 20000)
//      SAMPLE (default 1000)  INDEX (path to index.html)
const path = require('path');
const { Worker } = require('worker_threads');

const SEEDS = (process.env.SEEDS || '11,13,17,19').split(',').map(s => parseInt(s.trim(), 10));
const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '1000', 10);
const INDEX = process.env.INDEX || path.join(__dirname, 'index.html');
const WORKER = path.join(__dirname, 'harness-coupling-worker.js');
const CHANNEL = 'exp-alien-ablate';

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const w = new Worker(WORKER, { workerData });
    let result = null;
    w.on('message', (m) => { result = m; });
    w.on('error', reject);
    w.on('exit', (code) => {
      if (result) resolve(result);
      else reject(new Error(`worker exited (code ${code}) with no result — seed=${workerData.seed} alienSelect=${workerData.alienSelect}`));
    });
  });
}

function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function sd(a) { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); }
function lateMean(s, path_) {
  const t2 = Math.floor(2 * s.length / 3);
  let sum = 0, c = 0;
  for (let i = t2; i < s.length; i++) {
    const v = path_(s[i]);
    if (typeof v === 'number' && isFinite(v)) { sum += v; c++; }
  }
  return c ? sum / c : 0;
}

(async () => {
  console.error(`[alien-ablate] ${SEEDS.length} matched seeds x {on,off} = ${SEEDS.length * 2} workers, all coupled on one channel, ${TICKS} ticks`);
  const t0 = Date.now();

  const jobs = [];
  for (const seed of SEEDS) {
    jobs.push({ seed, arm: 'on', p: runWorker({ seed, ticks: TICKS, sample: SAMPLE, isolate: false, channel: CHANNEL, alienSelect: 1, index: INDEX, role: 'alien-on-' + seed }) });
    jobs.push({ seed, arm: 'off', p: runWorker({ seed, ticks: TICKS, sample: SAMPLE, isolate: false, channel: CHANNEL, alienSelect: 0, index: INDEX, role: 'alien-off-' + seed }) });
  }
  const settled = await Promise.all(jobs.map(j => j.p));
  const tDone = Date.now();

  const results = settled.map((r, i) => {
    const s = r.series || [];
    const last = s[s.length - 1] || {};
    return {
      arm: jobs[i].arm, seed: jobs[i].seed,
      bootErr: r.bootErr || null,
      loopErrors: r.loopErrors || 0, driverErr: r.driverErr || 0,
      meanAtomAge_late: +lateMean(s, x => x.bank && x.bank.meanAtomAge).toFixed(2),
      totAtoms_late: +lateMean(s, x => x.bank && x.bank.totAtoms).toFixed(2),
      boundOps_late: +lateMean(s, x => x.bank && x.bank.boundOps).toFixed(2),
      liveAtoms_late: +lateMean(s, x => x.bank && x.bank.liveAtoms).toFixed(2),
      grippedAtoms_final: last.alien ? last.alien.grippedAtoms : 0,
      bestAtomGrip_final: last.alien ? last.alien.bestAtomGrip : 0,
      alienAttempts_final: last.alien ? last.alien.attempts : 0,
      meanAmp_late: +lateMean(s, x => x.meanAmp).toFixed(4),
      diversityHbits_late: +lateMean(s, x => x.diversityHbits).toFixed(3),
      occupiedKinds_late: +lateMean(s, x => x.occupiedKinds).toFixed(2),
      cpl_final: last.cpl || null
    };
  });

  const pairedDelta = (key) => SEEDS.map(seed => {
    const on = results.find(r => r.arm === 'on' && r.seed === seed);
    const off = results.find(r => r.arm === 'off' && r.seed === seed);
    return (on && off) ? +(on[key] - off[key]).toFixed(4) : null;
  }).filter(x => x !== null);

  function verdictFor(ds) {
    const m = mean(ds), s = sd(ds), pos = ds.filter(d => d > 0).length, maj = Math.ceil(2 * ds.length / 3);
    const beatsNoise = Math.abs(m) > s;
    let label = 'INCONCLUSIVE';
    if (beatsNoise && pos >= maj) label = 'ON_HIGHER';
    else if (beatsNoise && (ds.length - pos) >= maj) label = 'ON_LOWER';
    else if (Math.abs(m) <= s) label = 'NO_EFFECT';
    return { mean: +m.toFixed(4), sd: +s.toFixed(4), perSeed: ds, positiveInSeeds: pos + '/' + ds.length, VERDICT: label };
  }

  const onArm = results.filter(r => r.arm === 'on');
  const couplingSanity = {
    on_sawExternalPeer: onArm.filter(r => r.cpl_final && r.cpl_final.externalPeers > 0).length + '/' + onArm.length,
    on_grippedAnyAtom: onArm.filter(r => r.grippedAtoms_final > 0).length + '/' + onArm.length,
    off_grippedAnyAtom_shouldBeZero: results.filter(r => r.arm === 'off' && r.grippedAtoms_final > 0).length,
    note: 'off should ALWAYS read grippedAtoms=0 (alienHits/alienAttempts never populate when the gate is off, by construction) — this checks the gate itself, not the hypothesis.'
  };

  console.log(JSON.stringify({
    config: { SEEDS, TICKS, SAMPLE, CHANNEL },
    timing_ms: { wall: tDone - t0 },
    couplingSanity,
    verdict: {
      meanAtomAge: verdictFor(pairedDelta('meanAtomAge_late')),
      totAtoms: verdictFor(pairedDelta('totAtoms_late')),
      liveAtoms: verdictFor(pairedDelta('liveAtoms_late')),
      meanAmp: verdictFor(pairedDelta('meanAmp_late')),
      diversityHbits: verdictFor(pairedDelta('diversityHbits_late')),
      occupiedKinds: verdictFor(pairedDelta('occupiedKinds_late'))
    },
    note: 'delta = on - off (matched seed pairs, same cohort/channel). meanAtomAge is the headline: ON_HIGHER there means grip is measurably protecting atoms from the blind mutation/cull sweep — the mechanism has real teeth, not just tracked stats. The fitness/diversity axes are secondary by design (the whole point is decoupling from local fitness), so NO_EFFECT there is not evidence against the mechanism the way NO_EFFECT on meanAtomAge would be.',
    results
  }, null, 1));
})().catch(e => { console.error('ALIEN ABLATION FAILED:', e.message, e.stack); process.exit(1); });
