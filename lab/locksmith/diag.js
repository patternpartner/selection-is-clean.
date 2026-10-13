// lab/locksmith/diag.js - what a plain CHEM_BIG world's chemistry looks like (earning reactions, their products' exits, pools). SEED=7290 TICKS=100000 node lab/locksmith/diag.js
const {World}=require('../oee-core.js');
const w=new World(+process.env.SEED||7290,{CHEM:1,CHEM_BIG:1,FLUXALL:1}); const T=+process.env.TICKS||100000;
const P=w.p, C=w.C, L=P.L||w.prog.length/C;
for(let s=1;s<=T;s++){ w.step(); if(s%20000===0){
  const acc=new Map(w.rxE); const r=w.sample(); // sample clears rxE
  const tot=[...acc.values()].reduce((a,b)=>a+b,0);
  const earn=[...acc].sort((a,b)=>b[1]-a[1]).slice(0,6);
  const amt=q=>{const m=w.big.layers.get(q); if(!m)return 0; let t=0; for(let c=0;c<C;c++)t+=m[c]; return t;};
  // carriers of each enzyme species
  const carry=new Map(); const LL=w.prog.length/(2*C);
  for(let c=0;c<C;c++){ if(!w.alive[c])continue; const o=c*LL*2,n=w.len[c]; const seen=new Set(); for(let i=0;i<n;i++){const op=w.prog[o+i*2]; if(op>=24&&op<=27){const q=w.prog[o+i*2+1]|(w.prog[o+((i+1)%n)*2+1]<<8); seen.add(q*4+op-24);}} for(const k of seen)carry.set(k,(carry.get(k)||0)+1);}
  console.log('t',s,'N',r.N,'metab',r.chem.metab,'layers',w.big.layers.size,'present',r.chem.present,'distinct enzymes carried',carry.size);
  for(const [id,v] of earn){ const q=id>>>2,j=id&3,pr=w.bprod(q,j); const outs=[0,1,2,3].map(k=>{const p2=w.bprod(pr,k),d=w.be(pr)-w.be(p2); return (d>0&&d<=P.CHEM_DMAX?'U':'-')+d.toFixed(2)+':'+(acc.get(pr*4+k)?((acc.get(pr*4+k)/tot).toFixed(3)):'0')+'/c'+(carry.get(pr*4+k)||0)}).join(' ');
    console.log(' rx',q,j,'share',(v/tot).toFixed(3),'carriers',carry.get(id)||0,'sub amt',amt(q).toFixed(0),'-> pr',pr,'e',w.be(pr).toFixed(2),'amt',amt(pr).toFixed(0),'outs',outs); }
  // top present species amounts
  const pres=[...w.big.layers.keys()].map(q=>[q,amt(q)]).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([q,a])=>q+':'+a.toFixed(0)+'(e'+w.be(q).toFixed(2)+')');
  console.log(' top pools',pres.join(' '));
}}
