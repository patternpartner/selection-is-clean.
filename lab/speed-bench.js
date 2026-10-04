// lab/speed-bench.js — timed headless oee-core run with a byte-identity digest.
// Same stepping and sampling as lab/core-run.js (sample every EVERY ticks, no wallS).
//   SEED=110 TICKS=20000 OPTS='{"CHEM":1,"HBODY":1}' node lab/speed-bench.js
// Prints one JSON line: ms, log hash (samples), state hash (full world after the last sample).
'use strict';
const crypto=require('crypto');
const {World}=require(process.env.CORE||'./oee-core.js');
const E=process.env;
const seed=+(E.SEED||1), T=+(E.TICKS||20000), EVERY=+(E.EVERY||1000);
const opts=E.OPTS?JSON.parse(E.OPTS):{};
const w=new World(seed,opts);
const logH=crypto.createHash('sha256');
let sampleMs=0;
const t0=process.hrtime.bigint();
for(let s=1;s<=T;s++){
  w.step();
  if(s%EVERY===0){
    const a=process.hrtime.bigint();
    const r=w.sample();
    logH.update(JSON.stringify(r));
    logH.update('\n');
    sampleMs+=Number(process.hrtime.bigint()-a)/1e6;
  }
}
const ms=Number(process.hrtime.bigint()-t0)/1e6;
const cpu=process.cpuUsage();
// Physics and bookkeeping that the next tick (and the next sample) read. Caches that are pure
// functions of this state (neighbor table, income-accumulator layout) are left out on purpose.
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
const st=stateHash(w);
process.stdout.write(JSON.stringify({
  seed,ticks:T,every:EVERY,
  ms:+ms.toFixed(1),
  sampleMs:+sampleMs.toFixed(1),
  cpuMs:+((cpu.user+cpu.system)/1000).toFixed(1),
  per100k:+(ms*100000/T).toFixed(1),
  log:logH.digest('hex'),
  state:st,
  N:w.count?w.count():null
})+'\n');
