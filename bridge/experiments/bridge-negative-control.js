// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE NEGATIVE CONTROL
// The question the whole cross-paradigm architecture never actually tested:
// does a seed that ORIGINATED in Pe bias a downstream L-system outcome any
// more than a random seed of the same size and same number-range would?
//
// Three arms, matched per-replicate on bag length:
//   TREATMENT  — number-bags harvested from REAL Pe packets via the bridge's
//                own harvestNumbers(). Genuine Pe-evolved structure.
//   CONTROL-1  — uniform [0,1) bags (the naive control: different range).
//   CONTROL-2  — bootstrap resample from the POOL of all real Pe numbers:
//                identical marginal distribution, every correlation/ordering
//                destroyed. THIS is the killer control.
//
// If TREATMENT ≈ CONTROL-2, the bridge transmits nothing but "numbers in a
// range" — decoration with a filter. If TREATMENT differs from BOTH controls,
// the bridge genuinely carries Pe-specific structure into the other substrate.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const Module = require('module');

// ---- shared DOM/canvas/etc stubs ----
function selfProxy() {
  const f = function () { return p; };
  const p = new Proxy(f, { get(_t, prop) { if (prop===Symbol.toPrimitive) return () => 0; if (prop==='width'||prop==='height') return 0; if(prop==='data') return new Uint8ClampedArray(4); return p; }, apply() { return p; } });
  return p;
}
function installEnv(captured) {
  const CTX = selfProxy();
  function makeEl() {
    return { getContext: () => CTX, addEventListener(){}, removeEventListener(){}, style:{}, width:1280, height:720, _text:'',
      get textContent(){return this._text;}, set textContent(v){this._text=v;},
      get innerHTML(){return this._text;}, set innerHTML(v){this._text=v;},
      set onclick(_){}, set onchange(_){}, click(){} };
  }
  const ELS = {};
  globalThis.document = { getElementById: (id) => (ELS[id] || (ELS[id] = makeEl())), createElement: () => makeEl(), addEventListener(){}, removeEventListener(){}, get hidden(){return false;} };
  globalThis.window = globalThis;
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
  globalThis.devicePixelRatio = 1;
  globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
  globalThis.performance = { now: () => Date.now() };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.setTimeout = () => 0; globalThis.clearTimeout = () => {};
  globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};
  globalThis.URL = { createObjectURL: () => 'blob:x' };
  globalThis.Blob = function(){};
  console.warn = () => {};
  console.error = () => {};
  const store = {};
  globalThis.localStorage = { getItem: (k)=>store[k]||null, setItem:(k,v)=>{store[k]=v;}, removeItem:(k)=>{delete store[k];} };
  globalThis.location = { hash: '', pathname: '/', search: '', href: 'http://x/' };
  globalThis.history = { replaceState(){}, pushState(){} };
  globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4, wakeLock: null };
  // BroadcastChannel that records every posted packet
  globalThis.BroadcastChannel = class {
    constructor(){}
    postMessage(msg){ try { captured.push(JSON.parse(JSON.stringify(msg))); } catch(e){} }
    addEventListener(){} close(){} set onmessage(_){}
  };
}

// ═══ STAGE 1 — harvest real Pe packets ═══
function harvestPePackets(warmup, harvest) {
  const captured = [];
  installEnv(captured);
  const html = fs.readFileSync('/home/user/selection-is-clean./index.html', 'utf8');
  const code = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const m = new Module('/tmp/pe-sim.js'); m.filename = '/tmp/pe-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
  // strip Pe's own auto-start so we drive loop() ourselves; expose loop + genome
  const codeNoStart = code.replace(/scheduleNext\(\);?\s*$/, '');
  const driver = `
    ;globalThis.__loop = loop;
    ;globalThis.__setRates = function(){ genome.netMigrantRate=1; genome.netPlasmidRate=1; genome.netMotifRate=1; genome.netInscribeRate=1; };
  `;
  m._compile(codeNoStart + driver, m.filename);
  const loop = globalThis.__loop;
  // warmup: let particles evolve, plasmids form, VM programs populate
  for (let i=0;i<warmup;i++) loop();
  const beforeCount = captured.length;
  globalThis.__setRates();
  for (let i=0;i<harvest;i++) loop();
  const packets = captured.slice(beforeCount);
  return packets;
}

