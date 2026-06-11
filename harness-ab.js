// A/B experiment harness: OEE metrics + tunable dynamics knobs patched non-destructively.
//   CAP_K     override native INTERACTION_CAP (unset = native; "inf" = uncapped).
//   NFD_MULT  multiplier on NFD_STRENGTH (default 1).
//   MUT_INTERVAL  initial genome.mutationInterval (default native 300). Shorten to give
//                 the genome-authoring tier (atoms/opcodes/objWeights) MORE trials.
//   AUTHOR_MULT   multiplier on the atom-birth and bound-opcode authoring probabilities
//                 (default 1), to favour authoring specifically over other mutations.
// All default to behavior identical to stock index.html (verified inert-at-defaults).
//
// Original header follows:
// Open-endedness metrics harness for index.html.
//
// Drives the sim headless (same DOM/timer stubs as harness.js) but, instead of
// just sampling population, computes metrics that bear on the actual question:
// is this OPEN-ENDED evolution, or a random walk in elaborate clothing?
//
// Four families, each labelled by what it can and cannot prove:
//   DIVERSITY  (standing) — how varied the world is right now.
//   NOVELTY    (cumulative) — is the system still discovering kinds it has
//              never produced before, or has discovery plateaued?
//   COMPLEXITY (structural) — are the system's own building blocks growing
//              (VM length, distinct opcodes in use, live authored atoms,
//              bound opcodes, dimensionality, lineage depth)?
//   TURNOVER   (drift signal) — are dominant kinds being replaced over time,
//              or is the world frozen?
//
// Honesty note: NOVELTY-still-rising is necessary but NOT sufficient for
// open-endedness — neutral drift also produces novelty. The decisive test is
// whether novelty is ADAPTIVE (selected, load-bearing), which needs ablation
// (planned next: harness-ablate.js). This harness measures the necessary
// conditions and flags when they fail, so we never mistake drift for evolution.
//
// Env:  TICKS (default 20000)  SAMPLE (ticks between samples, default 500)
//       SEED  (optional: seeded RNG + deterministic clock for exact replay)
//       INDEX (optional: path to the html file to load)
//       JSONL=1  (stream one metrics object per sample to stdout)
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '500', 10);
const STREAM = !!process.env.JSONL;

// ── Browser API stubs (identical to harness.js) ───────────────────
function selfProxy() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === 'width' || prop === 'height') return 0;
      if (prop === 'data') return new Uint8ClampedArray(4);
      return p;
    },
    apply() { return p; }
  });
  return p;
}
const CTX = selfProxy();
function makeEl() {
  return {
    getContext: () => CTX,
    addEventListener() {}, removeEventListener() {},
    set onclick(_) {}, set onchange(_) {}, click() {},
    style: {}, width: 1280, height: 720, _text: '',
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; }
  };
}
const ELS = {};
globalThis.document = {
  getElementById: (id) => (ELS[id] || (ELS[id] = makeEl())),
  createElement: () => makeEl(),
  addEventListener() {}, removeEventListener() {},
  get hidden() { return false; }
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.location = { hash: '', pathname: '/', search: '', href: 'http://x/' };
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4, wakeLock: null };
globalThis.BroadcastChannel = class { constructor() {} postMessage() {} addEventListener() {} close() {} set onmessage(_) {} };
globalThis.fetch = () => new Promise(() => {});
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;

// Clock: real by default; deterministic when SEED is set (so time-budget gates
// fire identically across runs and metrics are exactly reproducible).
const _epoch = Date.now();
globalThis.__detMs = 0;
globalThis.performance = process.env.SEED
  ? { now: () => globalThis.__detMs }
  : { now: () => Date.now() - _epoch };
if (process.env.SEED) {
  let a = (parseInt(process.env.SEED, 10) | 0) >>> 0;
  Math.random = function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

let loopErrors = 0, lastErr = '';
console.error = (...a) => { const s = a.join(' '); if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); } };
console.warn = () => {};

