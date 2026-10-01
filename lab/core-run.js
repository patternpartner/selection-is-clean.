// lab/core-run.js - run one oee-core world and print a JSON line every EVERY ticks.
//   SEED=1 TICKS=200000 EVERY=1000 [OPTS='{"MU_INS":0.02}'] [LOAD=prev.json] [SAVE=next.json] node lab/core-run.js > run.jsonl
// With LOAD the world resumes exactly where the save left it (state and RNG); TICKS more ticks are run. A save is
// written right after a sample, which is the point a resume is exact from.
'use strict';
const fs=require('fs'); const {World}=require('./oee-core.js');
const E=process.env, seed=+(E.SEED||1), T=+(E.TICKS||100000), EVERY=+(E.EVERY||1000);
const opts=E.OPTS?JSON.parse(E.OPTS):{};
const w=E.LOAD?World.load(fs.readFileSync(E.LOAD,'utf8')):new World(seed,opts); const t0=Date.now();
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ const r=w.sample(); r.wallS=+((Date.now()-t0)/1000).toFixed(1); process.stdout.write(JSON.stringify(r)+'\n'); } }
if(E.SAVE)fs.writeFileSync(E.SAVE,w.save());
