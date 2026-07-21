// Leaf worker for harness-ablate-reflex.js — one seed, one condition (intact/ablated), one process.
// Same DOM/timer stubs as harness.js/harness-oee.js. ABLATE_REFLEX=1 permanently closes the
// crw>0.001 gate at index.html's ONE reflexThreat/reflexTrend->vmRegs[4]/[5] write site (verified
// unique against the current file by the orchestrator's own text before ever running this).
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '1000', 10);
const ABLATE = process.env.ABLATE_REFLEX === '1';
// ARM1 (Fable's design): does trend/cohesionTrend ever leave zero if given a fair chance to? Two
// independent fixes to the starvation found in the diagnostic run — lower the 3-sample history bar
// to 2, and quadruple the cadence that feeds it (tick%60 -> tick%15) — orthogonal to ABLATE_REFLEX,
// so all four combinations (arm1 x {open,severed}) run through the same leaf.
const ARM1 = process.env.ARM1 === '1';
// PERSIST_REFLEX: the arm1 manipulation check (window shrunk to 2 samples, cadence quadrupled)
// still came back ucrWarmup=0 — a deeper cause than window/cadence. trackClusterPersistence()
// explicitly carries vmProgram/vmInfluence/fieldSignature/lineageID (and clusterGenome, separately)
// forward across detection cycles via the clusterVMs map, but never .reflex — and detectClusters()
// rebuilds `clusters` from scratch every cycle (clusters.length=0), so c.reflex is undefined at the
// start of every updateClusterReflex() call for every cluster, no matter how long it's persisted by
// hash-match. sizeHistory/coherenceHistory can never exceed length 1. Independent of ARM1 — a
// different, deeper bottleneck than the one Fable's design targeted.
const PERSIST_REFLEX = process.env.PERSIST_REFLEX === '1';

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
const SIZE_GATE = 'if(r.sizeHistory.length>=3){';
const COH_GATE = 'if(r.coherenceHistory.length>=3){';
const CADENCE = 'if(tick%60===0){\n    let alive=0,totalAmp=0,totalRes=0,';

function patchOnce(src, find, repl, label) {
  const n = src.split(find).length - 1;
  if (n !== 1) throw new Error(`patch target for ${label} found ${n} times, expected 1 — index.html has drifted`);
  return src.replace(find, repl);
}

