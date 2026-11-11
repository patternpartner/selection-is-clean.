// lab/port/sz5.js - #402: the engine's grade of a five-input function (taskSz5), outside the engine, so a rig can grade the truth
// tables a field reports. Exact NAND formula size for a function of at most four of the inputs (lab/nand4-sz.bin, the engine's
// TASK_SZ4); for a function of all five, the best Shannon split sz4(lo)+sz4(hi)+4 or a direct form where a half is constant - an
// UPPER BOUND, as in the engine. Checked against the engine's own TASK_SZ on every function a node world paid (see OEE-NOTES #402).
'use strict';
const fs=require('fs'), path=require('path');
const SZ4=Uint8Array.from(fs.readFileSync(path.join(__dirname,'..','nand4-sz.bin')));
function sz5(F){ let best=255; for(let v=0;v<5;v++){ const p=4-v; let lo=0, hi=0, bl=0, bh=0;
    for(let r=0;r<32;r++){ const b=(F>>>r)&1; if((r>>p)&1){ if(b)hi|=1<<bh; bh++; } else { if(b)lo|=1<<bl; bl++; } }
    let z; if(lo===hi)z=SZ4[lo]; else { z=SZ4[lo]+SZ4[hi]+4;
      if(lo===0)z=Math.min(z,SZ4[hi]+4); else if(hi===0)z=Math.min(z,SZ4[lo]+5); else if(lo===0xFFFF)z=Math.min(z,1+SZ4[(~hi)&0xFFFF]); else if(hi===0xFFFF)z=Math.min(z,2+SZ4[(~lo)&0xFFFF]); }
    if(z<best)best=z; } return best; }
module.exports={sz5,SZ4};
