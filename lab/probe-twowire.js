// lab/probe-twowire.js - #339: do paid outputs combine DISTINCT read words, and did the register start the epoch stale? Loads a saved
// three-input world, switches on CLEAN=2 bookkeeping (bit-exact junk, lab/oee-core-tasks.js), and follows through the registers
// (data flow) which read words of THIS epoch feed each one (up to 4 kept: READ sets {w}, NAND unions, GET/MOV copy, INPUT and every
// other change clear) and whether it carries material that was junk when the epoch began (STALE: at each epoch boundary a register
// with any junk bit is marked; NAND ORs the marks, GET/MOV copy, INPUT/READ/any other change clear). At each paid output its income
// goes to (k = 0, 1, 2, 3+ read words) x (stale start or not), clean / unclean. Draws nothing.
// (The first version kept 2 words and cleared them at an organism's first output of the epoch; this one clears at the boundary.)
//   LOAD=lab/out-strict2/7201_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-twowire.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C;
if(!w.Rj){ w.p.CLEAN=2; w.Rj=new Uint32Array(C*4).fill(0xFFFFFFFF); w.Rdm=new Uint32Array(C*4); w.tlastJ=new Uint32Array(C).fill(0xFFFFFFFF); w.tlastDm=new Uint32Array(C); w.ev.dirtyPaid=0; w.ev.dirtyE=0; }
const RS=Array.from({length:C*4},()=>[]), ST=new Uint8Array(C*4); let ep=w.epoch();
const boundary=()=>{ const e=w.epoch(); if(e===ep)return; ep=e; for(let r=0;r<C*4;r++){ RS[r]=[]; ST[r]=w.Rj[r]!==0?1:0; } };
const dA=w.depthAfter.bind(w);
w.depthAfter=function(b,op,arg,before){ boundary(); dA(b,op,arg,before); const s=b+(arg&3), R=this.R;
  if(op===28){ const t=b+(this.p.READ_REG?((arg>>3)&3):0), v=R[t]>>>0; RS[t]=v?[v]:[]; ST[t]=0; return; }   // #345: READ_REG writes register t
  if(op===26){ RS[b]=[...new Set(RS[b].concat(RS[s]))].slice(0,4); ST[b]=ST[b]|ST[s]; return; }
  if(op===27){ RS[b]=RS[s].slice(); ST[b]=ST[s]; return; } if(op===2){ RS[s]=RS[b].slice(); ST[s]=ST[b]; return; }
  for(let k=0;k<4;k++) if(R[b+k]!==before[k]){ RS[b+k]=[]; ST[b+k]=0; } };
const n={clean:{fresh:[0,0,0,0],stale:[0,0,0,0]}, unclean:{fresh:[0,0,0,0],stale:[0,0,0,0]}}, orig=w.taskOut;
w.taskOut=function(c,v){ boundary(); const j=this.Rj[c*4], k=Math.min(3,RS[c*4].length), st=ST[c*4]?'stale':'fresh', b=this.E[c]; orig.call(this,c,v); const g=this.E[c]-b; if(g>0)n[j?'unclean':'clean'][st][k]+=g; };
for(let s=0;s<+(E.WARM||2000);s++) w.step(); for(const a of ['clean','unclean']) for(const b of ['fresh','stale']) n[a][b].fill(0);
for(let s=0;s<+(E.TICKS||5000);s++) w.step();
let tot=0; for(const a of ['clean','unclean']) for(const b of ['fresh','stale']) tot+=n[a][b].reduce((x,y)=>x+y,0);
const p=a=>a.map(x=>+(x/tot).toFixed(3));
console.log(JSON.stringify({load:E.LOAD.split('/').pop(), shareOfAllIncome_by_k_0_1_2_3plus:{clean_fresh:p(n.clean.fresh), clean_stale:p(n.clean.stale), unclean_fresh:p(n.unclean.fresh), unclean_stale:p(n.unclean.stale)}}));
