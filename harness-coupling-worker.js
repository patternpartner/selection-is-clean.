// Worker body for harness-coupling.js. One worker = one universe instance, own V8 isolate (own
// Math/globals — true isolation, no vm-context perf penalty). Runs headless exactly like harness.js
// (same DOM/timer stubs) with ONE deliberate difference: BroadcastChannel is NOT stubbed to a no-op.
// Node's real BroadcastChannel multicasts by name across worker threads in the same process — that
// IS the coupling wire for this experiment. `isolate:true` remaps whatever name the sim asks for to
// a private per-worker name so the network code still runs (same cost) but never reaches a peer.
const { workerData, parentPort } = require('worker_threads');
const fs = require('fs');

const { seed, ticks, sample, isolate, index, channel, maturationTicks, role, alienSelect } = workerData;

// ── Browser API stubs (mirrors harness.js, incl. the document.head/body/classList fix) ──
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
    appendChild() {}, removeChild() {}, remove() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
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
  head: makeEl(), body: makeEl(),
  get hidden() { return false; }
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.location = { hash: '', pathname: '/', search: '', href: 'http://x/' };
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4, wakeLock: null };
globalThis.fetch = () => new Promise(() => {});
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;

// Deterministic clock + seeded RNG (harness-oee.js's algorithm) — reproducible per matched seed.
globalThis.__detMs = 0;
globalThis.performance = { now: () => globalThis.__detMs };
(function () {
  let a = (seed | 0) >>> 0;
  Math.random = function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
})();

// The sim's own self-drive (requestAnimationFrame path, since document.hidden is always false here)
// must stay dead so only OUR chunked stepping advances ticks. setInterval is left REAL: it's the
// metabolism collector's only clock, and letting it fire natively (via the setImmediate yields
// below) is what lets genome.coupling actually accumulate real cross-worker traffic during the run.
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};

// Real BroadcastChannel stays real for the coupled arm (channel name passed through unmodified).
// For the isolated arm, force every channel this worker opens onto a private name so the network
// code path (send/receive machinery, per-tick cost) is identical but no peer message ever arrives.
if (isolate) {
  const RealBC = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = class extends RealBC {
    constructor(_name) { super(channel); }
  };
}

// SWING #46 (ALIEN GRIP) is default-on in the sim itself; pass alienSelect:0 in workerData to run
// this instance with it off (pre-#46 behaviour) for an A/B under real coupling.
if (alienSelect !== undefined) globalThis.__ALIEN_SELECT = alienSelect | 0;

let loopErrors = 0, lastErr = '';
const _err = console.error.bind(console);
console.error = (...a) => {
  const s = a.join(' ');
  if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); }
};
console.warn = () => {};

