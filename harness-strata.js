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
// CULLDOOR multiplies the atom cull's entry probability. #208 measured that door opening once per
// 20,000-63,000 ticks, which is why the cull's four conditions and its atomIdleTolerance dial have
// never been evaluated. That leaves a registered prediction hanging -- "open the door and the gene
// does not stay at 0" -- and a prediction this rig could test and did not is worse than no
// prediction. So the door is settable, HARNESS-SIDE ONLY, and 1 is exactly the shipped behaviour.
//
// This is not a proposal to change the number. It measures what opening it WOULD do, which is the
// information the author needs in order to pick one, and picking it is not mine (#148).
const CULLDOOR=Number(process.env.CULLDOOR||'1');

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
// #212 control arm. __CG_TTL=0 disables clusterGenomes eviction entirely, which is the pre-#212
// engine exactly. The two arms are compared on a fingerprint over live particle state, because a
// prune that touches only unreachable entries must come back BIT-IDENTICAL, and this project's
// standard is to show that rather than argue it.
if(process.env.CG_TTL!==undefined)globalThis.__CG_TTL=parseInt(process.env.CG_TTL,10);
// #215 control arm. MOTIF_SELECT=0 stops motifKeepBias being created at all, so the knob-off engine
// draws no Math.random() for it in mutateGenome and none in mutateChildGenome's key walk either --
// which is what makes it the pre-#215 random stream rather than merely the pre-#215 behaviour.
if(process.env.MOTIF_SELECT!==undefined)globalThis.__MOTIF_SELECT=parseInt(process.env.MOTIF_SELECT,10);
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
globalThis.CULLDOOR_P=CULLDOOR;
globalThis.__cullDoor=function(nAtoms,rate){ const C=globalThis.__CG;
  C.doorEvals++; C.doorProbSum+=Math.min(1,Math.max(0,globalThis.CULLDOOR_P)); if(!(nAtoms>0))C.emptyBank++; };
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
// #216: IS CLUSTER COHERENCE A LIVE DISCRIMINATOR, OR IS IT SATURATED?
//
// #215's forced arm printed the motif bank and every entry read c = 1, 1, 1, 1, 0.96. That voids my
// own rationale for scoring quality as s*c rather than s+c, but the bigger question is not about
// motifs. coherence is the mean resultant length of member phases, and the engine asserts TWICE in
// its own comments that it is orthogonal to size -- "A cluster of 30 with coherence=0.2 (big but
// scattered) is very different from a cluster of 8 with coherence=0.9" (6782) and "ORTHOGONAL TO
// op62 (size): 30 members at coherence=0.2 != 8 members at coherence=0.9" (21785).
//
// If it is saturated near 1 in practice, that declared orthogonality is false and several live gates
// are effectively constants: the cosmos launch gate (c.coherence >= COSMOS_LAUNCH_COH, 14186),
// collectClusterUpstream's qualification (c.coherence < 0.45 rejects, 17191), the territory score
// (c.avgAmp*0.5 + c.coherence*0.35, 13832) and the dissolution fossil quality (13565).
//
// Measured at the point of COMPUTATION, so every cluster is counted rather than only the ones that
// pass the motif filter (persistAge>5 && size>5) -- which is the sampling error that would make a
// saturated reading look like a saturated variable. Binned by size too, because the claim under test
// is specifically that the two are independent.
// belowUpstreamGate and belowLaunchGate are counted DIRECTLY against the real thresholds. The first
// version derived them from the histogram with a bins[4]*0.5 fudge for the 0.45 boundary, which is
// an approximation reported as a number -- the precise error this arc keeps catching in other
// people's code and had no business committing in its own.
globalThis.__COH={n:0,sum:0,min:Infinity,max:-Infinity,bins:new Array(10).fill(0),bySize:{},belowUpstreamGate:0,ge0p9:0};
globalThis.__coh=function(v,n){ const C=globalThis.__COH;
  if(!(v>=0&&v<=1))return;
  C.n++; C.sum+=v; if(v<C.min)C.min=v; if(v>C.max)C.max=v;
  let b=Math.floor(v*10); if(b>9)b=9; C.bins[b]++;
  if(v<0.45)C.belowUpstreamGate++;   // collectClusterUpstream rejects below this (17191)
  if(v>=0.9)C.ge0p9++;
  const band=n<5?'lt5':n<10?'5-9':n<20?'10-19':n<40?'20-39':'40plus';
  const e=C.bySize[band]||(C.bySize[band]={n:0,sum:0,min:Infinity,max:-Infinity});
  e.n++; e.sum+=v; if(v<e.min)e.min=v; if(v>e.max)e.max=v;
};
globalThis.__COHE={n:0,sum:0,min:Infinity,max:-Infinity,ge0p9:0};
globalThis.__cohElig=function(v,n){ const C=globalThis.__COHE;
  if(!(v>=0&&v<=1))return; C.n++; C.sum+=v; if(v<C.min)C.min=v; if(v>C.max)C.max=v; if(v>=0.9)C.ge0p9++; };
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

