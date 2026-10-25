// #351 - PREREG-default.md's rules on lab/port/out-default (harness-oee outputs). D = default (null band), T = TASKS, R = REPL reference.
const fs=require('fs'), D=__dirname+'/out-default', seeds=[9201,9202,9203];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,a)=>{ if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const late=(j,k)=>mean(j.series.filter(x=>x.tick>=14000).map(x=>x[k]));
const M=j=>{ const t=j.verdict.diversity_trend, e=j.establishment||{}, last=j.series[j.series.length-1];
  return {cer:t.centredEntropyRatio, spread:t.spread_late, est:e.estFrac, lin:late(j,'linStanding'), prog:late(j,'progSigH'), alive:e.alive_late,
    er:t.entropyRatio, kinds:t.kinds_late, N:last.N, births:last.births, errs:(j.loopErrors||0)+(j.driverErr||0), never:j.livenessNever||[]}; };
const crashed=j=>{ let hi=false; for(const s of j.series){ if(s.N>20)hi=true; else if(hi&&s.N<5)return true; } return false; };
const rel=f=>(c,b)=>c===0?b!==0:Math.abs(b-c)>f*Math.abs(c);
const thr={cer:(c,b)=>Math.abs(b-c)>0.05, spread:rel(0.10), est:rel(0.25), lin:rel(0.25), prog:rel(0.10)};
const KEYS=['cer','spread','est','lin','prog'], rows=[], fmt=a=>a.map(x=>x==null||Number.isNaN(x)?'-':(+x).toFixed(3)).join(',');
for(const s of seeds){ const dj=['D0','D1','D2','D3'].map(a=>load(s,a)), tj=['T0','T1','T2'].map(a=>load(s,a)), rj=load(s,'R0');
  if(dj.some(x=>!x)||tj.some(x=>!x)||!rj){ console.log(s,'incomplete'); continue; }
  const dOk=dj.filter(j=>!crashed(j)&&M(j).errs===0).map(M), tRan=tj.filter(j=>M(j).errs===0&&M(j).never.indexOf('repl.birth')<0);
  const counted=dOk.length>=3&&tRan.length===3, tm=tRan.map(M), tCrash=tRan.filter(crashed).length, dCrash=dj.filter(crashed).length;
  console.log(`\n${s}${counted?'':'  NOT COUNTED'}  default ok ${dOk.length}/4 (crashed ${dCrash})  TASKS ran ${tRan.length}/3 (crashed ${tCrash})`);
  const mv={}; for(const k of KEYS){ const dv=dOk.map(x=>x[k]), tv=tm.map(x=>x[k]);
    if(dv.some(v=>v==null)||tv.some(v=>v==null)||!tv.length){ mv[k]='none'; continue; }
    const lo=Math.min(...dv), hi=Math.max(...dv), dm=mean(dv), t=mean(tv), above=tv.every(v=>v>hi), below=tv.every(v=>v<lo);
    mv[k]=((above||below)&&thr[k](dm,t))?(above?'UP':'DOWN'):'none';
    console.log(`  ${k.padEnd(6)} default ${fmt(dv)} (mean ${dm.toFixed(3)})  TASKS ${fmt(tv)} (mean ${t.toFixed(3)})  REPL ${fmt([M(rj)[k]])}  -> ${mv[k]}`); }
  for(const k of ['alive','N','er','kinds','births']) console.log(`  ${('['+k+']').padEnd(8)} default ${fmt(dj.map(j=>M(j)[k]))}  TASKS ${fmt(tj.map(j=>M(j)[k]))}  REPL ${fmt([M(rj)[k]])}`);
  rows.push({s,counted,mv,crash:tCrash>0&&dCrash===0}); }
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3), tally={};
for(const k of KEYS) tally[k]={UP:c.filter(r=>r.mv[k]==='UP').length, DOWN:c.filter(r=>r.mv[k]==='DOWN').length};
const crashN=c.filter(r=>r.crash).length; console.log(`\ncounted ${c.length}/3, need ${need}  ${JSON.stringify(tally)}  TASKS-only crash seeds ${crashN}`);
let v; if(c.length<3) v='INCONCLUSIVE'; else { const worse=KEYS.some(k=>tally[k].DOWN>=need)||crashN>=need, better=KEYS.some(k=>tally[k].UP>=need), any=c.some(r=>KEYS.some(k=>r.mv[k]!=='none'));
  v=worse&&better?'SPLIT':worse?'WORSE':better?'BETTER':any?'DIFFERS, NO CONSISTENT DIRECTION':'NO MEASURED DIFFERENCE'; }
console.log('VERDICT: '+v);
