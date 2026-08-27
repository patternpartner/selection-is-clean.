// Leaf worker for harness-ablate-reflex.js — one seed, one condition (intact/ablated), one process.
// Same DOM/timer stubs as harness.js/harness-oee.js. ABLATE_REFLEX=1 permanently closes the
// crw>0.001 gate at engine.html's ONE reflexThreat/reflexTrend->vmRegs[4]/[5] write site (verified
// unique against the current file before ever running this).
//
// #131 — MEASUREMENT NOW COMES FROM THE ENGINE, NOT FROM PATCHES. Every counter this rig used to
// text-inject was later promoted into engine.html itself, behind __REFLEX_DEBUG, under the same
// names: reflexDebugCounters.{ecvEntries,ecvNoCid,ecvNoCidx,ecvNoProg,ecvPassed,ucrCalls,
// ucrNewReflex,ucrWarmup,gateFires,gateThreatZero,gateTrendZero,sumAbsThreatAddend,
// sumAbsTrendAddend,sumAbsResidue4,sumAbsResidue5,nonzeroFirings,nonzeroFiringsReadable}.
// Two of the six needles had stopped matching as a result, so the rig refused to start — and the
// warmup patch had a worse failure waiting behind that one: it keyed on r.__warmed, the SAME flag
// the engine's native warmup counter sets, so whichever ran first would have silently starved the
// other and the rig would have reported a real-looking zero.
// What remains patched is only what is genuinely a MANIPULATION rather than a measurement: the
// ABLATE gate condition, ARM1's sample-bar and cadence changes, and the PERSIST_REFLEX carry.
// The counters are read from the engine's own object with REFLEX_DEBUG=1.
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '1000', 10);
const ABLATE = process.env.ABLATE_REFLEX === '1';
// ARM1 (Fable's design): does trend/cohesionTrend ever leave zero if given a fair chance to? Two
// independent fixes to the starvation found in the diagnostic run — lower the 3-sample history bar
// to 2, and quadruple the cadence that feeds it (tick%60 -> tick%15) — orthogonal to ABLATE_REFLEX,
// so all four combinations (arm1 x {open,severed}) run through the same leaf.
const ARM1 = process.env.ARM1 === '1';
// PERSIST_REFLEX: RETIRED (#131). This rig once patched in a reflex-persistence map because
// trackClusterPersistence() carried vmProgram/lineage forward across detection cycles but never
// .reflex, so sizeHistory/coherenceHistory could never exceed length 1 and the whole reflex signal
// was stillborn. That fix was adopted into engine.html as Swing #47 — `clusterReflexes`, declared at
// module scope, restored in trackClusterPersistence() and stored AFTER updateClusterReflex() updates
// it, which is exactly the timing this rig worked out. It is unconditional there, so the patch has
// nothing left to add and its needle no longer matches. The env var is accepted and ignored so any
// stored invocation keeps working; the flag below records that persistence is now always on.
const PERSIST_REFLEX = true; // native since Swing #47; no longer a treatment this rig can toggle

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
globalThis.BroadcastChannel = class { constructor() {} postMessage() {} addEventListener() {} close() {} set onmessage(_) {} };
globalThis.fetch = () => new Promise(() => {});
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;

globalThis.__detMs = 0;
globalThis.performance = { now: () => globalThis.__detMs };
if (process.env.SEED) {
  let a = (parseInt(process.env.SEED, 10) | 0) >>> 0;
  Math.random = function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

// #131: turn on the engine's own reflex instrumentation. __reflexDebugOn is a top-level const in
// engine.html, resolved when the script compiles, so this must be set BEFORE m._compile below.
globalThis.__REFLEX_DEBUG = 1;

let loopErrors = 0, lastErr = '';
console.error = (...a) => {
  const s = a.join(' ');
  if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); }
};
console.warn = () => {};

const INDEX = process.env.INDEX || (__dirname + '/engine.html');
const html = fs.readFileSync(INDEX, 'utf8');
let code = html.match(/<script>([\s\S]*)<\/script>/)[1];

