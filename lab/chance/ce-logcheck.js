// lab/chance/ce-logcheck.js - identity check: the trick logger must not change the simulation.
//   SEED=113 TICKS=20000 OPTS='{...}' [CORE=/path/oee-core.js] [LOG=1] node lab/chance/ce-logcheck.js
// Prints {log, state} digests: log = SHA-256 of every 1000-tick sample() JSON (no wallS), state = the physics/RNG state hash of
// lab/speed-bench.js (copied below). Run with LOG=1 (logger attached) and without, and with CORE = the unhooked cos/speedup core;
// all digests must match. With LOG=1 it also checks the logger's live carrier counts against a recount of all bodies.
'use strict';
const crypto=require('crypto'), path=require('path');
const {World}=require(process.env.CORE?path.resolve(process.env.CORE):'../oee-core.js'); const {TrickLog}=require('./ce-log.js');
const E=process.env, seed=+(E.SEED||1), T=+(E.TICKS||20000), EVERY=1000;
const w=new World(seed,E.OPTS?JSON.parse(E.OPTS):{}); let nrec=0; if(E.LOG==='1')w.lg=new TrickLog(w,()=>{ nrec++; });
const logH=crypto.createHash('sha256');
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ logH.update(JSON.stringify(w.sample())); logH.update('\n'); if(w.lg){ w.lg.bin(w); if(s%5000===0)w.lg.window(w); } } }
function stateHash(world){
  const h=crypto.createHash('sha256');
  const num=x=>{ const b=Buffer.allocUnsafe(8); b.writeDoubleLE(x,0); h.update(b); };
  const view=a=>{
    if(!a){ h.update('U'); return; }
    h.update(a.constructor.name); h.update(String(a.length)); h.update('\0');
    h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
  };
  h.update('t'); num(world.tick); h.update('rs'); num(world.reseeds||0);
  for(const k of ['rnd','srnd','nrnd','frnd','brng','crng','xr','arr','brr','krr','nrr','vrnd']){
    h.update(k); if(world[k]) num(world[k].s); else h.update('U');
  }
  for(const k of ['alive','E','age','pc','face','R','len','prog','sprog','slen','tag','tmpl','stamp','gen','light','cap','corpse','order','mol','eMol','prod','bd','bn','lastP','ph','eg','ct','ip','ipF','lt','uid','lkO','sId','sAmt','sE','sD','sCond','rec','bld','perm','tin','tic','tdone','tres','tcap','tE','tN','vc','vk']) view(world[k]);
  const j=x=>{ h.update(JSON.stringify(x)===undefined?'U':JSON.stringify(x)); };
  j(world.ns); num(world.nsNext); j(world.fs); num(world.fsNext); j(world.patch); j(world.chS||null);
  if(world.vn!==undefined) num(world.vn);
  if(world.everTags){ h.update('et'); j([...world.everTags].sort((a,b)=>a-b)); }
  if(world.fnRep){ h.update('fr'); j([...world.fnRep].sort((a,b)=>a-b)); }
  // income map at its insertion order, which is what a sample's stable sort falls back on
  if(world.bInc&&world.bInc.size){ h.update('bi'); for(const [k,v] of world.bInc){ num(k); num(v); } }
  if(world.bOrd&&world.bOrd.length){ h.update('bo'); for(const k of world.bOrd){ num(k); num(k<65536&&world.bIncA?world.bIncA[k]:world.bInc.get(k)); } }
  return h.digest('hex');
}
let cntOK=null; if(w.lg){ const re=new Map(); for(let c=0;c<w.C;c++) if(w.alive[c]) for(const k of w.lg.keys(w,c))re.set(k,(re.get(k)||0)+1); cntOK=true; for(let k=0;k<w.lg.cap;k++){ if((re.get(k)||0)!==w.lg.cnt[k]){ cntOK=false; break; } } }
process.stdout.write(JSON.stringify({seed,ticks:T,log:E.LOG==='1'?1:0,core:E.CORE||'lab/oee-core.js',logHash:logH.digest('hex'),state:stateHash(w),records:nrec,carrierCountsMatch:cntOK})+'\n');