// ── MOTIF LAYER. The removal counter that used to live here is RETIRED: #215 replaced both shift()
// sites with motifEvict(), which fires the engine's own motif.evictAge / motif.evictQuality names.
// A rig-side counter for an event the engine now declares is two sources of truth for one number,
// and the declared one wins. Creation is still counted here because no liveness name covers it.
// The witness itself: at the moment motifEvict decides by quality, check that the index it is about
// to splice really is the minimum s*c. Placed on the engine's own line rather than reimplementing the
// rule here, so the check cannot agree with a bug by sharing it.
patch("    M.splice(wi,1); fired('motif.evictQuality'); return;",
      "    {const W=globalThis.__mkbWitness; W.checks++; let mn=Infinity,n=0;\n" +
      "     for(let j=0;j<M.length;j++){const q=(+M[j].s||0)*(+M[j].c||0); if(q<mn){mn=q;n=1;} else if(q===mn)n++;}\n" +
      "     const qw=(+M[wi].s||0)*(+M[wi].c||0); if(qw===mn)W.correct++; if(n>1)W.ties++;}\n" +
      "    M.splice(wi,1); fired('motif.evictQuality'); return;",
      'mkb.witness');
// THE COMPARISON THAT SETTLES IT. Coherence measured at the point of computation covers EVERY
// cluster; coherence measured where a motif is minted covers only those passing persistAge>5 &&
// size>5. If the second is tight and the first is wide, the variable is fine and the MOTIF BANK is a
// biased sample of it -- which is what I generalised from when I called coherence saturated, and is
// the same error as #207 naming a store from one of its four consumers.
patch("          const motif={t:c.tendency.map(v=>+(v.toFixed(3))),s:c.size,c:+(c.coherence.toFixed(2)),age:c.persistAge};",
      "          const motif={t:c.tendency.map(v=>+(v.toFixed(3))),s:c.size,c:+(c.coherence.toFixed(2)),age:c.persistAge};\n" +
      "          globalThis.__cohElig(c.coherence,c.size);",
      'coherence.eligible');
