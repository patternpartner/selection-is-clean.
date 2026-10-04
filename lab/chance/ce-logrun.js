// lab/chance/ce-logrun.js - lab/core-run.js plus the read-only trick logger (lab/chance/ce-log.js).
//   SEED=113 TICKS=450000 OPTS='{...}' LOGF=run.log.jsonl node lab/chance/ce-logrun.js > run.jsonl
// stdout is the same per-1000-tick JSONL as core-run.js. LOGF gets the logger records; logger windows are 5000 ticks.
// With NOLOG=1 no logger is attached (identity check).  DIGEST=1 prints a final {"digest":...} line to stderr (see ce-logcheck.js).
'use strict';
const fs=require('fs'); const {World}=require('../oee-core.js'); const {TrickLog}=require('./ce-log.js');
const E=process.env, seed=+(E.SEED||1), T=+(E.TICKS||100000), EVERY=1000, LW=+(E.LOGWIN||5000);
const w=new World(seed,E.OPTS?JSON.parse(E.OPTS):{}); const t0=Date.now();
let fd=null, buf=[]; const flush=()=>{ if(fd!==null&&buf.length){ fs.writeSync(fd,buf.join('\n')+'\n'); buf=[]; } };
if(!E.NOLOG){ fd=fs.openSync(E.LOGF,'w'); w.lg=new TrickLog(w,l=>{ buf.push(l); if(buf.length>2000)flush(); }); }
for(let s=1;s<=T;s++){ w.step(); if(s%EVERY===0){ const r=w.sample(); if(w.lg){ w.lg.bin(w); if(s%LW===0)w.lg.window(w); } r.wallS=+((Date.now()-t0)/1000).toFixed(1); process.stdout.write(JSON.stringify(r)+'\n'); } }
flush(); if(fd!==null)fs.closeSync(fd);