const html = fs.readFileSync(process.env.INDEX || (__dirname + '/index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
// ── A/B knobs ─────────────────────────────────────────────────────
if (process.env.CAP_K) globalThis.__CAP_K = (process.env.CAP_K === 'inf' ? 1e9 : parseInt(process.env.CAP_K, 10));
globalThis.__NFD_MULT = process.env.NFD_MULT ? parseFloat(process.env.NFD_MULT) : 1;
if (process.env.MUT_INTERVAL) globalThis.__MUT_INTERVAL = parseInt(process.env.MUT_INTERVAL, 10);
globalThis.__AUTHOR_MULT = process.env.AUTHOR_MULT ? parseFloat(process.env.AUTHOR_MULT) : 1;
let _code = code;
function _patch(find, repl) {
  if (_code.indexOf(find) === -1) { console.error('AB PATCH MISS:', find.slice(0, 60)); process.exit(2); }
  _code = _code.replace(find, repl);
}
// NFD strength multiplier (cap is native; not patched).
_patch('amp[_i]+=NFD_STRENGTH*', 'amp[_i]+=NFD_STRENGTH*globalThis.__NFD_MULT*');
// Initial mutation interval override (still evolvable from there).
_patch('mutationInterval:300,', 'mutationInterval:(globalThis.__MUT_INTERVAL||300),');
// Authoring-rate multipliers: atom birth + bound-opcode creation.
_patch('if(Math.random()<rate*0.15){', 'if(Math.random()<rate*0.15*globalThis.__AUTHOR_MULT){');
_patch('if(Math.random()<0.01){', 'if(Math.random()<0.01*globalThis.__AUTHOR_MULT){');


// ── Metrics driver (runs in module scope → sees all sim globals) ──
const driver = `
;(function(){
  const STREAM=${STREAM};
  // Cumulative discovery sets (novelty): kinds the system has EVER produced.
  const seenBins=new Set();      // tendency-space cells ever occupied
  const seenMotifs=new Set();    // remembered cultural motifs ever seen
  let births=0;                  // high-water lineage-registry size = BIRTH THROUGHPUT,
                                 // NOT novelty (it rises with every birth regardless of
                                 // whether anything new appears). Reported, never trusted as OEE.
  let prevBins=new Set();        // last sample's occupied bins (for churn)

  // Coarsen a tendency vector to a discrete cell. Reuse the sim's own tendBin
  // if present (keeps our bins identical to the NFD bins); else replicate.
  function binOf(i){
    if(typeof tendBin==='function'){ try{return tendBin(i);}catch(e){} }
    const b=i*DIMS; let r=0;
    for(let d=0;d<3&&d<DIMS;d++){ let q=((tend[b+d]+1.2)/2.4*4)|0; q=q<0?0:q>3?3:q; r=r*4+q; }
    return r;
  }
  function shannon(counts){
    let tot=0; for(const k in counts)tot+=counts[k];
    if(tot<=0)return 0; let h=0;
    for(const k in counts){ const p=counts[k]/tot; if(p>0)h-=p*Math.log2(p); }
    return h; // bits
  }

  function metrics(){
    // ---- standing diversity ----
    const binCounts={}, casteSet=new Set();
    let alive=0, ampSum=0;
    const curBins=new Set();
    for(let i=0;i<N;i++){
      if(!palive[i])continue;
      alive++; ampSum+=amp[i];
      const b=binOf(i); binCounts[b]=(binCounts[b]||0)+1; curBins.add(b); seenBins.add(b);
      if(typeof pType!=='undefined') casteSet.add(pType[i]&7);
    }
    const occupied=Object.keys(binCounts).length;
    const Hbits=shannon(binCounts);
    const Hnorm=occupied>1?Hbits/Math.log2(occupied):0; // 0..1: evenness across occupied kinds

    // ---- novelty (cumulative + per-window new) ----
    let newBins=0; for(const b of curBins) if(!prevBins.has(b)) newBins++;
    // churn = fraction of last sample's kinds no longer dominant-present now
    let lost=0; for(const b of prevBins) if(!curBins.has(b)) lost++;
    const churn=prevBins.size>0?lost/prevBins.size:0;
    prevBins=curBins;

    let motifNew=0;
    if(typeof genome!=='undefined'&&Array.isArray(genome.stableMotifs)){
      for(const m of genome.stableMotifs){
        if(!m||!m.t)continue;
        const sig=m.t.map(x=>Math.round(x*5)).join(',');
        if(!seenMotifs.has(sig)){seenMotifs.add(sig);motifNew++;}
      }
    }
    if(typeof lineageRegistry!=='undefined'&&lineageRegistry.size>births) births=lineageRegistry.size;

    // ---- complexity (the system's own building blocks) ----
    const G=(typeof genome!=='undefined')?genome:{};
    const vmLen=Array.isArray(G.vmProgram)?G.vmProgram.length:0;
    const opSet=new Set(); if(Array.isArray(G.vmProgram))for(const ins of G.vmProgram)opSet.add(ins[0]|0);
    const liveAtoms=Array.isArray(G.userAtoms)?G.userAtoms.filter(a=>a&&(a.uses|0)>0).length:0;
    const totAtoms=Array.isArray(G.userAtoms)?G.userAtoms.length:0;
    const boundOps=Array.isArray(G.boundOpcodes)?G.boundOpcodes.length:0;
    const fitSensors=Array.isArray(G.fitnessSensors)?G.fitnessSensors.length:0;

    return {
      tick:(typeof tick!=='undefined')?tick:-1,
      N:alive,
      meanAmp:+(alive?ampSum/alive:0).toFixed(3),
      // diversity
      occupiedKinds:occupied,
      diversityHbits:+Hbits.toFixed(3),
      diversityEvenness:+Hnorm.toFixed(3),
      clusters:(typeof clusters!=='undefined')?clusters.length:-1,
      castes:casteSet.size,
      // novelty
      cumKinds:seenBins.size,
      newKinds:newBins,
      cumMotifs:seenMotifs.size,
      births:births, // throughput, not novelty (see decl) — diagnostic only
      // complexity
      vmLen, vmDistinctOps:opSet.size, liveAtoms, totAtoms, boundOps,
      DIMS:(typeof DIMS!=='undefined')?DIMS:-1, fitSensors,
      generation:(G.generation|0), extinctions:(G.extinctions|0),
      // turnover
      kindChurn:+churn.toFixed(3)
    };
  }

  globalThis.__SERIES=[];
  globalThis.__runOEE=function(ticks,every){
    let m=metrics(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+String.fromCharCode(10));
    for(let s=0;s<ticks;s++){
      globalThis.__detMs+=5;
      try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;}
      if((s+1)%every===0){ m=metrics(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+String.fromCharCode(10)); }
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/oee-sim.js');
m.filename = __dirname + '/oee-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

const t0 = Date.now();
try { m._compile(_code + driver, m.filename); }
catch (e) { console.log('COMPILE/BOOT THREW:', e.message); process.exit(1); }
const tBoot = Date.now();

globalThis.__runOEE(TICKS, SAMPLE);
const tDone = Date.now();

const S = globalThis.__SERIES;

// ── Trajectory verdicts: is novelty still being produced, or saturating? ──
// Compare the rate of NEW kinds discovered in the first third vs the last third
// of the run. A healthy open-ended system keeps the late rate well above zero;
// a system that has exhausted its search has a late rate near zero.
function windowNewRate(series, lo, hi) {
  if (hi - lo < 1) return 0;
  let sumNew = 0, dt = 0;
  for (let i = lo + 1; i <= hi && i < series.length; i++) {
    sumNew += series[i].newKinds;
    dt += (series[i].tick - series[i - 1].tick);
  }
  return dt > 0 ? sumNew / dt * 1000 : 0; // new kinds per 1000 ticks
}
const n = S.length;
const earlyRate = windowNewRate(S, 0, Math.floor(n / 3));
const lateRate = windowNewRate(S, Math.floor(2 * n / 3), n - 1);
const last = S[n - 1] || {};
const first = S[0] || {};

// Least-squares slope of a field over sample index → trend, robust to a single
// endpoint landing on an oscillation peak (the +4 vmLen artifact in the first run).
function slope(series, key) {
  const m = series.length;
  if (m < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < m; i++) { const x = i, y = series[i][key] || 0; sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const d = m * sxx - sx * sx;
  return d ? (m * sxy - sx * sy) / d : 0; // units of field per sample
}
function thirdMean(series, key, lo, hi) {
  let s = 0, c = 0; for (let i = lo; i < hi && i < series.length; i++) { s += series[i][key] || 0; c++; } return c ? s / c : 0;
}
const t1 = Math.floor(n / 3), t2 = Math.floor(2 * n / 3);

// Complexity: trend (slope per sample), not endpoint delta. endpointDelta kept but
// labelled as endpoint-sensitive so it's never read as a ratchet on its own.
const complexity = {
  vmLen_slopePerSample: +slope(S, 'vmLen').toFixed(4),
  vmLen_endpointDelta: (last.vmLen || 0) - (first.vmLen || 0),
  distinctOps_slopePerSample: +slope(S, 'vmDistinctOps').toFixed(4),
  liveAtoms_max: Math.max(...S.map(r => r.liveAtoms || 0)),
  totAtoms_max: Math.max(...S.map(r => r.totAtoms || 0)),
  boundOps_max: Math.max(...S.map(r => r.boundOps || 0)),
  DIMS_delta: (last.DIMS || 0) - (first.DIMS || 0),
  generation_delta: (last.generation || 0) - (first.generation || 0)
};
// A real ratchet shows a slope clearly above the noise of its oscillation.
const vmStd = (() => { const mu = thirdMean(S, 'vmLen', 0, n); let v = 0; for (const r of S) v += ((r.vmLen || 0) - mu) ** 2; return Math.sqrt(v / Math.max(1, n)); })();
complexity.vmLen_ratchets = complexity.vmLen_slopePerSample * n > vmStd; // total rise exceeds one std of the wobble

// Diversity trend: is the world holding variety or collapsing toward monoculture?
const diversity = {
  evenness_early: +thirdMean(S, 'diversityEvenness', 0, t1).toFixed(3),
  evenness_late: +thirdMean(S, 'diversityEvenness', t2, n).toFixed(3),
  kinds_early: +thirdMean(S, 'occupiedKinds', 0, t1).toFixed(1),
  kinds_late: +thirdMean(S, 'occupiedKinds', t2, n).toFixed(1),
  entropyBits_early: +thirdMean(S, 'diversityHbits', 0, t1).toFixed(2),
  entropyBits_late: +thirdMean(S, 'diversityHbits', t2, n).toFixed(2),
  clusters_early: +thirdMean(S, 'clusters', 0, t1).toFixed(1),
  clusters_late: +thirdMean(S, 'clusters', t2, n).toFixed(1)
};
// Collapse keyed on ENTROPY (bits), which is resolution-independent — unlike the
// occupied-kinds count, which is capped by the coarse 64-cell binning and gave false
// positives (a world holding even diversity across few-but-balanced kinds read as
// "collapsing"). A >=30% entropy loss early->late is the collapse signal; kinds ratio
// kept as a secondary diagnostic.
diversity.entropyRatio = diversity.entropyBits_early > 0 ? +(diversity.entropyBits_late / diversity.entropyBits_early).toFixed(2) : null;
diversity.kindsRatio = diversity.kinds_early > 0 ? +(diversity.kinds_late / diversity.kinds_early).toFixed(2) : null;
diversity.collapsing = diversity.entropyRatio !== null && diversity.entropyRatio < 0.7;

const verdict = {
  novelty_late_vs_early: { earlyNewKindsPer1k: +earlyRate.toFixed(2), lateNewKindsPer1k: +lateRate.toFixed(2),
    decayedTo: earlyRate > 0 ? +(lateRate / earlyRate).toFixed(2) : null, stillProducing: lateRate > 0.05 },
  diversity_trend: diversity,
  complexity_trend: complexity,
  complexity_topTierEngaged: (complexity.liveAtoms_max > 0 || complexity.boundOps_max > 0 || complexity.DIMS_delta > 0),
  notes: [
    'novelty.stillProducing is NECESSARY, not sufficient: neutral drift also makes new kinds.',
    'diversity.collapsing=true means the world is losing variety over time (monoculture pull winning).',
    'complexity.vmLen_ratchets distinguishes real growth from an oscillation that happened to end high.',
    'topTierEngaged=false means the self-authoring machinery never became load-bearing (atoms born but liveAtoms=0 still counts as dormant).',
    'Decisive adaptiveness test (does novelty get SELECTED) requires ablation — next harness.'
  ]
};

console.log(JSON.stringify({
  config: { TICKS, SAMPLE, SEED: process.env.SEED || null, INDEX: process.env.INDEX || 'index.html', CAP_K: (globalThis.__CAP_K!==undefined?globalThis.__CAP_K:'native'), NFD_MULT: globalThis.__NFD_MULT, MUT_INTERVAL: (globalThis.__MUT_INTERVAL||'native'), AUTHOR_MULT: globalThis.__AUTHOR_MULT },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  verdict,
  series: STREAM ? '(streamed as JSONL above)' : S
}, null, 1));
