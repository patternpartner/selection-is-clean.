// Controlled experiment: isolate the bloom mechanism.
// Freezes evolution (mutationRate=0) and sets physics gain/regulation multipliers,
// so we test PHYSICS not stochastic drift. Reports peak/steady population & amplitude.
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '12000', 10);
const GAIN_MULT = parseFloat(process.env.GAIN_MULT || '1');
const DCOST_MULT = parseFloat(process.env.DCOST_MULT || '1');
const FREEZE = process.env.FREEZE !== '0';

// ── Browser stubs (same as harness.js) ──
function selfProxy() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === 'width' || prop === 'height') return 0;
      if (prop === 'data') return new Uint8ClampedArray(4);
      return p;
    }, apply() { return p; }
  });
  return p;
}
const CTX = selfProxy();
function makeEl() {
  return { getContext: () => CTX, addEventListener() {}, removeEventListener() {},
    set onclick(_) {}, set onchange(_) {}, click() {}, style: {}, width: 1280, height: 720,
    _text: '', get textContent() { return this._text; }, set textContent(v) { this._text = v; } };
}
const ELS = {};
globalThis.document = { getElementById: (id) => (ELS[id] || (ELS[id] = makeEl())), createElement: () => makeEl(), addEventListener() {}, removeEventListener() {}, get hidden() { return false; } };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.location = { hash: '', pathname: '/', search: '', href: 'http://x/' };
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4, wakeLock: null };
globalThis.BroadcastChannel = class { postMessage() {} addEventListener() {} close() {} set onmessage(_) {} };
globalThis.fetch = () => new Promise(() => {});
globalThis.devicePixelRatio = 1; globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
let _t = 0; globalThis.performance = { now: () => (_t += 16) };
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0; globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};
console.error = () => {}; console.warn = () => {};

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

const driver = `
;(function(){
  var GM=${GAIN_MULT}, DM=${DCOST_MULT}, TK=${TICKS}, FZ=${FREEZE};
  if(FZ){ genome.mutationRate=0; if('mutationScale' in genome) genome.mutationScale=0; }
  genome.entropyK=(genome.entropyK||0.0004)*GM;
  genome.densityCostK=(genome.densityCostK||0.00003)*DM;
  var peakN=0,peakAmp=0,sumN=0,sumA=0,k=0,crossed100=-1;
  for(var s=0;s<TK;s++){
    try{loop();}catch(e){}
    var a=0,c=0; for(var i=0;i<N;i++){ if(amp[i]>0){a+=amp[i];c++;} }
    var ma=c?a/c:0;
    if(crossed100<0 && N>100) crossed100=tick;
    if(N>peakN)peakN=N; if(ma>peakAmp)peakAmp=ma;
    if(s>=TK-2000){ sumN+=N; sumA+=ma; k++; }
  }
  globalThis.__RES={GAIN_MULT:GM,DCOST_MULT:DM,frozen:FZ,
    entropyK:+genome.entropyK.toFixed(6),densityCostK:+genome.densityCostK.toFixed(6),
    peakN:peakN,peakAmp:+peakAmp.toFixed(3),
    tailMeanN:+(sumN/k).toFixed(1),tailMeanAmp:+(sumA/k).toFixed(3),
    crossed100atTick:crossed100};
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/exp-sim.js');
m.filename = __dirname + '/exp-sim.js';
m.paths = Module._nodeModulePaths(__dirname);
try { m._compile(code + driver, m.filename); }
catch (e) { console.log(JSON.stringify({ error: e.message })); process.exit(1); }
console.log(JSON.stringify(globalThis.__RES));
