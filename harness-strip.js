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
// This is not a proposed change to index.html. It is a measurement of how much of the accretion is load.
//
// (original header retained below — this file began as the meta-only ablation)
// META-INFLUENCE ABLATION — is the inflated meta layer HARMFUL, or harmless free weight?
//
// The atrophy probe proved the 116-gene meta-influence layer is inert BY ATTRIBUTION (protected=0)
// and net-inflates 4-5x despite the pruner. But inert-by-attribution is not the same as harmful:
// before adding any pruning cost to index.html (a real new selection pressure), we must know whether
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
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

// INDEX= lets the same strip arms run against a DIFFERENT build — specifically the pre-#49 clamped
// economy (git show d6febcb:index.html). That answers the question the rig cannot: are the meta/bank
// taxes visible in the economy the LIVE ARTWORK actually runs, or only on the instrument?
const html=fs.readFileSync(process.env.INDEX||(__dirname+'/index.html'),'utf8');
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
    const __lin=(function(){try{const h={};let n=0;for(let i=0;i<N;i++){if(!palive[i])continue;n++;h[pLin[i]]=(h[pLin[i]]||0)+1;}
      const sz=Object.values(h).sort((a,b)=>b-a);
      const singles=sz.filter(x=>x===1).length;
      const inMulti=sz.filter(x=>x>1).reduce((a,b)=>a+b,0);
      return {alive:n,nLin:sz.length,top:sz.slice(0,3),singles,
              singleFrac:n?+(singles/n).toFixed(3):0,          // share of POPULATION that is its own lineage
              multiFrac:n?+(inMulti/n).toFixed(3):0,           // share living in a lineage with >1 member
              maxLin:sz[0]||0, meanLin:sz.length?+(n/sz.length).toFixed(2):0};}catch(e){return null;}})();
    const __pur=(function(){try{return __purity(__binOf,(i)=>(typeof pLin!=='undefined'?pLin[i]:0),N);}catch(e){return{p:0,pn:0,ex:0,owned:0,ownedNull:0};}})(); globalThis.__samples.push({tick:(typeof tick!=='undefined'?tick:-1),N:alive,meanAmp:+(alive?ampSum/alive:0).toFixed(4),kinds:Object.keys(bc).length,lin:__lin,purity:__pur.p,purityNull:__pur.pn,purityExcess:__pur.ex,owned:__pur.owned,ownedNull:__pur.ownedNull,uaUses:(function(){try{let u=0,n=0,f=0;const A=genome.userAtoms||[];for(const a of A){u+=(a.uses|0);if((a.uses|0)>0)n++;if(a.failed)f++;}return 'bank='+A.length+' uses='+u+' proven='+n+' failed='+f+' bound='+((genome.boundOpcodes||[]).length);}catch(e){return '?';}})()}); }
  globalThis.__run=function(n,every){ sample(); for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;} if((s+1)%every===0)sample(); } };
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
console.log(JSON.stringify({ strip:STRIP, extra:EXTRA, ablated:ABLATE, ablatedBank:ABLATE_BANK, seed:process.env.SEED||null, loopErrors, lastErr, driverErr:globalThis.__driverErr||0,
  metaMag:globalThis.__metaMag(), lateMeanAmp:lateMean('meanAmp'), lateN:lateMean('N'), lateKinds:lateMean('kinds'), latePurity:lateMean('purity'), latePurityNull:lateMean('purityNull'), latePurityExcess:lateMean('purityExcess'), lateOwned:lateMean('owned'), lateOwnedNull:lateMean('ownedNull'), finalSample:S[S.length-1] }));
