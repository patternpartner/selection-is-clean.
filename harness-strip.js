// STRIP-DOWN — what does this system do if you SUBTRACT the machinery instead of adding more?
//
// Forty-eight swings added mechanism. Every measurement taken on the #49/#50 rig says mechanism is what is
// being paid for: the gen83 atom bank is a net drag in 4/5 seeds; the 116-gene meta-influence layer raises
// diversity by ~0.9 kinds when removed (4/5 seeds, beats its own noise); and vmGain, shipped unbounded so
// selection could buy any consequence it wanted, fell 1.0 -> 0.217 with the whole pool converged on the floor.
// Three independent measurements, three directions, one conclusion.
//
// So this runs the experiment the project has never run: a 2x2 that subtracts BOTH load-bearing-by-annotation
// subsystems, separately and together, and asks whether the stripped system beats the full one on the metric the
// whole #11-#39 arc was built to move. STRIP=none|meta|bank|both.
//
// This is not a proposed change to engine.html. It is a measurement of how much of the accretion is load.
//
// (original header retained below — this file began as the meta-only ablation)
// META-INFLUENCE ABLATION — is the inflated meta layer HARMFUL, or harmless free weight?
//
// The atrophy probe proved the 116-gene meta-influence layer is inert BY ATTRIBUTION (protected=0)
// and net-inflates 4-5x despite the pruner. But inert-by-attribution is not the same as harmful:
// before adding any pruning cost to engine.html (a real new selection pressure), we must know whether
// the inflation actually costs fitness or is harmless dead weight the system correctly ignores.
//
// Whole-layer ablation, same method as harness-ablate-bank: force every ATROPHY_SAFE influence param
// to 0 on every genome (self + every lineage clone) every cycle, vs intact, matched seeds. If ablated
// meanAmp >= intact, the meta layer is NOT load-bearing (harmless or wasteful bloat — pruning it can
// only help or do nothing, so a carry-cost change is warranted). If ablated < intact robustly, the
// layer IS contributing despite the attribution saying otherwise — pruning would hurt, no change.
//
// Env: SEEDS (default 11,13,17)  TICKS (default 20000)  ABLATE_META=1 zeros the layer.
const fs = require('fs');
const TICKS = parseInt(process.env.TICKS || '20000', 10);
const STRIP = (process.env.STRIP || (process.env.ABLATE_META === '1' ? 'meta' : 'none')).toLowerCase();
if(!['none','meta','bank','both'].includes(STRIP)){ console.log(JSON.stringify({error:'STRIP must be none|meta|bank|both'})); process.exit(1); }
const ABLATE = (STRIP === 'meta' || STRIP === 'both');       // zero the 116 meta-influence genes
const ABLATE_BANK = (STRIP === 'bank' || STRIP === 'both');  // pin every authored atom to constant 0
// EXTRA=<name>: strip one further subsystem ON TOP of the current arm, so the measurement is the MARGINAL
// cost of that subsystem against an already-stripped baseline — which is the question the additive result
// posed. Each is a single verified-unique chokepoint at a function entry; the function still gets CALLED
// (so a dead call-path cannot masquerade as a cheap layer), it just returns before doing anything.
const EXTRA = (process.env.EXTRA || 'none').toLowerCase();
const EXTRA_TARGETS = {
  shadow:  ['function runShadowSim(){',          'function runShadowSim(){ if(globalThis.__x)return;'],
  credit:  ['function applyCreditAssignment(){', 'function applyCreditAssignment(){ if(globalThis.__x)return;'],
  alien:   ['function runAlienPrediction(){',    'function runAlienPrediction(){ if(globalThis.__x)return;'],
  reflex:  ['function updateClusterReflex(){',   'function updateClusterReflex(){ if(globalThis.__x)return;'],
  learn:   ['function selfLearnFromBest(){',     'function selfLearnFromBest(){ if(globalThis.__x)return;'],
  decide:  ['function decideFromRealWinner(){',  'function decideFromRealWinner(){ if(globalThis.__x)return;'],
  niche:   ['function applyNicheEconomy(){',     'function applyNicheEconomy(){ if(globalThis.__x)return;'],
};
if(EXTRA!=='none' && !EXTRA_TARGETS[EXTRA]){ console.log(JSON.stringify({error:'EXTRA must be none|'+Object.keys(EXTRA_TARGETS).join('|')})); process.exit(1); }

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

