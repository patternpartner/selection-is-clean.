// Bloom-genome capture: run evolution live; snapshot the genome every SNAP ticks
// while calm (N<90), and when bloom onset is detected (N>BLOOM after tick MINT),
// dump both the bloom genome and the most recent calm snapshot for diffing.
const fs = require('fs');

const MAXT = parseInt(process.env.MAXT || '250000', 10);
const BLOOM = parseInt(process.env.BLOOM || '150', 10);
const MINT = parseInt(process.env.MINT || '30000', 10);
const SNAP = parseInt(process.env.SNAP || '10000', 10);
const OUT = process.env.OUT || '/tmp';

function selfProxy() {
  const f = function () { return p; };
  const p = new Proxy(f, { get(_t, prop) {
    if (prop === Symbol.toPrimitive) return () => 0;
    if (prop === 'width' || prop === 'height') return 0;
    if (prop === 'data') return new Uint8ClampedArray(4);
    return p;
  }, apply() { return p; } });
  return p;
}
const CTX = selfProxy();
function makeEl() { return { getContext: () => CTX, addEventListener() {}, removeEventListener() {}, set onclick(_) {}, set onchange(_) {}, click() {}, style: {}, width: 1280, height: 720, _text: '', get textContent() { return this._text; }, set textContent(v) { this._text = v; } }; }
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
  var MAXT=${MAXT}, BLOOM=${BLOOM}, MINT=${MINT}, SNAP=${SNAP};
  var OUT=${JSON.stringify(OUT)};
  var fs=require('fs');
  function snap(){ return JSON.parse(JSON.stringify(genome)); }  // functions dropped, structure kept
  var calm=null, calmTick=0;
  for(var s=0;s<MAXT;s++){
    try{loop();}catch(e){}
    if(N<90 && (tick%SNAP===0)){ calm=snap(); calmTick=tick; }
    if(tick>MINT && N>BLOOM){
      var bloom=snap();
      fs.writeFileSync(OUT+'/genome_calm.json', JSON.stringify({tick:calmTick,N_at:'<90',genome:calm},null,1));
      fs.writeFileSync(OUT+'/genome_bloom.json', JSON.stringify({tick:tick,N:N,genome:bloom},null,1));
      process.stdout.write(JSON.stringify({event:'BLOOM',bloomTick:tick,N:N,calmTick:calmTick})+String.fromCharCode(10));
      return;
    }
    if(tick%10000===0) process.stdout.write(JSON.stringify({tick:tick,N:N})+String.fromCharCode(10));
  }
  process.stdout.write(JSON.stringify({event:'NO_BLOOM',ranTo:tick})+String.fromCharCode(10));
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/capture-sim.js');
m.filename = __dirname + '/capture-sim.js';
m.paths = Module._nodeModulePaths(__dirname);
try { m._compile(code + driver, m.filename); }
catch (e) { console.log(JSON.stringify({ error: e.message })); process.exit(1); }
