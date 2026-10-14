// analysis for PREREG-mind-repl.md. node analyse16.js <dir>  files <seed>_<M|U|F|N0|N1|N2>.json
const fs=require('fs'); const D=process.argv[2]; const seeds=[121,122,123,124,125]; const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const M=j=>({cer:j.verdict.diversity_trend.centredEntropyRatio,spread:j.verdict.diversity_trend.spread_late,est:j.establishment?j.establishment.estFrac:0,alive:j.establishment?j.establishment.alive_late:0,
 N:j.series[j.series.length-1].N,births:j.series[j.series.length-1].births,errs:(j.loopErrors||0)+(j.driverErr||0),uses:(j.mind&&j.mind.uses)||0,lossOp:j.mind&&j.mind.lossOp});
const thr={cer:(c,b)=>Math.abs(b-c)>0.05,spread:(c,b)=>Math.abs(b-c)>0.10*Math.abs(c),est:(c,b)=>c===0?b!==0:Math.abs(b-c)>0.25*Math.abs(c),alive:(c,b)=>Math.abs(b-c)>0.25*Math.abs(c)};
const res={M:[],U:[],F:[]};
for(const s of seeds){ const A={M:load(s,'M'),U:load(s,'U'),F:load(s,'F')}, C=['N0','N1','N2'].map(a=>load(s,a));
  if(!A.M||!A.U||!A.F||C.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const c=C.map(M).filter(x=>x.N>=5&&x.errs===0);
  console.log(`\n${s}: nulls ok ${c.length}/3  alive_late ${c.map(x=>x.alive)}  cER ${c.map(x=>x.cer)}  spread ${c.map(x=>x.spread)}  est ${c.map(x=>x.est)}`);
  for(const arm of ['M','U','F']){ const b=M(A[arm]); const counted=b.uses>0&&b.errs===0&&c.length>=2; const mv={};
    for(const k of ['cer','spread','est','alive']){ const v=c.map(x=>x[k]), m=mean(v); const out=b[k]<Math.min(...v)||b[k]>Math.max(...v); mv[k]=(out&&thr[k](m,b[k]))?(b[k]>m?'UP':'DOWN'):'none'; }
    console.log(`  ${arm}${counted?'':' NOT COUNTED'} uses ${b.uses} lossOp ${b.lossOp} N ${b.N} alive_late ${b.alive} ${mv.alive} | cER ${b.cer} ${mv.cer} | spread ${b.spread} ${mv.spread} | est ${b.est} ${mv.est}`);
    res[arm].push({counted,mv,alive:b.alive}); } }
for(const arm of ['M','U','F']){ const r=res[arm].filter(x=>x.counted); const need=Math.ceil(r.length*2/3); const t={};
  for(const k of ['cer','spread','est','alive']) t[k]={UP:r.filter(x=>x.mv[k]==='UP').length,DOWN:r.filter(x=>x.mv[k]==='DOWN').length};
  console.log(`\n${arm}: counted ${r.length}/5 need ${need} ${JSON.stringify(t)}${r.length<3?'  INCONCLUSIVE':''}`); }
