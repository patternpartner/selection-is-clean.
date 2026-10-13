// probe5: randomized revert / sham / control of true founders' accumulated program change. Design: PREREG-permblank.md.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p5.js'); m.filename='/tmp/p5.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p5=function(SEED,T,END){
  const o={err:null,integrity:{},indiv:[],curve:[]}; const W=new WeakMap(), reg=[];
  const hash=p=>{ let h=''; if(p) for(const r of p)h+=r[0]+','+r[1]+','+r[2]+','+(+r[3]).toFixed(3)+';'; return h; };
  let s=(SEED*7919+12345)>>>0; const rnd=()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; };
  const rec=(pa)=>{ if(!(pa>=0)||!palive[pa])return; const g=pGenome[pa]; if(!g)return; const e=W.get(g); if(e&&e.kidsOn)e.kids++; };
  const oP=addParticle,oC=addCompound;
  addParticle=function(x,y,tv,b,pa,pb){ const n0=N,r=oP.apply(this,arguments); if(N>n0)rec(pa); return r; };
  addCompound=function(){ const n0=N,r=oC.apply(this,arguments); if(N>n0)rec(arguments[8]); return r; };
  const diffCount=(a,b)=>{ const la=a?a.length:0, lb=b?b.length:0; let d=Math.abs(la-lb); for(let i=0;i<Math.min(la,lb);i++){ if(a[i][0]!==b[i][0]||a[i][1]!==b[i][1]||a[i][2]!==b[i][2]||Math.abs(a[i][3]-b[i][3])>0.0005)d++; } return d; };
  const blankEmpty=()=>{ let alive=0,empty=0; const as=new Map(); for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i])as.set(pGenome[i],i); } for(const e of reg){ if(e.arm!=='BLANK')continue; const i=as.get(e.g); if(i===undefined)continue; alive++; if(pProg[i]&&pProg[i].length===0)empty++; } return {blankAlive:alive,blankAliveEmpty:empty}; };
  const aliveArms=()=>{ const as=new Set(); for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i])as.add(pGenome[i]); } const c={BLANK:0,SHAM:0,CONTROL:0,UNCHANGED:0}; for(const e of reg){ if(as.has(e.g))c[e.arm]++; } return {c,as}; };
  for(let t=1;t<=END;t++){ try{ loop(); }catch(ex){ o.err=String(ex&&ex.message||ex); break; }
    if(t===1){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]&&pProg[i]) W.set(pGenome[i],{g:pGenome[i],prog0:pProg[i].map(r=>r.slice()),h0:hash(pProg[i]),arm:null,kidsOn:false,kids:0}); } }
    if(t===T){ const elig=[], unch=[];
      for(let i=0;i<N;i++){ if(!palive[i])continue; const e=pGenome[i]&&W.get(pGenome[i]); if(!e)continue; (hash(pProg[i])!==e.h0?elig:unch).push(i); }
      for(let k=elig.length-1;k>0;k--){ const j=Math.floor(rnd()*(k+1)); const x=elig[k]; elig[k]=elig[j]; elig[j]=x; }
      const per=Math.floor(elig.length/3), arms=['BLANK','SHAM','CONTROL'];
      o.integrity={eligible:elig.length,perArm:per,unchanged:unch.length,blankOk:0,shamOk:0,reblanked:0,recloned:0,aliasedBefore:0,applied:0};
      for(let a=0;a<3;a++){ for(let q=a*per;q<(a+1)*per;q++){ const i=elig[q], g=pGenome[i], e=W.get(g); const pre=hash(pProg[i]);
          e.arm=arms[a]; e.kidsOn=true; e.pre={len:pProg[i].length,diff:diffCount(pProg[i],e.prog0),aliased:(pProg[i]===g.vmProgram)?1:0}; reg.push(e);
          if(e.pre.aliased)o.integrity.aliasedBefore++;
          if(arms[a]==='BLANK'){ const c=[]; pProg[i]=c; g.vmProgram=c; if(pProg[i].length===0)o.integrity.blankOk++; o.integrity.applied++; }
          else if(arms[a]==='SHAM'){ const c=pProg[i].map(r=>r.slice()); pProg[i]=c; g.vmProgram=c; if(hash(pProg[i])===pre)o.integrity.shamOk++; o.integrity.applied++; } } }
      
      for(const i of unch){ const e=W.get(pGenome[i]); e.arm='UNCHANGED'; e.kidsOn=true; e.pre={len:pProg[i].length,diff:0,aliased:(pProg[i]===pGenome[i].vmProgram)?1:0}; reg.push(e); }
      o.curve.push({t,...aliveArms().c}); }
    if(t>T&&t%500===0) o.curve.push({t,...aliveArms().c,...blankEmpty()});
    if(t>T&&(t-T)%20===0){ for(let i=0;i<N;i++){ if(!palive[i])continue; const g=pGenome[i]; const e=g&&W.get(g); if(!e)continue; if(e.arm==='BLANK'){ if(pProg[i]&&pProg[i].length>0){ const c=[]; pProg[i]=c; g.vmProgram=c; o.integrity.reblanked++; } } else if(e.arm==='SHAM'){ if(pProg[i]){ const c=pProg[i].map(r=>r.slice()); pProg[i]=c; g.vmProgram=c; o.integrity.recloned++; } } } } }
  const {as}=aliveArms(); for(const e of reg) o.indiv.push([e.arm, as.has(e.g)?1:0, e.kids, e.pre.len, e.pre.diff, e.pre.aliased]);
  return o; };
`, '/tmp/p5.js');
const SEED=+(process.env.SEED||1), T=+(process.env.T||1500), END=+(process.env.END||4000);
const o=globalThis.__p5(SEED,T,END);
fs.writeFileSync(process.env.OUT||('/tmp/p5-'+SEED+'.json'),JSON.stringify({seed:SEED,T,END,err:o.err,integrity:o.integrity,curve:o.curve,indiv:o.indiv}));
console.log(JSON.stringify({seed:SEED,T,END,err:o.err,integrity:o.integrity,curve:o.curve}));
