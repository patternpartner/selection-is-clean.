// lab/core-activity.js - evolutionary activity against the built-in neutral shadow, for one or more core-run logs.
// Ops 24-31 do nothing and are drawn by mutation at the same rate as every other op, so they (and pairs made only of
// them) rise only by riding a winning lineage. In each window of WIN samples:
//   - a working op (1-23) is SIGNIFICANT when its mean carrier share beats every neutral op's;
//   - a working PAIR (two working ops adjacent in a program) is significant when it beats every neutral pair's.
// Reported per window: how many working ops/pairs are significant, how many are significant for the FIRST time in the
// run (new adaptive components), and the neutral maxima they had to beat. Sustained new significant pairs late in a
// run is the signature this bench exists to look for.
'use strict';
const fs=require('fs'); const {OPS,NOPS,NEUTRAL0}=require('./oee-core.js');
const WIN=+(process.env.WIN||20);
for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0);
  const everOp=new Set(), everBg=new Set(); const out=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN);
    const opM=new Float64Array(NOPS); for(const r of W) for(let q=0;q<NOPS;q++) opM[q]+=r.opShare[q]/W.length;
    const bgM=new Map(); for(const r of W) for(const [b,v] of Object.entries(r.bigrams)) bgM.set(+b,(bgM.get(+b)||0)+v/W.length);
    let nOp=0; for(let q=NEUTRAL0;q<NOPS;q++) if(opM[q]>nOp)nOp=opM[q];
    let nBg=0; for(const [b,v] of bgM){ const a=(b/NOPS)|0, c=b%NOPS; if(a>=NEUTRAL0&&c>=NEUTRAL0&&v>nBg)nBg=v; }
    const sigOp=[], sigBg=[]; for(let q=1;q<NEUTRAL0;q++) if(opM[q]>nOp)sigOp.push(q);
    for(const [b,v] of bgM){ const a=(b/NOPS)|0, c=b%NOPS; if(a>0&&a<NEUTRAL0&&c>0&&c<NEUTRAL0&&v>nBg)sigBg.push(b); }
    const newOp=sigOp.filter(q=>!everOp.has(q)), newBg=sigBg.filter(b=>!everBg.has(b)); for(const q of sigOp)everOp.add(q); for(const b of sigBg)everBg.add(b);
    const L=W.at(-1);
    out.push(`  t${W[0].t}-${L.t} N~${Math.round(W.reduce((a,r)=>a+r.N,0)/W.length)} gen~${L.meanGen} len~${L.meanLen} | neutral max op ${nOp.toFixed(2)} pair ${nBg.toFixed(2)} | sig ops ${sigOp.length} (new: ${newOp.map(q=>OPS[q]).join(',')||'-'}) | sig pairs ${sigBg.length} (new ${newBg.length}: ${newBg.slice(0,6).map(b=>OPS[(b/NOPS)|0]+'>'+OPS[b%NOPS]).join(' ')})`);
  }
  console.log('==',f.split('/').pop(),'samples',rows.length,'| cumulative significant ops',everOp.size,'pairs',everBg.size); console.log(out.join('\n'));
}
