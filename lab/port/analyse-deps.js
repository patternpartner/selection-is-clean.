// #356 - PREREG-deps.md's rules on lab/port/out-deps.
const fs=require('fs'), D=__dirname+'/out-deps', seeds=[9701,9702,9703];
const load=(s,a)=>{ const f=`${D}/${s}_${a}.jsonl`; if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; const L=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>JSON.parse(l)); return {rows:L.filter(r=>!r.final), fin:L.find(r=>r.final)}; };
const q=(rows,a,b)=>{ let n=0,s=0; for(const r of rows) if(r.tick>a&&r.tick<=b&&r.firstPaid){ n+=r.firstPaid; s+=r.firstPaid*r.meanDepth; } return {n, d:n?s/n:null}; };
let acc=0, st=0, n=0;
for(const s of seeds){ const A=load(s,'DEFAULT'), P=load(s,'PIN'); if(!A||!P){ console.log(s,'incomplete'); continue; } n++;
  const H=A.rows[A.rows.length-1].tick, q2=q(A.rows,H/4,H/2), q4=q(A.rows,3*H/4,H), pinMax=Math.max(0,...P.rows.map(r=>r.maxDepth||0));
  const isAcc=q4.n>0&&q2.d!=null&&q4.d>q2.d&&q4.d>pinMax, isSt=q2.d!=null&&(q4.d==null||q4.d<=q2.d); if(isAcc)acc++; if(isSt)st++;
  const ae=(a,b)=>{ let n2=0,x=0; for(const r of A.rows) if(r.tick>a&&r.tick<=b&&r.firstPaid){ n2+=r.firstPaid; x+=r.firstPaid*r.allEarlier; } return n2?(x/n2).toFixed(3):'-'; };
  const last=A.rows[A.rows.length-1];
  console.log(`${s}: H ${H} | depth q2 ${q2.d&&q2.d.toFixed(2)} (${q2.n} fns) -> q4 ${q4.d&&q4.d.toFixed(2)} (${q4.n} fns) | PIN max depth ${pinMax}, PIN repertoire ${P.fin&&P.fin.repertoire} | allEarlier q2 ${ae(H/4,H/2)} q4 ${ae(3*H/4,H)} | repertoire ${A.fin&&A.fin.repertoire} | pools empty/under1% at end ${last.poolsEmpty}/${last.poolsUnder1pct} | drain share end ${last.drainShare} | depth hist ${JSON.stringify(A.fin&&A.fin.depthHist)} -> ${isAcc?'ACC':isSt?'STALL':'neither'}`); }
if(n<3){ console.log(`complete ${n}/3`); process.exit(0); }
console.log('VERDICT: '+(acc>=2?'ACCUMULATING':st>=2?'STALLED':'MIXED'));