// Diagnostics are always instrumented (both ABLATE arms) — additive, doesn't change which branch
// runs. The gate's OWN condition is what ABLATE flips; when false, the counters inside just never
// increment (correctly reading zero), same as any other dead branch.
const gateCond = ABLATE ? 'false&&cl.reflexThreat!==undefined' : 'crw>0.001&&cl.reflexThreat!==undefined';
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
  // Warmup counter: fires once per cluster-reflex object, the first tick its history actually
  // clears the sample bar (2 under ARM1, 3 at baseline) — "did the manipulation check pass".
  const sizeThresh = ARM1 ? 2 : 3;
  code = patchOnce(code, SIZE_GATE,
    `if(r.sizeHistory.length>=${sizeThresh}){\n      if(!r.__warmed){r.__warmed=true;globalThis.__ucrWarmup=(globalThis.__ucrWarmup||0)+1;}`,
    'sizeHistory threshold + warmup counter');
  code = patchOnce(code, COH_GATE, `if(r.coherenceHistory.length>=${sizeThresh}){`, 'coherenceHistory threshold');
  if (ARM1) {
    code = patchOnce(code, CADENCE, 'if(tick%15===0){\n    let alive=0,totalAmp=0,totalRes=0,', 'updateClusterReflex cadence');
  }
  if (PERSIST_REFLEX) {
    code = patchOnce(code,
      '      const prevVM=clusterVMs.get(bestMatch.hash);\n      if(prevVM){\n        c.vmProgram=prevVM.prog.map(inst=>[...inst]); // deep copy',
      '      const prevVM=clusterVMs.get(bestMatch.hash);\n      if(prevVM){\n        if(prevVM.reflex)c.reflex=prevVM.reflex; // PERSIST_REFLEX: carry reflex state forward like vmProgram/lineage\n        c.vmProgram=prevVM.prog.map(inst=>[...inst]); // deep copy',
      'reflex restore in trackClusterPersistence');
    code = patchOnce(code,
      'newVMs.set(c.hash,{prog:c.vmProgram.map(inst=>[...inst]),inf:c.vmInfluence,sig:Array.from(c.fieldSignature||[0,0,0]),lineage:c.lineageID});',
      'newVMs.set(c.hash,{prog:c.vmProgram.map(inst=>[...inst]),inf:c.vmInfluence,sig:Array.from(c.fieldSignature||[0,0,0]),lineage:c.lineageID,reflex:c.reflex});',
      'reflex store in trackClusterPersistence');
  }
  // Gate block: addend logging (as before) + residue-before-injection + register-4/5-readability
  // check for the rare nonzero firings (closes the 0.16% stitch — does anything downstream even
  // read what got written, for the cases where it's not trivially zero at the source).
  code = patchOnce(code, GATE_BLOCK,
    `if(${gateCond}){\n    globalThis.__gateFires=(globalThis.__gateFires||0)+1;\n    if(cl.reflexThreat===0)globalThis.__gateThreatZero=(globalThis.__gateThreatZero||0)+1;\n    if(cl.reflexTrend===0)globalThis.__gateTrendZero=(globalThis.__gateTrendZero||0)+1;\n    globalThis.__sumAbsThreatAddend=(globalThis.__sumAbsThreatAddend||0)+Math.abs(cl.reflexThreat*crw);\n    globalThis.__sumAbsTrendAddend=(globalThis.__sumAbsTrendAddend||0)+Math.abs(cl.reflexTrend*crw);\n    globalThis.__sumAbsResidue4=(globalThis.__sumAbsResidue4||0)+Math.abs(vmRegs[4]);\n    globalThis.__sumAbsResidue5=(globalThis.__sumAbsResidue5||0)+Math.abs(vmRegs[5]);\n    if(cl.reflexThreat!==0||cl.reflexTrend!==0){\n      globalThis.__nonzeroFirings=(globalThis.__nonzeroFirings||0)+1;\n      let __r45=false;\n      if(cl.vmProgram){for(let __pi=0;__pi<cl.vmProgram.length;__pi++){const __inst=cl.vmProgram[__pi];if(!__inst)continue;if(Math.abs(__inst[1])%12===4||Math.abs(__inst[1])%12===5){__r45=true;break;}}}\n      if(__r45)globalThis.__nonzeroFiringsReadable=(globalThis.__nonzeroFiringsReadable||0)+1;\n    }\n    vmRegs[4]+=cl.reflexThreat*crw;\n    vmRegs[5]+=cl.reflexTrend*crw;\n  }`,
    'gate block with addend/residue/readability logging');
} catch (e) {
  console.log(JSON.stringify({ error: e.message, series: [] }));
  process.exit(1);
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
  arm1: ARM1, persistReflex: PERSIST_REFLEX,
  diagnostics: {
    ecvEntries: globalThis.__ecvEntries || 0,
    ecvNoCid: globalThis.__ecvNoCid || 0,
    ecvNoCidx: globalThis.__ecvNoCidx || 0,
    ecvNoProg: globalThis.__ecvNoProg || 0,
    ecvPassed: globalThis.__ecvPassed || 0,
    ucrCalls: globalThis.__ucrCalls || 0,
    ucrNewReflex: globalThis.__ucrNewReflex || 0,
    ucrWarmup: globalThis.__ucrWarmup || 0,
    gateFires: globalThis.__gateFires || 0,
    gateThreatZero: globalThis.__gateThreatZero || 0,
    gateTrendZero: globalThis.__gateTrendZero || 0,
    sumAbsThreatAddend: globalThis.__sumAbsThreatAddend || 0,
    sumAbsTrendAddend: globalThis.__sumAbsTrendAddend || 0,
    sumAbsResidue4: globalThis.__sumAbsResidue4 || 0,
    sumAbsResidue5: globalThis.__sumAbsResidue5 || 0,
    nonzeroFirings: globalThis.__nonzeroFirings || 0,
    nonzeroFiringsReadable: globalThis.__nonzeroFiringsReadable || 0
  },
  series: S
}));
