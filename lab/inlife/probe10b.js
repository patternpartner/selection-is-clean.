// probe8: population-wide blank vs NUDGE nulls. Design: PREREG-popblank-traits-b.md.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p8.js'); m.filename='/tmp/p8.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p8=function(MODE,K,T,END){
  const o={err:null,mode:MODE,k:K,linAtT:0,birthsAfter:0,birthsP:0,birthsC:0,series:[],lenAt:{}}; let on=false;
  const oP=addParticle,oC=addCompound;
  addParticle=function(x,y,tv,b,pa,pb){ const n0=N,r=oP.apply(this,arguments); if(on&&N>n0&&pa>=0){o.birthsAfter++;o.birthsP++;} return r; };
  addCompound=function(){ const n0=N,r=oC.apply(this,arguments); if(on&&N>n0&&arguments[8]>=0){o.birthsAfter++;o.birthsC++;} return r; };
  const meanLen=()=>{ let n=0,l=0; for(let i=0;i<N;i++){ if(palive[i]&&pProg[i]){ n++; l+=pProg[i].length; } } return +(l/Math.max(n,1)).toFixed(2); };
  const aliveN=()=>{ let n=0; for(let i=0;i<N;i++) if(palive[i])n++; return n; };
  for(let t=1;t<=END;t++){ try{ loop(); }catch(ex){ o.err=String(ex&&ex.message||ex); break; }
    if(t===T){ o.linAtT=nextLineageID; on=true; if(MODE==='NUDGE'){ for(let z=0;z<K;z++)Math.random(); } else if(MODE==='BLANK'){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } } }
    if(MODE==='BLANK'&&t>T&&(t-T)%20===0){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]&&pProg[i]&&pProg[i].length>0){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } }
    if(t%500===0){ o.series.push({t,alive:aliveN(),births:o.birthsAfter,meanLen:meanLen()}); } }
  o.aliveEnd=aliveN(); o.linNextEnd=nextLineageID; o.minted=nextLineageID-o.linAtT;
  { const D=DIMS; let n=0; const mu=new Float64Array(D); const lins=new Set(); for(let i=0;i<N;i++){ if(!palive[i])continue; n++; lins.add(pLin[i]); for(let d=0;d<D;d++)mu[d]+=tend[i*D+d]; } for(let d=0;d<D;d++)mu[d]/=Math.max(n,1); let v=0; for(let i=0;i<N;i++){ if(!palive[i])continue; for(let d=0;d<D;d++){ const x=tend[i*D+d]-mu[d]; v+=x*x; } } o.dispersion=v/Math.max(n,1); o.lineagesAlive=lins.size; o.dims=D; }
  return o; };
`, '/tmp/p8.js');
const SEED=+(process.env.SEED||1), MODE=process.env.MODE||'NUDGE', K=+(process.env.K||0), T=+(process.env.T||1500), END=+(process.env.END||4000);
const o=globalThis.__p8(MODE,K,T,END);
fs.writeFileSync(process.env.OUT,JSON.stringify({seed:SEED,...o}));
console.log(JSON.stringify({seed:SEED,mode:MODE,k:K,err:o.err,births:o.birthsAfter,aliveEnd:o.aliveEnd}));