// Only the gate's CONDITION is patched now — the body around it is the engine's own instrumented
// block and is left exactly as it ships.
const GATE_COND = 'if(crw>0.001&&cl.reflexThreat!==undefined){';
const SIZE_GATE = 'if(r.sizeHistory.length>=3){';
const COH_GATE = 'if(r.coherenceHistory.length>=3){';
const CADENCE = 'if(tick%60===0){\n    let alive=0,totalAmp=0,totalRes=0,';

function patchOnce(src, find, repl, label) {
  const n = src.split(find).length - 1;
  if (n !== 1) throw new Error(`patch target for ${label} found ${n} times, expected 1 — engine.html has drifted`);
  return src.replace(find, repl);
}

// Diagnostics are always instrumented (both ABLATE arms) — additive, doesn't change which branch
// runs. The gate's OWN condition is what ABLATE flips; when false, the counters inside just never
// increment (correctly reading zero), same as any other dead branch.
// ABLATE flips the gate's own condition; everything inside the block is the engine's, untouched.
const gateCond = ABLATE ? 'if(false&&cl.reflexThreat!==undefined){' : GATE_COND;
try {
  if (ABLATE) code = patchOnce(code, GATE_COND, gateCond, 'cluster-reflex gate condition');
  if (ARM1) {
    // Manipulation check: does trend/cohesionTrend leave zero if the sample bar is lowered and the
    // cadence that feeds it quadrupled? The engine's native warmup line sits immediately after the
    // size gate and is carried through verbatim, so its ucrWarmup keeps counting against the NEW bar.
    code = patchOnce(code, SIZE_GATE, 'if(r.sizeHistory.length>=2){', 'sizeHistory threshold');
    code = patchOnce(code, COH_GATE, 'if(r.coherenceHistory.length>=2){', 'coherenceHistory threshold');
    code = patchOnce(code, CADENCE, 'if(tick%15===0){\n    let alive=0,totalAmp=0,totalRes=0,', 'updateClusterReflex cadence');
  }
} catch (e) {
  console.log(JSON.stringify({ error: e.message, series: [] }));
  process.exit(1);
}

const driver = `
;(function(){
  // #131: reflexDebugCounters is a module-scope const inside engine.html, so the outer harness
  // scope cannot see it — the old patches wrote to globalThis, which is why reading it there used
  // to work. Publish the live object (same reference, so it keeps updating as the run proceeds).
  globalThis.__reflexCounters = (typeof reflexDebugCounters!=='undefined') ? reflexDebugCounters : null;
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
  function sample(){
    const binCounts={}; let alive=0, ampSum=0;
    for(let i=0;i<N;i++){
      if(!palive[i])continue;
      alive++; ampSum+=amp[i];
      const b=__binOf(i); binCounts[b]=(binCounts[b]||0)+1;
    }
    const occupied=Object.keys(binCounts).length;
    const Hbits=__shannon(binCounts);
    globalThis.__SAMPLES.push({
      tick:(typeof tick!=='undefined'?tick:-1),
      N:alive, meanAmp:+(alive?ampSum/alive:0).toFixed(4),
      occupiedKinds:occupied, diversityHbits:+Hbits.toFixed(3),
      crw:(typeof genome!=='undefined'?+((genome.clusterReflexWeight||0).toFixed(4)):0)
    });
  }
  globalThis.__SAMPLES=[];
  globalThis.__run=function(ticks,every){
    sample();
    for(let s=0;s<ticks;s++){
      globalThis.__detMs+=5;
      try{ loop(); }catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      if((s+1)%every===0)sample();
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/reflex-sim.js');
m.filename = __dirname + '/reflex-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

try {
  m._compile(code + driver, m.filename);
} catch (e) {
  console.log(JSON.stringify({ error: 'COMPILE/BOOT THREW: ' + e.message, series: [] }));
  process.exit(1);
}

globalThis.__run(TICKS, SAMPLE);
const S = globalThis.__SAMPLES;
console.log(JSON.stringify({
  ablated: ABLATE, seed: process.env.SEED || null,
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  crwFinal: S.length ? S[S.length - 1].crw : null,
  arm1: ARM1, persistReflex: 'native (Swing #47)',
  diagnostics: {
    // #131: straight from the engine's own reflexDebugCounters (REFLEX_DEBUG=1), not from patches.
    ...(globalThis.__reflexCounters || {})
  },
  series: S
}));
