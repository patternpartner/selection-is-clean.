// ARGMAX-TIE PROBE — a hypothesis this probe REFUTED. Kept, per the record's convention of
// documenting dead ends rather than deleting them (cf. PERSIST_REFLEX's first attempt, #47).
//
// THE HYPOTHESIS (from static reading alone, which is why it was wrong): selfLearnFromBest()
// (index.html:5440) and decideFromRealWinner() (:5464) both pick "the best lineage" by strict
// argmax over amp[i]. amp is clamped by `if(amp[i]>1.2)amp[i]=1.2` into a Float32Array, so every
// clamped particle should hold the identical bit pattern; with the saturation gauge measuring
// 75-87% of the population at that clamp, the argmax looked like it had to be resolving a massive
// tie by array order — i.e. "DECIDE FROM THE REAL WINNER" (#44) deciding from an arbitrary index.
//
// THE MEASUREMENT (seed 7, 2500 ticks): REFUTED. tiedAtMax is 1 at nearly every sample (one
// sample showed 5 of 405). bestAmp reads 1.200020-1.200875 — strictly ABOVE the clamp, because
// amp receives further additions after the clamp site within the same tick, so the maximum is a
// genuine unique value and the argmax is not degenerate. The clamp does not collapse the argmax.
//
// What the probe DID confirm, and what the saturation finding actually rests on, are the bands:
//   aboveRepro04 (amp>0.4, op16's reproduction gate)          — 98.8-99.4% of living particles
//   aboveSat08   (amp>0.8, above which a spawn's amp*=0.5     — 93.6-98.6%
//                 still leaves the parent over that gate)
//   atClamp                                                    — 76-82%
// i.e. essentially the whole population is past the reproduction gate, and ~95% is past the point
// where more amp buys any additional reproductive capability.
//
// Usage: SEED=7 TICKS=2500 SAMPLE=500 node harness-tie.js
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
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

const driver = `
;(function(){
  globalThis.__SAMPLES=[];
  globalThis.__TIE=[];
  // instrument the exact argmax that selfLearnFromBest/decideFromRealWinner use
  globalThis.__tieCensus=function(){
    var best=-1,bestAmp=-1e9;
    for(var i=0;i<N;i++){ if(palive[i]&&pProg[i]&&amp[i]>bestAmp){bestAmp=amp[i];best=i;} }
    if(best<0)return null;
    var tied=0,aliveProg=0,firstTied=-1;
    for(var j=0;j<N;j++){ if(!palive[j]||!pProg[j])continue; aliveProg++;
      if(amp[j]===bestAmp){ tied++; if(firstTied<0)firstTied=j; } }
    return {bestIdx:best, bestAmp:+bestAmp.toFixed(6), tiedAtMax:tied, eligible:aliveProg,
            tieFraction:+(tied/Math.max(1,aliveProg)).toFixed(4), firstTiedIdx:firstTied,
            atClamp: bestAmp>=1.2-1e-6};
  };
  function bands(){
    var n=0,c=0,rep=0,sat=0;
    for(var i=0;i<N;i++){ if(!palive[i])continue; var a=amp[i]; if(!Number.isFinite(a))continue; n++;
      if(a>=1.2-1e-6)c++; if(a>0.4)rep++; if(a>0.8)sat++; }
    return n?{nAlive:n, atClamp:+(c/n).toFixed(4), aboveRepro04:+(rep/n).toFixed(4), aboveSat08:+(sat/n).toFixed(4)}:null;
  }
  function sample(){
    var t=null,b=null; try{t=globalThis.__tieCensus();}catch(e){} try{b=bands();}catch(e){}
    globalThis.__SAMPLES.push({tick:(typeof tick!=='undefined'?tick:-1), N:N, tie:t, bands:b});
  }
  globalThis.__run=function(ticks,every){ sample();
    for(var s=0;s<ticks;s++){ try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;}
      if((s+1)%every===0)sample(); } };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/tie-sim.js');
m.filename = __dirname + '/tie-sim.js';
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
