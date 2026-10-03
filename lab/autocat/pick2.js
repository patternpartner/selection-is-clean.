// Phase A2 design-choice rule (fixed in PHASEA2 before any result). node pick2.js D1.json D2.json D3.json  (trial.js JSON=...)
const fs=require('fs'), SEEDS=(process.env.SEEDS||'80 81 82').split(' '), out=[];
for(const f of process.argv.slice(2)){ const r=JSON.parse(fs.readFileSync(f)), name=f.split('/').pop().replace('.json',''); let ahead=0, dq=[], inc=[];
  for(const s of SEEDS){ const F=r['FULL'+s], ns=r['FULLNS'+s]; if(!F){ dq.push('missing '+s); continue; } inc.push(F.strInc);
    for(const a of ['NOAC','RAND','RANDN','SHUF']){ const x=r[a+s]; if(x&&F.Lu>x.Lu)ahead++; }
    for(const a of ['FULL','NOAC','RAND','RANDN','SHUF']){ const x=r[a+s]; if(!x)continue; if(x.reseeds>0)dq.push(`${a}${s} reseeded`); if(ns&&x.N<0.5*ns.N)dq.push(`${a}${s} N ${x.N.toFixed(0)} < 50% of FULLNS ${ns.N.toFixed(0)}`); } }
  out.push({name,ahead,inc:inc.reduce((a,b)=>a+b,0)/Math.max(1,inc.length),dq}); }
const ok=out.filter(o=>!o.dq.length), pool=ok.length?ok:out; pool.sort((a,b)=>b.ahead-a.ahead||b.inc-a.inc);
for(const o of out)console.log(`${o.name}: FULL-ahead ${o.ahead}/12, FULL late structure income ${(100*o.inc).toFixed(1)}%, ${o.dq.length?'DISQUALIFIED ('+o.dq.join('; ')+')':'qualified'}`);
console.log(`CHOSEN ${pool[0].name}${ok.length?'':' (all disqualified: least-bad, flagged)'}`);