// the bridge's OWN harvestNumbers (identical in both new systems) — the exact
// function that decides what, if anything, crosses the bridge.
function harvestNumbers(o,out,d){
  d=d||0; if(d>6||out.length>32)return out;
  if(typeof o==='number'&&isFinite(o)){out.push(o);return out;}
  if(Array.isArray(o)){for(const v of o)harvestNumbers(v,out,d+1);return out;}
  if(o&&typeof o==='object'){for(const k in o)harvestNumbers(o[k],out,d+1);return out;}
  if(typeof o==='string'&&o.length){let h=0;for(let i=0;i<o.length;i++)h=(h*31+o.charCodeAt(i))|0;out.push(h/2147483647);}
  return out;
}

// ═══ STAGE 2 — load the L-system substrate, expose its internals ═══
function loadLsys() {
  // fresh env (no captured needed here)
  installEnv([]);
  const html = fs.readFileSync('/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/lsystem-growth.html', 'utf8');
  let code = html.match(/<script>([\s\S]*)<\/script>/)[1];
  // strip the auto-boot tail so nothing runs on its own
  code = code.replace(/\/\/ ═+\s*\/\/ BOOT[\s\S]*$/,'');
  const m = new Module('/tmp/lsys-sim.js'); m.filename = '/tmp/lsys-sim.js'; m.paths = Module._nodeModulePaths('/tmp');
  const driver = `
    ;globalThis.__lsys = { freshGenome, mutateGenome, develop, growthCycle, currentInfluence,
      interpret, expandString, layoutPlots, seedPopulation,
      get population(){return population;}, set population(v){population=v;},
      get tick(){return tick;}, set tick(v){tick=v;},
      get plots(){return plots;}, POP_SIZE, GROWTH_CYCLE, AXIOM, ITER_DEPTH };
  `;
  // W/H must be set (draw/develop use plot sizes); call resize via a fake
  code = code.replace('addEventListener(\'resize\',resize);', 'W=1280;H=720;');
  m._compile(code + driver, m.filename);
  return globalThis.__lsys;
}

// seed ONE organism from a token bag through the real freshGenome path, angle
// fixed to isolate the token channel (angle is always random in freshGenome and
// carries no token information, so fixing it is a fair variance reduction applied
// identically to all three arms). Return coverage + symbol composition + rule.
function seedOrganism(L, tokens) {
  const g = L.freshGenome(1, tokens);           // the real bridge seeding path
  const rule = g.rules.F;
  const ind = { rules:{F:rule}, angle:30, plotIdx:0, createdTick:0, bridgeInfluence:1 };
  L.develop(ind);
  const n = rule.length || 1;
  let cF=0,cP=0,cM=0,cO=0,cC=0;
  for (const ch of rule){ if(ch==='F')cF++; else if(ch==='+')cP++; else if(ch==='-')cM++; else if(ch==='[')cO++; else if(ch===']')cC++; }
  return { coverage: ind.coverage, overgrown: !!ind.overgrown, len: rule.length,
    fF:cF/n, bracket:(cO+cC)/n, turn:(cP+cM)/n, rule };
}

