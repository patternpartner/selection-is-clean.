// #263 — WHICH LAWS STARVE A WORLD SLOWLY ENOUGH THAT THE VERDICT KEEPS THEM? #255b found WORLD_ENERGY_REGEN at 0
// passing the law verdict (the 1,200-tick probation sees the first 20% of a 4,000-tick decline), and #259's worlds
// pinned at ~89 living turned out to hold WORLD_ENERGY_MAX at 0 - the same shape through a second row. This rig asks
// the structural question of ONE row at a time instead of reading the next failure: boot the default world with the
// law process OFF (no in-world proposals, so nothing but this row moves), run to AT, set ROW to TO (lo | hi | a number)
// through the row's own setter, hold it there every tick, and run AFTER more ticks. Draws nothing of its own.
//   SEED=1 ROW=WORLD_ENERGY_MAX TO=lo node harness-lawedge.js        (ROW unset = the control)
// Output, one JSON object:
//   before       mean living over the LAW_WINDOW (600) ticks before AT - the baseline the engine's verdict uses
//   probation    mean living over the LAW_PROBATION (1,200) ticks after AT - what the verdict compares
//   ratio, kept  probation/before, and whether it clears the default LAW_VIABLE 0.7 (the verdict would KEEP it)
//   late         mean living over the last 1,000 ticks; at2k/at4k/at6k; floor after AT; extinctAt
//   drifted      ticks on which the row was found moved off TO before re-applying (the engine moving it)
//   reach        chance that ONE in-world proposal from the default lands exactly on this edge (the step is
//                (U-0.5) x span x 0.35, clamped to the row's range - attemptLawMutation)
// No backticks in the appended driver's comments.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
globalThis.__LAWMUT=0;   // the law process off: this row is the only thing that moves
const fs=require('fs'),path=require('path');
const E=process.env, AT=+(E.AT||3000), AFTER=+(E.AFTER||6000), EVERY=+(E.EVERY||500);
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/lawedge.js');m.filename='/tmp/lawedge.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__LE=function(ROW,TO,AT,AFTER,EVERY){
  const alive=function(){ let n=0; for(let i=0;i<N;i++) if(palive[i])n++; return n; };
  const row=ROW?LAW_DECLARED.find(function(x){return x.name===ROW;}):null;
  if(ROW&&!row) return {error:'unknown ROW '+ROW};
  let def=null, to=null;
  if(row){ def=+row.get(); to=TO==='lo'?row.lo:TO==='hi'?row.hi:+TO; if(!isFinite(to)) return {error:'bad TO '+TO}; to=__cl(to,row.lo,row.hi); }
  const hist=[], series=[]; let floor=Infinity, extinctAt=null, drifted=0, errs=0;
  for(let s=1;s<=AT+AFTER;s++){
    if(row&&s>AT){ if(+row.get()!==to){ if(s>AT+1)drifted++; row.set(to); } }
    globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    const n=alive(); hist.push(n);
    if(s>AT){ if(n<floor)floor=n; if(n===0&&extinctAt===null)extinctAt=s-AT; }
    if(s%EVERY===0) series.push(n); }
  const mean=function(a,b){ let t=0; for(let k=a;k<b;k++)t+=hist[k]; return t/Math.max(1,b-a); };
  const before=mean(AT-LAW_WINDOW,AT), probation=mean(AT,AT+LAW_PROBATION), ratio=before>0?probation/before:0;
  const at=function(k){ return AT+k<=hist.length?hist[AT+k-1]:null; };
  let reach=null; if(row){ const span=row.hi-row.lo, h=0.175*span, d=Math.abs(to-def);
    reach=(to===row.lo||to===row.hi)?Math.max(0,(h-d)/(2*h)):0; }
  return {row:ROW||null,default:def,to,lo:row?row.lo:null,hi:row?row.hi:null,before:+before.toFixed(1),probation:+probation.toFixed(1),
    ratio:+ratio.toFixed(3),kept:ratio>=0.7,late:+mean(hist.length-1000,hist.length).toFixed(1),at2k:at(2000),at4k:at(4000),at6k:at(6000),
    floor,extinctAt,drifted,reach:reach===null?null:+reach.toFixed(3),errs,series}; };`,'/tmp/lawedge.js');
const r=globalThis.__LE(E.ROW||'',E.TO||'lo',AT,AFTER,EVERY);
console.log(JSON.stringify(Object.assign({seed:E.SEED||'1',at:AT,after:AFTER},r)));
