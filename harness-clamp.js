// CLAMP CENSUS (#71) — HOW MUCH OF THE PHENOTYPE IS THE GENOME, AND HOW MUCH IS THE CLAMP?
//
// #70 found the substrate makes inertness free: every VM register index is folded (Math.abs(src)%12),
// the dispatch switch has no `default:` so an unrecognised opcode is a silent no-op, and 802 __cl()
// calls bound the rest. Nothing a mutation can do produces a program that breaks. That is the
// mechanism behind the repeated "channel measures near-inert" finding — a broken genome neither dies
// nor works, so selection sees nothing either way.
//
// Before removing any guardrail, measure which ones actually FIRE. A clamp that never binds is free
// documentation; a clamp that binds on most evaluations is the substrate overwriting an evolved value,
// and every mutation in that direction is invisible to selection by construction.
//
// This is harness-side ONLY. index.html is untouched, so the artwork carries no cost on a phone —
// the same reason harness-gates.js rewrites gate conditions here rather than shipping counters.
//
// Method: rewrite every `__cl(` CALL SITE (not the definition) to `__clS(<siteId>,` and define __clS
// to return exactly what __cl returns while counting. Per site: evaluations, binds at lo, binds at hi,
// and NaN passthroughs — NaN fails both comparisons and so leaves a clamp UNCHANGED, which is the one
// way a clamp silently fails at the job it exists for, and is counted separately rather than folded
// into the bind count.
//
// CONTROL: counting must not perturb. __clS returns the identical value for identical input and draws
// no randomness, so the run must come back bit-identical to the uninstrumented build. NOCOUNT=1 is the
// control arm — no rewrite at all — and `fingerprint` is a checksum over live particle state at the end
// of the run. If the two arms' fingerprints differ, the census is invalid and gets rebuilt, exactly as
// in #70. Comparing `alive` and `kinds` alone would not do: two scalars can agree by luck.
//
// Env: SEED  TICKS (default 3000)  TOP (default 25 sites reported)  CHECK=1 (run the control)
//      NOCOUNT=1 (control arm: no rewrite at all)  INDEX= (measure a different build)
const fs = require('fs');
const TICKS = parseInt(process.env.TICKS || '3000', 10);
const TOP   = parseInt(process.env.TOP || '25', 10);
// #82: sampling cadence. #81 was underpowered because the spread crosses the 10-90% carrier band in only
// 3-7 windows at 1000 ticks — fixation arrives by t~9000. The sampler is read-only (no draws, no writes
// to simulation state), so raising the rate cannot move the trajectory; the fingerprint control confirms
// it rather than assuming it.
const SWIN  = parseInt(process.env.SAMPLE_WIN || '1000', 10);
const NOCOUNT = (process.env.NOCOUNT|0) === 1;  // control arm: skip the rewrite entirely

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
for (const kn of ['COSMOS_COST','COSMOS_CONTACT','COSMOS_MERGE','COSMOS_SENSE','COSMOS_AFFORD','ESCAPE_DEATH','ATOM_HERITABLE','MEME_TRANSFER'])
  if (process.env[kn] !== undefined) globalThis['__'+kn] = parseInt(process.env[kn], 10);
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

// INDEX= lets the same strip arms run against a DIFFERENT build — specifically the pre-#49 clamped
// economy (git show d6febcb:index.html). That answers the question the rig cannot: are the meta/bank
// taxes visible in the economy the LIVE ARTWORK actually runs, or only on the instrument?