// ═══ STATS ═══
function mannWhitney(a, b) {
  // returns { U, z, p (two-sided), cliff } — rank-based, no normality assumed
  const na=a.length, nb=b.length;
  const all = a.map(v=>({v,g:0})).concat(b.map(v=>({v,g:1})));
  all.sort((x,y)=>x.v-y.v);
  // assign average ranks (handle ties)
  let i=0; while(i<all.length){ let j=i; while(j<all.length && all[j].v===all[i].v) j++;
    const r=(i+j-1)/2 + 1; for(let k=i;k<j;k++) all[k].rank=r; i=j; }
  let R1=0; for(const e of all) if(e.g===0) R1+=e.rank;
  const U1 = R1 - na*(na+1)/2;
  const U = Math.min(U1, na*nb - U1);
  const mu = na*nb/2;
  const sigma = Math.sqrt(na*nb*(na+nb+1)/12);
  const z = sigma>0 ? (U - mu)/sigma : 0;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  // Cliff's delta = (2*U1)/(na*nb) - 1  (effect size, -1..1)
  const cliff = (2*U1)/(na*nb) - 1;
  return { U, z, p, cliff };
}
function normalCdf(x){ return 0.5*(1+erf(x/Math.SQRT2)); }
function erf(x){ const t=1/(1+0.3275911*Math.abs(x));
  const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  return x>=0?y:-y; }
function median(a){ const s=a.slice().sort((x,y)=>x-y); const n=s.length; return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2; }
function mean(a){ return a.reduce((s,v)=>s+v,0)/a.length; }
function cliffLabel(d){ const a=Math.abs(d); return a<0.147?'negligible':a<0.33?'small':a<0.474?'medium':'large'; }

// ═══ RUN ═══
console.log('STAGE 1: harvesting real Pe packets…');
const packets = harvestPePackets(3000, 8000);
const typeCounts = {};
for (const p of packets){ typeCounts[p.type]=(typeCounts[p.type]||0)+1; }
console.log('  captured '+packets.length+' packets:', JSON.stringify(typeCounts));

// build treatment corpus of number-bags (only non-empty)
const corpus = [];
const pePool = [];
for (const p of packets){
  const bag = harvestNumbers(p.data, [], 0);
  if (bag.length){ corpus.push(bag); for(const x of bag) pePool.push(x); }
}
console.log('  usable non-empty bags: '+corpus.length+'; pooled numbers: '+pePool.length);
if (corpus.length < 50) { console.log('  TOO FEW BAGS — aborting'); process.exit(1); }
// quick look at the pool's range
const poolSorted = pePool.slice().sort((a,b)=>a-b);
console.log('  Pe pool range: min='+poolSorted[0].toFixed(3)+' med='+median(pePool).toFixed(3)+' max='+poolSorted[poolSorted.length-1].toFixed(3));

console.log('\nSTAGE 2: loading L-system substrate…');
const L = loadLsys();
L.tick = 0;

// ═══ STAGE 3 — immediate test: R replicates, matched lengths per replicate ═══
const R = 3000;
function sampleBag(){ return corpus[(Math.random()*corpus.length)|0]; }
function bootstrapBag(len){ const out=new Array(len); for(let i=0;i<len;i++) out[i]=pePool[(Math.random()*pePool.length)|0]; return out; }
function uniformBag(len){ const out=new Array(len); for(let i=0;i<len;i++) out[i]=Math.random(); return out; }

const arms = { treat:{cov:[],brk:[],len:[],turn:[]}, ctl1:{cov:[],brk:[],len:[],turn:[]}, ctl2:{cov:[],brk:[],len:[],turn:[]} };
const seenRules = { treat:new Set(), ctl1:new Set(), ctl2:new Set() };
for (let r=0;r<R;r++){
  const T = sampleBag(); const Lr = T.length;
  const c1 = uniformBag(Lr);
  const c2 = bootstrapBag(Lr);
  for (const [key,bag] of [['treat',T],['ctl1',c1],['ctl2',c2]]){
    const o = seedOrganism(L, bag);
    arms[key].cov.push(Math.log10(o.coverage));   // log — coverage spans orders of magnitude
    arms[key].brk.push(o.bracket);
    arms[key].len.push(o.len);
    arms[key].turn.push(o.turn);
    seenRules[key].add(o.rule);
  }
}

