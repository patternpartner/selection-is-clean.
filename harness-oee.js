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

// ── Metrics driver (runs in module scope → sees all sim globals) ──
const driver = `
;(function(){
  const STREAM=${STREAM};
  // Cumulative discovery sets (novelty): kinds the system has EVER produced.
  const seenBins=new Set();      // tendency-space cells ever occupied
  const seenMotifs=new Set();    // remembered cultural motifs ever seen
  let cumLineages=0;             // high-water mark of lineage registry size
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
    if(typeof lineageRegistry!=='undefined'&&lineageRegistry.size>cumLineages) cumLineages=lineageRegistry.size;

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
      cumLineages:cumLineages,
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
try { m._compile(code + driver, m.filename); }
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

const complexityGrew = {
  vmLen: (last.vmLen || 0) - (first.vmLen || 0),
  liveAtoms: (last.liveAtoms || 0) - (first.liveAtoms || 0),
  boundOps: (last.boundOps || 0) - (first.boundOps || 0),
  DIMS: (last.DIMS || 0) - (first.DIMS || 0),
  distinctOps: (last.vmDistinctOps || 0) - (first.vmDistinctOps || 0),
  generation: (last.generation || 0) - (first.generation || 0)
};
// Mean standing diversity over the run (evenness 0..1).
const meanEven = n ? +(S.reduce((a, r) => a + r.diversityEvenness, 0) / n).toFixed(3) : 0;
const meanKinds = n ? +(S.reduce((a, r) => a + r.occupiedKinds, 0) / n).toFixed(1) : 0;

const verdict = {
  novelty_late_vs_early: { earlyNewKindsPer1k: +earlyRate.toFixed(2), lateNewKindsPer1k: +lateRate.toFixed(2),
    stillProducing: lateRate > 0.05, ratio: earlyRate > 0 ? +(lateRate / earlyRate).toFixed(2) : null },
  diversity_mean: { evenness: meanEven, occupiedKinds: meanKinds },
  complexity_delta: complexityGrew,
  complexity_topTierEngaged: (complexityGrew.liveAtoms > 0 || complexityGrew.boundOps > 0 || complexityGrew.DIMS > 0),
  notes: [
    'novelty.stillProducing is NECESSARY, not sufficient: neutral drift also makes new kinds.',
    'topTierEngaged=false means the self-authoring machinery never populated — the open-ended layer is dormant.',
    'Decisive adaptiveness test (does novelty get SELECTED) requires ablation — next harness.'
  ]
};

console.log(JSON.stringify({
  config: { TICKS, SAMPLE, SEED: process.env.SEED || null, INDEX: process.env.INDEX || 'index.html' },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  verdict,
  series: STREAM ? '(streamed as JSONL above)' : S
}, null, 1));
