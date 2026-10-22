// lab/probe-twowire.js - #339: do paid outputs combine TWO DISTINCT read words? Loads a saved three-input world, switches on CLEAN=2
// bookkeeping (bit-exact junk, lab/oee-core-tasks.js), and follows, through the registers, which read words feed each one (data flow,
// up to 2 distinct words kept: READ sets {w}, NAND unions, GET/MOV copy, INPUT and every other change clear; a new epoch clears).
// At each paid output: no read word, one, or two or more, split clean / unclean. Draws nothing.
//   LOAD=lab/out-strict2/7201_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-twowire.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C;
w.p.CLEAN=2; w.Rj=new Uint32Array(C*4).fill(0xFFFFFFFF); w.Rdm=new Uint32Array(C*4); w.tlastJ=new Uint32Array(C).fill(0xFFFFFFFF); w.tlastDm=new Uint32Array(C); w.ev.dirtyPaid=0; w.ev.dirtyE=0;
const A=new Float64Array(C*4), B=new Float64Array(C*4);   // up to two distinct read words per register (0 = none); words stored +1 so 0 means empty
const put=(r,a,b)=>{ A[r]=a; B[r]=b; };
const uni=(r,s)=>{ const xs=[A[r],B[r],A[s],B[s]].filter(x=>x>0); const u=[...new Set(xs)]; put(r,u[0]||0,u[1]||0); };
const dA=w.depthAfter.bind(w); let ep=w.epoch();
w.depthAfter=function(b,op,arg,before){ dA(b,op,arg,before); const s=b+(arg&3), R=this.R;
  if(op===28){ const v=R[b]>>>0; put(b,v?v+1:0,0); return; }
  if(op===26){ uni(b,s); return; } if(op===27){ put(b,A[s],B[s]); return; } if(op===2){ put(s,A[b],B[b]); return; }
  for(let k=0;k<4;k++) if(R[b+k]!==before[k]) put(b+k,0,0); };
const orig=w.taskOut; const n={clean:[0,0,0], unclean:[0,0,0]};
w.taskOut=function(c,v){ const e=this.epoch(); if(e!==ep){ A.fill(0); B.fill(0); ep=e; }   // a read word from an earlier epoch is stale: forget it
  const j=this.Rj[c*4], k=(A[c*4]>0)+(B[c*4]>0), b=this.E[c]; orig.call(this,c,v); const g=this.E[c]-b; if(g>0)(j?n.unclean:n.clean)[k]+=g; };
for(let s=0;s<+(E.WARM||2000);s++) w.step(); for(const x of ['clean','unclean'])n[x].fill(0);
for(let s=0;s<+(E.TICKS||5000);s++) w.step();
const p=a=>{ const t=a.reduce((x,y)=>x+y,0)||1; return a.map(x=>+(x/t).toFixed(3)); };
console.log(JSON.stringify({load:E.LOAD.split('/').pop(), cleanIncomeBy_reads_0_1_2plus:p(n.clean), uncleanIncomeBy_reads_0_1_2plus:p(n.unclean), cleanIncome:Math.round(n.clean.reduce((x,y)=>x+y,0))}));
