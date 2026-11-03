// #370 - the chained long runs, one line per 10,000-tick chunk: functions new to the universe's history, functions ever paid (and
// share of the space), mean formula size, exp(H), alive (mean, min), task income, imitator activity. Rows of a chunk are offset by
// c*CHUNK. Reads lab/port/out-chain/<s>_c<c>.jsonl.   node lab/port/analyse-chain.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-chain'), CH=+(process.env.CHUNK||10000);
const SEEDS=(process.env.SEEDS||'10401 10402 10403').split(/\s+/).filter(Boolean);
for(const s of SEEDS){ console.log('== '+s); let peak=0;
  for(let c=0;;c++){ const f=path.join(D,s+'_c'+c+'.jsonl'); if(!fs.existsSync(f))break; const all=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    const R=all.filter(r=>r.fnPaid!==undefined); if(!R.length){ console.log('  c'+c+' (no rows yet)'); break; } const pb=all.find(r=>r.popBoot);
    const sum=k=>R.reduce((a,r)=>a+(r[k]||0),0), mean=k=>sum(k)/R.length, V=sum('newToHistory'); if(V>peak)peak=V;
    console.log('  '+String((c*CH+R[R.length-1].tick)).padStart(6)+' ticks  new '+String(V).padStart(5)+' ('+(peak?Math.round(100*V/peak):0)+'% of peak)  ever '+R[R.length-1].everPaid+' ('+(100*R[R.length-1].everPaid/65536).toFixed(1)+'%)'
      +'  size '+mean('meanSz').toFixed(2)+'  exp(H) '+mean('expH').toFixed(0)+'  alive '+Math.round(mean('alive'))+' (min '+Math.min(...R.map(r=>r.alive))+')  task inc '+Math.round(sum('taskInc'))
      +'  copies '+sum('copies')+'  desync max '+Math.max(...R.map(r=>r.desync|0))+(pb?'  [restored '+pb.popBoot.restored+', seen '+pb.seenRestored+']':'')+(R.length<CH/500?'  (partial: '+R.length+' windows)':'')); } }
