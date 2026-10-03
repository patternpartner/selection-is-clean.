// lab/autocat/diag3.js - Phase A3b diagnosis (TRIAL seeds only): why does used body novelty decline? An exact copy of
// World.bodyBirth with counters (same RNG calls, so the run is identical), plus per-window readouts: body size, captures
// attempted / blocked by a full body / added, NEW catalyst keys by origin (capture vs mutation), and the fraction of new keys
// that ever become USED (>= 1% of chemical income or of carriers, as in the Lu measure).
//   SEED=73 TICKS=250000 OPTS='{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16}' node lab/autocat/diag3.js
'use strict'; const {World}=require('../oee-core.js'); const E=process.env;
const w=new World(+(E.SEED||73),JSON.parse(E.OPTS)), P=w.p, M=P.BODY_MAX, S=P.CHEM_S, T=+(E.TICKS||250000), WIN=+(E.WIN||25000);
let c0={births:0,capTry:0,capFull:0,capAdd:0,capNoSrc:0,dupTry:0,dupFull:0,del:0,mut:0,newCap:0,newMut:0,full:0}, cnt={...c0};
const origin=new Map(), born=new Map(), used=new Set(); // key -> 'cap'|'mut'; first tick
w.bodyBirth=function(c,t){ const r=this.brng; let src=c; cnt.births++;
  if(P.BODY_SHUF){ for(let k=0;k<64;k++){ const q=(r()*this.C)|0; if(this.alive[q]&&q!==t){ src=q; break; } } }
  const L=[]; if(P.BODY_INH) for(let i=0;i<this.bn[src];i++)L.push(this.bd[src*M+i]); if(L.length>=M)cnt.full++;
  for(let i=0;i<L.length;i++) if(r()<P.BODY_MUT){ let q=L[i]>>8; if(r()<0.5)q=(r()*S)|0; const tt=this.bNewT(q); if(tt>=0){ L[i]=q*256+tt; cnt.mut++; if(!origin.has(L[i])){ origin.set(L[i],'mut'); born.set(L[i],this.tick); cnt.newMut++; } } }
  if(L.length&&L.length<M&&r()<P.BODY_DUP){ L.push(L[(r()*L.length)|0]); cnt.dupTry++; }
  if(L.length&&r()<P.BODY_DEL){ L.splice((r()*L.length)|0,1); cnt.del++; }
  if(L.length<M&&r()<P.BODY_CAP){ cnt.capTry++; const q=P.BODY_RCAP?(r()*S)|0:this.lastP[c]; if(q>=0){ const tt=this.bNewT(q); if(tt>=0){ const k=q*256+tt; L.push(k); cnt.capAdd++; if(!origin.has(k)){ origin.set(k,'cap'); born.set(k,this.tick); cnt.newCap++; } } } else cnt.capNoSrc++; }
  else if(L.length>=M)cnt.capFull+=P.BODY_CAP;   // expected captures lost to a full body (no RNG drawn when full, as in the core)
  for(let i=0;i<L.length;i++)this.bd[t*M+i]=L[i]; this.bn[t]=L.length; };
const acc=new Map(); let rowsW=[];
console.log('window end | births | mean body size | share of births with a full parent body | captures added | captures lost to full body (expected) | new keys from capture | new keys from mutation | mutations | deletions | catalyst kinds | used now | new USED this window (cap/mut origin) | fnGenoN | top fn share');
for(let s=1;s<=T;s++){ w.step(); if(s%1000===0){ const r=w.sample(), b=r.body; rowsW.push(r); for(const [k,v] of b.bU)acc.set(k,Math.max(acc.get(k)||0,0)); }
  if(s%WIN===0){ const inc=new Map(), car=new Map(); for(const r of rowsW){ for(const [k,v] of r.body.bU)inc.set(k,(inc.get(k)||0)+v/rowsW.length); for(const [k,v] of r.body.bC)car.set(k,(car.get(k)||0)+v/rowsW.length); }
    const u=new Set([...[...inc].filter(([k,v])=>v>=0.01).map(([k])=>k),...[...car].filter(([k,v])=>v>=0.01).map(([k])=>k)]); let nc=0, nm=0, no=0; for(const k of u) if(!used.has(k)){ used.add(k); const o=origin.get(k); if(o==='cap')nc++; else if(o==='mut')nm++; else no++; }
    const m=f=>rowsW.reduce((x,r)=>x+f(r),0)/rowsW.length;
    console.log(`${s} | ${cnt.births} | ${m(r=>r.body.size).toFixed(2)} | ${(cnt.full/Math.max(1,cnt.births)).toFixed(3)} | ${cnt.capAdd} | ${cnt.capFull.toFixed(0)} | ${cnt.newCap} | ${cnt.newMut} | ${cnt.mut} | ${cnt.del} | ${m(r=>r.body.kinds).toFixed(0)} | ${u.size} | ${nc+nm+no} (${nc}/${nm}${no?'/other '+no:''}) | ${m(r=>r.fnGenoN).toFixed(0)} | ${m(r=>r.fnGeno[0][1]/r.N).toFixed(3)}`);
    cnt={...c0}; rowsW=[]; } }
let ec=0, em=0, uc=0, um=0; for(const [k,o] of origin){ if(o==='cap'){ ec++; if(used.has(k))uc++; } else { em++; if(used.has(k))um++; } }
console.log(`TOTAL new keys: capture ${ec} (ever used ${uc}, ${(100*uc/Math.max(1,ec)).toFixed(1)}%), mutation ${em} (ever used ${um}, ${(100*um/Math.max(1,em)).toFixed(1)}%)`);
