// analysis for PREREG-repl-default.md.  node lab/inlife/analyse-repl-default.js <dir>
// files: <seed>_<D0..D3|R0..R2>.json (harness-oee.js stdout). D = the current default world (null band), R = REPL=1.
const fs=require('fs'); const D=process.argv[2]; const seeds=[6101,6102,6103,6104,6105];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const M=j=>{ const t=j.verdict.diversity_trend, e=j.establishment||{}, last=j.series[j.series.length-1];
  return {cer:t.centredEntropyRatio, spread:t.spread_late, est:e.estFrac, alive:e.alive_late,
    er:t.entropyRatio, kinds:t.kinds_late, N:last.N, gen:last.generation, births:last.births,
    errs:(j.loopErrors||0)+(j.driverErr||0), never:j.livenessNever||[]}; };
const crashed=j=>{ const a=j.series.map(s=>s.N); let hi=false; for(const n of a){ if(n>20)hi=true; else if(hi&&n<5)return true; } return false; };
const thr={cer:(c,b)=>Math.abs(b-c)>0.05, spread:(c,b)=>Math.abs(b-c)>0.10*Math.abs(c), est:(c,b)=>c===0?b!==0:Math.abs(b-c)>0.25*Math.abs(c)};
const KEYS=['cer','spread','est'], rows=[];
for(const s of seeds){
  const dj=['D0','D1','D2','D3'].map(a=>load(s,a)), rj=['R0','R1','R2'].map(a=>load(s,a));
  if(dj.some(x=>!x)||rj.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const dOk=dj.filter(j=>!crashed(j)&&M(j).errs===0).map(M);
  const rRan=rj.filter(j=>M(j).errs===0&&M(j).never.indexOf('repl.birth')<0);
  const counted=dOk.length>=3&&rRan.length===3;
  const rm=rRan.map(M), rCrash=rRan.filter(crashed).length, dCrash=dj.filter(crashed).length;
  const fmt=a=>a.map(x=>x==null?'-':(+x).toFixed(3)).join(',');
  console.log(`\n${s}${counted?'':'  NOT COUNTED'}  default ok ${dOk.length}/4 (crashed ${dCrash})  REPL ran ${rRan.length}/3 (crashed ${rCrash})`);
  const mv={};
  for(const k of KEYS){ const dv=dOk.map(x=>x[k]), rv=rm.map(x=>x[k]);
    if(dv.some(v=>v==null)||rv.some(v=>v==null)||!rv.length){ mv[k]='none'; continue; }
    const lo=Math.min(...dv), hi=Math.max(...dv), dm=mean(dv), r=mean(rv);
    const above=rv.every(v=>v>hi), below=rv.every(v=>v<lo);
    mv[k]=((above||below)&&thr[k](dm,r))?(above?'UP':'DOWN'):'none';
    console.log(`  ${k.padEnd(6)} default ${fmt(dv)} (mean ${dm.toFixed(3)})  REPL ${fmt(rv)} (mean ${r.toFixed(3)})  -> ${mv[k]}`); }
  for(const k of ['alive','N','er','kinds','gen','births'])
    console.log(`  ${('['+k+']').padEnd(8)} default ${fmt(dj.map(j=>M(j)[k]))}  REPL ${fmt(rj.map(j=>M(j)[k]))}`);
  rows.push({s,counted,mv,crash:rCrash>0&&dCrash===0});
}
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3);
const tally={}; for(const k of KEYS) tally[k]={UP:c.filter(r=>r.mv[k]==='UP').length, DOWN:c.filter(r=>r.mv[k]==='DOWN').length};
const crashN=c.filter(r=>r.crash).length;
console.log(`\ncounted ${c.length}/5, need ${need}  ${JSON.stringify(tally)}  REPL-only crash seeds ${crashN}`);
let v;
if(c.length<3) v='INCONCLUSIVE';
else { const worse=KEYS.some(k=>tally[k].DOWN>=need)||crashN>=need, better=KEYS.some(k=>tally[k].UP>=need);
  const anyMove=c.some(r=>KEYS.some(k=>r.mv[k]!=='none'));
  v=worse&&better?'SPLIT':worse?'WORSE':better?'BETTER':anyMove?'DIFFERS, NO CONSISTENT DIRECTION':'NO MEASURED DIFFERENCE'; }
console.log('VERDICT: '+v);
