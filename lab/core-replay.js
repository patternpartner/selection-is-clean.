// lab/core-replay.js - a CAUSAL test inside an evolved world: load a save and run it on with one thing changed.
// ARM=on runs the saved world as it was; ARM=off removes every virion and stops immigration at the moment of loading, so the
// same evolved community, chemistry and history carry on without the virus. Replicates differ only in the main RNG stream
// (its state is XORed with the replicate number), so a difference between arms is the virus's doing.
// Reported per replicate and 30,000-tick window: reactions newly active (at least MIN of metabolic income, and never active
// in the run's own history before the save - HIST is that run's log), how many reactions carry at least MIN, and the share of
// the living that carry the commonest METAB instruction (a monoculture reads near 1).
//   LOAD=v.1.c2.json HIST=v.1.all.jsonl ARM=off REP=1 TICKS=120000 node lab/core-replay.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core.js');
const E=process.env, T=+(E.TICKS||120000), EVERY=1000, WIN=30, MIN=+(E.MIN||0.01), REP=+(E.REP||1);
const w=World.load(fs.readFileSync(E.LOAD,'utf8'));
w.rnd.s=(w.rnd.s^(REP*0x9e3779b1))|0;
if(E.ARM==='off'){ w.vn=0; w.p.V_IMMIG=0; }
const hist=new Set(); if(E.HIST){ const rows=fs.readFileSync(E.HIST,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.chem&&r.t<=w.tick);
  for(let i=0;i+WIN<=rows.length;i+=WIN){ const m=new Map(); for(const r of rows.slice(i,i+WIN)) for(const [x,v] of r.chem.flux) m.set(x,(m.get(x)||0)+v/WIN); for(const [x,v] of m) if(v>=MIN)hist.add(x); } }
const ever=new Set(hist), out=[]; let win=[];
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ win.push(w.sample()); if(win.length===WIN){ const m=new Map(); let car=0;
  for(const r of win){ for(const [x,v] of r.chem.flux) m.set(x,(m.get(x)||0)+v/WIN); car+=Math.max(r.opShare[24],r.opShare[25],r.opShare[26],r.opShare[27])/WIN; }
  const act=[...m.entries()].filter(([x,v])=>v>=MIN).map(([x])=>x); const nw=act.filter(x=>!ever.has(x)); for(const x of act)ever.add(x);
  out.push({t:win.at(-1).t,newActive:nw.length,active:act.length,monoculture:+car.toFixed(2),N:win.at(-1).N,virions:w.vn||0}); win=[]; } } }
console.log(JSON.stringify({load:E.LOAD.split('/').pop(),arm:E.ARM||'on',rep:REP,histActive:hist.size,windows:out}));