const html=fs.readFileSync(process.env.INDEX||(__dirname+'/index.html'),'utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

// ── SITE REWRITE ────────────────────────────────────────────────────────────────────────────────
// Every `__cl(` except the definition itself becomes `__clS(<n>,`. Line numbers are resolved against
// a precomputed newline index so attribution is a real source location, not a serial number: a census
// that cannot name the site it is accusing is not actionable.
const nlAt=[]; for(let i=0;i<code.length;i++) if(code.charCodeAt(i)===10) nlAt.push(i);
function lineOf(off){ let lo=0,hi=nlAt.length; while(lo<hi){const m=(lo+hi)>>1; if(nlAt[m]<off)lo=m+1; else hi=m;} return lo+1; }
const sites=[]; let defSeen=0;
if(!NOCOUNT) code=code.replace(/__cl\(/g,(m,off)=>{
  if(code.slice(Math.max(0,off-9),off)==='function '){ defSeen++; return m; }   // the definition — left alone
  const ln=lineOf(off);
  const lineStart=code.lastIndexOf('\n',off)+1;
  let lineEnd=code.indexOf('\n',off); if(lineEnd<0)lineEnd=code.length;
  sites.push({id:sites.length, line:ln, src:code.slice(lineStart,lineEnd).trim().slice(0,150)});
  return '__clS('+(sites.length-1)+',';
});
if(!NOCOUNT && defSeen!==1){ console.log(JSON.stringify({error:'expected exactly 1 __cl definition, saw '+defSeen})); process.exit(1); }
if(!NOCOUNT && !sites.length){ console.log(JSON.stringify({error:'no __cl call sites found'})); process.exit(1); }

// #77 probe: is the ambient `genome` inside executeVM the PARTICLE's genome? If it is, the two guards
// there were already per-lineage and #76's "all five read the global list" is wrong for those two.
{ const A="      const _og=(__ATOM_DISPATCH&&pGenome[i])?pGenome[i]:genome;";
  if(code.split(A).length-1===1) code=code.replace(A, A+"{const _S=globalThis.__ogp=globalThis.__ogp||{same:0,diff:0,noP:0};if(!pGenome[i])_S.noP++;else if(genome===pGenome[i])_S.same++;else _S.diff++;}");
}
{ const B="    if(__ATOM_XFER){ if(pGenome[i]){ const _dn=";
  if(code.split(B).length-1===1) code=code.replace(B, "    if(__ATOM_XFER){ if(pGenome[i]){ {const _T=globalThis.__dnp=globalThis.__dnp||{selfIsParticle:0,selfIsOther:0};if(genome===pGenome[i])_T.selfIsParticle++;else _T.selfIsOther++;} const _dn=");
}

// ── #81 CARRIER vs NON-CARRIER, WITH A SHAM CONTROL ─────────────────────────────────────────────
// #80 reached fixation on every seed and could not say whether the primitive PAYS: at MEME_RATE 0.004
// across ~350 particles a strictly neutral element fixes on the same timescale. The contrast has to be
// sampled DURING the spread, while both classes exist.
//
// THE CONFOUND, which is why a raw split would not settle it either: carrier status is not randomly
// assigned. The first carrier is random, but spread is by CONTACT, so carriers are whoever sits in dense
// well-connected regions — and that predicts amplitude and reproduction on its own, with no help from the
// atom. A carrier advantage measured directly is "the atom pays" and "well-connected particles get atoms
// first" summed together, which is the same shape of error as #72's maxSpeed.
//
// SHAM ARM: ATOM_SHAM=1 makes uaCall return 0 while still counting the invocation, so the atom spreads
// and is executed exactly as before but its output reaches nothing — the same device harness-strip uses
// for STRIP=bank. Then:
//   carrier advantage (real)  = atom effect + position confound
//   carrier advantage (sham)  = position confound alone
//   difference                = the atom effect, with the confound subtracted rather than assumed away
if((process.env.ATOM_SHAM|0)===1){
  const A='function uaCall(atom,a,b){';
  if(code.split(A).length-1!==1){ console.log(JSON.stringify({error:'uaCall anchor'})); process.exit(1); }
  code=code.replace(A, A+'if(atom){atom.uses=(atom.uses|0)+1;} return 0; // #81 SHAM: executed, output reaches nothing');
}
// Births by the PARENT's carrier status — per-capita reproduction is the second half of "does it pay",
// and amplitude alone cannot show a primitive that converts energy into offspring rather than into mass.
// BOTH spawn paths. The first version of this counted only addParticle and returned 0 carrier births
// against 30 non-carrier births while carriers were 34% of the population — impossible by chance, and the
// tell that the instrument could not see what it was asked about. #70 established there are two spawn
// paths and every prior instrument in this file that touched one of them had to touch both.
for(const [FN,SIG] of [['addParticle','function addParticle(x,y,tv,born,parentA,parentB){'],
                       ['addCompound','function addCompound(x,y,nt,nvx,nvy,na,np,nf,parentA,parentB){']]){
  if(code.split(SIG).length-1!==1){ console.log(JSON.stringify({error:'birth anchor '+FN})); process.exit(1); }
  code=code.replace(SIG, SIG+'{try{if(parentA>=0&&parentA<N&&pGenome[parentA]){const _B=globalThis.__bth=globalThis.__bth||{carrier:0,nonCarrier:0};'
    +'const _bg=pGenome[parentA].boundOpcodes; if(Array.isArray(_bg)&&_bg.length)_B.carrier++; else _B.nonCarrier++;}}catch(e){}}');
}

// ── #79 mutateGenome AMBIENT PROBE ──────────────────────────────────────────────────────────────
// The corrected seeding design needs mutateGenome to run with the SELF genome ambient. That is exactly
// the class of assumption that has been wrong three times (#75 #76 #77), so it is probed rather than
// read. Two independent tests, because a captured boot reference goes stale if anything reassigns
// genome wholesale, and an identity scan over pGenome does not depend on any reference at all:
//   bootRef  — is the ambient genome the same object the driver captured before any swap?
//   isParticle — is the ambient genome identical to ANY live particle genome right now?
// Also records how many live particle genomes exist at that moment, since seeding needs a target.
{ const A='function mutateGenome(){';
  const n=code.split(A).length-1;
  if(n!==1){ console.log(JSON.stringify({error:'mutateGenome anchor x'+n})); process.exit(1); }
  code=code.replace(A, A+'{try{const _P=globalThis.__mg=globalThis.__mg||{calls:0,bootRefSame:0,bootRefDiff:0,isParticle:0,notParticle:0,ticks:[],targets:[]};'
    +'_P.calls++;'
    +'if(globalThis.__selfRef){ if(genome===globalThis.__selfRef)_P.bootRefSame++; else _P.bootRefDiff++; }'
    +'var _hit=false,_tg=0; for(var _k=0;_k<N;_k++){ if(!palive[_k])continue; if(pGenome[_k]){_tg++; if(pGenome[_k]===genome)_hit=true;} }'
    +'if(_hit)_P.isParticle++; else _P.notParticle++;'
    +'if(_P.ticks.length<40){_P.ticks.push(typeof tick!=="undefined"?tick:-1);_P.targets.push(_tg);}'
    +'}catch(e){globalThis.__mgErr=String(e&&e.message||e);}}');
}

// ── #77 TRANSFER DIAGNOSTIC ─────────────────────────────────────────────────────────────────────
// Both arms came back bit-identical with memeTransfers 0, so the reversal changed nothing and the
// germline-unproven hypothesis is refuted (germProven 2-7, germUses 567-1377). That leaves two very
// different states the counter cannot distinguish: the function is never CALLED, or it is called and
// returns at a guard. Counting calls and each return reason separates them.
{ const A='function attemptMemeTransfer(recv,donor){';
  if(code.split(A).length-1!==1){ console.log(JSON.stringify({error:'attemptMemeTransfer anchor x'+(code.split(A).length-1)})); process.exit(1); }
  code=code.replace(A, A+'globalThis.__xf=globalThis.__xf||{calls:0,noDonor:0,noProven:0,dup:0,cap:0,ok:0};globalThis.__xf.calls++;');
  const G1='  if(!recv||!donor||!Array.isArray(donor.userAtoms)||!Array.isArray(donor.boundOpcodes)||!donor.boundOpcodes.length)return;';
  if(code.split(G1).length-1===1) code=code.replace(G1,'  if(!recv||!donor||!Array.isArray(donor.userAtoms)||!Array.isArray(donor.boundOpcodes)||!donor.boundOpcodes.length){globalThis.__xf.noDonor++;return;}');
  const G2='  if(bestAI<0)return;';
  if(code.split(G2).length-1===1) code=code.replace(G2,'  if(bestAI<0){globalThis.__xf.noProven++;return;}');
}
// count the guarded CALL SITE separately: how often the proximity+rate lottery actually opens
{ const C='if(__MEME_ON&&proximity>MEME_PROX_THRESH&&Math.random()<MEME_RATE){';
  if(code.split(C).length-1===1) code=code.replace(C, C+'globalThis.__xfSite=(globalThis.__xfSite||0)+1;');
  const P='if(__MEME_ON&&proximity>MEME_PROX_THRESH)';
  code=code.replace('const bond=sim*phaseAlign*proximity;','globalThis.__proxMax=Math.max(globalThis.__proxMax||0,proximity);const bond=sim*phaseAlign*proximity;');
}

// ── #74 UNRECOGNISED-OPCODE RATE ────────────────────────────────────────────────────────────────
// #73 settled that the next lethality target should be the dispatch `default:` — an unrecognised
// opcode IS heritable by construction, unlike escape. What is not known is whether making it fatal is
// survivable: mutation draws opcodes uniformly from [0, OPCODE_COUNT) and nobody here has ever measured
// how many of those draws land somewhere with no implementation. If the miss rate is high, a fatal
// default is a population-extinction event rather than a selection pressure, and the metabolic-cost
// version is the only writable one. That decision needs a number, and this is the number.
//
// Method: a `default:` clause placed FIRST in each switch. JS dispatches to default only when no case
// matches regardless of clause order, so `switch(op){default:{count();break;} case 0: ...}` is exactly
// equivalent to a default at the end — and the anchor `switch(op){` is a string that actually exists,
// which a default at the end is not. Previously an unmatched op fell out of the switch doing nothing;
// now it counts and breaks. Same behaviour, which the fingerprint control has to confirm.
const OPSITES=['shadow','sensor','particle','plasmid','cluster','shadow2'];
// The set of opcodes the PARTICLE VM actually implements, read off its own case labels rather than
// inferred from what happened to miss at runtime. An opcode that is unimplemented but never executed
// would be invisible to a runtime histogram, and this number decides whether a fatal default is
// survivable — it is not a number to estimate.
const PARTICLE_SWITCH_IDX=2;
let IMPLEMENTED=null;
{ let at=-1; for(let k=0;k<=PARTICLE_SWITCH_IDX;k++) at=code.indexOf('switch(op){',at+1);
  if(at<0){ console.log(JSON.stringify({error:'particle VM switch not found'})); process.exit(1); }
  let depth=0,i=code.indexOf('{',at),end=-1;
  for(;i<code.length;i++){ const c=code[i];
    if(c==='{')depth++; else if(c==='}'){ depth--; if(depth===0){ end=i; break; } } }
  if(end<0){ console.log(JSON.stringify({error:'particle VM switch unterminated'})); process.exit(1); }
  const body=code.slice(at,end);
  const labs=new Set(); let m; const re=/case\s+(\d+)\s*:/g;
  while((m=re.exec(body))!==null) labs.add(+m[1]);
  IMPLEMENTED=[...labs].sort((a,b)=>a-b);
  if(IMPLEMENTED.length<50){ console.log(JSON.stringify({error:'implausible case count '+IMPLEMENTED.length})); process.exit(1); }
}
{ const n=code.split('switch(op){').length-1;
  if(n!==6){ console.log(JSON.stringify({error:'expected 6 switch(op) dispatches, saw '+n})); process.exit(1); }
  let k=0;
  code=code.split('switch(op){').map((seg,i)=> i===0?seg:('__opAll['+(k)+']++;switch(op){default:{__opMiss('+(k++)+',op);break;}'+seg)).join('');
  // the split/join above prefixes each occurrence; k advances once per join point
}
code = 'const __opAll=new Float64Array(6),__opMissN=new Float64Array(6),__opMissCore=new Float64Array(6),__opMissBound=new Float64Array(6);\n'
     + 'const __opMissHist=new Map();\n'
     + 'function __opMiss(s,op){__opMissN[s]++;if(op>=CORE_OPCODES)__opMissBound[s]++;else __opMissCore[s]++;__opMissHist.set(op,(__opMissHist.get(op)||0)+1);}\n'
     + code;

// ── #73 DEATH PROVENANCE ────────────────────────────────────────────────────────────────────────
// #72 found the escape kill has no selective consequence — the death rate is flat after burn-in — and
// inferred that escape is an ACCIDENT rather than a heritable strategy. That was an inference. This
// measures it: tag every death with its cause AND the lineage of the particle that died, so the escape
// distribution can be tested against the distribution of all other deaths. If escape were heritable it
// would concentrate in lineages; if it is a numerical excursion it is spread in proportion to exposure,
// and other-cause deaths are the exposure proxy that needs no new per-tick accounting.
// Harness-side, like the clamp rewrite: index.html carries none of this.
function patchExactly(find,repl,label,expected){
  const n=code.split(find).length-1;
  if(n!==expected){ console.log(JSON.stringify({error:'patch '+label+' x'+n+' expected '+expected})); process.exit(1); }
  code=code.split(find).join(repl);
}
for(const [cause,marker] of [['escape','deathsByEscape++;'],['physics','deathsByPhysics++;'],['age','deathsByAge++;']]){
  patchExactly('deaths.push(i);deathsThisTick++;'+marker,
               'deaths.push(i);deathsThisTick++;'+marker+'__dTag("'+cause+'",pLin[i]);',
               'death-'+cause, 1);
}
code = 'const __dLog={escape:new Map(),physics:new Map(),age:new Map()};\n'
     + 'function __dTag(c,l){const m=__dLog[c];if(m)m.set(l,(m.get(l)||0)+1);}\n'
     + code;

// __clS is __cl plus counters. Identical return for identical input, no randomness, so the trajectory
// cannot move. NaN is tallied apart from binds: x<lo and x>hi are both false for NaN, so a NaN sails
// through unchanged — the clamp reports success while having done nothing.
const NS=sites.length;
if(!NOCOUNT) code = 'const __clCalls=new Float64Array('+NS+'),__clLo=new Float64Array('+NS+'),__clHi=new Float64Array('+NS+'),__clNaN=new Float64Array('+NS+');\n'
     + 'function __clS(s,x,lo,hi){__clCalls[s]++;if(x!==x){__clNaN[s]++;return x;}if(x<lo){__clLo[s]++;return lo;}if(x>hi){__clHi[s]++;return hi;}return x;}\n'
     + code;

const driver=`
;(function(){
  const __IMPL=${JSON.stringify(IMPLEMENTED)};
  // #72 falsifier 4, second attempt. maxSpeed and meanSpeed CANNOT answer it: they are taken over live
  // particles, so killing the 1e37 outliers drops them by arithmetic rather than by selection. The
  // quantity that separates the two is the escape-death RATE over time. Selection removing the programs
  // that drive unbounded velocity should make the rate DECLINE; a janitor collecting a constant trickle
  // of garbage should make it FLAT. Sampled per window, cumulative counter differenced.
  globalThis.__selfRef=genome; // captured before any loop() call, i.e. before any per-particle swap
  globalThis.__escSeries=[];
  // #75 BOUND-SLOT OCCUPANCY. 'bos.push(...)' fills the 96 authored-atom slots as a DENSE PREFIX, and
  // cloneGenome slices the list, so each lineage has its own frontier: opcode CORE_OPCODES+k resolves
  // iff k < that particle's own bos.length. Two consequences worth measuring rather than reasoning
  // about. First, every dead bound opcode is structurally a pseudogene — it comes alive if the frontier
  // ever advances past it, which is the pre-adaptation the bound-slot design exists to permit. Second,
  // the SAME instruction is functional in one lineage and inert in another, purely by genetic
  // background. Sampled per window: the self frontier, atoms authored, and the live population's bound
  // instructions split into resolving vs waiting.
  globalThis.__boundSeries=[];
  globalThis.__sampleBound=function(t){ try{
    const bosSelf=(genome.boundOpcodes||[]).length, atoms=(genome.userAtoms||[]).length;
    let live=0,waiting=0,mn=1e9,mx=-1,sum=0,np=0,maxWait=0;
    for(let i=0;i<N;i++){ if(!palive[i]||!pProg[i])continue;
      const bg=(pGenome[i]&&Array.isArray(pGenome[i].boundOpcodes))?pGenome[i].boundOpcodes:(genome.boundOpcodes||[]);
      const f=bg.length; np++; sum+=f; if(f<mn)mn=f; if(f>mx)mx=f;
      for(const ins of pProg[i]){ if(!ins)continue; const op=ins[0]|0;
        if(op>=CORE_OPCODES&&op<CORE_OPCODES+MAX_BOUND_OPCODES){
          const k=op-CORE_OPCODES;
          if(k<f)live++; else { waiting++; if(k>maxWait)maxWait=k; } } } }
    // #81 split: amplitude, age and reproductive provision for carriers vs non-carriers, plus the
    // cumulative birth counts by parent class differenced per window by the reader.
    let _cn=0,_ca=0,_cg=0,_cp=0,_nn=0,_na=0,_ng=0,_np2=0;
    for(let q=0;q<N;q++){ if(!palive[q])continue; const g=pGenome[q];
      const isC=g&&Array.isArray(g.boundOpcodes)&&g.boundOpcodes.length>0;
      const _am=amp[q], _ag=(typeof page!=='undefined'?page[q]:0), _pv=(typeof pProvision!=='undefined'?pProvision[q]:0);
      if(isC){ _cn++; if(isFinite(_am))_ca+=_am; _cg+=_ag; if(isFinite(_pv))_cp+=_pv; }
      else { _nn++; if(isFinite(_am))_na+=_am; _ng+=_ag; if(isFinite(_pv))_np2+=_pv; } }
    const _sp={carrierN:_cn, nonCarrierN:_nn,
      carrierAmp:_cn?+(_ca/_cn).toFixed(4):null, nonCarrierAmp:_nn?+(_na/_nn).toFixed(4):null,
      carrierAge:_cn?+(_cg/_cn).toFixed(1):null, nonCarrierAge:_nn?+(_ng/_nn).toFixed(1):null,
      carrierProv:_cn?+(_cp/_cn).toFixed(4):null, nonCarrierProv:_nn?+(_np2/_nn).toFixed(4):null,
      birthsCarrier:(globalThis.__bth?globalThis.__bth.carrier:0), birthsNonCarrier:(globalThis.__bth?globalThis.__bth.nonCarrier:0)};
    globalThis.__boundSeries.push({t, bosSelf, atoms, MAX:MAX_BOUND_OPCODES, split:_sp,
      carriers:(function(){let c=0;for(let q=0;q<N;q++){if(!palive[q])continue;const g=pGenome[q];if(g&&Array.isArray(g.boundOpcodes)&&g.boundOpcodes.length)c++;}return c;})(),
      memeToParticle:(typeof __memeToParticle!=='undefined'?__memeToParticle:null),
      memeTransfers:(typeof __memeTransfers!=='undefined'?__memeTransfers:null),
      atomSeeded:(typeof __atomSeeded!=='undefined'?__atomSeeded:null),
      germUses:(function(){let u=0;for(const a of (genome.userAtoms||[]))u+=(a.uses|0);return u;})(),
      germProven:(function(){let n=0;for(const a of (genome.userAtoms||[]))if((a.uses|0)>0)n++;return n;})(),
      atomUses:(function(){let u=0;for(let q=0;q<N;q++){if(!palive[q])continue;const g=pGenome[q];if(!g||!Array.isArray(g.userAtoms))continue;for(const a of g.userAtoms)u+=(a.uses|0);}return u;})(),
      frontierMin:np?mn:0, frontierMax:np?mx:0, frontierMean:np?+(sum/np).toFixed(2):0,
      boundInstLive:live, boundInstWaiting:waiting, highestWaitingSlot:maxWait});
  }catch(e){ globalThis.__boundSeries.push({t,error:String(e&&e.message||e)}); } };
  globalThis.__run=function(n,win){ win=win||1000; let prev=0; globalThis.__sampleBound(0);
    for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      if((s+1)%win===0){ let cur=0; try{ cur=(typeof deathsByEscape!=='undefined')?deathsByEscape:0; }catch(e){}
        globalThis.__escSeries.push(cur-prev); prev=cur; globalThis.__sampleBound(s+1); } } };
  // Census accessors live in the SIM module's scope for the same reason __metaMag does — read from the
  // harness file directly they come back undefined, silently.
  globalThis.__clampDump=function(){ if(typeof __clCalls==='undefined')return []; const o=[]; for(let i=0;i<__clCalls.length;i++)
    o.push([__clCalls[i],__clLo[i],__clHi[i],__clNaN[i]]); return o; };
  // CONTROL fingerprint: a checksum over live particle state, not a summary of it. Positions,
  // amplitudes, tendencies, lineage ids and program lengths all fold in, so an instrument that
  // perturbed ANY of them by one ulp shows up here rather than hiding behind an equal alive count.
  globalThis.__fingerprint=function(){ try{ let a=0,b=0,c=0,d=0,n=0;
    let nanPos=0,nanAmp=0,nanTend=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++;
      // NaN is excluded from the SUMS and counted instead. A NaN folded into a checksum turns the whole
      // term into null and silently deletes that field from the control — which is how a live particle
      // with a NaN position went unnoticed here in the first place.
      if(px[i]!==px[i]||py[i]!==py[i])nanPos++; else a+=px[i]+py[i];
      if(amp[i]!==amp[i])nanAmp++; else b+=amp[i];
      c+=pLin[i]; d+=(pProg[i]?pProg[i].length:0);
      for(let q=0;q<DIMS;q++){ const _t=tend[i*DIMS+q]; if(_t!==_t)nanTend++; else b+=_t; } }
    return {n, pos:+a.toFixed(6), amp:+b.toFixed(6), lin:c, prog:d, nanPos, nanAmp, nanTend,
            tick:(typeof tick!=='undefined'?tick:-1),
            totalTicks:(typeof genome!=='undefined'?genome.totalTicks:-1)};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  // Position range among LIVE particles. The fingerprint sum ran to -2.2e8 at 300 ticks and overflowed
  // to Infinity by 1500, which is either a wrapped coordinate stored unwrapped or particles genuinely
  // leaving the world and staying alive. Those are very different findings, so measure rather than infer.
  globalThis.__posRange=function(){ try{
    // Bands by how far outside the world a live particle sits. A particle one screen out is plausibly
    // in transit — the spawner launches from just off-edge. One at 1e6 screens out is not in transit,
    // it is gone, and it is still counted alive by every population metric in this project.
    let n=0,inf=0,off=0, b1=0,b2=0,b3=0,b4=0, ampIn=0,ampOut=0,ampInf=0, clustered=0;
    let mnx=Infinity,mxx=-Infinity,mny=Infinity,mxy=-Infinity;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++; const x=px[i],y=py[i],a=amp[i];
      if(!isFinite(x)||!isFinite(y)){ inf++; if(isFinite(a))ampInf+=a; continue; }
      if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y;
      const dx=x<0?-x:(x>W?x-W:0), dy=y<0?-y:(y>H?y-H:0), d=dx>dy?dx:dy;
      if(d<=0){ if(isFinite(a))ampIn+=a; continue; }
      off++; if(isFinite(a))ampOut+=a;
      if(d<=W)b1++; else if(d<=W*100)b2++; else if(d<=W*1e6)b3++; else b4++;
      try{ if(typeof clusterID!=='undefined'&&clusterID[i]>=0)clustered++; }catch(e){}
    }
    return {n, offWorld:off, offFrac:n?+(off/n).toFixed(4):0, nonFinite:inf,
            band_within1screen:b1, band_to100:b2, band_to1e6:b3, band_beyond:b4,
            escapeesInClusters:clustered,
            ampInWorld:+ampIn.toFixed(3), ampOffWorld:+ampOut.toFixed(3), ampNonFinite:+ampInf.toFixed(3),
            ampOffFrac:(ampIn+ampOut)>0?+(ampOut/(ampIn+ampOut)).toFixed(4):0,
            xMin:mnx, xMax:mxx, yMin:mny, yMax:mxy, W, H};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  // #72 falsifier 4. Lethality only matters if it has a SELECTIVE consequence — if programs that drive
  // unbounded velocity are now selected against. Near-escapes (live particles outside the world but not
  // yet past the kill threshold) are the leading indicator: they should FALL in the treatment arm if
  // selection is acting, and stay flat if the kill merely removes garbage after the fact.
  globalThis.__escape=function(){ try{ let mx=0,sum=0,n=0,near=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++;
      const vxi=vx[i],vyi=vy[i]; if(isFinite(vxi)&&isFinite(vyi)){ const sp=Math.sqrt(vxi*vxi+vyi*vyi); sum+=sp; if(sp>mx)mx=sp; }
      const x=px[i],y=py[i]; if(isFinite(x)&&isFinite(y)&&(x<0||x>W||y<0||y>H))near++; }
    return { deathsByEscape:(typeof deathsByEscape!=='undefined'?deathsByEscape:null),
             escapeNonFinite:(typeof escapeNonFinite!=='undefined'?escapeNonFinite:null),
             on:(typeof __ESCAPE_DEATH!=='undefined'?!!__ESCAPE_DEATH:null),
             nearEscapes:near, meanSpeed:n?+(sum/n).toFixed(4):0, maxSpeed:+mx.toFixed(4) };
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  // #80: does pProg[k] alias pGenome[k].vmProgram? The seeding change splices a call-site into the
  // genome's program; if the two are separate arrays the splice is never executed and the mechanism is
  // inert. Structural claim -> probed, not read.
  globalThis.__aliasProbe=function(){ try{ let same=0,diff=0,noP=0,noG=0;
    for(let k=0;k<N;k++){ if(!palive[k])continue;
      const g=pGenome[k]; if(!g){noG++;continue;} if(!pProg[k]){noP++;continue;}
      if(pProg[k]===g.vmProgram)same++; else diff++; }
    return {aliased:same, separate:diff, noProg:noP, noGenome:noG};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__mutProbe=function(){ try{ const P=globalThis.__mg||null; if(!P)return {calls:0};
    return { calls:P.calls, bootRefSame:P.bootRefSame, bootRefDiff:P.bootRefDiff,
             ambientIsAParticleGenome:P.isParticle, ambientIsNotAParticleGenome:P.notParticle,
             firstTicks:P.ticks.slice(0,12), liveGenomesAtCall:P.targets.slice(0,12),
             err:globalThis.__mgErr||null }; }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__memeDiag=function(){ try{ return { ogProbe:globalThis.__ogp||null, dnProbe:globalThis.__dnp||null, MEME_ON:(typeof __MEME_ON!=='undefined'?__MEME_ON:null),
    ATOM_XFER:(typeof __ATOM_XFER!=='undefined'?__ATOM_XFER:null), rate:MEME_RATE, thresh:MEME_PROX_THRESH,
    siteOpened:globalThis.__xfSite||0, proxMax:globalThis.__proxMax||0, xf:globalThis.__xf||null }; }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__opcodes=function(){ try{
    const sites=[]; for(let i=0;i<6;i++) sites.push({site:i,
      exec:__opAll[i], miss:__opMissN[i], missCore:__opMissCore[i], missBound:__opMissBound[i],
      missFrac:__opAll[i]?+(__opMissN[i]/__opAll[i]).toFixed(5):0});
    const h=[...__opMissHist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15);
    let tExec=0,tMiss=0,tCore=0,tBound=0;
    for(let i=0;i<6;i++){ tExec+=__opAll[i]; tMiss+=__opMissN[i]; tCore+=__opMissCore[i]; tBound+=__opMissBound[i]; }
    // Programs carrying at least one op with no implementation. The EXECUTION rate says how much work is
    // wasted; this says how much of the POPULATION a fatal default would kill, which is the survivability
    // question and is not the same number.
    let progs=0,progsWithMiss=0,instTot=0,instMiss=0;
    const impl=new Set(__IMPL);
    for(let i=0;i<N;i++){ if(!palive[i]||!pProg[i])continue; progs++; let bad=0;
      // cloneGenome does g.boundOpcodes=src.boundOpcodes.slice() — the bound list is PER GENOME, not
      // shared, so the binding that decides whether an opcode resolves is the one on THIS particle's
      // own genome. Reading the global list would mark a slot bound for a lineage that never bound it,
      // and this is the number the fatal-vs-cost decision rests on.
      const _bg=(pGenome[i]&&Array.isArray(pGenome[i].boundOpcodes))?pGenome[i].boundOpcodes:(genome.boundOpcodes||[]);
      for(const ins of pProg[i]){ if(!ins)continue; instTot++;
        const op=ins[0]|0;
        const isBound=(op>=CORE_OPCODES&&op<CORE_OPCODES+MAX_BOUND_OPCODES&&_bg[op-CORE_OPCODES]);
        if(!impl.has(op)&&!isBound){ bad++; instMiss++; } }
      if(bad)progsWithMiss++; }
    return { CORE_OPCODES, OPCODE_COUNT, implementedCases:__IMPL.length, unimplementedInCore:CORE_OPCODES-__IMPL.filter(x=>x<CORE_OPCODES).length, sites,
      totalExec:tExec, totalMiss:tMiss, missCore:tCore, missBound:tBound,
      missFrac:tExec?+(tMiss/tExec).toFixed(5):0,
      liveProgs:progs, progsWithMiss, progsWithMissFrac:progs?+(progsWithMiss/progs).toFixed(4):0,
      instTot, instMiss, instMissFrac:instTot?+(instMiss/instTot).toFixed(4):0,
      topMissedOps:h };
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__deathLineages=function(){ try{ const o={};
    for(const k in __dLog){ const e=[]; for(const [l,n] of __dLog[k]) e.push([l,n]); o[k]=e; } return o;
  }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__aliveN=function(){ try{ let a=0; for(let i=0;i<N;i++)if(palive[i])a++; return a; }catch(e){ return -1; } };
  globalThis.__kinds=function(){ try{ const b={}; for(let i=0;i<N;i++){ if(!palive[i])continue;
      const q=i*DIMS; let r=0; for(let d=0;d<3&&d<DIMS;d++){ let v=((tend[q+d]+1.2)/2.4*4)|0; v=v<0?0:v>3?3:v; r=r*4+v; } b[r]=1; }
    return Object.keys(b).length; }catch(e){ return -1; } };
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/clamp-sim.js');m.filename=__dirname+'/clamp-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS, SWIN);
const dump=NOCOUNT?[]:globalThis.__clampDump();
const fingerprint=globalThis.__fingerprint();

let tCalls=0,tLo=0,tHi=0,tNaN=0,everBound=0,neverCalled=0;
for(let i=0;i<dump.length;i++){
  const [c,lo,hi,nn]=dump[i];
  tCalls+=c; tLo+=lo; tHi+=hi; tNaN+=nn;
  if(lo+hi>0)everBound++;
  if(c===0)neverCalled++;
}
const rows=dump.map((d,i)=>({ site:i, line:sites[i].line, calls:d[0], lo:d[1], hi:d[2], nan:d[3],
    bindFrac:d[0]?+((d[1]+d[2])/d[0]).toFixed(4):0, src:sites[i].src }));
// Two orderings, because they answer different questions. By BIND COUNT: where the substrate does the
// most overwriting in absolute terms. By BIND FRACTION (on sites with real traffic): where an evolved
// value is pinned essentially always, i.e. where the genome has no say at all.
const byCount=[...rows].filter(r=>r.lo+r.hi>0).sort((a,b)=>(b.lo+b.hi)-(a.lo+a.hi)).slice(0,TOP);
const byFrac =[...rows].filter(r=>r.calls>=1000).sort((a,b)=>b.bindFrac-a.bindFrac).slice(0,TOP);
const nanSites=rows.filter(r=>r.nan>0).sort((a,b)=>b.nan-a.nan).slice(0,TOP);

console.log(JSON.stringify({
  seed:process.env.SEED||null, ticks:TICKS, sampleWin:SWIN, index:process.env.INDEX||'index.html', nocount:NOCOUNT,
  fingerprint, posRange:globalThis.__posRange(), escape:globalThis.__escape(), escSeries:globalThis.__escSeries||null, boundSeries:globalThis.__boundSeries||null, deathLineages:globalThis.__deathLineages?globalThis.__deathLineages():null, opcodes:globalThis.__opcodes?globalThis.__opcodes():null, memeDiag:globalThis.__memeDiag?globalThis.__memeDiag():null, mutProbe:globalThis.__mutProbe?globalThis.__mutProbe():null, aliasProbe:globalThis.__aliasProbe?globalThis.__aliasProbe():null,
  loopErrors, lastErr, driverErr:globalThis.__driverErr||0,
  alive:globalThis.__aliveN(), kinds:globalThis.__kinds(),
  sites:NS, sitesNeverCalled:neverCalled, sitesEverBound:everBound,
  totalEvals:tCalls, bindsLo:tLo, bindsHi:tHi, nanPassthrough:tNaN,
  bindFrac:tCalls?+((tLo+tHi)/tCalls).toFixed(5):0,
  evalsPerTick:TICKS?Math.round(tCalls/TICKS):0,
  topByBindCount:byCount, topByBindFrac:byFrac, nanSites
},null,1));
