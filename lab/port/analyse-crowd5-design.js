// #394 DESIGN readout for lab/port/out-crowd5-design: per run, new functions V, CPU (user+sys), V per CPU-hour, mean alive, late/early.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-crowd5-design');
for(const f of fs.readdirSync(D).filter(x=>x.endsWith('.done')).sort()){ const t=f.slice(0,-5);
  const R=fs.readFileSync(path.join(D,t+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.fnPaid!==undefined);
  const s=fs.readFileSync(path.join(D,t+'.time'),'utf8'); let c=0; for(const k of ['user','sys']){ const m=s.match(new RegExp(k+'\\s+(\\d+)m([\\d.]+)s')); if(m)c+=(+m[1])*60+(+m[2]); }
  const V=R.reduce((a,r)=>a+r.newToHistory,0), h=R.length>>1, e=R.slice(0,h).reduce((a,r)=>a+r.newToHistory,0), l=R.slice(h).reduce((a,r)=>a+r.newToHistory,0);
  console.log(t.padEnd(12)+' V '+String(V).padStart(6)+'  cpu '+(c/60).toFixed(1).padStart(5)+'m  per CPU-hour '+String(Math.round(V/(c/3600))).padStart(7)+'  alive '+String(Math.round(R.reduce((a,r)=>a+r.meanAlive,0)/R.length)).padStart(5)+'  late/early '+(l/Math.max(1,e)).toFixed(2)+'  meanSz '+R[R.length-1].meanSz); }