console.log('\nSTAGE 3 RESULTS — immediate seeded-organism outcomes (R='+R+' per arm, lengths matched per replicate)');
function reportMetric(name, key){
  const t=arms.treat[key], c1=arms.ctl1[key], c2=arms.ctl2[key];
  console.log('\n  ['+name+']  median: treat='+median(t).toFixed(4)+'  ctl1(uniform)='+median(c1).toFixed(4)+'  ctl2(marginal-matched)='+median(c2).toFixed(4));
  const tvc1 = mannWhitney(t,c1);
  const tvc2 = mannWhitney(t,c2);
  const c1vc2 = mannWhitney(c1,c2);
  console.log('    treat vs ctl1 : p='+tvc1.p.toExponential(2)+'  Cliff δ='+tvc1.cliff.toFixed(3)+' ('+cliffLabel(tvc1.cliff)+')');
  console.log('    treat vs ctl2 : p='+tvc2.p.toExponential(2)+'  Cliff δ='+tvc2.cliff.toFixed(3)+' ('+cliffLabel(tvc2.cliff)+')   <<< THE KILLER CONTROL');
  console.log('    ctl1  vs ctl2 : p='+c1vc2.p.toExponential(2)+'  Cliff δ='+c1vc2.cliff.toFixed(3)+' ('+cliffLabel(c1vc2.cliff)+')');
}
reportMetric('log10 coverage','cov');
reportMetric('bracket fraction','brk');
reportMetric('rule length','len');
reportMetric('turn fraction','turn');
console.log('\n  distinct rule-strings produced:  treat='+seenRules.treat.size+'  ctl1='+seenRules.ctl1.size+'  ctl2='+seenRules.ctl2.size+'  (of '+R+' each)');

// ═══ STAGE 4 — downstream: does provenance survive selection? ═══
// Seed whole populations from one arm, evolve, compare equilibrium fitness.
console.log('\nSTAGE 4: downstream persistence — seed whole populations per arm, evolve, compare equilibrium mean coverage');
function evolvePopulationFromArm(bagFn, reps, cycles){
  const finals=[];
  for (let rep=0; rep<reps; rep++){
    L.tick = 0;
    const pop=[];
    for (let i=0;i<L.POP_SIZE;i++){
      const bag=bagFn();
      const g=L.freshGenome(1,bag);
      pop.push({rules:{F:g.rules.F},angle:g.angle,plotIdx:i,createdTick:0,reproducedCount:0,bridgeInfluence:1});
    }
    L.population = pop;
    L.layoutPlots();
    for (const ind of pop) L.develop(ind);
    for (let cyc=0; cyc<cycles; cyc++){ L.tick = L.tick + L.GROWTH_CYCLE; L.growthCycle(); }
    const cov = L.population.filter(p=>!p.overgrown).map(p=>Math.log10(Math.max(1,p.coverage)));
    finals.push(cov.length?mean(cov):0);
  }
  return finals;
}
const REPS=300, CYCLES=400;
const dTreat = evolvePopulationFromArm(sampleBag, REPS, CYCLES);
const dCtl1  = evolvePopulationFromArm(()=>uniformBag(6+((Math.random()*8)|0)), REPS, CYCLES);
const dCtl2  = evolvePopulationFromArm(()=>bootstrapBag(6+((Math.random()*8)|0)), REPS, CYCLES);
console.log('  equilibrium mean log10-coverage after '+CYCLES+' cycles ('+REPS+' independent populations/arm):');
console.log('    treat median='+median(dTreat).toFixed(4)+'  ctl1='+median(dCtl1).toFixed(4)+'  ctl2='+median(dCtl2).toFixed(4));
const dtvc2 = mannWhitney(dTreat,dCtl2);
const dtvc1 = mannWhitney(dTreat,dCtl1);
console.log('    treat vs ctl1 : p='+dtvc1.p.toExponential(2)+'  Cliff δ='+dtvc1.cliff.toFixed(3)+' ('+cliffLabel(dtvc1.cliff)+')');
console.log('    treat vs ctl2 : p='+dtvc2.p.toExponential(2)+'  Cliff δ='+dtvc2.cliff.toFixed(3)+' ('+cliffLabel(dtvc2.cliff)+')   <<< persistence-after-selection');

console.log('\nDONE.');
