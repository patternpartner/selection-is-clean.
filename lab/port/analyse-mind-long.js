// per-leg reading of out-long/lm1-{base,learn}.jsonl: F at each leg's end, new in that leg, size 17+ new in that leg, ticks, creatures
const fs=require('fs'), D=require('path').join(__dirname,'out-long')+'/';   // #433
const rd=x=>fs.readFileSync(D+'lm1-'+x+'.jsonl','utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined);
const B=rd('base'), L=rd('learn'); const legs=[...new Set(B.map(r=>r.leg))].sort((a,b)=>a-b);
let pb=0, pl=0;
for(const g of legs){ const b=B.filter(r=>r.leg===g), l=L.filter(r=>r.leg===g); if(!b.length||!l.length)continue;
  const zb=b[b.length-1], zl=l[l.length-1], gb=b.reduce((s,r)=>s+((r.D&&r.D.ge17)|0),0), gl=l.reduce((s,r)=>s+((r.D&&r.D.ge17)|0),0);
  // F is the field's union so far (the chain carries it), so new in a leg is the difference
  const nb=zb.F-pb, nl=zl.F-pl; pb=zb.F; pl=zl.F;
  console.log('leg '+g+'  t '+zb.t+'  F draw '+zb.F+'  learn '+zl.F+'  cum ratio '+(zb.F/zl.F).toFixed(2)+'  | this leg new '+nb+' / '+nl+' ('+(nb/Math.max(1,nl)).toFixed(2)+')  size17+ '+gb+' / '+gl+' ('+(gb/Math.max(1,gl)).toFixed(2)+')  | ticks '+zb.K+' / '+zl.K+'  creatures '+zb.A+' / '+zl.A+'  mind '+(zb.sw&&zb.sw.mindMode)+'/'+(zl.sw&&zl.sw.mindMode)); }
