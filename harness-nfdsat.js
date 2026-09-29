// #262 — THE TRAIT NFD, READ: does "the engine of novelty" (engine ~26698) differentiate, or is it a flat tax?
// Draw-free. Every EVERY ticks, recompute the engine's own term per living particle,
//   t = clamp(1 - binCount/(N/64 + 0.001), -1, 1)   on tendBin's 4x4x4 grid (bin edges at 0 and +/-0.6),
// and report the fraction at -1 (the full tax), the fraction with t>0 (paid for rarity), the mean and sd of t, and
// the occupied cells. Beside it, two what-ifs read in the SAME world (they do not change it):
//   centred  the same term on a 0.6-wide grid with the population mean at a bin centre (harness-oee's centredH grid)
//   occ      the same grid, divided by the mean over OCCUPIED cells and the living (the program NFD's form, ~26720)
// Output: late-half averages of each, the last population mean, and eight samples.
//   SEED=1 TICKS=20000 EVERY=500 node harness-nfdsat.js
const R=__dirname;
try{ require(R+'/harness-env.js').applyKnobs(globalThis); }catch(_){}
require(R+'/harness-env.js')(globalThis);
const fs=require('fs');
const E=process.env, T=+(E.TICKS||5000), EVERY=Math.max(1,Math.min(+(E.EVERY||50),T));   // at least one sample, even in smoke.sh
const code=fs.readFileSync(E.INDEX||R+'/engine.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/nfdsat.js');m.filename='/tmp/nfdsat.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__NP=function(T,EVERY){ const rows=[];
  const stat=function(ix,binOf,occ){ const h=new Map(); for(const i of ix){ const b=binOf(i); h.set(b,(h.get(b)||0)+1); }
    const mean=occ?ix.length/h.size:N/TCELLS; let sat=0,pos=0,s=0,s2=0; for(const i of ix){ let t=1-h.get(binOf(i))/(mean+0.001); t=t<-1?-1:t>1?1:t; if(t<=-1)sat++; if(t>0)pos++; s+=t; s2+=t*t; }
    const n=ix.length, mu=s/n; return {sat:+(sat/n).toFixed(3),pos:+(pos/n).toFixed(3),mean:+mu.toFixed(3),sd:+Math.sqrt(Math.max(0,s2/n-mu*mu)).toFixed(3),cells:h.size}; };
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if(s%EVERY) continue;
    const ix=[]; for(let i=0;i<N;i++) if(palive[i])ix.push(i); if(ix.length<2){ rows.push({s,n:ix.length}); continue; }
    const mu=[0,0,0]; for(const i of ix) for(let d=0;d<3;d++)mu[d]+=tend[i*DIMS+d]/ix.length;
    const cen=function(i){ let r=0; for(let d=0;d<3;d++){ let q=Math.floor((tend[i*DIMS+d]-mu[d]+0.3)/0.6)+2; q=q<0?0:q>3?3:q; r=r*4+q; } return r; };
    rows.push({s,n:ix.length,N,mu:mu.map(v=>+v.toFixed(3)),corner:stat(ix,tendBin),centred:stat(ix,cen),occ:stat(ix,tendBin,true)}); }
  return rows; };`,'/tmp/nfdsat.js');
const rows=globalThis.__NP(T,EVERY);
const late=rows.filter(r=>r.corner&&r.s>T/2);
const avg=(k,f)=>+(late.reduce((t,r)=>t+r[k][f],0)/late.length).toFixed(3);
console.log(JSON.stringify({seed:E.SEED||'1',ticks:T,lateSamples:late.length,
  corner:{sat:avg('corner','sat'),pos:avg('corner','pos'),mean:avg('corner','mean'),sd:avg('corner','sd'),cells:avg('corner','cells')},
  centred:{sat:avg('centred','sat'),pos:avg('centred','pos'),mean:avg('centred','mean'),sd:avg('centred','sd'),cells:avg('centred','cells')},
  occ:{sat:avg('occ','sat'),pos:avg('occ','pos'),mean:avg('occ','mean'),sd:avg('occ','sd'),cells:avg('occ','cells')},
  muLate:late.at(-1)&&late.at(-1).mu, sample:rows.filter((r,i)=>i%Math.max(1,Math.floor(rows.length/8))===0)}));
