// lab/probe-leak.js - #343: where does a second distinct read get lost between the read and a payment? Loads a saved four-input
// (or three-input) TASKS world with OTHERS and runs on, drawing nothing beyond the world's own. Per organism and epoch it keeps the
// DISTINCT nonzero words read, and through the registers (data flow, as lab/probe-twowire.js) which of this epoch's read words feed each
// register. Two numbers (the user's design):
//  PRE-EMPTION: of organism-epochs that reach a 2nd distinct read, the share whose life payment slot (TASK_MAX) was already used when
//               that 2nd read happened - and the share already used before the epoch's first read.
//  OVERWRITE:   OUTPUTs made after 2+ distinct reads this epoch, split by how many read words feed the output register (0 / 1 / 2+);
//               for all such outputs, and for the paid ones.
//   LOAD=lab/out-tree/7601_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-leak.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C, TM=w.p.TASK_MAX;
const RS=Array.from({length:C*4},()=>[]), dR=Array.from({length:C},()=>[]), usedAtFirst=new Uint8Array(C);
let ep=w.epoch(), on=false; const P={orgEpochs2:0, usedAt2nd:0, usedBeforeFirst:0}, O={all:[0,0,0], paid:[0,0,0]};
const boundary=()=>{ const e=w.epoch(); if(e===ep)return; ep=e; for(let r=0;r<C*4;r++)RS[r]=[]; for(let c=0;c<C;c++)dR[c]=[]; };
const dA=w.depthAfter.bind(w);
w.depthAfter=function(b,op,arg,before){ boundary(); dA(b,op,arg,before); const s=b+(arg&3), R=this.R, c=b>>2;
  if(op===28){ const v=R[b]>>>0; RS[b]=v?[v]:[];
    if(v&&!dR[c].includes(v)){ if(dR[c].length===0)usedAtFirst[c]=this.tcount(c)>=TM?1:0; dR[c].push(v);
      if(dR[c].length===2&&on){ P.orgEpochs2++; if(this.tcount(c)>=TM)P.usedAt2nd++; if(usedAtFirst[c])P.usedBeforeFirst++; } }
    return; }
  if(op===26){ RS[b]=[...new Set(RS[b].concat(RS[s]))].slice(0,4); return; }
  if(op===27){ RS[b]=RS[s].slice(); return; } if(op===2){ RS[s]=RS[b].slice(); return; }
  for(let k=0;k<4;k++) if(R[b+k]!==before[k]) RS[b+k]=[]; };
const tb=w.taskBirth.bind(w); w.taskBirth=function(c){ tb(c); dR[c]=[]; for(let k=0;k<4;k++)RS[c*4+k]=[]; };
const orig=w.taskOut;
w.taskOut=function(c,v){ boundary(); if(!on||dR[c].length<2){ orig.call(this,c,v); return; }
  const k=Math.min(2,RS[c*4].length), b=this.E[c]; O.all[k]++; orig.call(this,c,v); if(this.E[c]>b)O.paid[k]++; };
for(let s=0;s<+(E.WARM||2000);s++) w.step(); on=true;
for(let s=0;s<+(E.TICKS||5000);s++) w.step();
const r=(a,b)=>+(a/Math.max(1,b)).toFixed(3), sh=a=>{ const t=a.reduce((x,y)=>x+y,0); return a.map(x=>r(x,t)); };
console.log(JSON.stringify({load:E.LOAD.split('/').slice(-2).join('/'), readDir:w.p.READ_DIR||0,
  preemption:{orgEpochsReaching2ndDistinctRead:P.orgEpochs2, slotUsedBy2ndRead:r(P.usedAt2nd,P.orgEpochs2), slotUsedBeforeFirstRead:r(P.usedBeforeFirst,P.orgEpochs2)},
  overwrite:{outputsAfter2plusReads:O.all.reduce((x,y)=>x+y,0), byReadsFeeding_0_1_2plus:sh(O.all), paid:O.paid.reduce((x,y)=>x+y,0), paidByReadsFeeding_0_1_2plus:sh(O.paid)}}));
