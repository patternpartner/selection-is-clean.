// Leaf worker for harness-ablate-reflex.js — one seed, one condition (intact/ablated), one process.
// Same DOM/timer stubs as harness.js/harness-oee.js. ABLATE_REFLEX=1 permanently closes the
// crw>0.001 gate at index.html's ONE reflexThreat/reflexTrend->vmRegs[4]/[5] write site (verified
// unique against the current file by the orchestrator's own text before ever running this).
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '1000', 10);
const ABLATE = process.env.ABLATE_REFLEX === '1';

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

let loopErrors = 0, lastErr = '';
console.error = (...a) => {
  const s = a.join(' ');
  if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); }
};
console.warn = () => {};

const INDEX = process.env.INDEX || (__dirname + '/index.html');
const html = fs.readFileSync(INDEX, 'utf8');
let code = html.match(/<script>([\s\S]*)<\/script>/)[1];

const GATE_BLOCK = 'if(crw>0.001&&cl.reflexThreat!==undefined){\n    vmRegs[4]+=cl.reflexThreat*crw;\n    vmRegs[5]+=cl.reflexTrend*crw;\n  }';
const ECV_GUARD = 'function executeClusterVM(i,j,sim,d){\n  const cid=clusterID[i];\n  if(cid<0)return;\n  const cIdx=cid<MAX_CLUSTERS?clusterByID[cid]:-1;\n  if(cIdx<0)return;\n  const cl=clusters[cIdx];\n  if(!cl||!cl.vmProgram)return;';
const UCR_START = 'function updateClusterReflex(){';
const UCR_NEWREFLEX = 'if(!c.reflex){';

function patchOnce(src, find, repl, label) {
  const n = src.split(find).length - 1;
  if (n !== 1) throw new Error(`patch target for ${label} found ${n} times, expected 1 — index.html has drifted`);
  return src.replace(find, repl);
}

if (ABLATE) {
  code = patchOnce(code, 'if(crw>0.001&&cl.reflexThreat!==undefined){', 'if(false&&cl.reflexThreat!==undefined){', 'gate');
} else {
  // Three diagnostics requested to distinguish a genuinely severed/dormant pathway from one that
  // fires but contributes trivially-zero addends (threatLevel clamps to [0,1] — a healthy, growing,
  // size>=4 cluster plausibly lands exactly on 0 there constantly). All additive, same branches,
  // same conditions — no behavior change, just counters and running sums.
  try {
    code = patchOnce(code, ECV_GUARD,
      'function executeClusterVM(i,j,sim,d){\n  globalThis.__ecvEntries=(globalThis.__ecvEntries||0)+1;\n  const cid=clusterID[i];\n  if(cid<0){globalThis.__ecvNoCid=(globalThis.__ecvNoCid||0)+1;return;}\n  const cIdx=cid<MAX_CLUSTERS?clusterByID[cid]:-1;\n  if(cIdx<0){globalThis.__ecvNoCidx=(globalThis.__ecvNoCidx||0)+1;return;}\n  const cl=clusters[cIdx];\n  if(!cl||!cl.vmProgram){globalThis.__ecvNoProg=(globalThis.__ecvNoProg||0)+1;return;}\n  globalThis.__ecvPassed=(globalThis.__ecvPassed||0)+1;',
      'executeClusterVM guard');
    code = patchOnce(code, UCR_START,
      'function updateClusterReflex(){\n  globalThis.__ucrCalls=(globalThis.__ucrCalls||0)+1;',
      'updateClusterReflex entry');
    code = patchOnce(code, UCR_NEWREFLEX,
      'globalThis.__ucrNewReflex=(globalThis.__ucrNewReflex||0)+1;if(!c.reflex){',
      'updateClusterReflex new-reflex count');
    code = patchOnce(code, GATE_BLOCK,
      'if(crw>0.001&&cl.reflexThreat!==undefined){\n    globalThis.__gateFires=(globalThis.__gateFires||0)+1;\n    if(cl.reflexThreat===0)globalThis.__gateThreatZero=(globalThis.__gateThreatZero||0)+1;\n    if(cl.reflexTrend===0)globalThis.__gateTrendZero=(globalThis.__gateTrendZero||0)+1;\n    globalThis.__sumAbsThreatAddend=(globalThis.__sumAbsThreatAddend||0)+Math.abs(cl.reflexThreat*crw);\n    globalThis.__sumAbsTrendAddend=(globalThis.__sumAbsTrendAddend||0)+Math.abs(cl.reflexTrend*crw);\n    vmRegs[4]+=cl.reflexThreat*crw;\n    vmRegs[5]+=cl.reflexTrend*crw;\n  }',
      'gate block with addend logging');
  } catch (e) {
    console.log(JSON.stringify({ error: e.message, series: [] }));
    process.exit(1);
  }
}

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
  diagnostics: ABLATE ? null : {
    ecvEntries: globalThis.__ecvEntries || 0,
    ecvNoCid: globalThis.__ecvNoCid || 0,
    ecvNoCidx: globalThis.__ecvNoCidx || 0,
    ecvNoProg: globalThis.__ecvNoProg || 0,
    ecvPassed: globalThis.__ecvPassed || 0,
    ucrCalls: globalThis.__ucrCalls || 0,
    ucrNewReflex: globalThis.__ucrNewReflex || 0,
    gateFires: globalThis.__gateFires || 0,
    gateThreatZero: globalThis.__gateThreatZero || 0,
    gateTrendZero: globalThis.__gateTrendZero || 0,
    sumAbsThreatAddend: globalThis.__sumAbsThreatAddend || 0,
    sumAbsTrendAddend: globalThis.__sumAbsTrendAddend || 0
  },
  series: S
}));