const html = fs.readFileSync(index, 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

const driver = `
;(function(){
  function __binOf(i){
    if(typeof tendBin==='function'){ try{return tendBin(i);}catch(e){} }
    const b=i*DIMS; let r=0;
    for(let d=0;d<3&&d<DIMS;d++){ let q=((tend[b+d]+1.2)/2.4*4)|0; q=q<0?0:q>3?3:q; r=r*4+q; }
    return r;
  }
  function __shannon(counts){
    let tot=0; for(const k in counts)tot+=counts[k];
    if(tot<=0)return 0; let h=0;
    for(const k in counts){ const p=counts[k]/tot; if(p>0)h-=p*Math.log2(p); }
    return h;
  }
  globalThis.__sample=function(){
    const binCounts={}; let alive=0, ampSum=0;
    for(let i=0;i<N;i++){
      if(!palive[i])continue;
      alive++; ampSum+=amp[i];
      const b=__binOf(i); binCounts[b]=(binCounts[b]||0)+1;
    }
    const occupied=Object.keys(binCounts).length;
    const Hbits=__shannon(binCounts);
    const Hnorm=occupied>1?Hbits/Math.log2(occupied):0;
    let cpl=null;
    if(typeof genome!=='undefined'&&genome.coupling){
      // externalPeers excludes 'self' — the metab collector's own 'ch' hears this worker's own
      // 'bc' emissions by design (real BroadcastChannel semantics: a second channel object hears
      // everything except messages IT sent), so a self entry shows up even fully isolated. Only
      // an id OTHER than genome.coupling.self is evidence a real peer's packet was heard.
      const c=genome.coupling; let emit=0,absorb=0,extPeers=0;
      for(const id in (c.peers||{})){
        const p=c.peers[id];
        for(const k in (p.emit||{}))emit+=p.emit[k];
        for(const k in (p.absorb||{}))absorb+=p.absorb[k];
        if(id!==c.self)extPeers++;
      }
      cpl={buds:c.buds||0, liveCount:c.liveCount||0, peers:Object.keys(c.peers||{}).length, externalPeers:extPeers, emit, absorb};
    }
    // SWING #46 (ALIEN GRIP) instrumentation: aggregate + best-atom alien-prediction accuracy, so a
    // coupling run can tell whether the new currency is even accumulating, separate from whether it's
    // shaping the bank (that's the mutation/cull protection, not observable from a sample alone).
    let alien=null;
    if(typeof genome!=='undefined'&&genome.alienPredict){
      const ap=genome.alienPredict;
      let bestGrip=0,bestAttempts=0,gripped=0;
      if(Array.isArray(genome.userAtoms)){
        for(const a of genome.userAtoms){
          const att=a&&(a.alienAttempts|0)||0;
          if(att<6)continue; // mirror ALIEN_GRIP_MIN_ATTEMPTS — atoms below the sample floor don't count as "gripped" here either
          gripped++;
          const grip=(a.alienHits|0)/att;
          if(grip>bestGrip||(grip===bestGrip&&att>bestAttempts)){bestGrip=grip;bestAttempts=att;}
        }
      }
      alien={attempts:ap.attempts|0, hits:ap.hits|0, grippedAtoms:gripped, bestAtomGrip:+bestGrip.toFixed(3), bestAtomAttempts:bestAttempts};
    }
    // Bank composition/survival — the direct behavioural signature of ALIEN GRIP actually protecting
    // atoms, independent of the alien bookkeeping itself: does __ALIEN_SELECT change how OLD the bank's
    // atoms get before being overwritten, not just whether grip stats exist.
    let bank=null;
    if(typeof genome!=='undefined'&&Array.isArray(genome.userAtoms)){
      const ua=genome.userAtoms;
      let ageSum=0,live=0;
      for(const a of ua){ ageSum+=(a&&(a.age|0))||0; if(a&&(a.uses|0)>0)live++; }
      bank={totAtoms:ua.length, boundOps:Array.isArray(genome.boundOpcodes)?genome.boundOpcodes.length:0,
        liveAtoms:live, meanAtomAge:+(ua.length?ageSum/ua.length:0).toFixed(2)};
    }
    return {
      tick:(typeof tick!=='undefined')?tick:-1,
      N:alive, meanAmp:+(alive?ampSum/alive:0).toFixed(4),
      occupiedKinds:occupied, diversityHbits:+Hbits.toFixed(3), diversityEvenness:+Hnorm.toFixed(3),
      lineages:(typeof lineageRegistry!=='undefined'?lineageRegistry.size:-1),
      extinctions:(typeof genome!=='undefined'?(genome.extinctions||0):-1),
      cpl, alien, bank
    };
  };
  globalThis.__runChunk=function(n){
    for(let s=0;s<n;s++){
      globalThis.__detMs+=5;
      try{ loop(); }catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/harness-coupling-sim-' + seed + '-' + (isolate ? 'iso' : 'cpl') + '.js');
m.filename = __dirname + '/harness-coupling-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

let bootErr = null;
try {
  m._compile(code + driver, m.filename);
} catch (e) {
  bootErr = e.message;
}

(async () => {
  if (bootErr) {
    parentPort.postMessage({ seed, isolate, role, bootErr, series: [] });
    process.exit(0);
  }
  const CHUNK = 100;
  const series = [];
  series.push(globalThis.__sample());
  let done = 0;
  let maturedPosted = false;
  while (done < ticks) {
    const n = Math.min(CHUNK, ticks - done);
    globalThis.__runChunk(n);
    done += n;
    // Yield to the event loop so real setInterval (metab collector flush) and real cross-thread
    // BroadcastChannel deliveries actually get processed before the next chunk.
    await new Promise((res) => setImmediate(res));
    if (done % sample < CHUNK || done === ticks) series.push(globalThis.__sample());
    // Asymmetric-coupling checkpoint: a producer worker keeps running (channel already open, but
    // nobody else has joined it yet) past this point — this message is the orchestrator's signal
    // that maturation is done and it's safe to spawn fresh peers onto the same channel name.
    if (!maturedPosted && maturationTicks && done >= maturationTicks) {
      maturedPosted = true;
      parentPort.postMessage({ seed, isolate, role, matured: true, snapshotAtMaturation: globalThis.__sample() });
    }
  }
  parentPort.postMessage({
    seed, isolate, role,
    loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
    series
  });
  // The metab collector's real (unstubbed) setInterval keeps the event loop alive forever
  // otherwise — nothing ever clears it, so the worker would never exit on its own.
  process.exit(0);
})();
