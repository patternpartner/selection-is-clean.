// analysis for PREREG-repl.md. node analyse15.js <dir>   files: <seed>_<NOVM|BLANK|C0|C1|C2>.json (harness-oee.js stdout)
const fs=require('fs'); const D=process.argv[2]; const seeds=[111,112,113,114,115]; const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const M=j=>({cer:j.verdict.diversity_trend.centredEntropyRatio,spread:j.verdict.diversity_trend.spread_late,est:j.establishment?j.establishment.estFrac:null,alive:j.establishment?j.establishment.alive_late:null,
 er:j.verdict.diversity_trend.entropyRatio,kinds:j.verdict.diversity_trend.kinds_late,births:j.series[j.series.length-1].births,N:j.series[j.series.length-1].N,errs:(j.loopErrors||0)+(j.driverErr||0),calls:j.vmNoopCalls,prog:j.popProgLen});
const thr={cer:(c,b)=>Math.abs(b-c)>0.05,spread:(c,b)=>Math.abs(b-c)>0.10*Math.abs(c),est:(c,b)=>c===0?b!==0:Math.abs(b-c)>0.25*Math.abs(c)};
const res={NOVM:[],BLANK:[]};
for(const s of seeds){ const A={NOVM:load(s,'NOVM'),BLANK:load(s,'BLANK')}, C=['C0','C1','C2'].map(a=>load(s,a));
  if(!A.NOVM||!A.BLANK||C.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const cm=C.map(M), c=cm.filter(x=>x.N>=5&&x.errs===0);
  console.log(`\n${s}: controls ok ${c.length}/3  N ${cm.map(x=>x.N)}  alive_late ${cm.map(x=>x.alive)}  births ${cm.map(x=>x.births)}`);
  for(const arm of ['NOVM','BLANK']){ const b=M(A[arm]); const counted=c.length>=2&&b.errs===0&&(arm==='BLANK'||b.calls>100000);
    const mv={}; for(const k of ['cer','spread','est']){ const v=c.map(x=>x[k]), m=mean(v); const out=b[k]<Math.min(...v)||b[k]>Math.max(...v); mv[k]=(out&&thr[k](m,b[k]))?(b[k]>m?'UP':'DOWN'):'none'; }
    console.log(`  ${arm}${counted?'':' NOT COUNTED'} N ${b.N} alive_late ${b.alive} births ${b.births} prog ${b.prog}${b.calls!==undefined?' vmcalls '+b.calls:''} | cER ${b.cer} (${mean(c.map(x=>x.cer)).toFixed(2)}) ${mv.cer} | spread ${b.spread} (${mean(c.map(x=>x.spread)).toFixed(3)}) ${mv.spread} | est ${b.est} (${mean(c.map(x=>x.est)).toFixed(4)}) ${mv.est} | er ${b.er} kinds ${b.kinds}`);
    res[arm].push({counted,mv}); } }
for(const arm of ['NOVM','BLANK']){ const r=res[arm].filter(x=>x.counted); const need=Math.ceil(r.length*2/3);
  const t={}; for(const k of ['cer','spread','est']) t[k]={UP:r.filter(x=>x.mv[k]==='UP').length,DOWN:r.filter(x=>x.mv[k]==='DOWN').length};
  console.log(`\n${arm}: counted ${r.length}/5 need ${need}  ${JSON.stringify(t)}`); if(r.length<3)console.log('  INCONCLUSIVE'); }
