// #264 (run: node microcosm-scale.js <outdir>): does the arms race survive at the FIELD's scale? #260's 10 coexisting regimes x unseen seeds 21-23, phage on,
// four scales: field (CAP 7200 = 18 x 400, 18 patches) at MIG 0.005 and at MIG 0.0005; references CAP 300/4 and 20000/16.
// Four at a time. Rule fixed before: the race SURVIVES at a scale if phage are alive into the late window (and the
// culture too) in at least 20 of the 30 runs.
const cp=require('child_process'), fs=require('fs'), OUT=process.argv[2]; fs.mkdirSync(OUT,{recursive:true});
const REG=[{A:0.0001,DELTA:0.005,B:5,H:1,MUP:0.05,COST:0.1},{A:0.0001,DELTA:0.005,B:5,H:1,MUP:0.2,COST:0.1},{A:0.0001,DELTA:0.02,B:5,H:1,MUP:0.05,COST:0.1},
  {A:0.0001,DELTA:0.02,B:5,H:1,MUP:0.2,COST:0.1},{A:0.0001,DELTA:0.02,B:20,H:0,MUP:0.2,COST:0.1},{A:0.0001,DELTA:0.02,B:20,H:1,MUP:0.2,COST:0.1},
  {A:0.0001,DELTA:0.05,B:5,H:0,MUP:0.05,COST:0.1},{A:0.0001,DELTA:0.05,B:5,H:0,MUP:0.2,COST:0.1},{A:0.0001,DELTA:0.05,B:5,H:1,MUP:0.05,COST:0.1},
  {A:0.0001,DELTA:0.05,B:5,H:1,MUP:0.2,COST:0.1}];
const SCALES=[['field',7200,18,0.005],['fieldLowMig',7200,18,0.0005],['world',300,4,0.005],['culture',20000,16,0.005]];
const jobs=[]; REG.forEach((g,ri)=>{ for(const seed of [21,22,23]) for(const [name,cap,pat,mig] of SCALES)
  jobs.push({ri,seed,name,env:Object.assign({},g,{MIG:mig,SEED:seed,PHAGE:1,CAP:cap,PATCHES:pat,STEPS:20000})}); });
let i=0; const res=[];
const one=j=>new Promise(r=>{ const f=OUT+'/'+j.name+'_r'+j.ri+'_s'+j.seed+'.json'; if(fs.existsSync(f)){ r(JSON.parse(fs.readFileSync(f,'utf8'))); return; }
  const env=Object.assign({},process.env); for(const k in j.env)env[k]=String(j.env[k]);
  cp.execFile('node',[__dirname+'/harness-microcosm.js'],{env,maxBuffer:1e8},(e,out)=>{ let x; try{ x=JSON.parse(out); }catch(_){ x={error:String(e)}; }
    x.ri=j.ri; x.scale=j.name; fs.writeFileSync(f,JSON.stringify(x)); r(x); }); });
(async()=>{ async function w(){ while(i<jobs.length){ const j=jobs[i++]; res.push(await one(j)); } } await Promise.all([w(),w(),w(),w()]);
  fs.writeFileSync(OUT+'/all.done','ok');
  const late=10000;
  for(const [name] of SCALES){ const R=res.filter(x=>x.scale===name&&!x.error);
    const live=R.filter(x=>x.crashedAt===null&&(x.phageGoneAt===null||x.phageGoneAt>late));
    const crashed=R.filter(x=>x.crashedAt!==null).length, lost=R.filter(x=>x.crashedAt===null&&x.phageGoneAt!==null&&x.phageGoneAt<=late).length;
    const m=(a,f)=>a.length?+(a.reduce((t,x)=>t+x[f],0)/a.length).toFixed(3):null;
    console.log(name.padEnd(12),'runs',R.length,'| race alive into late window',live.length,'| phage lost',lost,'| culture crashed',crashed,
      '| live runs: lock/tag persist per 1k',m(live,'lockPersistPer1k'),'/',m(live,'tagPersistPer1k'),'| lock>tag in',live.filter(x=>x.lockPersistPer1k>x.tagPersistPer1k).length,
      '|', live.length>=20?'SURVIVES':'does not survive'); }
})();