patch("if(!isDupe){genome.stableMotifs.push(motif);",
      "if(!isDupe){globalThis.__bump('motif.push');genome.stableMotifs.push(motif);",
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
// THE OUTER DOOR — RETIRED IN #211, AND THIS RIG'S ANCHOR GUARD IS WHAT CAUGHT IT.
// The first version of this audit instrumented the tolerance gate and the trust window and got
// outer:0 -- the block they live in was never entered at all. Everything below them was downstream of
//   if(genome.userAtoms.length>0 && Math.random() < rate*0.1)
// with rate about 0.06, so the door opened with probability ~0.005 on a path mutateGenome visits
// roughly forty times per 12,000 ticks: one entry per 20,000-63,000 ticks, measured on three seeds.
// #211 deleted that coin. The line is now unconditional on anything but the bank being non-empty.
//
// CULLDOOR survives the change with a new meaning, which is the useful one now: it is the ENTRY
// PROBABILITY, 1 by default (the shipped engine). Setting CULLDOOR=0.005 re-closes the door to
// roughly where it was, so the pre-#211 behaviour stays runnable as a control arm rather than only
// existing in git history.
patch("  if(genome.userAtoms.length>0){",
      "  globalThis.__cullDoor(genome.userAtoms.length,rate);\n" +
      "  if(genome.userAtoms.length>0&&(" + CULLDOOR + ">=1||Math.random()<" + CULLDOOR + ")){ globalThis.__CG.entered++;",
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

// #216m: AND #212 GAVE IT ONE — after this census was written, and by my own hand. The source scan
// below is a tripwire for exactly that, and it FIRED: a delete site now exists, so the layer row fell
// through to its 'unknown' branch and the verdict computed to "NO REMOVAL AT ALL" for a layer that
// had just been given a working eviction. Nothing caught it because this rig's output is not part of
// the push gate, so a tripwire nobody reads is a tripwire that did not fire. The row below now
// recognises the #212 prune by name and keeps the scan as a guard against a SECOND, unclassified site.
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
patch("      phCoh=Math.sqrt(sinSum*sinSum+cosSum*cosSum)/n;",
      "      phCoh=Math.sqrt(sinSum*sinSum+cosSum*cosSum)/n; globalThis.__coh(phCoh,n);",
      'coherence.compute');
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

// MOTIF READS -- ALL OF THEM, BECAUSE #207 COUNTED ONE AND GENERALISED FROM IT.
//
// #207 instrumented the extinction reseed alone, saw 1,981 crossings on the seed with 23 extinctions
// and ZERO on the two with none, and concluded that stableMotifs is "a DEATH-TRIGGERED store -- a
// universe that never dies never uses its cultural memory at all". That is false. The store has four
// live consumers and the reseed is the rarest of them:
//
//   28174  EVERY TICK. Each cluster finds its best-matching motif and, if similarity > 0.3, pulls
//          every member particle's tendency toward it by 0.0001*bestSim. Continuous cultural
//          influence on the living, which is the opposite of death-triggered.
//   26484  the ordinary spawner, at rate culturalBias -- not the extinction path.
//   19365  the extinction reseed, the one #207 measured.
//   26538  the boot reseed from a save.
//
// The zero on two seeds was real and the inference from it was not. Counting one site and naming the
// store after it is the same shape of error as reading atom.author as a bank insertion (#209).
patch("    if(genome.stableMotifs.length>0&&clusters.length>0){",
      "    if(genome.stableMotifs.length>0&&clusters.length>0){globalThis.__bump('motif.read.tick');",
      'motif.read.tick');
patch("  }else if(genome.stableMotifs.length>0&&Math.random()<genome.culturalBias){",
      "  }else if(genome.stableMotifs.length>0&&Math.random()<genome.culturalBias){globalThis.__bump('motif.read.spawn');",
      'motif.read.spawn');
patch("            for(let d=0;d<DIMS;d++)tend[i*DIMS+d]+=(bestMotif.t[d]-tend[i*DIMS+d])*0.0001*bestSim;",
      "            globalThis.__bump('motif.nudge');\n            for(let d=0;d<DIMS;d++)tend[i*DIMS+d]+=(bestMotif.t[d]-tend[i*DIMS+d])*0.0001*bestSim;",
      'motif.nudge');

// Motif -> particle. At extinction, culturalBias of the reseed is drawn from stableMotifs, so the
// cultural layer's content DOES reach the layer where death is conditional. What it cannot do is
// carry the verdict back: the motif's own removal stays FIFO whatever becomes of its descendants.
patch("        const motif=genome.stableMotifs[Math.random()*genome.stableMotifs.length|0];\n        const tv=new Float32Array(DIMS);\n        for(let d=0;d<DIMS;d++)tv[d]=motif.t[d]+(Math.random()-0.5)*0.2;",
      "        globalThis.__bump('motif.toParticle'); const motif=genome.stableMotifs[Math.random()*genome.stableMotifs.length|0];\n        const tv=new Float32Array(DIMS);\n        for(let d=0;d<DIMS;d++)tv[d]=motif.t[d]+(Math.random()-0.5)*0.2;",
      'motif.toParticle');

const Module=require('module');
const driver=`
(function(){
  // #215: FORCE THE DIAL. The gene is seeded at 0 and drifts slowly, so across three seeds and 36,000
  // ticks motif.evictQuality fired ZERO times -- the branch was wired, reachable, and never actually
  // executed. An untested branch in engine.html is a liability whatever the measurement says, so
  // MOTIF_BIAS forces motifKeepBias every tick and the run reports whether the right motif went.
  globalThis.__forcedMKB=(process.env.MOTIF_BIAS!==undefined)?Number(process.env.MOTIF_BIAS):null;
  // Witness: before each eviction, record whether the motif the engine is about to drop is in fact
  // the lowest s*c in the bank. Counting that the branch FIRED is not the same as checking it picked
  // correctly, and this project has shipped a mechanism that fired and did the wrong thing before.
  globalThis.__mkbWitness={checks:0,correct:0,ties:0};
  globalThis.__run=function(n){ for(let s=0;s<n;s++){ globalThis.__detMs+=5;
    if(globalThis.__forcedMKB!==null){ try{ genome.motifKeepBias=globalThis.__forcedMKB; }catch(e){} }
    try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; } } };
  // Read from INSIDE the compiled module: __liveness, the death tallies and the genome are lexical
  // bindings of this module and are not on globalThis. Reading them from the harness file returns
  // undefined, silently -- the exact trap harness-clamp records for its own probe.
  globalThis.__L=function(k){ try{ return __liveness[k]|0; }catch(e){ return -1; } };
  globalThis.__deaths=function(){ try{ return {
    escape:(typeof deathsByEscape!=='undefined')?deathsByEscape:-1,
    physics:(typeof deathsByPhysics!=='undefined')?deathsByPhysics:-1,
    age:(typeof deathsByAge!=='undefined')?deathsByAge:-1 }; }catch(e){ return {error:String(e)}; } };
  // Control fingerprint. CULLDOOR=1 rewrites rate*0.1 to rate*0.1*1, which draws no extra randomness
  // and should come back bit-identical to an unrewritten build. This project's standard is to CHECK
  // that rather than argue it, because "the instrument cannot have perturbed anything" has been wrong
  // here before.
  globalThis.__fingerprint=function(){ try{ let a=0,b=0,c=0,n=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++;
      if(px[i]===px[i]&&py[i]===py[i])a+=px[i]+py[i];
      if(amp[i]===amp[i])b+=amp[i];
      c+=pLin[i]; }
    return {n,pos:+a.toFixed(6),amp:+b.toFixed(6),lin:c,tick:(typeof tick!=='undefined'?tick:-1)};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__state=function(){ try{ let alive=0; for(let i=0;i<N;i++)if(palive[i])alive++;
    return { alive, atoms:(genome.userAtoms||[]).length, maxAtoms:(typeof MAX_USER_ATOMS!=='undefined')?MAX_USER_ATOMS:-1,
      motifs:(genome.stableMotifs||[]).length, motifCap:genome.motifMemorySize,
      atomIdleTolerance:(genome.atomIdleTolerance===undefined?null:+genome.atomIdleTolerance.toFixed(5)),
      motifKeepBias:(genome.motifKeepBias===undefined?null:+genome.motifKeepBias.toFixed(5)),
      motifBank:(genome.stableMotifs||[]).map(m=>({s:m.s,c:m.c,q:+(((+m.s||0)*(+m.c||0)).toFixed(3))})),
      motifEvictAge:__liveness['motif.evictAge']|0, motifEvictQuality:__liveness['motif.evictQuality']|0,
      atomUseProtect:(genome.atomUseProtect===undefined?null:+genome.atomUseProtect.toFixed(5)),
      clusterGenomeEntries:(typeof clusterGenomes!=='undefined')?clusterGenomes.size:-1,
      clusterGenomeSeenEntries:(typeof clusterGenomeSeen!=='undefined')?clusterGenomeSeen.size:-1,
      cgTTL:(typeof CLUSTER_GENOME_TTL!=='undefined')?CLUSTER_GENOME_TTL:-1,
      cgEvicted:__liveness['cluster.cgEvict']|0,
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
     {site:'motifEvict by age (shift)', kind:'unconditional', n:L('motif.evictAge')},
     // #215 made this one conditional on the motif's own measured size and coherence. Whether it
     // ever fires is up to the lineage's motifKeepBias, which is why both rows are reported.
     {site:'motifEvict by quality (s*c)', kind:'conditional', n:L('motif.evictQuality')} ] },
 // #216m: THE KIND IS COMPUTED FROM THE RUN, NOT ASSERTED. #212 evicts a cluster genome whose last
 // touch is older than CLUSTER_GENOME_TTL, and a read HIT re-stamps it. So the prune sorts on use --
 // an entry that keeps being read keeps being spared -- which is conditional under this rig's own
 // definition (age, uses). BUT ONLY IF A RE-STAMP EVER HAPPENS. With zero read-hits every entry dies
 // at exactly TTL and the prune is a timer, which is this rig's 'unconditional': turnover with the
 // variance destroyed rather than sorted. Rather than pick one and write it down, the row reads
 // cg.hit -- the count of read-hits, which IS the count of re-stamps -- and classifies itself. The
 // number is reported beside the verdict so the reading is checkable rather than taken on trust.
 { layer:'cluster genome', created:S['cg.set']|0, removals:
     cgDeletes===0 ? [{site:'(no delete or clear exists in engine.html)', kind:'none', n:0}]
   : cgDeletes===1 ? [{site:'#212 TTL prune on the clusterGenomeSeen last-touch horizon',
                       kind:((S['cg.hit']|0)>0?'conditional':'unconditional'),
                       n:L('cluster.cgEvict'), restampsThatCouldSpare:S['cg.hit']|0,
                       note:((S['cg.hit']|0)>0
                         ? 'read-hits re-stamp, so entries that are used outlive entries that are not'
                         : 'NO read-hit occurred, so nothing was ever spared by use: this run cannot '+
                           'distinguish the prune from a fixed-age timer, and it is counted as one')}]
                   : [{site:'delete/clear x'+cgDeletes+' — a site this rig does not recognise; classify it before trusting this row',
                       kind:'unknown', n:-1}] },
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
  arm:{seed:process.env.SEED||null,ticks:TICKS,cullDoor:CULLDOOR},
  state:st, deaths:d, fingerprint:globalThis.__fingerprint(), clusterGenomeDeleteSitesInSource:cgDeletes,
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
      motifReads:{ perTickClusterMatch:S['motif.read.tick']|0, ordinarySpawner:S['motif.read.spawn']|0,
                   extinctionReseed:S['motif.toParticle']|0, particlesNudged:S['motif.nudge']|0 },
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
  coherence:(function(){ const C=globalThis.__COH; if(!C.n)return {n:0};
    const bySize={}; for(const k in C.bySize){ const e=C.bySize[k];
      bySize[k]={n:e.n, mean:+(e.sum/e.n).toFixed(4), min:+e.min.toFixed(4), max:+e.max.toFixed(4)}; }
    return { n:C.n, mean:+(C.sum/C.n).toFixed(4), min:+C.min.toFixed(4), max:+C.max.toFixed(4),
             // bins[i] counts coherence in [i/10,(i+1)/10). If the mass is all in bins 8-9 the
             // variable is saturated and every gate that reads it is a constant.
             bins:C.bins, fracAtOrAbove0p9:+(C.ge0p9/C.n).toFixed(4),
             fracBelowUpstreamGate0p45:+(C.belowUpstreamGate/C.n).toFixed(4),
             bySize };
  })(),
  coherenceMotifEligible:(function(){ const C=globalThis.__COHE; if(!C.n)return {n:0};
    return {n:C.n, mean:+(C.sum/C.n).toFixed(4), min:+C.min.toFixed(4), max:+C.max.toFixed(4),
            fracAtOrAbove0p9:+(C.ge0p9/C.n).toFixed(4)}; })(),
  mkbWitness:globalThis.__mkbWitness,
  loopErrors,lastErr,driverErr:globalThis.__driverErr||0
},null,1));
