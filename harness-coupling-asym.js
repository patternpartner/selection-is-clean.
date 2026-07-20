// ASYMMETRIC CAUSAL COUPLING TEST — the actual analogue of what the live 8-body cohort showed.
//
// harness-coupling.js (swing #45) coupled SYMMETRIC same-age peers and found coupling did not raise
// diversity — if anything it mildly homogenized. That result named its own follow-up: the live
// cohort's producer/consumer differentiation came from an AGE/MATURITY ASYMMETRY (an old, large
// producer feeding novelty to young bloomers), not from coupling per se. This harness builds that
// asymmetry directly:
//   1. One PRODUCER instance runs alone for MATURATION_TICKS (its BroadcastChannel is already open
//      on the shared channel name, but nobody else has joined it yet, so nothing crosses).
//   2. Once mature, N FRESH instances spawn for COUPLE_TICKS, in matched pairs:
//        COUPLED   — joins the producer's channel; can hear it (and be heard by it) for the whole run.
//        ISOLATED  — same seed, private channel name — same strength-matched "unplugged" control as
//                    swing #45, now with a producer actually present on the other side of the wire.
// If fresh-COUPLED diverges from fresh-ISOLATED (esp. toward MORE diversity, unlike #45's symmetric
// result), that's evidence the asymmetry — not coupling alone — is what drives the live differentiation.
//
// Env: PRODUCER_SEED (default 7 — the project's canonical authoring seed)
//      MATURATION_TICKS (default 30000)  COUPLE_TICKS (default 15000)
//      FRESH_SEEDS (comma list, matched pairs — default 11,13,17)
//      SAMPLE (ticks between samples, default 750)  INDEX (path to index.html)
const path = require('path');
const { Worker } = require('worker_threads');

const PRODUCER_SEED = parseInt(process.env.PRODUCER_SEED || '7', 10);
const MATURATION_TICKS = parseInt(process.env.MATURATION_TICKS || '30000', 10);
const COUPLE_TICKS = parseInt(process.env.COUPLE_TICKS || '15000', 10);
const FRESH_SEEDS = (process.env.FRESH_SEEDS || '11,13,17').split(',').map(s => parseInt(s.trim(), 10));
const SAMPLE = parseInt(process.env.SAMPLE || '750', 10);
const INDEX = process.env.INDEX || path.join(__dirname, 'index.html');
const WORKER = path.join(__dirname, 'harness-coupling-worker.js');
const PRODUCER_CHANNEL = 'exp-asym-producer';

function runWorker(workerData, onMessage) {
  return new Promise((resolve, reject) => {
    const w = new Worker(WORKER, { workerData });
    let result = null;
    w.on('message', (m) => { result = m; if (onMessage) onMessage(m); });
    w.on('error', reject);
    w.on('exit', (code) => {
      if (result) resolve(result);
      else reject(new Error(`worker exited (code ${code}) with no result — ${JSON.stringify(workerData.role || workerData.seed)}`));
    });
  });
}

function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function sd(a) { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); }
function lateMean(s, key) {
  const t2 = Math.floor(2 * s.length / 3);
  let sum = 0, c = 0;
  for (let i = t2; i < s.length; i++) { const v = s[i][key]; if (typeof v === 'number') { sum += v; c++; } }
  return c ? sum / c : 0;
}

