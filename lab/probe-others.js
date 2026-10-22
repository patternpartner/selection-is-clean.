// lab/probe-others.js - #335: what are #334's size-7..10 functions built from? Loads a LIVE world's save and runs it on,
// with READ_OTHER live (KO=0) or knocked out from the first tick (KO=1: the loaded world's OTHERS set to 2, so a read
// returns 0). Same state and RNG at the start, so the two are the same world until the first read.
// At every PAID output it records the function T, its NAND size, whether the organism had read a nonzero word this epoch,
// and that word's function g; composition DEPTH(T) is 0 if T was paid without a read, else 1 + DEPTH(g) (the smallest
// seen). A read is not proof the output used it - the knockout is the causal test. Draws nothing beyond the world's own.
//   LOAD=lab/out-others/7001_o1.7.save TICKS=30000 KO=0 node lab/probe-others.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js'); const {SZ}=require('./core-tasks.js');
const E=process.env, T=+(E.TICKS||60000), KO=(E.KO|0)===1;
const w=World.load(fs.readFileSync(E.LOAD,'utf8')); if(KO) w.p.OTHERS=2;
const fnOf=v=>{ const I=w.win; let F=0, set=0; for(let i=0;i<32;i++){ const k=(((I[0]>>>i)&1)<<2)|(((I[1]>>>i)&1)<<1)|((I[2]>>>i)&1), o=(v>>>i)&1;
  if(set&(1<<k)){ if(((F>>k)&1)!==o)return -1; } else { set|=1<<k; if(o)F|=1<<k; } } return F; };
const paid=new Map(), depth=new Map(); let paidN=0, withRead=0;
const orig=w.taskOut.bind(w);
w.taskOut=function(c,v){ const before=this.E[c]; const e=this.epoch(); const rd=(this.treadE[c]===e&&this.tread[c]!==0)?this.tread[c]:0;
  orig(c,v); if(!(this.E[c]>before)) return;   // not paid (a payment is the only thing taskOut adds to the store)
  const F=fnOf(v); if(F<0) return; paidN++; const g=rd?fnOf(rd):-1; if(rd) withRead++;
  const d=(g>=0&&g!==0&&g!==255)?1+(depth.has(g)?depth.get(g):0):0; if(!depth.has(F)||d<depth.get(F)) depth.set(F,d);
  let p=paid.get(F); if(!p){ p={n:0,withRead:0,gs:new Map()}; paid.set(F,p); } p.n++; if(rd){ p.withRead++; if(g>=0) p.gs.set(g,(p.gs.get(g)||0)+1); } };
for(let s=0;s<T;s++) w.step();
const fns=[...paid.entries()].filter(([F,p])=>p.n>=50).map(([F,p])=>({F, hex:F.toString(16), size:SZ[F], paid:p.n, readShare:+(p.withRead/p.n).toFixed(3), depth:depth.get(F),
  topG:[...p.gs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([g,n])=>g.toString(16)+'/s'+SZ[g]+'x'+n)})).sort((a,b)=>b.size-a.size||b.paid-a.paid);
console.log(JSON.stringify({load:E.LOAD, ko:KO, ticks:T, paidN, readShare:+(withRead/Math.max(1,paidN)).toFixed(3), hardest:fns.length?fns[0].size:0, nFns:fns.length,
  bySize:fns.reduce((m,f)=>(m[f.size]=(m[f.size]||0)+1,m),{}), depthHist:fns.reduce((m,f)=>(m[f.depth]=(m[f.depth]||0)+1,m),{}), fns}));
