// #362 - PREREG-trickle.md's rules on lab/port/out-trickle.
const fs=require('fs'), D=__dirname+'/out-trickle', seeds=[9801,9802,9803,9804,9805,9806];
const load=(s,a)=>{ if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; return fs.readFileSync(`${D}/${s}_${a}.jsonl`,'utf8').trim().split('\n').map(l=>JSON.parse(l)).filter(r=>r.tick&&r.alive!=null); };
const judge=R=>{ if(!R||!R.length)return {status:'MISSING'}; const last=R[R.length-1]; if(last.tick<40000)return {status:'INCOMPLETE', reached:last.tick};
  const peak=Math.max(...R.map(r=>r.taskIncome)), late=R.filter(r=>r.tick>30000), lateInc=Math.max(...late.map(r=>r.taskIncome)), lateArr=late.reduce((a,r)=>a+r.arrivals,0), cum=last.cumArrived;
  let hi=false, crash=false; for(const r of R){ if(hi&&r.minAlive<5)crash=true; if(r.maxAlive>20)hi=true; }
  const stalled=cum<500||(lateInc<0.05*peak&&lateArr<20); return {status:stalled?'STALLED':'LIVE', crash, peak:Math.round(peak), lateInc:Math.round(lateInc), lateArr, cum}; };
let n=0, so=0, st=0, co=0, ct=0;
for(const s of seeds){ const o=judge(load(s,'OLD')), t=judge(load(s,'TRICKLE')); console.log(s,'OLD',JSON.stringify(o),'| TRICKLE',JSON.stringify(t));
  if(['STALLED','LIVE'].includes(o.status)&&['STALLED','LIVE'].includes(t.status)){ n++; if(o.status==='STALLED')so++; if(t.status==='STALLED')st++; if(o.crash)co++; if(t.crash)ct++; } }
console.log(`counted ${n}/6 | stalled OLD ${so}, TRICKLE ${st} | crashes OLD ${co}, TRICKLE ${ct}`);
if(n<4){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
const conf=so-st>=2&&st<=1, guard=ct>co; console.log('VERDICT: '+(conf&&!guard?'CONFIRMED - ship TASK_TRICKLE=200':'NOT CONFIRMED')+(guard?' (guard: more crashes)':''));
