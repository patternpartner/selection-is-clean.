// #234 — WHAT THE LAW VERDICT KEEPS, BY DIRECTION. The verdict keeps a law if the population holds 70% of
// its pre-proposal mean (LAW_VIABLE). #232 showed that makes the carrying-capacity laws a one-way ratchet.
// This asks the same of the laws that decide DIVERSITY rather than size: does the verdict prefer one
// direction of INHERIT_SD (mutation, #220f), BIRTH_SHRINK or CONTACT_BLEND (the homogenisers, #222b)?
//
// One process per trial. Natural law proposals are switched off (LAW_RATE=0) for a WARM-tick warm-up, so
// every trial starts from the same world with no trial in flight; then ONE proposal is forced through the
// engine's own path - the same row.set, the same LAW_COST, the same __lawTrial record - at STEP x the law's
// range, up or down, and the engine's own verdict runs after LAW_PROBATION. ARM=control forces nothing.
//   SEED=1 LAW=INHERIT_SD DIR=down WARM=3000 STEP=0.175 node harness-verdict.js
// Output: {kept, held/baseline, trait spread and population before/after the probation}.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const WARM=+(process.env.WARM||process.env.TICKS||3000), STEP=+(process.env.STEP||0.175);
const LAW=process.env.LAW||'INHERIT_SD', DIR=process.env.DIR||'down', ARM=process.env.ARM||'force';
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/verdict.js');m.filename='/tmp/verdict.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__V=function(WARM,STEP,LAW,DIR,ARM){
  const tick1=()=>{ globalThis.__detMs+=5; try{loop();}catch(e){} };
  const spread=()=>{ let n=0; const c=new Float64Array(DIMS); for(let i=0;i<N;i++){ if(!palive[i])continue; n++; for(let d=0;d<DIMS;d++)c[d]+=tend[i*DIMS+d]; }
    if(!n)return {n:0,s:0}; for(let d=0;d<DIMS;d++)c[d]/=n; let s=0; for(let i=0;i<N;i++){ if(!palive[i])continue; let q=0; for(let d=0;d<DIMS;d++){const v=tend[i*DIMS+d]-c[d];q+=v*v;} s+=Math.sqrt(q); }
    return {n,s:s/n}; };
  const _rate=LAW_RATE; LAW_RATE=0;
  for(let s=0;s<WARM;s++) tick1();
  LAW_RATE=0;   // stays off: exactly one trial, the forced one
  const idx=LAW_DECLARED.findIndex(r=>r.name===LAW); const row=LAW_DECLARED[idx];
  const before=spread(); let from=null,to=null;
  if(ARM!=='control'){
    if(__lawTrial) return {error:'a trial was already in flight at the end of the warm-up'};
    from=+row.get(); const span=row.hi-row.lo; to=__cl(from+(DIR==='up'?1:-1)*span*STEP,row.lo,row.hi);
    if(to===from) return {error:'the step moves nothing (at the bound)',from};
    row.set(to); for(let i=0;i<N;i++) if(palive[i]) amp[i]*=(1-LAW_COST);
    __lawTrial={idx,from,to,startTick:tick|0,baseline:lawMean(),sum:0,n:0,viable:LAW_VIABLE,probation:LAW_PROBATION};
  }
  const logLen=__lawLog.length; const P=LAW_PROBATION+60;
  for(let s=0;s<P;s++) tick1();
  const after=spread(); const e=__lawLog.length>logLen?__lawLog[__lawLog.length-1]:null;
  const ev=(genome.eventLog||[]).filter(x=>x&&x.k==='law_verdict').slice(-1)[0];
  return {law:LAW,dir:ARM==='control'?'control':DIR,from,to,kept:e?e[4]===1:null,
          held_over_base:ev&&ev.d&&ev.d.base?+(ev.d.held/ev.d.base).toFixed(3):null,
          nBefore:before.n,nAfter:after.n,spreadBefore:+before.s.toFixed(4),spreadAfter:+after.s.toFixed(4),
          valueAtEnd:+row.get()};
};`,'/tmp/verdict.js');
console.log(JSON.stringify(Object.assign({seed:process.env.SEED||'1'},globalThis.__V(WARM,STEP,LAW,DIR,ARM))));
