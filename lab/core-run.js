// lab/core-run.js - run one oee-core world and print a JSON line every EVERY ticks.
//   SEED=1 TICKS=200000 EVERY=1000 [OPTS='{"MU_INS":0.02}'] node lab/core-run.js > run.jsonl
'use strict';
const {World}=require('./oee-core.js');
const E=process.env, seed=+(E.SEED||1), T=+(E.TICKS||100000), EVERY=+(E.EVERY||1000);
const opts=E.OPTS?JSON.parse(E.OPTS):{};
const w=new World(seed,opts); const t0=Date.now();
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ const r=w.sample(); r.wallS=+((Date.now()-t0)/1000).toFixed(1); process.stdout.write(JSON.stringify(r)+'\n'); } }