// INDEX= lets the same strip arms run against a DIFFERENT build — specifically the pre-#49 clamped
// economy (git show d6febcb:index.html). That answers the question the rig cannot: are the meta/bank
// taxes visible in the economy the LIVE ARTWORK actually runs, or only on the instrument?
const html=fs.readFileSync(process.env.INDEX||(__dirname+'/engine.html'),'utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];
function patchOnce(find,repl,label){const n=code.split(find).length-1;if(n!==1){console.log(JSON.stringify({error:`patch ${label} x${n}`}));process.exit(1);}code=code.replace(find,repl);}

if(ABLATE){
  // Zero every ATROPHY_SAFE param on every fresh lineage clone.
  patchOnce(
    'function cloneGenome(src){\n  const g={...src}; // scalars copied by value → each lineage OWNS its physics; objects shared by ref',
    'function cloneGenome(src){\n  const g={...src}; // scalars copied by value → each lineage OWNS its physics; objects shared by ref\n  try{ if(typeof ATROPHY_SAFE!=="undefined")for(const _p of ATROPHY_SAFE)g[_p]=0; }catch(e){}',
    'clone-zero');
  // And re-zero the self genome every mutate cycle so it can never drift the layer back up.
  patchOnce(
    'function mutateGenome(){',
    'function mutateGenome(){\n  try{ if(typeof ATROPHY_SAFE!=="undefined")for(const _p of ATROPHY_SAFE)genome[_p]=0; }catch(e){}',
    'mutate-zero');
}

if(ABLATE_BANK){
  // Single chokepoint: every atom invocation returns 0 regardless of expression. Also neutralises any
  // atom authored mid-run, so the bank cannot regrow into the arm. Mirrors harness-ablate-bank's ABLATE=all.
  patchOnce(
    'function uaCall(atom,a,b){\n  if(!atom)return 0;',
    'function uaCall(atom,a,b){\n  if(!atom)return 0;\n  if(globalThis.__stripBank){ atom.uses=(atom.uses|0)+1; return 0; } // STRIP=bank/both: executed, but its output reaches nothing',
    'bank-zero');
}

if(EXTRA!=='none'){
  const [find,repl]=EXTRA_TARGETS[EXTRA];
  patchOnce(find, repl, 'extra-'+EXTRA);
}

// count the atom-birth event itself — two causal stories about "no atoms" have now been wrong, both
// because the readout could not distinguish "never attempted" from "attempted and removed".
{ const N4='const expression=uaGenExpression();';
  const h4=code.split(N4).length-1;
  if(h4===1) code=code.replace(N4, 'globalThis.__uaBirths=(globalThis.__uaBirths||0)+1; '+N4); }
{ const N5='function mutateGenome(){';
  const h5=code.split(N5).length-1;
  if(h5===1) code=code.replace(N5, N5+' globalThis.__mutCalls=(globalThis.__mutCalls||0)+1;'); }

const driver=`
;(function(){
  globalThis.__stripBank=${ABLATE_BANK}; globalThis.__x=${EXTRA!=='none'};
  function __binOf(i){ if(typeof tendBin==='function'){try{return tendBin(i);}catch(e){}} const b=i*DIMS;let r=0;for(let d=0;d<3&&d<DIMS;d++){let q=((tend[b+d]+1.2)/2.4*4)|0;q=q<0?0:q>3?3:q;r=r*4+q;}return r; }
  globalThis.__samples=[];
  // KIND PURITY — does a lineage OWN a tendency bin, or do particles merely wander through it?
  // Drift occupies a bin with scattered particles from many lineages; novelty occupies it with a coherent
  // lineage that found it and holds it. Raw purity is confounded (a size-1 bin scores 1.0 by construction,
  // so drift's many-small-bins inflate it), so this reports purity against a SHUFFLED-LABEL NULL: same bin
  // sizes, same lineage abundances, lineage labels permuted. excess = real - shuffled is the structure that
  // is not explained by how many bins there are and how common each lineage is.
  // The shuffle uses its OWN prng — it must never draw from Math.random, which would consume the sim's
  // seeded stream and change the trajectory being measured.
  let __ps=0x9E3779B9; function __prand(){ __ps=(__ps+0x6D2B79F5)|0; let t=Math.imul(__ps^__ps>>>15,1|__ps); t=(t+Math.imul(t^t>>>7,61|t))^t; return ((t^t>>>14)>>>0)/4294967296; }
  function __purity(binOf,linOf,n){
    const bins=[],lins=[];
    for(let i=0;i<n;i++){ if(!palive[i])continue; bins.push(binOf(i)); lins.push(linOf(i)); }
    if(!bins.length) return {p:0,pn:0,ex:0,owned:0};
    function score(labels){
      const h={},sz={};
      for(let k=0;k<bins.length;k++){ const b=bins[k]; (h[b]=h[b]||{}); h[b][labels[k]]=(h[b][labels[k]]||0)+1; sz[b]=(sz[b]||0)+1; }
      let wsum=0,wtot=0,owned=0;
      for(const b in sz){ let mx=0; for(const l in h[b]) if(h[b][l]>mx)mx=h[b][l];
        const pr=mx/sz[b]; wsum+=pr*sz[b]; wtot+=sz[b];
        if(sz[b]>=5 && pr>=0.5) owned++; }               // owned: a real bin (>=5) majority-held by one lineage
      return {p:wtot?wsum/wtot:0, owned};
    }
    const real=score(lins);
    const sh=lins.slice();
    for(let k=sh.length-1;k>0;k--){ const j=(__prand()*(k+1))|0; const t=sh[k]; sh[k]=sh[j]; sh[j]=t; }
    const nul=score(sh);
    return {p:+real.p.toFixed(4), pn:+nul.p.toFixed(4), ex:+(real.p-nul.p).toFixed(4), owned:real.owned, ownedNull:nul.owned};
  }
  function sample(){ let alive=0,ampSum=0; const bc={}; for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; ampSum+=amp[i]; const b=__binOf(i); bc[b]=(bc[b]||0)+1; }
    const __modes=(function(){try{
      const h=[0,0,0,0,0],b=[0,0,0,0,0]; let n=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; n++; h[pMode[i]]++; b[pModeBias[i]]++; }
      if(!n)return null;
      const frac=h.map(x=>+(x/n).toFixed(3));
      const occupied=h.filter(x=>x>0).length;
      // Shannon evenness over modes: 1 = all five equally held, 0 = everything in one mode.
      let H=0; for(const x of h){ if(x>0){ const pr=x/n; H-=pr*Math.log(pr); } }
      return {frac,occupied,evenness:+(H/Math.log(5)).toFixed(3),biasFrac:b.map(x=>+(x/n).toFixed(3))};
    }catch(e){return null;}})();
    // WAVE 8 (#59) COSMOS CENSUS. Built to measure the MECHANISM rather than my hypothesis about it —
    // #57's census caught a failure it had NOT predicted precisely because it read the mechanism. So
    // launches, deaths, emitters, emissions and merges are counted SEPARATELY, because "it fired" and
    // "it paid out" are different claims and #58 shipped a wave that confused them. launchDrive is the
    // payout test that does not depend on my reading: launching costs amp up front and returns nothing
    // unless a child beats the odds, so if contact is worth nothing, cluster-level selection should push
    // the heritable propensity DOWN across a run.
    const __cos=(function(){try{
      if(typeof cosmosStats==='undefined')return null;
      let dsum=0,dn=0;
      for(const c of clusters){const g=c&&c.clusterGenome;if(g&&isFinite(g.launchDrive)){dsum+=g.launchDrive;dn++;}}
      return {launches:cosmosStats.launches,deaths:cosmosStats.deaths,everExported:cosmosStats.everExported,
              fluxTicksOut:cosmosStats.fluxTicksOut,merges:cosmosStats.merges,senseReads:cosmosStats.senseReads,senseHits:cosmosStats.senseHits,
              // Knob nesting reported rather than left to be rediscovered: merge's criterion is a fact
              // about cumulative export, and export only happens in cosmosFlux, so CONTACT=0 zeroes
              // MERGE too. #59's ablation table read these as independent and its MERGE row was
              // confounded by exactly this.
              knobsNested:((globalThis.__COSMOS_CONTACT??1)|0)===0?'CONTACT=0 also zeroes MERGE':null,
              // #60 boundary accounting. fluxErr is the assay that can return "matter was created" and
              // so falsify the wave's central claim; parasites/netNeg answer whether the two-way channel
              // is real or whether inward flow is a direction that exists only in the comment.
              fluxOut:+cosmosStats.fluxOut.toFixed(4),fluxIn:+cosmosStats.fluxIn.toFixed(4),
              netFlux:+(cosmosStats.fluxOut-cosmosStats.fluxIn).toFixed(4),
              fluxErr:cosmosStats.fluxErr,fluxErrMax:cosmosStats.fluxErrMax,
              parasites:cosmosStats.parasites,netNegDeaths:cosmosStats.netNegDeaths,
              netAtDeath:+cosmosStats.netAtDeath.toFixed(4),
              live:cosmosChildren.length,
              meanAge:cosmosStats.ageN?+(cosmosStats.ageSum/cosmosStats.ageN).toFixed(1):0,
              meanPeakCoh:cosmosStats.ageN?+(cosmosStats.peakCohSum/cosmosStats.ageN).toFixed(3):0,
              drive:dn?+(dsum/dn).toFixed(3):null,driveN:dn,
              bankCosmos:(function(){try{return (genome.shadowScenarioBank||[]).filter(s=>s&&s.src==='cosmos').length}catch(e){return -1}})()};
    }catch(e){return null;}})();
    const __lin=(function(){try{const h={};let n=0;for(let i=0;i<N;i++){if(!palive[i])continue;n++;h[pLin[i]]=(h[pLin[i]]||0)+1;}
      const sz=Object.values(h).sort((a,b)=>b-a);
      const singles=sz.filter(x=>x===1).length;
      const inMulti=sz.filter(x=>x>1).reduce((a,b)=>a+b,0);
      return {alive:n,nLin:sz.length,top:sz.slice(0,3),singles,
              singleFrac:n?+(singles/n).toFixed(3):0,          // share of POPULATION that is its own lineage
              multiFrac:n?+(inMulti/n).toFixed(3):0,           // share living in a lineage with >1 member
              maxLin:sz[0]||0, meanLin:sz.length?+(n/sz.length).toFixed(2):0};}catch(e){return null;}})();
    const __pur=(function(){try{return __purity(__binOf,(i)=>(typeof pLin!=='undefined'?pLin[i]:0),N);}catch(e){return{p:0,pn:0,ex:0,owned:0,ownedNull:0};}})(); globalThis.__samples.push({tick:(typeof tick!=='undefined'?tick:-1),N:alive,meanAmp:+(alive?ampSum/alive:0).toFixed(4),kinds:Object.keys(bc).length,lin:__lin,modes:__modes,cosmos:__cos,purity:__pur.p,purityNull:__pur.pn,purityExcess:__pur.ex,owned:__pur.owned,ownedNull:__pur.ownedNull,uaUses:(function(){try{let u=0,n=0,f=0;const A=genome.userAtoms||[];for(const a of A){u+=(a.uses|0);if((a.uses|0)>0)n++;if(a.failed)f++;}return 'bank='+A.length+' uses='+u+' proven='+n+' failed='+f+' bound='+((genome.boundOpcodes||[]).length);}catch(e){return '?';}})()}); }
  globalThis.__run=function(n,every){ sample(); for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;} if((s+1)%every===0)sample(); } };
  // #59: the per-launch log lives in the SIM module's scope, so it needs a driver-scope accessor — the
  // same reason __metaMag exists. Reading it directly from the harness file returned null silently.
  globalThis.__cosmosLog=function(){ try{ return cosmosLaunchLog.map(L=>({
      e:+L.e.toPrecision(3),k:+L.k.toPrecision(3),r:+L.r.toPrecision(3),c:+L.c.toPrecision(3),t:+L.t.toPrecision(3),
      ie:+L.inh.e.toPrecision(3),ik:+L.inh.k.toPrecision(3),ir:+L.inh.r.toPrecision(3),ic:+L.inh.c.toPrecision(3),it:+L.inh.t.toPrecision(3),
      endow:L.endow,mem:L.members,gain:L.gain,exp:L.exported,imp:L.imported,oldGate:L.oldGate,afford:L.afford,csize:L.csize,ccoh:L.ccoh,cage:L.cage,age:L.age,pk:L.peakCoh,pm:L.peakMass,alive:L.alive,hd:L.heatDeath|0})); }catch(e){ return null; } };
  // Finding 6 verification: dump the actual cosmos bank entries. With the baseline taken from the
  // GLOBAL genome these came back saturated at the +/-2 clamp (measured: both entries e:-2), meaning the
  // child's real perturbation was discarded. Relative to the INHERITED lineage physics they should be
  // interior values.
  globalThis.__cosmosBank=function(){ try{
    return (genome.shadowScenarioBank||[]).filter(x=>x&&x.src==='cosmos')
      .map(x=>({e:+x.e.toFixed(3),k:+x.k.toFixed(3),r:+x.r.toFixed(3),c:+x.c.toFixed(3),t:+x.t.toFixed(3)}));
  }catch(e){return null} };
  globalThis.__cosmosDefaults=function(){ try{ return {e:genome.entropyBaseline,k:genome.entropyK,r:genome.entrainRate,c:genome.creationCost,t:genome.entrainThresh}; }catch(e){ return null; } };
  // #70 — LINEAGE LIFESPAN + RECRUITMENT CENSUS. The instrument #69 named as missing. singleFrac is a
  // snapshot: it counts lineages of size 1 without asking whether they are new lineages on their way up
  // or lineages that will die alone, and those are opposite readings of the same number. This reports,
  // per mint site, how many lineages were minted, how many EVER reached 2+ members, and how long they
  // lived — which separates the two readings. Registry-side only; no simulation state is touched.
  globalThis.__linCensus=function(){ try{
    const now=genome.totalTicks, out={}, all={n:0,rec:0,alive:0,lifeSum:0,peakSum:0,zombie:0};
    const lifeHist=[0,0,0,0,0,0]; // <=60, <=300, <=1000, <=3000, <=10000, >10000 ticks
    const peakHist={}; // peak membership -> count
    for(const[lid,e] of lineageRegistry){
      const s=e.src||'?'; const o=out[s]||(out[s]={n:0,rec:0,alive:0,lifeSum:0,peakMax:0,peakSum:0,zombie:0});
      const life=(e.extinct?(e.deathTick||now):now)-e.birthTick;
      const rec=e.peak>1?1:0;
      o.n++; all.n++; o.rec+=rec; all.rec+=rec; o.lifeSum+=life; all.lifeSum+=life;
      o.peakSum+=e.peak; all.peakSum+=e.peak; if(e.peak>o.peakMax)o.peakMax=e.peak;
      o.zombie+=e.zombie|0; all.zombie+=e.zombie|0;
      if(!e.extinct){ o.alive++; all.alive++; }
      lifeHist[life<=60?0:life<=300?1:life<=1000?2:life<=3000?3:life<=10000?4:5]++;
      peakHist[e.peak]=(peakHist[e.peak]||0)+1;
    }
    for(const s in out){ const o=out[s];
      o.recFrac=o.n?+(o.rec/o.n).toFixed(3):0; o.meanLife=o.n?+(o.lifeSum/o.n).toFixed(1):0;
      o.meanPeak=o.n?+(o.peakSum/o.n).toFixed(2):0; delete o.lifeSum; delete o.peakSum; }
    // The live singleton population, split by the mint site that produced it. singleFrac's numerator,
    // finally attributable: a singleton minted by 'founder' is the world handing out a free lineage,
    // a singleton minted by 'speciate' is a divergence event that has not recruited YET.
    const cnt={}; for(let i=0;i<N;i++){ if(!palive[i])continue; cnt[pLin[i]]=(cnt[pLin[i]]||0)+1; }
    const singBySrc={}, liveBySrc={};
    for(const k in cnt){ const e=lineageRegistry.get(+k), s=e?(e.src||'?'):'UNREGISTERED';
      liveBySrc[s]=(liveBySrc[s]||0)+1; if(cnt[k]===1)singBySrc[s]=(singBySrc[s]||0)+1; }
    // Reconciliation: registry + pruned must equal every id ever minted, or the census is partial and
    // says so rather than reporting a total that merely looks complete.
    return { tick:now, registry:lineageRegistry.size, minted:nextLineageID-1,
      pruned:linPruned.n, prunedBySrc:linPruned.bySrc, prunedRecruited:linPruned.everRecruited,
      complete:(lineageRegistry.size+linPruned.n)===(nextLineageID-1),
      all:{n:all.n,rec:all.rec,recFrac:all.n?+(all.rec/all.n).toFixed(3):0,alive:all.alive,
           meanLife:all.n?+(all.lifeSum/all.n).toFixed(1):0,meanPeak:all.n?+(all.peakSum/all.n).toFixed(2):0,
           zombie:all.zombie},
      bySrc:out, lifeHist, peakHist, liveBySrc, singBySrc }; }catch(e){ return {error:String(e&&e.message||e)}; } };
  // #70 — founder-mint count on the PRE-#67 build, where founders came from their own counter. That
  // build has no census, but _linNext IS the founder tally, so this makes the one number the census
  // cannot reach on the old code readable under INDEX=. Returns null on any build past #67, where the
  // variable no longer exists and bySrc.founder.n is the same quantity.
  // Both counters, so their RANGES are comparable rather than assumed. On the pre-#67 build founders
  // draw from _linNext and speciated children from nextLineageID; if those ranges overlap, a speciated
  // child can be relabelled with an id a living founder already holds, and two distinct lineages read
  // as one. That is a different failure from the one #67 fixed (a lookup returning a foreign record)
  // and it would DEFLATE nLin rather than inflate it.
  globalThis.__linNextVal=function(){ try{ return {linNext:(typeof _linNext!=='undefined')?_linNext:null,
    lineageIDNext:(typeof nextLineageID!=='undefined')?nextLineageID:null}; }catch(e){ return null; } };
  globalThis.__metaMag=function(){ // sum of |ATROPHY_SAFE params| on the self — to confirm ablation actually zeroed it
    if(typeof ATROPHY_SAFE==='undefined')return null; let s=0,n=0; for(const p of ATROPHY_SAFE){ if(isFinite(genome[p])){s+=Math.abs(genome[p]);n++;} } return {sum:+s.toFixed(3),n}; };
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/meta-sim.js');m.filename=__dirname+'/meta-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS,1000);
const S=globalThis.__samples;
const t2=Math.floor(2*S.length/3);
function lateMean(k){let s=0,c=0;for(let i=t2;i<S.length;i++){const v=S[i][k];if(typeof v==='number'){s+=v;c++;}}return c?+(s/c).toFixed(4):0;}
console.log(JSON.stringify({ strip:STRIP, extra:EXTRA, ablated:ABLATE, ablatedBank:ABLATE_BANK, seed:process.env.SEED||null, loopErrors, lastErr, driverErr:globalThis.__driverErr||0, uaBirths:globalThis.__uaBirths||0, mutCalls:globalThis.__mutCalls||0,
  metaMag:globalThis.__metaMag(), lateMeanAmp:lateMean('meanAmp'), lateN:lateMean('N'), lateKinds:lateMean('kinds'),
  // #59: launchDrive early vs late is the self-administered payout test — see the census comment.
  cosmosDriveEarly:(S[1]&&S[1].cosmos)?S[1].cosmos.drive:null, cosmosDriveLate:(S[S.length-1]&&S[S.length-1].cosmos)?S[S.length-1].cosmos.drive:null,
  cosmos:(S[S.length-1]||{}).cosmos||null,
  cosmosLog:globalThis.__cosmosLog?globalThis.__cosmosLog():null, cosmosDefaults:globalThis.__cosmosDefaults?globalThis.__cosmosDefaults():null, cosmosBank:globalThis.__cosmosBank?globalThis.__cosmosBank():null, linCensus:globalThis.__linCensus?globalThis.__linCensus():null, linNext:globalThis.__linNextVal?globalThis.__linNextVal():null, latePurity:lateMean('purity'), latePurityNull:lateMean('purityNull'), latePurityExcess:lateMean('purityExcess'), lateOwned:lateMean('owned'), lateOwnedNull:lateMean('ownedNull'), finalSample:S[S.length-1] }));
