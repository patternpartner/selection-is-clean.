// WHERE DOES SELECTION TERMINATE? (#206) — A CENSUS OF EVERY PERSISTENCE LAYER
//
// #205 ended on a sentence that turned out to be the interesting one: in surface/6, "the thing that
// would be selected against survives every death it causes". The population dies; the germline, the
// atom bank, the cultural memory and the threshold gene all ride through. So this system is not one
// replicator with one mortality boundary. It is a stack of them, each with its own rule for what gets
// removed, and "the system selected X" is underspecified until you say AT WHICH LAYER.
//
// THE TEST, and it is a sharp one. A layer can only be a unit of selection if something REMOVES its
// occupants DIFFERENTIALLY -- conditional on a trait of the thing removed. So classify every removal
// site in the engine into exactly one of three kinds:
//
//   CONDITIONAL    removal depends on a property of the individual (age, uses, credit, amplitude).
//                  This is selection. Count it.
//   UNCONDITIONAL  removal depends only on position or on a cap -- a FIFO shift, a ring buffer, a
//                  wholesale reset. Variance is destroyed, not sorted. This is DRIFT WITH A CEILING,
//                  and it is invisible in an export because the layer still looks like it is turning
//                  over.
//   NONE           nothing ever removes anything. The layer only grows. No selection is possible at
//                  it, whatever the rest of the file says about it.
//
// Then the number that answers the question is, per layer, conditional removals divided by creations.
// Where that ratio is zero, selection has terminated BELOW that layer.
//
// WHY A CENSUS AND NOT AN ABLATION. Every layer here is already declared and already runs. The claim
// under test is not "does this code execute" but "does executing it sort anything", and a count of
// removals by kind answers that directly. Where a removal path exists but never fires, that is the
// #205/uaMaxDepth situation again -- declared, exercised on paper, never reached -- and it shows up
// here as a conditional site with a count of zero, which is a different reading from a site that is
// absent. Both are reported; they are not merged.
//
// HARNESS-SIDE ONLY. engine.html is not modified. Counters are added by source rewrite at named
// anchors, every one of which is asserted to appear exactly once, so a refactor that moves a site
// fails this rig loudly instead of silently reporting a zero.
//
// Env: SEED  TICKS (default 12000)
const fs=require('fs');
const TICKS=parseInt(process.env.TICKS||'12000',10);

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
const CTX=selfProxy();
function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1,height:1,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
const ELS={};
globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;
globalThis.innerWidth=1280;globalThis.innerHeight=720;
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

