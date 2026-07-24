// AMP SATURATION GAUGE — how much headroom does the selection currency actually have?
//
// This is swing #48's Rider 2 in the one form it was said to be honestly available: an
// "honestly-labeled TOTAL-physics-saturation gauge that does not claim VM attribution"
// (OEE-NOTES, #48 riders). It makes no attempt to attribute saturation to VM output — VM
// output is applied diffusely across ~8 actuators x 3 execution paths and the clamps that
// would catch it are shared with base physics, which is exactly why the per-site counter was
// (correctly) not shipped as a one-liner. This measures the TOTAL distribution of amp[i]
// against its own hard bound, and attributes nothing.
//
// What it censuses, per sample, over LIVING particles only:
//   atCap / within1pct / within5pct  — share pinned at or against the clamp (index.html:12091,
//                                      `if(amp[i]>1.2)amp[i]=1.2` — a bare literal, not a gene)
//   mean / sd / cv                   — is there dispersion left for selection to act on
//   q.p01..p99                       — where the population actually sits in the range
//   headroom                         — (cap-mean)/cap, the dynamic range meanAmp still has
//
// Why it matters: meanAmp is the shared primary dependent variable of harness-ablate-bank.js,
// harness-meta-ablate.js and harness-ablate-reflex.js. If it runs pinned near its ceiling, every
// ablation in the record is being read off the last few percent of a clamped variable.
//
// Usage: SEED=7 TICKS=6000 SAMPLE=1500 node harness-saturation.js
//
// Apparatus below (DOM stubs, rAF neutralisation, module compile) is harness.js's, unmodified —
// only the driver/report differ. Pe itself is NOT patched: this is observation only.
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '6000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '300', 10);

// ── Browser API stubs ─────────────────────────────────────────────
// Universal self-returning proxy: every method call / property read yields
// the same proxy, so canvas draw chains never throw. Numeric coercions give
// NaN, which only ever lands in (discarded) render output, never sim arrays.
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
globalThis.fetch = () => new Promise(() => {}); // never resolves
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
const _epoch = Date.now();
globalThis.performance = { now: () => Date.now() - _epoch }; // real clock so time-budget gates (e.g. the 80ms updateField guard) behave as in the browser

// Neutralize self-driving so WE control stepping.
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

// Capture runtime errors the loop's try/catch swallows.
let loopErrors = 0, lastErr = '';
const _err = console.error.bind(console);
console.error = (...a) => {
  const s = a.join(' ');
  if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); }
};
console.warn = () => {};

// ── Load + instrument the script ──────────────────────────────────
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
let code = html.match(/<script>([\s\S]*)<\/script>/)[1];

// AMP_CAP — same verified-unique patch as harness-oee.js, so the gauge can characterise the
// distribution under a RAISED clamp, not just the shipped one. Default off = byte-identical code.
const AMP_CAP = process.env.AMP_CAP !== undefined ? parseFloat(process.env.AMP_CAP) : 1.2;
// CARRY_RATE — same verified-unique patch, for calibrating #50's rent without editing index.html.
if (process.env.CARRY_RATE !== undefined) {
  const cr = parseFloat(process.env.CARRY_RATE);
  const N2 = 'const AMP_CARRY_RATE=0.005;';
  const h2 = code.split(N2).length - 1;
  if (!Number.isFinite(cr) || cr < 0 || h2 !== 1) {
    console.log(JSON.stringify({error:'CARRY_RATE invalid or patch target not unique ('+h2+' hits)'})); process.exit(1); }
  code = code.replace(N2, 'const AMP_CARRY_RATE=' + cr + ';');
}
if (process.env.AMP_CAP !== undefined) {
  const NEEDLE = 'const AMP_CAP=6.0;';
  const hits = code.split(NEEDLE).length - 1;
  if (!Number.isFinite(AMP_CAP) || AMP_CAP <= 0 || hits !== 1) {
    console.log(JSON.stringify({error:'AMP_CAP invalid or patch target not unique ('+hits+' hits)'})); process.exit(1); }
  code = code.replace(NEEDLE, 'const AMP_CAP=' + AMP_CAP + ';');
}

