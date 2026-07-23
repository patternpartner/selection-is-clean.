// ATROPHY PROBE — does the pruner fire? (Fable's keystone packet, grounded against source first.)
//
// The thesis under test: this codebase was built start-MAXIMAL (232 opcodes, dozens of meta-influence
// genes) with a pruner (Layer 29 ATROPHY, Pe40) meant to concentrate function by decaying provably-
// inert params toward zero — the biological pattern (bloat by duplication, then reductive selection).
// Whether that framing has teeth reduces to four words: DOES THE ATROPHY FIRE. Instrumented here by
// text-patching the EXISTING atrophy block (index.html ~10539) — mechanism unchanged, counters only.
//
// Four questions, ordered by governance:
//   Q1 KEYSTONE  — did any ATROPHY_SAFE param measurably decay in 20k ticks? (cuts>0 anywhere.)
//   Q2 3-STATE   — per param: protected (positive slow-trace, earning keep) / eligible (harmful or
//                  quiet — should decay) / BELOW-BAR (conf<=0.35 — atrophy structurally never evaluates
//                  it: the "knife doesn't reach its jurisdiction" case). The confound that guts the
//                  "elevated genes = still earning" reading: high-but-below-bar is drift, not merit.
//   Q3 OPCODES   — the VM program (232-wide choice space) has NO pruner (atrophy only patrols scalar
//                  influence-genes). Census evolved pProg opcode frequency vs the boot seed: does
//                  selection ALONE concentrate opcodes (some vanish, some dominate) with no culler?
//   Q4 BOUND     — atrophyRate clamp is [0,0.6] (index.html sanitize line 6289 / mutate 10816, read
//                  from source, not grepped-and-guessed). Reported with the run's evolved value so
//                  "near ceiling => pin not optimum" can be judged: 0.6 is the ceiling.
//
// Env: SEED (default 7)  TICKS (default 20000)
const fs = require('fs');
const TICKS = parseInt(process.env.TICKS || '20000', 10);

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
const CTX=selfProxy();
function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
const ELS={};
globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

