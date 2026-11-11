// #406 - two chained fields side by side: per leg, what each found and how deep.   node lab/port/analyse-long-pair.js lp1 noground
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-long'), [,, NAME, ARM]=process.argv;
const load=x=>fs.readFileSync(path.join(D,NAME+'-'+x+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.F!==undefined);
const A=load('base'), B=load(ARM); const legs=Math.min(Math.max(...A.map(r=>r.leg)),Math.max(...B.map(r=>r.leg)));
const sum=(L,g)=>{ const S=L.filter(r=>r.leg===g); let n=0,s=0,g17=0; for(const r of S){ if(!r.D||!r.D.n)continue; n+=r.D.n; s+=r.D.mean*r.D.n; g17+=r.D.ge17; } const z=S[S.length-1], a=S[0];
  const T=S.filter(r=>r.t>z.t-300); let tn=0,ts=0; for(const r of T){ if(!r.D||!r.D.n)continue; tn+=r.D.n; ts+=r.D.mean*r.D.n; }
  return {new:n, depth:n?s/n:0, g17, F:z.F, K:z.K, A:z.A, last:tn?ts/tn:0, restored:a.slots.filter(x=>x[6]>0).length+'/'+a.U}; };
console.log('leg  minutes   base: new, depth of new (last 5 min), size 17+, alive | '+ARM+': same | ratio of new, cumulative ratio');
for(let g=1;g<=legs;g++){ const a=sum(A,g), b=sum(B,g);
  console.log(String(g).padStart(3)+'  '+((g-1)*25+'-'+g*25).padEnd(8)+'  '+a.new+', '+a.depth.toFixed(2)+' ('+a.last.toFixed(2)+'), '+a.g17+', '+a.A+' ['+a.restored+']  |  '+b.new+', '+b.depth.toFixed(2)+' ('+b.last.toFixed(2)+'), '+b.g17+', '+b.A+' ['+b.restored+']  |  '+(a.new/b.new).toFixed(2)+', '+(a.F/b.F).toFixed(2)); }
