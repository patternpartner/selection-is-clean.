// Headless harness for index.html — drives the simulation in Node with no browser.
// Stubs the DOM/canvas/timer APIs, neutralizes the self-driving rAF loop,
// then steps loop() a fixed number of ticks and samples the system's own state.
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
globalThis.fetch = () => new Promise(() => {}); // never resolves
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
let _t = 0;
globalThis.performance = { now: () => (_t += 16) }; // monotonic virtual clock

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
  globalThis.__SAMPLES = [];
  function meanAmp(){ let s=0,k=0; for(let i=0;i<N;i++){ if(amp[i]>0){s+=amp[i];k++;} } return k?s/k:0; }
  function clusterSizes(){ return clusters.map(c=> (c&&c.size?c.size:0)); }
  function sample(){
    let cs=[]; try{cs=clusterSizes();}catch(e){}
    (function(__o){process.stdout.write(JSON.stringify(__o)+String.fromCharCode(10));})({
      tick: (typeof tick!=='undefined'?tick:-1),
      N: (typeof N!=='undefined'?N:-1),
      meanAmp: +meanAmp().toFixed(4),
      clusters: (typeof clusters!=='undefined'?clusters.length:-1),
      maxCluster: cs.length?Math.max.apply(null,cs):0,
      lineages: (typeof lineageRegistry!=='undefined'?lineageRegistry.size:-1),
      DIMS: (typeof DIMS!=='undefined'?DIMS:-1),
      mutationRate: (typeof genome!=='undefined'?+(genome.mutationRate||0).toFixed(5):-1),
      objWeights: (typeof genome!=='undefined'&&genome.objWeights)?genome.objWeights.map(x=>+x.toFixed(3)):[],
      extinctions: (typeof genome!=='undefined'?(genome.extinctions||0):-1),
      boundOps: (typeof genome!=='undefined'&&Array.isArray(genome.boundOpcodes))?genome.boundOpcodes.length:0,
      userAtoms: (typeof genome!=='undefined'&&Array.isArray(genome.userAtoms))?genome.userAtoms.length:0,
      fitSensors: (typeof genome!=='undefined'&&Array.isArray(genome.fitnessSensors))?genome.fitnessSensors.length:0
    });
  }
  globalThis.__run = function(ticks, every){
    sample();
    for(let s=0;s<ticks;s++){
      try{ loop(); }catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      if((s+1)%every===0) sample();
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/harness-sim.js');
m.filename = __dirname + '/harness-sim.js';
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

const S = [];
console.log(JSON.stringify({
  config: { TICKS, SAMPLE },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  samples: S
}, null, 1));