const html=fs.readFileSync(__dirname+'/index.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

function patchOnce(find,repl,label){
  const n=code.split(find).length-1;
  if(n!==1){console.log(JSON.stringify({error:`patch target ${label} found ${n} times, expected 1`}));process.exit(1);}
  code=code.replace(find,repl);
}

// (Q1/Q2) Census every ATROPHY_SAFE param each atrophy cycle, classify by the block's own gates.
patchOnce(
'    for(const p of META_LAYER_PARAMS){\n      if(!ATROPHY_SAFE.has(p))continue;\n      const e=mc[p];\n      if(!e||e.traceSlow===undefined)continue;\n      const conf=e.conf||0;\n      const tSlow=e.traceSlow;',
'    for(const p of META_LAYER_PARAMS){\n      if(!ATROPHY_SAFE.has(p)){ if(globalThis.__atrInit)globalThis.__atrNoEntry=(globalThis.__atrNoEntry||new Set()).add(p); continue; }\n      const e=mc[p];\n      if(!e||e.traceSlow===undefined){ globalThis.__atrCensus=globalThis.__atrCensus||{}; const _c=globalThis.__atrCensus[p]||(globalThis.__atrCensus[p]={seen:0,belowBar:0,harmfulElig:0,quietElig:0,protectedPos:0,middling:0,noAttrib:0,cuts:0}); _c.seen++; _c.noAttrib++; continue; }\n      const conf=e.conf||0;\n      const tSlow=e.traceSlow;\n      { globalThis.__atrCensus=globalThis.__atrCensus||{}; const _c=globalThis.__atrCensus[p]||(globalThis.__atrCensus[p]={seen:0,belowBar:0,harmfulElig:0,quietElig:0,protectedPos:0,middling:0,noAttrib:0,cuts:0}); _c.seen++;\n        if(conf<=0.35)_c.belowBar++; else if(conf>0.35&&tSlow<-0.10)_c.harmfulElig++; else if(conf>0.35&&Math.abs(tSlow)<0.03&&Math.abs(e.trace)<0.05)_c.quietElig++; else if(conf>0.35&&tSlow>0.05)_c.protectedPos++; else _c.middling++; }',
'census loop head');

// (Q1) Log the harmful-path cut.
patchOnce(
'        const strength=aRate*(0.5+Math.abs(tSlow));\n        const factor=__cl(1-strength,0,1);\n        if(isFinite(genome[p]))genome[p]*=factor;',
'        const strength=aRate*(0.5+Math.abs(tSlow));\n        const factor=__cl(1-strength,0,1);\n        { const _from=genome[p]; if(isFinite(genome[p]))genome[p]*=factor; const _to=genome[p]; if(isFinite(_from)&&isFinite(_to)&&Math.abs(_from-_to)>1e-12){ globalThis.__atrCuts=globalThis.__atrCuts||[]; if(globalThis.__atrCuts.length<400)globalThis.__atrCuts.push({p,from:+_from.toPrecision(4),to:+_to.toPrecision(4),tick:(typeof tick!=="undefined"?tick:-1),path:"harmful"}); if(globalThis.__atrCensus&&globalThis.__atrCensus[p])globalThis.__atrCensus[p].cuts++; } }',
'harmful cut');

// (Q1) Log the probe-confirmed-dead cut.
patchOnce(
'              const factor=__cl(1-aRate,0,1); // AUTONOMY: confirmed-dead decays at FULL rate (was half)\n              if(isFinite(genome[p]))genome[p]*=factor;',
'              const factor=__cl(1-aRate,0,1); // AUTONOMY: confirmed-dead decays at FULL rate (was half)\n              { const _from=genome[p]; if(isFinite(genome[p]))genome[p]*=factor; const _to=genome[p]; if(isFinite(_from)&&isFinite(_to)&&Math.abs(_from-_to)>1e-12){ globalThis.__atrCuts=globalThis.__atrCuts||[]; if(globalThis.__atrCuts.length<400)globalThis.__atrCuts.push({p,from:+_from.toPrecision(4),to:+_to.toPrecision(4),tick:(typeof tick!=="undefined"?tick:-1),path:"probed"}); if(globalThis.__atrCensus&&globalThis.__atrCensus[p])globalThis.__atrCensus[p].cuts++; } }',
'probed cut');

const driver=`
;(function(){
  globalThis.__atrInit=true;
  // seed opcode distribution — captured at boot, before any evolution
  globalThis.__seedOpcodes={};
  try{ for(const inst of genome.vmProgram){ const op=inst[0]|0; globalThis.__seedOpcodes[op]=(globalThis.__seedOpcodes[op]||0)+1; } }catch(e){}
  globalThis.__seedAtrophyRate = (typeof genome!=='undefined')?genome.atrophyRate:null;
  globalThis.__run=function(n){ for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;} } };
  globalThis.__report=function(){
    // Q3: opcode census over living per-lineage programs
    const evolved={}; let nProg=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; const pr=pProg[i]; if(!pr)continue; nProg++; for(const inst of pr){ const op=inst[0]|0; evolved[op]=(evolved[op]||0)+1; } }
    let totalOps=0; for(const k in evolved)totalOps+=evolved[k];
    const freq=Object.entries(evolved).map(([op,c])=>[+op,c,+(c/totalOps).toFixed(4)]).sort((a,b)=>b[1]-a[1]);
    // final per-param attribution state
    const mc=genome.metaCredit||{};
    const paramState={};
    if(typeof ATROPHY_SAFE!=='undefined'){
      for(const p of META_LAYER_PARAMS){ if(!ATROPHY_SAFE.has(p))continue; const e=mc[p];
        paramState[p]={val:isFinite(genome[p])?+(+genome[p]).toPrecision(4):genome[p],
          conf:e?+(e.conf||0).toFixed(3):null, trace:e?+(e.trace||0).toFixed(4):null, traceSlow:(e&&e.traceSlow!==undefined)?+e.traceSlow.toFixed(4):null,
          peakValue:(e&&e.peakValue!==undefined)?+(+e.peakValue).toPrecision(4):null }; }
    }
    return {
      seedAtrophyRate:globalThis.__seedAtrophyRate, finalAtrophyRate:+((genome.atrophyRate||0).toFixed(4)), atrophyRateClamp:[0,0.6],
      totalCuts:(globalThis.__atrCuts||[]).length, cutSample:(globalThis.__atrCuts||[]).slice(0,40),
      cutsByParam:(function(){const o={};for(const c of (globalThis.__atrCuts||[]))o[c.p]=(o[c.p]||0)+1;return o;})(),
      census:globalThis.__atrCensus||{},
      paramState,
      opcode:{nLivingPrograms:nProg, distinctSeed:Object.keys(globalThis.__seedOpcodes||{}).length, seedOpcodes:globalThis.__seedOpcodes,
        distinctEvolved:freq.length, totalOpInstances:totalOps, top15:freq.slice(0,15), everUsedOfSpace:freq.length+' of ~232' }
    };
  };
})();
`;

const Module=require('module');
const m=new Module(__dirname+'/atrophy-sim.js');
m.filename=__dirname+'/atrophy-sim.js';
m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'COMPILE/BOOT THREW: '+e.message}));process.exit(1); }

globalThis.__run(TICKS);
const rep=globalThis.__report();
console.log(JSON.stringify({config:{SEED:process.env.SEED||null,TICKS},loopErrors,lastErr,driverErr:globalThis.__driverErr||0,...rep},null,1));
