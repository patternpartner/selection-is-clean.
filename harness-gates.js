// TERM-LEVEL GATE AUDIT — which term in a compound condition actually does the rejecting?
//
// #61 found that the cosmology's launch gate, written as
//     size >= 9 AND coherence >= 0.55 AND persistAge >= 10
// was in operation `persistAge >= 10` with two ornaments: across three seeds the size term rejected
// EXACTLY ZERO candidates while persistAge rejected 96% of them. The wave was specified in terms of
// size and coherence and the code was selecting on age.
//
// That is a general failure mode and this file has no instrument for it. A compound condition
// reports as ONE boolean. Every readout in the project — counts, rates, diversity curves, the
// per-launch log — sees `eligible: true/false` and cannot see that one term does all the work while
// another is inert. Dead apparatus does not only hide in unread constants (MODE_REACH, #58); it
// hides INSIDE live conditions, where two of three terms firing is enough to make the whole gate
// look load-bearing. Nothing in this project has ever asked which term flipped the boolean.
//
// For each instrumented gate this reports:
//   n      times evaluated
//   pass   times every term passed
//   block  per term, times that term was blocking
//   SOLE   per term, times that term was THE ONLY blocker
//
// SOLE is the statistic that matters. A term that is never the sole blocker never independently
// changed an outcome — delete it and the gate admits exactly the same set. That is a per-term,
// falsifiable definition of dead apparatus, where the existing instruments could only judge whole
// mechanisms.
//
// Only gates whose terms are PURE are instrumented. Forcing evaluation of a term containing
// Math.random() would consume draws the original short-circuits away and shift the seeded
// trajectory, making the audit measure a different world than the one it audits.
//
// Env: SEED, TICKS (default 6000).
const fs=require('fs');
const TICKS=parseInt(process.env.TICKS||'6000',10);

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
const CTX=selfProxy();
function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
const ELS={};
globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
// GENOME resume (ported from harness-oee.js). REQUIRED for the bank arm: a fresh boot authors ~3 atoms
// with ZERO uses, so STRIP=bank on a fresh boot would be hollow by construction — the exact trap that
// wasted the first payoff attempt. Point GENOME= at a real export with a used bank.
const _gnHash=process.env.GENOME?('#'+JSON.parse(require('fs').readFileSync(process.env.GENOME,'utf8')).genome):'';
globalThis.location={hash:_gnHash,pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
// ENV KNOBS. This file never had any, and that silently invalidated the first cost A/B run against it:
// COSMOS=0 was passed, nothing read it, the LIVE block filled __COSMOS=1 in both arms, and the two runs
// came back identical to the digit — 2 launches and 10 emissions on both sides of a "control". An arm
// that cannot be turned off is not a control, so the plumbing goes in before any ablation claim does.
// Same one-line form as harness-oee.js.
if (process.env.COSMOS !== undefined) globalThis.__COSMOS = parseInt(process.env.COSMOS, 10);
for (const kn of ['COSMOS_COST','COSMOS_CONTACT','COSMOS_MERGE','COSMOS_SENSE','COSMOS_AFFORD'])
  if (process.env[kn] !== undefined) globalThis['__'+kn] = parseInt(process.env[kn], 10);
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

const html=fs.readFileSync(__dirname+'/index.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];
function patchOnce(find,repl,label){ patchExactly(find,repl,label,1); }
// patchExactly asserts the EXPECTED number of matches rather than accepting whatever it finds. The
// speciation gate legitimately appears twice (addParticle and addCompound each have a spawn path), and
// the earlier version of this file used unchecked split/join for it — which matched zero times after
// #63 deleted the string it targeted, silently dropping the gate from every later audit. Either
// direction of drift is caught now: too few matches AND too many.
function patchExactly(find,repl,label,expected){
  const n=code.split(find).length-1;
  if(n!==expected){console.log(JSON.stringify({error:`patch ${label} x${n} expected ${expected}`}));process.exit(1);}
  code=code.split(find).join(repl);
}

// ── THE GATES ────────────────────────────────────────────────────────────────────────────────────
// Each entry rewrites one compound condition into __g(name,[term,...]) where every term is TRUE
// when it BLOCKS. Semantics are preserved exactly: the disjunction of the terms equals the original
// condition, and every term is pure so eager evaluation changes nothing.
patchOnce(
  'if(c.persistAge<Math.min(_budThr,CBUD_MIN_AGE)||c.size<_budMinSize)continue;',
  "if(__g('cluster_bud',['persistAge',c.persistAge<Math.min(_budThr,CBUD_MIN_AGE),'size',c.size<_budMinSize]))continue;",
  'cluster_bud');

// avgAmp was deleted from this gate in #64 (sole blocker 0 of 314). patchOnce caught the stale string
// as x0 rather than silently matching nothing, which is the whole reason it exists.
patchOnce(
  'if(c.persistAge<6||c.coherence<0.45)continue;',
  "if(__g('cluster_upstream',['persistAge',c.persistAge<6,'coherence',c.coherence<0.45]))continue;",
  'cluster_upstream');

// speciation: the parent-lineage eligibility test. MUST go through patchOnce — the previous version
// used unchecked split/join against a string that #63's own SPECIATE_MIN_AGE deletion had removed, so
// it matched ZERO times and this gate silently disappeared from every audit after 341c45a. The #65
// output was printed without it and the absence was not noticed. An unchecked patch is an instrument
// that lies quietly, which is the exact failure this file collects.
patchExactly(
  'if(_pe&&!_pe.extinct&&(genome.totalTicks-_pe.birthTick)>SPECIATE_MIN_AGE){',
  "if(!__g('speciate_parent',['noEntry',!_pe,'extinct',!!(_pe&&_pe.extinct),'tooYoung',!!(_pe&&(genome.totalTicks-_pe.birthTick)<=SPECIATE_MIN_AGE)])){",
  'speciate_parent',2);   // both spawn paths: addParticle and addCompound

// #65 — more pure compound gates. Each added because a compound condition reports as ONE boolean and
// this project has now found two dead terms hiding inside live conditions (SPECIATE_MIN_AGE, avgAmp).
patchOnce(
  'if(!c.vmProgram||c.vmProgram.length<2)continue;',
  "if(__g('upstream_prog',['noProgram',!c.vmProgram,'tooShort',!!(c.vmProgram&&c.vmProgram.length<2)]))continue;",
  'upstream_prog');

// Behavioural-isolation gate for entrainment (#17). Both halves are pure: an opcode-mismatch fraction
// and a lineage-identity test. __SPEC.gate is a config flag, so it is folded in as its own term —
// a flag that is always one value is exactly the kind of inert term this audit exists to surface.
// spec_entrain is a PER-PAIR path — 1.47M evaluations per 2500 ticks — and instrumenting it produced
// a loop error (watchdog), the same signature the predation gate gave. Behind HOT=1 with predate, and
// its numbers must not be mixed with a run that did not carry that cost. Measured while it was on,
// both terms are live: crossLineage sole 55.8%, mismatch sole 5.8%. No dead term there.
if((process.env.HOT|0)===1) patchOnce(
  'const _spGate=(_sppN===0||_sppD<_sppN*0.75)&&(!__SPEC.gate||pLin[_drv]===pLin[_oth]);',
  "const _spGate=!__g('spec_entrain',['mismatch',!(_sppN===0||_sppD<_sppN*0.75),'crossLineage',!(!__SPEC.gate||pLin[_drv]===pLin[_oth])]);",
  'spec_entrain');

// Tag every pLin mint site so provenance is recorded rather than inferred.
// Post-#67 the founder path mints through createLineage, so it is tagged as LINEAGE-minted. The
// founder set now stays empty by construction, and aliasCarrier going to 0 is the fix's success
// criterion rather than a vacuous reading — the previous version of this assay reported 0 because the
// tag sets did not exist yet at boot, which is a different thing entirely and looked identical.
patchExactly('pLin[i]=(parentA>=0&&parentA<N)?pLin[parentA]:createLineage(0);',
  'pLin[i]=(parentA>=0&&parentA<N)?pLin[parentA]:(function(){const _v=createLineage(0);globalThis.__lineageMinted&&globalThis.__lineageMinted.add(_v);return _v;})();',
  'mint-founder',2);   // both spawn paths
{ const N2='pLin[i]=_new;'; const h=code.split(N2).length-1;
  if(h>0) code=code.split(N2).join('pLin[i]=_new; globalThis.__lineageMinted&&globalThis.__lineageMinted.add(_new);'); }

const driver=`
;(function(){
  globalThis.__G={};
  globalThis.__g=function(name,pairs){
    let G=globalThis.__G[name];
    if(!G){ G={n:0,pass:0,terms:[],block:[],sole:[]};
      for(let i=0;i<pairs.length;i+=2){G.terms.push(pairs[i]);G.block.push(0);G.sole.push(0);}
      globalThis.__G[name]=G; }
    G.n++;
    let nb=0,last=-1;
    for(let i=1,t=0;i<pairs.length;i+=2,t++){ if(pairs[i]){G.block[t]++;nb++;last=t;} }
    if(nb===0)G.pass++; else if(nb===1)G.sole[last]++;
    return nb>0;
  };
  globalThis.__run=function(n){ for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){globalThis.__derr=(globalThis.__derr||0)+1;} } };
  // NAMESPACE ASSAY. The speciation gate reads lineageRegistry.get(pLin[parentA]). pLin is assigned
  // either from _linNext++ (founders) or from createLineage()'s return (speciated), and
  // lineageRegistry is keyed ONLY by createLineage's counter, nextLineageID. If those are two
  // counters then most pLin values are not registry keys at all and the gate is failing on a lookup
  // miss rather than on the biological criterion it is written in terms of. Measured directly rather
  // than inferred from the gate audit, because inference is how this record's wrong stories start.
  // PROVENANCE ASSAY. pLin is minted from TWO counters: _linNext++ for founders and createLineage()'s
  // nextLineageID++ for speciated particles. The previous assay asked only whether pLin[i] had a
  // registry entry — which is TRUE under numeric aliasing, since both counters start at 1 and their
  // ranges overlap. It therefore could not distinguish "this lineage is registered" from "this number
  // happens to index someone else's entry", and #62's namespace hypothesis was declared refuted on its
  // strength. This one records where each pLin value actually CAME FROM.
  globalThis.__aliasAssay=function(){
    let live=0,alias=0,proper=0,unknown=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; live++;
      const l=pLin[i];
      const isFounder=globalThis.__founderMinted.has(l), isLineage=globalThis.__lineageMinted.has(l);
      if(isFounder&&lineageRegistry.has(l)&&!isLineage) alias++;      // founder id indexing someone else's entry
      else if(isLineage&&lineageRegistry.has(l)) proper++;            // genuinely registered
      else unknown++;
    }
    // how many non-extinct registry entries are held alive ONLY by a founder-minted pLin alias?
    let nonExtinct=0,clusterCarried=0,aliasHeld=0;
    const carried=new Set(); for(const c of clusters) if(c&&c.lineageID) carried.add(c.lineageID);
    const livePLin=new Set(); for(let i=0;i<N;i++) if(palive[i]) livePLin.add(pLin[i]);
    for(const [lid,e] of lineageRegistry){ if(e.extinct)continue; nonExtinct++;
      if(carried.has(lid)) clusterCarried++;
      else if(livePLin.has(lid)&&globalThis.__founderMinted.has(lid)&&!globalThis.__lineageMinted.has(lid)) aliasHeld++; }
    return {live,aliasCarrier:alias,properCarrier:proper,unknown,
            nonExtinctEntries:nonExtinct,clusterCarried,heldAliveByAliasOnly:aliasHeld,
            founderMinted:globalThis.__founderMinted.size,lineageMinted:globalThis.__lineageMinted.size};
  };
  globalThis.__nsAssay=function(){
    let live=0,hit=0;const seen=new Set(),seenHit=new Set();
    for(let i=0;i<N;i++){ if(!palive[i])continue; live++;
      const l=pLin[i]; seen.add(l);
      if(lineageRegistry.has(l)){hit++;seenHit.add(l);} }
    return {liveParticles:live,withRegistryEntry:hit,
            pctWithEntry:live?+(100*hit/live).toFixed(1):0,
            distinctPLin:seen.size,distinctWithEntry:seenHit.size,
            registrySize:lineageRegistry.size,linNextCounter:_linNext,lineageIDCounter:nextLineageID};
  };
})();
`;
// Created BEFORE m._compile so boot-time mints are tagged. The first version put these in the driver
// IIFE, which runs after the sim has already initialised, so every founder minted during boot read as
// "unknown" and the assay silently could not answer the question it was built for.
globalThis.__founderMinted=new Set();
globalThis.__lineageMinted=new Set();
const Module=require('module');
const m=new Module(__dirname+'/gates-sim.js');m.filename=__dirname+'/gates-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS);

const G=globalThis.__G;
const out={seed:process.env.SEED||null,ticks:TICKS,loopErrors,lastErr,driverErr:globalThis.__derr||0,namespace:globalThis.__nsAssay(),alias:globalThis.__aliasAssay(),gates:{}};
for(const name in G){
  const g=G[name];
  out.gates[name]={n:g.n,pass:g.pass,passRate:+(g.pass/Math.max(1,g.n)).toFixed(4),
    terms:g.terms.map((t,i)=>({term:t,block:g.block[i],blockPct:+(100*g.block[i]/Math.max(1,g.n)).toFixed(1),
                               sole:g.sole[i],solePct:+(100*g.sole[i]/Math.max(1,g.n)).toFixed(1)}))};
}
console.log(JSON.stringify(out,null,1));
