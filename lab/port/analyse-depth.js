// #402 - read the depth of what is new from field-rate outputs: per five minutes, how many functions joined the union, their mean
// formula size, and how many are of size 13+ and 17+.   node lab/port/analyse-depth.js file.jsonl [file2.jsonl ...]
const fs=require('fs');
for(const f of process.argv.slice(2)){ const L=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.F!==undefined&&r.D); if(!L.length){ console.log(f+': no depth rows'); continue; }
  const z=L[L.length-1]; let T13=0,T17=0; const rows=[];
  for(let w=0;w*300<z.t;w++){ const S=L.filter(r=>r.t>w*300&&r.t<=(w+1)*300); let n=0,sum=0,g13=0,g17=0,mx=0; for(const r of S){ if(!r.D.n)continue; n+=r.D.n; sum+=r.D.mean*r.D.n; g13+=r.D.ge13; g17+=r.D.ge17; mx=Math.max(mx,r.D.max); }
    T13+=g13; T17+=g17; rows.push('  min '+(w*5)+'-'+((w+1)*5)+': new '+n+', mean depth '+(n?(sum/n).toFixed(2):'-')+', size 13+ '+g13+' ('+(n?(100*g13/n).toFixed(0):0)+'%), size 17+ '+g17+' ('+(n?(100*g17/n).toFixed(0):0)+'%), max '+mx); }
  console.log(f.split('/').pop()+': F '+z.F+', size 13+ '+T13+', size 17+ '+T17+', ticks '+z.K+', alive '+z.A); console.log(rows.join('\n')); }
