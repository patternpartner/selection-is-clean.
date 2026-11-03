// lab/port/analyse-prey.js - the rule of PREREG-prey.md (#366), as written there.
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-prey');
function load(s,a){ const f=path.join(D,s+'_'+a+'.jsonl'); if(!fs.existsSync(path.join(D,s+'_'+a+'.done')))return null;
  const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); const rows=L.filter(r=>r.alive!==undefined), end=L.find(r=>r.stopped);
  if(!end||end.stopped!=='ticks'||!rows.length||rows[rows.length-1].tick<40000)return {complete:false};
  let pk=0, collapse=false, at=null; for(const r of rows){ if(pk>0&&r.alive<pk*0.25&&!collapse){ collapse=true; at=r.tick; } if(r.alive>pk)pk=r.alive; }
  const late=rows.filter(r=>r.tick>30000);
  return {complete:true, collapse, at, peak:pk, prey:rows.reduce((x,r)=>x+(r.prey|0),0), lateArr:late.reduce((x,r)=>x+r.arrivals,0), lateInc:+late.reduce((x,r)=>x+r.taskIncome,0).toFixed(0), endAlive:rows[rows.length-1].alive}; }
let counted=0, cP=0, cN=0; const both=[];
for(const s of [9901,9902,9903,9904,9905,9906,9907,9908]){ const P=load(s,'PREY'), Q=load(s,'NOPREY');
  const ok=P&&Q&&P.complete&&Q.complete&&P.prey>0&&Q.prey===0;
  console.log(s+' PREY '+JSON.stringify(P)+'\n     NOPREY '+JSON.stringify(Q)+(ok?'':'   (not counted)'));
  if(!ok)continue; counted++; if(P.collapse)cP++; if(Q.collapse)cN++; if(!P.collapse&&!Q.collapse)both.push([s,P.lateArr,Q.lateArr]); }
let split=false; if(both.length>=3){ const worse=both.filter(([,p,q])=>q<p*0.75).length; split=worse>=Math.ceil(both.length*2/3);
  console.log('neither collapsed on '+both.length+': late arrivals PREY/NOPREY '+both.map(b=>b[0]+' '+b[1]+'/'+b[2]).join(', ')+' | NOPREY worse by >25% on '+worse); }
console.log('counted '+counted+'/8 | collapsed PREY '+cP+', NOPREY '+cN);
console.log('VERDICT: '+(counted<6?'INCONCLUSIVE':(cP-cN>=3&&cN<=1)?(split?'SPLIT (confirmed on collapse, worse on late arrivals) - default stays':'CONFIRMED'):'NOT CONFIRMED'));
