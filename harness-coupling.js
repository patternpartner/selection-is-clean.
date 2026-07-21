// CAUSAL NETWORK-COUPLING TEST — does real inter-universe BroadcastChannel coupling change a
// cohort's diversity/fitness trajectory, or is the trophic differentiation seen in live exports
// (OEE-NOTES: "COHORT (8 live exports...) — trophic division of labour") confounded by age/pop-size,
// as the notes flag ("no no-network control proves old→young flow CAUSES the young diversity")?
//
// Every prior closed-harness run (harness.js/-oee/-ab/-ablate*) stubs BroadcastChannel to a no-op,
// so they have ALWAYS run with coupling off — none of them could speak to this question. This harness
// runs a real cohort of universes, each in its own worker thread (own V8 isolate — real isolation,
// full native speed, unlike a vm-context sandbox which turned out ~4x slower per tick), using Node's
// REAL BroadcastChannel (which natively multicasts by channel name across worker threads in the same
// process — verified directly before building this) as the coupling wire. Two arms, matched seeds:
//   COUPLED  — N workers share one channel name; messages actually cross between them.
//   ISOLATED — same N seeds, same code path, same per-tick cost (the network layer still runs and
//              still broadcasts every tick) but each worker's BroadcastChannel constructor is remapped
//              to a private channel name, so no peer message ever arrives. The strength-matched
//              "unplugged" control the live 8-body cohort never had.
// If COUPLED cohorts diverge from their ISOLATED twins, coupling is causal. If not, the live cohort's
// producer/consumer read was likely structure that would have appeared from age/size alone.
//
// Env: SEEDS (comma list, matched pairs — default 11,13,17)  TICKS (default 15000)
//      SAMPLE (ticks between samples, default 500)  INDEX (path to index.html, default ./index.html)
const path = require('path');
const { Worker } = require('worker_threads');

const SEEDS = (process.env.SEEDS || '11,13,17').split(',').map(s => parseInt(s.trim(), 10));
const TICKS = parseInt(process.env.TICKS || '15000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '500', 10);
const INDEX = process.env.INDEX || path.join(__dirname, 'index.html');
const WORKER = path.join(__dirname, 'harness-coupling-worker.js');

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const w = new Worker(WORKER, { workerData });
    let result = null;
    w.on('message', (m) => { result = m; });
    w.on('error', reject);
    w.on('exit', (code) => {
      if (result) resolve(result);
      else reject(new Error(`worker exited (code ${code}) with no result — seed=${workerData.seed} isolate=${workerData.isolate}`));
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
  console.error(`[coupling] ${SEEDS.length} matched seeds x 2 arms = ${SEEDS.length * 2} workers, ${TICKS} ticks, sample every ${SAMPLE}`);
  const t0 = Date.now();

  const jobs = [];
  for (const seed of SEEDS) {
    jobs.push({ seed, arm: 'coupled', p: runWorker({ seed, ticks: TICKS, sample: SAMPLE, isolate: false, channel: 'exp-coupled', index: INDEX }) });
    jobs.push({ seed, arm: 'isolated', p: runWorker({ seed, ticks: TICKS, sample: SAMPLE, isolate: true, channel: 'exp-isolated-' + seed, index: INDEX }) });
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
      meanAmp_late: +lateMean(s, 'meanAmp').toFixed(4),
      diversityHbits_late: +lateMean(s, 'diversityHbits').toFixed(3),
      diversityEvenness_late: +lateMean(s, 'diversityEvenness').toFixed(3),
      occupiedKinds_late: +lateMean(s, 'occupiedKinds').toFixed(2),
      N_late: +lateMean(s, 'N').toFixed(1),
      cpl_final: last.cpl || null
    };
  });

  const pairedDelta = (key) => SEEDS.map(seed => {
    const c = results.find(r => r.arm === 'coupled' && r.seed === seed);
    const i = results.find(r => r.arm === 'isolated' && r.seed === seed);
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

  const coupled = results.filter(r => r.arm === 'coupled');
  const isolated = results.filter(r => r.arm === 'isolated');
  const couplingSanity = {
    coupled_sawExternalPeer: coupled.filter(r => r.cpl_final && r.cpl_final.externalPeers > 0).length + '/' + coupled.length,
    isolated_sawExternalPeer: isolated.filter(r => r.cpl_final && r.cpl_final.externalPeers > 0).length + '/' + isolated.length,
    isolated_absorbedAnything: isolated.filter(r => r.cpl_final && r.cpl_final.absorb > 0).length + '/' + isolated.length,
    note: 'externalPeers excludes the metab collector\'s own self-loop (its "ch" hears its own "bc"). coupled should be >0/N; isolated should be 0/N for both externalPeers and absorb (absorb only fires via handleNetworkMessage, which already filters out self — the sim-state-level proof isolation is real).'
  };

  console.log(JSON.stringify({
    config: { SEEDS, TICKS, SAMPLE },
    timing_ms: { wall: tDone - t0 },
    couplingSanity,
    verdict: {
      meanAmp: verdictFor(pairedDelta('meanAmp_late')),
      diversityHbits: verdictFor(pairedDelta('diversityHbits_late')),
      diversityEvenness: verdictFor(pairedDelta('diversityEvenness_late')),
      occupiedKinds: verdictFor(pairedDelta('occupiedKinds_late'))
    },
    note: 'delta = coupled - isolated (matched seed pairs). COUPLED_HIGHER/LOWER = coupling has a robust causal effect. NO_EFFECT = coupling made no measurable difference on this axis in this run. INCONCLUSIVE = mixed/noisy.',
    results
  }, null, 1));
})().catch(e => { console.error('COUPLING HARNESS FAILED:', e.message); process.exit(1); });
