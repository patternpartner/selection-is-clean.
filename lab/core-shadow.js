// lab/core-shadow.js - evolutionary activity against the SHADOW genealogy (Bedau-Packard style).
// Every organism carries a shadow program that is copied and mutated at each birth exactly like its real one but never
// executed, so the shadow has the same family tree, the same sweeps and the same hitchhiking, and no selection.
// In each window of WIN samples, a working op (1-23) or working pair (two working ops adjacent) is SIGNIFICANT when its
// mean carrier share beats the most widespread op / pair of ANY kind in the shadow. With ~1,000 shadow pairs setting
// the bar, chance lets through about 529/1025 ~ 0.5 real pairs a window. Reported: significant and first-time-significant
// counts per window, the shadow bars, and the running total.
'use strict';
const fs=require('fs'); const {OPS,NOPS,NEUTRAL0}=require('./oee-core.js');
const WIN=+(process.env.WIN||30);
for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.shadowBigrams);
  const everOp=new Set(), everBg=new Set(); const out=[]; const newPerWin=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN);
    const opM=new Float64Array(NOPS), sopM=new Float64Array(NOPS); for(const r of W) for(let q=0;q<NOPS;q++){ opM[q]+=r.opShare[q]/W.length; sopM[q]+=r.shadowOpShare[q]/W.length; }
    const bgM=new Map(), sbgM=new Map(); for(const r of W){ for(const [b,v] of Object.entries(r.bigrams)) bgM.set(+b,(bgM.get(+b)||0)+v/W.length); for(const [b,v] of Object.entries(r.shadowBigrams)) sbgM.set(+b,(sbgM.get(+b)||0)+v/W.length); }
    let bOp=0; for(let q=1;q<NOPS;q++) if(sopM[q]>bOp)bOp=sopM[q];
    let bBg=0; for(const v of sbgM.values()) if(v>bBg)bBg=v;
    const sigOp=[], sigBg=[]; for(let q=1;q<NEUTRAL0;q++) if(opM[q]>bOp)sigOp.push(q);
    for(const [b,v] of bgM){ const a=(b/NOPS)|0, c=b%NOPS; if(a>0&&a<NEUTRAL0&&c>0&&c<NEUTRAL0&&v>bBg)sigBg.push(b); }
    const newOp=sigOp.filter(q=>!everOp.has(q)), newBg=sigBg.filter(b=>!everBg.has(b)); for(const q of sigOp)everOp.add(q); for(const b of sigBg)everBg.add(b);
    newPerWin.push(newBg.length); const L=W.at(-1);
    out.push(`  t${W[0].t}-${L.t} gen~${L.meanGen} len~${L.meanLen} | shadow bar op ${bOp.toFixed(2)} pair ${bBg.toFixed(2)} | sig ops ${sigOp.length} (new: ${newOp.map(q=>OPS[q]).join(',')||'-'}) | sig pairs ${sigBg.length} (new ${newBg.length}: ${newBg.slice(0,5).map(b=>OPS[(b/NOPS)|0]+'>'+OPS[b%NOPS]).join(' ')})`);
  }
  console.log('==',f.split('/').pop(),'| cumulative significant ops',everOp.size,'pairs',everBg.size,'| new pairs per window',newPerWin.join(','));
  console.log(out.join('\n'));
}