(async () => {
  console.error(`[asym] producer seed=${PRODUCER_SEED} matures for ${MATURATION_TICKS} ticks alone, then ${FRESH_SEEDS.length} fresh pairs join for ${COUPLE_TICKS} ticks`);
  const t0 = Date.now();

  let resolveFreshJobs;
  const freshJobsReady = new Promise((res) => { resolveFreshJobs = res; });
  let maturedAt = null;
  let producerMaturitySnapshot = null;

  const producerPromise = runWorker(
    { seed: PRODUCER_SEED, ticks: MATURATION_TICKS + COUPLE_TICKS, sample: SAMPLE, isolate: false, channel: PRODUCER_CHANNEL, index: INDEX, maturationTicks: MATURATION_TICKS, role: 'producer' },
    (m) => {
      if (m.matured && !maturedAt) {
        maturedAt = Date.now();
        producerMaturitySnapshot = m.snapshotAtMaturation;
        console.error(`[asym] producer matured after ${((maturedAt - t0) / 1000).toFixed(0)}s wall — snapshot: N=${m.snapshotAtMaturation.N} meanAmp=${m.snapshotAtMaturation.meanAmp} occupiedKinds=${m.snapshotAtMaturation.occupiedKinds} — spawning fresh cohort`);
        const jobs = [];
        for (const seed of FRESH_SEEDS) {
          jobs.push({ seed, arm: 'coupled', p: runWorker({ seed, ticks: COUPLE_TICKS, sample: SAMPLE, isolate: false, channel: PRODUCER_CHANNEL, index: INDEX, role: 'fresh-coupled' }) });
          jobs.push({ seed, arm: 'isolated', p: runWorker({ seed, ticks: COUPLE_TICKS, sample: SAMPLE, isolate: true, channel: 'exp-asym-isolated-' + seed, index: INDEX, role: 'fresh-isolated' }) });
        }
        resolveFreshJobs(jobs);
      }
    }
  );

  const jobs = await freshJobsReady;
  const freshSettled = await Promise.all(jobs.map(j => j.p));
  const producerResult = await producerPromise;
  const tDone = Date.now();

  const freshResults = freshSettled.map((r, i) => {
    const s = r.series || [];
    const last = s[s.length - 1] || {};
    return {
      arm: jobs[i].arm, seed: jobs[i].seed,
      bootErr: r.bootErr || null,
      loopErrors: r.loopErrors || 0, driverErr: r.driverErr || 0,
      meanAmp_late: +lateMean(s, 'meanAmp').toFixed(4),
      diversityHbits_late: +lateMean(s, 'diversityHbits').toFixed(3),
      diversityEvenness_late: +lateMean(s, 'diversityEvenness').toFixed(3),
      occupiedKinds_late: +lateMean(s, 'occupiedKinds').toFixed(2),
      N_late: +lateMean(s, 'N').toFixed(1),
      cpl_final: last.cpl || null
    };
  });

  const pairedDelta = (key) => FRESH_SEEDS.map(seed => {
    const c = freshResults.find(r => r.arm === 'coupled' && r.seed === seed);
    const i = freshResults.find(r => r.arm === 'isolated' && r.seed === seed);
    return (c && i) ? +(c[key] - i[key]).toFixed(4) : null;
  }).filter(x => x !== null);

  function verdictFor(ds) {
    const m = mean(ds), s = sd(ds), pos = ds.filter(d => d > 0).length, maj = Math.ceil(2 * ds.length / 3);
    const beatsNoise = Math.abs(m) > s;
    let label = 'INCONCLUSIVE';
    if (beatsNoise && pos >= maj) label = 'COUPLED_HIGHER';
    else if (beatsNoise && (ds.length - pos) >= maj) label = 'COUPLED_LOWER';
    else if (Math.abs(m) <= s) label = 'NO_EFFECT';
    return { mean: +m.toFixed(4), sd: +s.toFixed(4), perSeed: ds, positiveInSeeds: pos + '/' + ds.length, VERDICT: label };
  }

  const freshCoupled = freshResults.filter(r => r.arm === 'coupled');
  const freshIsolated = freshResults.filter(r => r.arm === 'isolated');
  const producerSeries = producerResult.series || [];
  const producerFinal = producerSeries[producerSeries.length - 1] || {};
  // A fresh instance's OWN tick-0 sample is the fair "young" baseline to compare the producer's
  // maturity snapshot against — same seed family/engine, just no time on the clock yet.
  const freshBaselineAtBoot = freshSettled[0] && freshSettled[0].series && freshSettled[0].series[0];

  const couplingSanity = {
    freshCoupled_sawExternalPeer: freshCoupled.filter(r => r.cpl_final && r.cpl_final.externalPeers > 0).length + '/' + freshCoupled.length,
    freshIsolated_sawExternalPeer: freshIsolated.filter(r => r.cpl_final && r.cpl_final.externalPeers > 0).length + '/' + freshIsolated.length,
    freshIsolated_absorbedAnything: freshIsolated.filter(r => r.cpl_final && r.cpl_final.absorb > 0).length + '/' + freshIsolated.length,
    producer_finalExternalPeers: producerFinal.cpl ? producerFinal.cpl.externalPeers : null,
    note: 'freshCoupled should be >0/N (heard the producer); freshIsolated should be 0/N on both. producer_finalExternalPeers>0 confirms it actually heard the fresh cohort join, not just broadcast into silence.'
  };

  console.log(JSON.stringify({
    config: { PRODUCER_SEED, MATURATION_TICKS, COUPLE_TICKS, FRESH_SEEDS, SAMPLE },
    timing_ms: { wall: tDone - t0, toMaturation: maturedAt ? maturedAt - t0 : null },
    producerProfile: {
      freshBaselineAtBoot: freshBaselineAtBoot ? { N: freshBaselineAtBoot.N, meanAmp: freshBaselineAtBoot.meanAmp, occupiedKinds: freshBaselineAtBoot.occupiedKinds, diversityHbits: freshBaselineAtBoot.diversityHbits } : null,
      atMaturation: producerMaturitySnapshot ? { N: producerMaturitySnapshot.N, meanAmp: producerMaturitySnapshot.meanAmp, occupiedKinds: producerMaturitySnapshot.occupiedKinds, diversityHbits: producerMaturitySnapshot.diversityHbits } : null,
      atEndOfCouplingPhase: { N: producerFinal.N, meanAmp: producerFinal.meanAmp, occupiedKinds: producerFinal.occupiedKinds, diversityHbits: producerFinal.diversityHbits }
    },
    couplingSanity,
    verdict: {
      meanAmp: verdictFor(pairedDelta('meanAmp_late')),
      diversityHbits: verdictFor(pairedDelta('diversityHbits_late')),
      diversityEvenness: verdictFor(pairedDelta('diversityEvenness_late')),
      occupiedKinds: verdictFor(pairedDelta('occupiedKinds_late'))
    },
    note: 'delta = fresh-coupled - fresh-isolated (matched seed pairs), late-window means over the COUPLE_TICKS phase only. COUPLED_HIGHER/LOWER = the asymmetric coupling (mature producer -> fresh peers) has a robust causal effect. Compare against swing #45 (symmetric): if this flips NO_EFFECT/LOWER into HIGHER, the asymmetry is what matters, not coupling per se.',
    freshResults,
    producerFinalSample: producerFinal
  }, null, 1));
})().catch(e => { console.error('ASYM COUPLING HARNESS FAILED:', e.message, e.stack); process.exit(1); });
