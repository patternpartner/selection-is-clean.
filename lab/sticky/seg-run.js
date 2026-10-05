// lab/sticky/seg-run.js - run ONE segment of a world: like lab/core-run.js, but resumes/saves with the exact fullsave.js.
//   SEED TICKS EVERY OPTS [LOAD=ckpt] [SAVE=ckpt.tmp] node lab/sticky/seg-run.js >> run.jsonl
'use strict';
const fs=require('fs'); const {World}=require('../oee-core.js'); const {saveAll,loadAll}=require('./fullsave.js');
const E=process.env, seed=+(E.SEED||1), T=+(E.TICKS||100000), EVERY=+(E.EVERY||1000), opts=E.OPTS?JSON.parse(E.OPTS):{};
const w=E.LOAD?loadAll(fs.readFileSync(E.LOAD,'utf8')):new World(seed,opts); const t0=Date.now();
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ const r=w.sample(); r.wallS=+((Date.now()-t0)/1000).toFixed(1); process.stdout.write(JSON.stringify(r)+'\n'); } }
if(E.SAVE)fs.writeFileSync(E.SAVE,saveAll(w));
