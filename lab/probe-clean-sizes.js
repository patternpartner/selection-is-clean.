// lab/probe-clean-sizes.js - #339: a saved three-input world's task income split CLEAN / UNCLEAN (bit-exact, lab/oee-core-tasks.js CLEAN)
// by the paid function's exact NAND circuit size, and the unclean part split into junk that is STALE (an earlier epoch's input bits
// only) and junk from a NON-LOGIC word. Bookkeeping only (CLEAN=2): refuses nothing, draws nothing.
//   LOAD=lab/out-strict2/7201_o1.7.save [WARM=2000] [TICKS=10000] node lab/probe-clean-sizes.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js'); const {CSZ}=require('./core-tasks.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), C=w.C;
w.p.CLEAN=2; w.Rj=new Uint32Array(C*4).fill(0xFFFFFFFF); w.Rdm=new Uint32Array(C*4); w.tlastJ=new Uint32Array(C).fill(0xFFFFFFFF); w.tlastDm=new Uint32Array(C); w.ev.dirtyPaid=0; w.ev.dirtyE=0;
for(let s=0;s<+(E.WARM||2000);s++) w.step();
const clean=new Float64Array(12), dirty=new Float64Array(12); const orig=w.taskOut;
w.taskOut=function(c,v){ const j=this.Rj[c*4], b=this.E[c]; orig.call(this,c,v); const g=this.E[c]-b; if(!(g>0))return;
  const I=this.win; let T=0,set=0; for(let i=0;i<32;i++){ const k=(((I[0]>>>i)&1)<<2)|(((I[1]>>>i)&1)<<1)|((I[2]>>>i)&1); if(!(set&(1<<k))){ set|=1<<k; if((v>>>i)&1)T|=1<<k; } }
  (j?dirty:clean)[CSZ[T]]+=g; };
for(let s=0;s<+(E.TICKS||10000);s++) w.step();
const tot=a=>a.reduce((x,y)=>x+y,0), hi=a=>a.slice(5).reduce((x,y)=>x+y,0), f=a=>[...a].map((v,i)=>v>0?i+':'+Math.round(v):'').filter(Boolean).join(' ');
console.log(JSON.stringify({load:E.LOAD.split('/').pop(), cleanShare:+(tot(clean)/(tot(clean)+tot(dirty))).toFixed(3), circuit5plus:{clean:Math.round(hi(clean)), unclean:Math.round(hi(dirty)), cleanShare:+(hi(clean)/Math.max(1,hi(clean)+hi(dirty))).toFixed(3)}, clean:f(clean), unclean:f(dirty)}));
