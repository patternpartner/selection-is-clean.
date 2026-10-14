// probe14 (PILOT): a world with the VM entry points turned into no-ops (executeVM, executeClusterVM, executeSoloVM) from tick T, against draw-order nulls.
// MODE=NOVM|NUDGE. T=0 applies before the first tick. Reads state only; wrappers draw nothing.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p14.js'); m.filename='/tmp/p14.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p14=function(MODE,K,T,END,EVERY){
  const o={err:null,mode:MODE,k:K,births:0,series:[]}; let on=false; const oP=addParticle,oC=addCompound;
  addParticle=function(x,y,tv,b,pa,pb){ const n0=N,r=oP.apply(this,arguments); if(on&&N>n0&&pa>=0)o.births++; return r; };
  addCompound=function(){ const n0=N,r=oC.apply(this,arguments); if(on&&N>n0&&arguments[8]>=0)o.births++; return r; };
  const apply=()=>{ on=true; if(MODE==='NOVM'){ executeVM=function(){}; executeClusterVM=function(){}; executeSoloVM=function(){}; } else { for(let z=0;z<K;z++)Math.random(); } };
  if(T===0)apply();
  const snap=(t)=>{ let n=0; const lins=new Set(), cl=new Set(); let sp=0; const D=DIMS; const mu=new Float64Array(D);
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++; lins.add(pLin[i]); if(clusterID[i]>=0)cl.add(clusterID[i]); sp+=Math.hypot(vx[i],vy[i]); for(let d=0;d<D;d++)mu[d]+=tend[i*D+d]; }
    for(let d=0;d<D;d++)mu[d]/=Math.max(n,1); let v=0; for(let i=0;i<N;i++){ if(!palive[i])continue; for(let d=0;d<D;d++){ const x=tend[i*D+d]-mu[d]; v+=x*x; } }
    o.series.push({t,alive:n,births:o.births,lineagesAlive:lins.size,minted:nextLineageID,clusters:cl.size,meanSpeed:+(sp/Math.max(n,1)).toFixed(3),dispersion:+(v/Math.max(n,1)).toFixed(3),dims:D}); };
  for(let t=1;t<=END;t++){ try{ loop(); }catch(ex){ o.err=String(ex&&ex.message||ex); break; } if(t===T&&T>0)apply(); if(t%EVERY===0)snap(t); }
  return o; };
`, '/tmp/p14.js');
const o=globalThis.__p14(process.env.MODE,+(process.env.K||0),+(process.env.T||0),+(process.env.END||8000),+(process.env.EVERY||1000));
fs.writeFileSync(process.env.OUT,JSON.stringify({seed:process.env.SEED,...o})); console.log(JSON.stringify({seed:process.env.SEED,mode:o.mode,k:o.k,err:o.err,births:o.births,last:o.series[o.series.length-1]}));