// cumulative amp-starvation death counter (the in-sim counters reset each cycle)
{ const N3='deaths.push(i);deathsThisTick++;deathsByPhysics++;';
  const h3=code.split(N3).length-1;
  if(h3!==1){ console.log(JSON.stringify({error:'amp-death needle not unique ('+h3+')'})); process.exit(1); }
  code=code.replace(N3, N3+'globalThis.__ampDeaths=(globalThis.__ampDeaths||0)+1;'); }

const driver = `
;(function(){
  globalThis.__SAMPLES = [];
  function census(){
    var vals=[];
    for(var i=0;i<N;i++){ if(!palive[i])continue; var a=amp[i]; if(Number.isFinite(a)) vals.push(a); }
    vals.sort(function(x,y){return x-y;});
    var n=vals.length; if(!n) return null;
    var sum=0; for(var j=0;j<n;j++)sum+=vals[j];
    var mean=sum/n, v=0; for(var j2=0;j2<n;j2++){var d=vals[j2]-mean; v+=d*d;}
    var sd=Math.sqrt(v/n);
    // #50b: measure against the EFFECTIVE ceiling. Once the ceiling floats (cap = AMP_CAP_REL x mean),
    // comparing amp to the floor constant AMP_CAP reports pinning that is not happening.
    var CAPV=(typeof ampCeiling==='function')?ampCeiling():((typeof AMP_CAP!=='undefined')?AMP_CAP:1.2);
    var dT=(typeof genome!=='undefined'?genome.deathThreshold:0.04);
    function frac(pred){var c=0;for(var k=0;k<n;k++)if(pred(vals[k]))c++;return c/n;}
    function q(p){return vals[Math.min(n-1,Math.floor(p*n))];}
    return {
      nAlive:n, mean:+mean.toFixed(5), sd:+sd.toFixed(5), cv:+(sd/(mean||1)).toFixed(5),
      cap:CAPV, deathThresh:+(+dT).toFixed(4),
      atCap:      +frac(function(a){return a>=CAPV-1e-6;}).toFixed(4),
      within1pct: +frac(function(a){return a>=CAPV*0.99;}).toFixed(4),
      within5pct: +frac(function(a){return a>=CAPV*0.95;}).toFixed(4),
      nearDeath:  +frac(function(a){return a<=dT*2;}).toFixed(4),
      q:{p01:+q(0.01).toFixed(4),p10:+q(0.10).toFixed(4),p50:+q(0.50).toFixed(4),p90:+q(0.90).toFixed(4),p99:+q(0.99).toFixed(4)},
      headroom:+((CAPV-mean)/CAPV).toFixed(5)
    };
  }
  function sample(){
    var c=null; try{c=census();}catch(e){}
    globalThis.__SAMPLES.push({
      tick:(typeof tick!=='undefined'?tick:-1),
      ampDeaths:(globalThis.__ampDeaths||0),
      N:(typeof N!=='undefined'?N:-1),
      lineages:(typeof lineageRegistry!=='undefined'?lineageRegistry.size:-1),
      clusters:(typeof clusters!=='undefined'?clusters.length:-1),
      amp:c
    });
  }
  globalThis.__run = function(ticks, every){
    sample();
    for(var s=0;s<ticks;s++){
      try{ loop(); }catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      if((s+1)%every===0) sample();
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/sat-sim.js');
m.filename = __dirname + '/sat-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

const t0 = Date.now();
try {
  m._compile(code + driver, m.filename);
} catch (e) {
  console.log('COMPILE/BOOT THREW:', e.message);
  process.exit(1);
}
const tBoot = Date.now();

globalThis.__run(TICKS, SAMPLE);
const tDone = Date.now();

const S = globalThis.__SAMPLES;
console.log(JSON.stringify({
  config: { TICKS, SAMPLE },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  samples: S
}, null, 1));