const html=fs.readFileSync(__dirname+'/engine.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

globalThis.__S={};
// Crossing bookkeeping. Kept on globalThis and called FROM the compiled module, because tick and the
// cluster hashes are lexical bindings there and cannot be read from this file.
globalThis.__cgTick=new Map();   // hash -> tick it was last written
globalThis.__cgAges=[];          // age in ticks of every get() that HIT
// Sole-blocker tallies for the idle cull. Kept on globalThis and called from inside the module.
globalThis.__CG={doorEvals:0,entered:0,doorProbSum:0,emptyBank:0,outer:0,tolZero:0,noTrust:0,bothBlocked:0,bothOpen:0,tolMax:0,winMax:0,
                 atomEvals:0,grace:0,used:0,alien:0,credit:0,soleGrace:0,soleUsed:0,soleAlien:0,soleCredit:0,noneBlocked:0};
globalThis.__cullDoor=function(nAtoms,rate){ const C=globalThis.__CG;
  C.doorEvals++; C.doorProbSum+=Math.max(0,rate*0.1); if(!(nAtoms>0))C.emptyBank++; };
globalThis.__cullGate=function(tol,usePop,winAge,winNeed){ const C=globalThis.__CG;
  C.outer++; if(tol>C.tolMax)C.tolMax=tol; if(winAge>C.winMax)C.winMax=winAge;
  const tolOk=tol>0, trustOk=(usePop===1)&&(winAge>winNeed);
  if(!tolOk&&!trustOk)C.bothBlocked++; else if(!tolOk)C.tolZero++; else if(!trustOk)C.noTrust++; else C.bothOpen++; };
globalThis.__cullAtom=function(grace,used,alien,credit){ const C=globalThis.__CG;
  C.atomEvals++;
  if(grace)C.grace++; if(used)C.used++; if(alien)C.alien++; if(credit)C.credit++;
  const n=(grace?1:0)+(used?1:0)+(alien?1:0)+(credit?1:0);
  if(n===0)C.noneBlocked++;
  else if(n===1){ if(grace)C.soleGrace++; else if(used)C.soleUsed++; else if(alien)C.soleAlien++; else C.soleCredit++; } };
globalThis.__cgNote=function(h,t){ try{ globalThis.__cgTick.set(h,t); }catch(e){} };
globalThis.__cgRead=function(h,t,hit){ try{
  globalThis.__S['cg.get']=(globalThis.__S['cg.get']||0)+1;
  if(hit){ globalThis.__S['cg.hit']=(globalThis.__S['cg.hit']||0)+1;
    const w=globalThis.__cgTick.get(h); if(w!==undefined)globalThis.__cgAges.push(t-w); }
}catch(e){} };
function bump(k){ globalThis.__S[k]=(globalThis.__S[k]||0)+1; }
globalThis.__bump=bump;

// Every anchor is asserted exactly once. A rig that silently reports zero because a site moved is
// worse than no rig: it reads as a finding.
const CULL_INNER_OLD = [
  '          if((a.age|0)<=UA_GRACE_AGE)continue;',
  '          if((__atomExprUses.get(a.expression)||0)!==0)continue;      // ran this window, population-wide',
  '          if(_alienSelectC&&alienGrip(a)>0)continue;'
].join('\n');
const CULL_INNER_NEW = [
  '          {let _cr0=0;',
  '           if(__ATOM_CREDIT&&a.creditTrace>0)_cr0=a.creditTrace;',
  '           if(__EXPR_CREDIT){const _pc0=__atomExprCredit.get(a.expression)||0; if(_pc0>_cr0)_cr0=_pc0;}',
  '           globalThis.__cullAtom((a.age|0)<=UA_GRACE_AGE,(__atomExprUses.get(a.expression)||0)!==0,',
  '                                 !!(_alienSelectC&&alienGrip(a)>0),_cr0>0);}',
  '          if((a.age|0)<=UA_GRACE_AGE)continue;',
  '          if((__atomExprUses.get(a.expression)||0)!==0)continue;      // ran this window, population-wide',
  '          if(_alienSelectC&&alienGrip(a)>0)continue;'
].join('\n');
const fails=[];
function patch(anchor,replacement,label,expect){
  const n=code.split(anchor).length-1;
  if(n!==(expect===undefined?1:expect)){ fails.push(label+': expected '+(expect===undefined?1:expect)+' site(s), found '+n); return; }
  code=code.split(anchor).join(replacement);
}

// ── MOTIF LAYER. Creation is a push; removal is shift(), which is FIFO and reads nothing about the
// motif it drops. If that is the only removal path, the cultural layer cannot be selected at all --
// it can only be aged out, which sorts by arrival order and by nothing else.
patch("while(genome.stableMotifs.length>genome.motifMemorySize)genome.stableMotifs.shift();",
      "while(genome.stableMotifs.length>genome.motifMemorySize){globalThis.__bump('motif.shift');genome.stableMotifs.shift();}",
      'motif.shift.cap');
patch("if(!isDupe){genome.stableMotifs.push(motif);if(genome.stableMotifs.length>5)genome.stableMotifs.shift();",
      "if(!isDupe){globalThis.__bump('motif.push');genome.stableMotifs.push(motif);if(genome.stableMotifs.length>5){globalThis.__bump('motif.shift');genome.stableMotifs.shift();}",
      'motif.push');

// ── ATOM LAYER. fired('atom.author') sits at the top of uaGenExpression(), which GENERATES an
// expression; it is not the same event as an atom entering the bank, and reading it as one inflated
// the created count by an order of magnitude in this rig's first run (570 authored against a bank
// holding 18). The layer's creation event is the push into genome.userAtoms, and it has four sites:
// one germline authoring path, and three by which an atom ARRIVES from somewhere else -- the wire,
// horizontal transfer, and seeding into a particle. They are counted separately, because a bank that
// grows by transfer and a bank that grows by invention are different claims about the same number.
patch("genome.userAtoms.push({expression,compiled:null,failed:false,uses:0,age:0,alienHits:0,alienAttempts:0,creditTrace:_seedCr});",
      "globalThis.__bump('atom.insert.germline'),genome.userAtoms.push({expression,compiled:null,failed:false,uses:0,age:0,alienHits:0,alienAttempts:0,creditTrace:_seedCr});",
      'atom.insert.germline');
patch("_g.userAtoms.push({expression:_ex,compiled:null,failed:false,uses:0,state:0,creditTrace:0});",
      "globalThis.__bump('atom.insert.wire'),_g.userAtoms.push({expression:_ex,compiled:null,failed:false,uses:0,state:0,creditTrace:0});",
      'atom.insert.wire');
patch("_g.userAtoms.push({expression:_a.expression,compiled:null,failed:false,uses:0,state:0,creditTrace:_seedC});",
      "globalThis.__bump('atom.insert.seed'),_g.userAtoms.push({expression:_a.expression,compiled:null,failed:false,uses:0,state:0,creditTrace:_seedC});",
      'atom.insert.seed');
patch("recv.userAtoms.push({expression:donorExpr,compiled:null,failed:false,uses:0,state:0,creditTrace:_seedCT});",
      "globalThis.__bump('atom.insert.hgt'),recv.userAtoms.push({expression:donorExpr,compiled:null,failed:false,uses:0,state:0,creditTrace:_seedCT});",
      'atom.insert.hgt');

// ── WHY THE IDLE CULL NEVER FIRES — A SOLE-BLOCKER AUDIT (#208)
// #206 found the atom bank's idle cull firing zero times on every seed, and #207 found the wire that
// feeds it (creditTrace) computed and consumed by nothing. Before calling that unreachable, the gate
// has to be taken apart: this project has a standing rule that an unfired thing is not automatically
// a defect, and the cull's OWN comment is a standing decision -- "If releasing idle atoms costs
// fitness the gene goes to 0 and stays; if it pays, it rises. That is the whole point and I am not
// going to pick the number." So a cull that is silent because atomIdleTolerance sat at 0 is the
// system deciding, and must not be reported as a broken mechanism.
//
// The two readings are distinguishable, and harness-gates.js already established how: count, for each
// term, how often it was the SOLE blocker. A term that is never the sole blocker cannot be what is
// holding the gate shut.
//
//   _tol      genome.atomIdleTolerance, seeded at 0, walked by maybe(...,0.15), __cl'd to [0,1].
//             Sole blocker => the silence is the lineage's own choice.
//   _trust    __ATOM_USE_POP && (tick - __atomUseWindowStart) > ATOM_IDLE_WINDOW (2000). The window
//             start is RESTAMPED every time __atomExprUses passes 5,000 entries, so a busy world can
//             in principle keep resetting the clock and never accumulate 2,000 ticks of window.
//             Sole blocker => the silence is structural and choice never gets a say.
//   per-atom  grace age, population-wide uses, alien grip, credit.
// THE OUTER DOOR, which turned out to be the whole answer. The first version of this audit
// instrumented the tolerance gate and the trust window and got outer:0 -- the block they live in was
// never entered at all in 3,000 ticks. Everything below them is downstream of one coin flip:
//   if(genome.userAtoms.length>0 && Math.random() < rate*0.1)
// with rate = genome.mutationRate * stabilityFactor, about 0.06. So the door opens with probability
// ~0.006 on a path mutateGenome visits roughly forty times per 12,000 ticks. Counting the evaluation
// separately from the entry is the only way to tell "the conditions were consulted and refused" from
// "the conditions were never consulted".
patch("  if(genome.userAtoms.length>0&&Math.random()<rate*0.1){",
      "  globalThis.__cullDoor(genome.userAtoms.length,rate);\n" +
      "  if(genome.userAtoms.length>0&&Math.random()<rate*0.1){ globalThis.__CG.entered++;",
      'cull.door');
patch("      const _tol=__cl(finiteOr(genome.atomIdleTolerance,0),0,1);",
      "      const _tol=__cl(finiteOr(genome.atomIdleTolerance,0),0,1);\n" +
      "      globalThis.__cullGate(_tol,__ATOM_USE_POP?1:0,tick-__atomUseWindowStart,ATOM_IDLE_WINDOW);",
      'cull.outer');
patch(CULL_INNER_OLD, CULL_INNER_NEW, 'cull.inner');

// ── CLUSTER-GENOME LAYER. clusterGenomes is a Map keyed by cluster hash that carries a cluster's
// evolved parameters across detection cycles. The engine's own comment at its declaration says
// "Selection: clusters that bud successfully propagate their clusterGenome". So the ENTRIES are the
// unit. The question this rig exists to settle is whether anything ever takes one out.
patch("clusterGenomes.set(","globalThis.__bump('cg.set'),clusterGenomes.set(",'cg.set',2);

const cgDeletes=(code.match(/clusterGenomes\.(delete|clear)\(/g)||[]).length;

// ── THE CROSSING CENSUS (#207). #206 said where selection terminates. This says whether anything
// accumulated ABOVE that line can ever get back below it, into the one layer where removal is
// conditional. A store that only fills is dead weight; a store that is READ BACK is memory, and the
// number that separates them is not the size of the store but the AGE of the entries that get read.
//
// clusterGenomes has exactly one read site: a newly detected cluster that matches a previous one BY
// HASH inherits its genome. So a dead entry is not gone, it is dormant -- it wakes if a cluster with
// that hash re-forms. Whether that ever happens, and how far back it reaches, is the whole question
// for this layer, and it is measurable: record the tick of every write and the age of every hit.
patch("clusterGenomes.set(c.hash,c.clusterGenome);",
      "globalThis.__cgNote(c.hash,tick),clusterGenomes.set(c.hash,c.clusterGenome);",'cg.set.cluster');
patch("clusterGenomes.set(daughter.hash,daughterCG);",
      "globalThis.__cgNote(daughter.hash,tick),clusterGenomes.set(daughter.hash,daughterCG);",'cg.set.daughter');
patch("      const prevCG=clusterGenomes.get(bestMatch.hash);",
      "      const prevCG=clusterGenomes.get(bestMatch.hash); globalThis.__cgRead(bestMatch.hash,tick,prevCG!==undefined);",
      'cg.get');

// The upward channel, the one crossing in this engine explicitly built for the job: qualifying
// clusters donate a VM motif into a buffer, and the buffer is drained into the GLOBAL vmProgram. Both
// ends are counted, because a buffer that fills and never drains is the same shape of finding as a
// store that fills and is never read.
patch("      clusterUpstreamBuffer.push({","      globalThis.__bump('up.push'),clusterUpstreamBuffer.push({",'up.push');
patch("    const upstream=clusterUpstreamBuffer.shift();",
      "    globalThis.__bump('up.drain'); const upstream=clusterUpstreamBuffer.shift();",'up.drain');

// Motif -> particle. At extinction, culturalBias of the reseed is drawn from stableMotifs, so the
// cultural layer's content DOES reach the layer where death is conditional. What it cannot do is
// carry the verdict back: the motif's own removal stays FIFO whatever becomes of its descendants.
patch("        const motif=genome.stableMotifs[Math.random()*genome.stableMotifs.length|0];\n        const tv=new Float32Array(DIMS);\n        for(let d=0;d<DIMS;d++)tv[d]=motif.t[d]+(Math.random()-0.5)*0.2;",
      "        globalThis.__bump('motif.toParticle'); const motif=genome.stableMotifs[Math.random()*genome.stableMotifs.length|0];\n        const tv=new Float32Array(DIMS);\n        for(let d=0;d<DIMS;d++)tv[d]=motif.t[d]+(Math.random()-0.5)*0.2;",
      'motif.toParticle');

const Module=require('module');
const driver=`
(function(){
  globalThis.__run=function(n){ for(let s=0;s<n;s++){ globalThis.__detMs+=5;
    try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; } } };
  // Read from INSIDE the compiled module: __liveness, the death tallies and the genome are lexical
  // bindings of this module and are not on globalThis. Reading them from the harness file returns
  // undefined, silently -- the exact trap harness-clamp records for its own probe.
  globalThis.__L=function(k){ try{ return __liveness[k]|0; }catch(e){ return -1; } };
  globalThis.__deaths=function(){ try{ return {
    escape:(typeof deathsByEscape!=='undefined')?deathsByEscape:-1,
    physics:(typeof deathsByPhysics!=='undefined')?deathsByPhysics:-1,
    age:(typeof deathsByAge!=='undefined')?deathsByAge:-1 }; }catch(e){ return {error:String(e)}; } };
  globalThis.__state=function(){ try{ let alive=0; for(let i=0;i<N;i++)if(palive[i])alive++;
    return { alive, atoms:(genome.userAtoms||[]).length, maxAtoms:(typeof MAX_USER_ATOMS!=='undefined')?MAX_USER_ATOMS:-1,
      motifs:(genome.stableMotifs||[]).length, motifCap:genome.motifMemorySize,
      clusterGenomeEntries:(typeof clusterGenomes!=='undefined')?clusterGenomes.size:-1,
      clustersNow:(typeof clusters!=='undefined')?clusters.length:-1,
      extinctions:genome.extinctions|0, generation:genome.generation|0, totalTicks:genome.totalTicks|0 };
  }catch(e){ return {error:String(e&&e.message||e)}; } };
})();
`;
if(fails.length){ console.log(JSON.stringify({error:'ANCHORS',fails},null,1)); process.exit(1); }
const m=new Module(__dirname+'/strata-sim.js');m.filename=__dirname+'/strata-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS);

const L=globalThis.__L, S=globalThis.__S, st=globalThis.__state(), d=globalThis.__deaths();
const deathsTotal=(d.escape|0)+(d.physics|0)+(d.age|0);

// kind: 'conditional' (a trait of the individual decides), 'unconditional' (position or a cap decides),
// 'none' (no removal path exists in the source at all).
const layers=[
 { layer:'particle', created:L('birth.paid'), removals:[
     {site:'death (escape/physics/age)', kind:'conditional', n:deathsTotal} ] },
 { layer:'atom (germline bank)', created:S['atom.insert.germline']|0, removals:[
     {site:'evict at MAX_USER_ATOMS (pickAtomToEvict)', kind:'conditional', n:L('atom.evict')},
     {site:'idle cull', kind:'conditional', n:L('atom.cull')} ] },
 { layer:'opcode slot', created:L('atom.opAuthor'), removals:[
     {site:'opCull', kind:'conditional', n:L('atom.opCull')} ] },
 { layer:'motif (cultural memory)', created:S['motif.push']|0, removals:[
     {site:'shift() past motifMemorySize', kind:'unconditional', n:S['motif.shift']|0} ] },
 { layer:'cluster genome', created:S['cg.set']|0, removals:
     cgDeletes===0 ? [{site:'(no delete or clear exists in engine.html)', kind:'none', n:0}]
                   : [{site:'delete/clear', kind:'unknown', n:-1}] },
 { layer:'germline (this universe)', created:1, removals:[
     {site:'extinction reseeds FROM the germline (saveGenome after N=0)', kind:'unconditional', n:st.extinctions} ] },
 { layer:'universe', created:L('cosmos.found')+L('cosmos.launch'), removals:[
     {site:'cosmos.merge', kind:'conditional', n:L('cosmos.merge')} ] },
];
for(const x of layers){
  x.conditionalRemovals=x.removals.filter(r=>r.kind==='conditional').reduce((a,r)=>a+Math.max(0,r.n),0);
  x.selectionRatio = x.created>0 ? +(x.conditionalRemovals/x.created).toFixed(5) : null;
  // The verdict is deliberately blunt. A layer with creations and zero conditional removals is not
  // "weakly selected"; nothing at that layer has been sorted even once in this run.
  x.verdict = x.created===0 ? 'nothing created'
            : x.conditionalRemovals>0 ? 'SELECTED'
            : x.removals.some(r=>r.kind==='unconditional'&&r.n>0) ? 'turnover, but UNCONDITIONAL'
            : 'NO REMOVAL AT ALL';
}
console.log(JSON.stringify({
  arm:{seed:process.env.SEED||null,ticks:TICKS},
  state:st, deaths:d, clusterGenomeDeleteSitesInSource:cgDeletes,
  crossings:(function(){
    const srt=[...(globalThis.__cgAges||[])].sort((x,y)=>x-y);
    return {
      clusterGenome:{ reads:S['cg.get']|0, hits:S['cg.hit']|0, writes:S['cg.set']|0,
        hitFrac:(S['cg.get']|0)?+((S['cg.hit']|0)/(S['cg.get']|0)).toFixed(4):0,
        hitAgeTicks:{ n:srt.length, min:srt.length?srt[0]:null,
          median:srt.length?srt[srt.length>>1]:null, max:srt.length?srt[srt.length-1]:null,
          overA1000Ticks:srt.filter(v=>v>1000).length } },
      clusterUpstream:{ donated:S['up.push']|0, drainedIntoGlobalVM:S['up.drain']|0 },
      motifToParticle:S['motif.toParticle']|0,
      atomToParticle:S['atom.insert.seed']|0
    };
  })(),
  layers,
  cosmos:{launch:L('cosmos.launch'),found:L('cosmos.found'),merge:L('cosmos.merge'),foundRefused:L('cosmos.foundRefused')},
  atomCullIdleFirings:L('atom.cull.idle'),
  // THE FEEDBACK SIGNAL AND ITS CONSUMER, side by side. applyCreditAssignment computes per-atom
  // creditTrace -- the one quantity in this engine that carries a VERDICT from the layer where
  // selection happens back up to the atom bank. The idle cull is the thing that reads it and acts.
  // Printing the producer next to the consumer is the whole point: a signal computed thousands of
  // times whose only consumer fires zero times is not a weak selection pressure, it is an
  // unterminated wire.
  creditLoop:{ signalComputed:L('atom.credit'), consumerFired:L('atom.cull.idle')+L('atom.cull') },
  // Sole-blocker audit. tolZero dominating means the LINEAGE chose; noTrust dominating means the
  // window clock is structural and choice never gets a say; bothOpen with zero culls means the
  // per-atom terms are doing it and the sole* counters say which.
  cullGate:Object.assign({},globalThis.__CG,{
    meanDoorProb:globalThis.__CG.doorEvals?+(globalThis.__CG.doorProbSum/globalThis.__CG.doorEvals).toFixed(5):0,
    expectedEntries:+(globalThis.__CG.doorProbSum).toFixed(3),
    ticksPerEntryIfLinear:globalThis.__CG.doorProbSum>0?Math.round(TICKS/globalThis.__CG.doorProbSum):null}),
  // Reported beside the layer row, not inside it: uaGenExpression() calls are NOT bank insertions.
  atomFlow:{expressionsAuthored:L('atom.author'), insertedGermline:S['atom.insert.germline']|0,
            arrivedByWire:S['atom.insert.wire']|0, arrivedBySeed:S['atom.insert.seed']|0,
            arrivedByHGT:S['atom.insert.hgt']|0},
  births:{paid:L('birth.paid'),refused:L('birth.refused')},
  loopErrors,lastErr,driverErr:globalThis.__driverErr||0
},null,1));
