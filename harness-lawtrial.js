// #265 — DOES THE ENGINE'S OWN VERDICT CATCH A LAW THAT STARVES THE WORLD? harness-lawedge.js (#263) holds a row at an
// edge with the law process OFF and reports what the verdict WOULD see; this rig runs the verdict itself. Boot the
// default world with the law process ON but no proposals of its own (LAW_RATE 0, so the only trial is ours), let the
// population history fill, and at AT install ROW -> TO as a trial exactly as attemptLawMutation does (the row's own
// setter, the LAW_COST paid by every living particle, baseline = lawMean(), viable and probation captured now). The
// engine then judges it - keeps or reverts - and runs on for AFTER ticks.
//   SEED=201 ROW=WORLD_ENERGY_REGEN TO=lo PROBATION=3000 node harness-lawtrial.js
//   PROBATION   the trial's probation (default: the engine's LAW_PROBATION), so one engine can be read at two lengths
// Output: verdict (1 kept, 0 reverted, null not judged by the end), the tick it was judged, the row's value at the end,
// living before / over the probation / late, the floor after AT, extinctAt, and a series every EVERY ticks.
// No backticks in the appended driver's comments.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env;
const AT=+(E.AT||(E.TICKS?Math.max(1,Math.floor(+E.TICKS/3)):3000)), AFTER=+(E.AFTER||(E.TICKS?Math.max(1,+E.TICKS-AT):9000));
const EVERY=Math.max(1,Math.min(+(E.EVERY||500),AT+AFTER));
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/lawtrial.js');m.filename='/tmp/lawtrial.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__LT=function(ROW,TO,AT,AFTER,EVERY,PROB){
  const alive=function(){ let n=0; for(let i=0;i<N;i++) if(palive[i])n++; return n; };
  const idx=LAW_DECLARED.findIndex(function(x){return x.name===ROW;});
  if(idx<0) return {error:'unknown ROW '+ROW};
  const row=LAW_DECLARED[idx];
  if(!__LAWMUT) return {error:'the law process is off (LAWMUT=0) - this rig needs it on'};
  LAW_RATE=0;   // no proposals of the world's own: the only trial is the one installed below
  const hist=[], series=[]; let floor=Infinity, extinctAt=null, errs=0, trial=null, judgedAt=null, verdict=null, logLen=0;
  for(let s=1;s<=AT+AFTER;s++){
    if(s===AT+1){
      const from=+row.get(); let to=TO==='lo'?row.lo:TO==='hi'?row.hi:+TO; to=__cl(to,row.lo,row.hi);
      if(__lawTrial) return {error:'a trial was already in flight at AT'};
      row.set(to);
      for(let i=0;i<N;i++) if(palive[i]) amp[i]*=(1-LAW_COST);
      __lawTrial={idx,from,to,startTick:tick|0,baseline:lawMean(),sum:0,n:0,viable:LAW_VIABLE,probation:PROB>0?PROB:LAW_PROBATION};
      trial={from,to,baseline:+__lawTrial.baseline.toFixed(1),viable:__lawTrial.viable,probation:__lawTrial.probation};
      logLen=__lawLog.length; }
    globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    const n=alive(); hist.push(n);
    if(s>AT){ if(n<floor)floor=n; if(n===0&&extinctAt===null)extinctAt=s-AT;
      if(verdict===null&&__lawLog.length>logLen){ const e=__lawLog[__lawLog.length-1]; if(e&&e[1]===ROW){ verdict=e[4]; judgedAt=s-AT; } } }
    if(s%EVERY===0) series.push(n); }
  const mean=function(a,b){ a=Math.max(0,a); b=Math.min(hist.length,b); let t=0; for(let k=a;k<b;k++)t+=hist[k]; return t/Math.max(1,b-a); };
  return {row:ROW,trial,verdict,judgedAt,endValue:+row.get(),before:+mean(AT-LAW_WINDOW,AT).toFixed(1),
    probationMean:trial?+mean(AT,AT+trial.probation).toFixed(1):null,late:+mean(hist.length-1000,hist.length).toFixed(1),
    floor,extinctAt,errs,series}; };`,'/tmp/lawtrial.js');
const r=globalThis.__LT(E.ROW||'',E.TO||'lo',AT,AFTER,EVERY,+(E.PROBATION||0));
console.log(JSON.stringify(Object.assign({seed:E.SEED||'1',at:AT,after:AFTER},r)));
