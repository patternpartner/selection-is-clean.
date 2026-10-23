// lab/probe-hops.js - step 1 after #344 (the user's design): how deep do PAID functions sit in the chain of reads, when in the epoch
// is the payment slot spent, and does the sub-1% tail hold the deeper functions? Loads a saved four-input world (DEPTH on) and runs
// on, drawing nothing beyond the world's own. Uses the core's own composition depth (Rd: INPUT 0, a read word = its publisher's
// depth + 1, NAND the deeper operand; data flow, so an UPPER bound - a read washed out by NAND's controlling 0 still counts).
// Per paid output: its function, depth (0, 1, 2, 3+), income and epoch tick (tick % TASK_EPOCH).
// Reported: income by depth; income by depth x share band (the function's share of the probe window's income: >= 1% / < 1%) with
// the income-weighted mean circuit size; the epoch tick at which the paying output came, by depth; and per function the share of
// its payments made at depth 0 (for internalisation: compare saves from early and late in one run).
//   LOAD=lab/out-epay/7701_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-hops.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js'); const {CSZ4}=require('./core-tasks4.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), EP=w.p.TASK_EPOCH;
if(!w.Rd) throw new Error('needs DEPTH');
const per=new Map(); let on=false; const tickBins=Array.from({length:4},()=>new Float64Array(10));
const orig=w.taskOut;
w.taskOut=function(c,v){ const d=Math.min(3,this.Rd[c*4]), b=this.E[c]; orig.call(this,c,v); const g=this.E[c]-b; if(!(g>0)||!on)return;
  const T=this.fn4(v); let p=per.get(T); if(!p){ p={g:0,n:0,byD:[0,0,0,0]}; per.set(T,p); } p.g+=g; p.n++; p.byD[d]+=g; tickBins[d][Math.floor((this.tick%EP)/(EP/10))]+=g; };
for(let s=0;s<+(E.WARM||2000);s++) w.step(); on=true;
for(let s=0;s<+(E.TICKS||5000);s++) w.step();
let tot=0; for(const p of per.values()) tot+=p.g;
const byD=[0,0,0,0], band={hi:{g:0,byD:[0,0,0,0],cs:0,nf:0}, lo:{g:0,byD:[0,0,0,0],cs:0,nf:0}};
for(const [T,p] of per){ const b=p.g/tot>=0.01?band.hi:band.lo; b.g+=p.g; b.nf++; b.cs+=p.g*Math.min(10,CSZ4[T]); for(let k=0;k<4;k++){ b.byD[k]+=p.byD[k]; byD[k]+=p.byD[k]; } }
const sh=(a,t)=>a.map(x=>+(x/Math.max(1e-9,t)).toFixed(3));
const H=-[...per.values()].reduce((a,p)=>{ const q=p.g/tot; return a+q*Math.log(q); },0);
console.log(JSON.stringify({load:E.LOAD.split('/').slice(-2).join('/'), epay:w.p.TASK_EPAY||0, functionsPaid:per.size, effectiveFunctions:+Math.exp(H).toFixed(1),
  incomeByDepth_0_1_2_3plus:sh(byD,tot),
  band1pct:{functions:band.hi.nf, incomeShare:+(band.hi.g/tot).toFixed(3), byDepth:sh(band.hi.byD,band.hi.g), meanCircuit:+(band.hi.cs/Math.max(1e-9,band.hi.g)).toFixed(2)},
  bandBelow1pct:{functions:band.lo.nf, incomeShare:+(band.lo.g/tot).toFixed(3), byDepth:sh(band.lo.byD,band.lo.g), meanCircuit:+(band.lo.cs/Math.max(1e-9,band.lo.g)).toFixed(2)},
  epochTickTenths_byDepth:tickBins.map(a=>sh([...a],a.reduce((x,y)=>x+y,0))),
  depth0ShareTop:[...per.entries()].sort((a,b)=>b[1].g-a[1].g).slice(0,12).map(([T,p])=>T.toString(16)+'/c'+CSZ4[T]+':'+(p.byD[0]/p.g).toFixed(2))}));
