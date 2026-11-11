// #407 - read a field built with #arms: per arm, what its universes found (their own union), how deep, on how many ticks.
//   node lab/port/analyse-arms.js file.jsonl
const fs=require('fs'); const L=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.F!==undefined&&r.arms);
if(!L.length){ console.log('no arm rows'); process.exit(0); } const z=L[L.length-1], keys=Object.keys(z.arms);
console.log('t '+z.t+' s, field F '+z.F+'; per arm: universes, F (own union), F per universe, ticks per universe, alive per universe, functions per 1,000 ticks, size 17+ found, mean depth of new in last 5 min');
for(const k of keys){ const a=z.arms[k]; let g17=0, n=0, s=0; for(const r of L){ const x=r.arms[k]; if(!x)continue; g17+=x.ge17|0; if(r.t>z.t-300&&x.new){ n+=x.new; s+=x.mean*x.new; } }
  console.log('  '+k.padEnd(14)+' U '+a.U+'  F '+a.F+'  F/U '+Math.round(a.F/a.U)+'  K/U '+Math.round(a.K/a.U)+'  A/U '+Math.round(a.A/a.U)+'  F per 1k ticks '+(1000*a.F/a.K).toFixed(0)+'  size17+ '+g17+'  depth '+(n?(s/n).toFixed(2):'-')+'  check '+JSON.stringify(a.ground)); }
console.log('F per universe by 5 min: '+keys.map(k=>k+': '+L.filter(r=>r.t%300===0).map(r=>r.arms[k]?Math.round(r.arms[k].F/r.arms[k].U):'-').join(',')).join('  |  '));
