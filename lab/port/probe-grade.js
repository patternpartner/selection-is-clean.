// #445 - HOW ARBITRARY IS THE GRADE PAST FIVE INPUTS? The engine grades a function of more than five inputs by a Shannon split on its
// TOP input, recursively, down to the five-input grade (oSz). The same function with its inputs in another order grades differently.
// This probe runs an open world, then takes every function the ground holds and grades it twice: the engine's way, and by the best
// split order over the inputs past the fifth (every order tried). Reads only; draws nothing.
//   SEED=12 TICKS=10000 node lab/port/probe-grade.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
process.env.TASKS='1'; process.env.MIND=process.env.MIND||'20'; process.env.SEED=process.env.SEED||'12';
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/probe-grade.js'); m.filename='/tmp/probe-grade.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__T=function(ticks){ for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; loop(); }
  // best grade of table T (an array of 32-bit words, length a power of two) over every order of splitting on its word-index bits
  const comb=(a,b,lo,hi,neg,rec)=>{ if(a<0&&b<0)return a===-1?0:1; if(a===-1)return b+4; if(b===-1)return a+5; if(a===-2)return 1+rec(hi,!neg); if(b===-2)return 2+rec(lo,!neg); return a+b+4; };
  const best=(T,neg)=>{ const w=T.length; if(w===1){ let x=neg?~T[0]:T[0]; x>>>=0; return x===0?-1:x===0xFFFFFFFF?-2:taskSz5(x); }
    let out=1e9; for(let b=1;b<w;b<<=1){ const lo=[], hi=[]; for(let x=0;x<w;x++)((x&b)?hi:lo).push(T[x]); let eq=true; for(let x=0;x<lo.length;x++) if(lo[x]!==hi[x]){ eq=false; break; }
      if(eq)return best(lo,neg); const a=best(lo,neg), c=best(hi,neg), z=comb(a,c,lo,hi,neg,best); if(z<out)out=z; } return out; };
  const rows=[]; for(let c=0;c<FIELD_W*FIELD_H;c++){ if(!tG[c])continue; for(let x=0;x<oWD;x++)oF[x]=oG[c*OWM+x];
    let mm=tNin, w=oWD; while(mm>5){ const h=w>>1; let eq=true; for(let x=0;x<h;x++) if(oF[x]!==oF[x+h]){ eq=false; break; } if(!eq)break; mm--; w=h; }
    if(mm===5)continue; const top=oSz(0,mm,false), T=[]; for(let x=0;x<w;x++)T.push(oF[x]); rows.push([mm,top,best(T,false)]); }
  return {n:tNin, rows}; };`, m.filename);
const R=globalThis.__T(parseInt(process.env.TICKS||'10000',10)); const r=R.rows.filter(x=>x[2]>0);
const q=(a,p)=>{ const b=a.slice().sort((x,y)=>x-y); return b[Math.min(b.length-1,Math.floor(b.length*p))]; };
const ratio=r.map(x=>x[1]/x[2]), lt=r.map(x=>Math.log(x[1])), lb=r.map(x=>Math.log(x[2])), mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const mt=mean(lt), mb=mean(lb); let sxy=0,sxx=0,syy=0; for(let i=0;i<r.length;i++){ sxy+=(lt[i]-mt)*(lb[i]-mb); sxx+=(lt[i]-mt)**2; syy+=(lb[i]-mb)**2; }
console.log('inputs held '+R.n+'; ground functions past five inputs '+r.length+'; the engine grade over the best-order grade: median '+q(ratio,0.5).toFixed(2)+', 10th-90th percentile '+q(ratio,0.1).toFixed(2)+'-'+q(ratio,0.9).toFixed(2)+', max '+q(ratio,0.999).toFixed(2)+
  '; correlation of their logs '+(sxy/Math.sqrt(sxx*syy)).toFixed(3)+'; share graded exactly alike '+(ratio.filter(v=>v===1).length/r.length).toFixed(2)+'; mean grade engine '+mean(r.map(x=>x[1])).toFixed(1)+', best order '+mean(r.map(x=>x[2])).toFixed(1));
