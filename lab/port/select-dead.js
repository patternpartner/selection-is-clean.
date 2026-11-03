// #375 - PREREG-revive.md's dead-state rule, applied to lab/port/out-gen/. Reads only each run's rows up to the save tick T.
// Prints one line per seed: its earliest dead state, or none. Written before any world was generated.
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-gen');
const SEEDS=(process.env.SEEDS||'10801 10802 10803 10804 10805 10806 10807 10808 10809 10810').split(/\s+/).filter(Boolean);
const out=[];
for(const s of SEEDS){ if(!fs.existsSync(path.join(D,s+'.done'))){ console.log(s+' not done'); continue; }
  const R=fs.readFileSync(path.join(D,s+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.fnPaid!==undefined);
  let pick=null;
  for(const T of [4000,8000,12000]){ const w=R.filter(r=>r.tick>T-1000&&r.tick<=T); if(w.length!==2)continue;
    const peak=Math.max(...R.filter(r=>r.tick<=T).map(r=>r.taskInc)), sz=(w[0].meanSz+w[1].meanSz)/2, inc=w[0].taskInc+w[1].taskInc, al=(w[0].alive+w[1].alive)/2;
    const dead=sz<1.5&&inc<0.01*peak&&al<400;
    console.log(s+' T '+T+'  size '+sz.toFixed(2)+'  task income '+inc.toFixed(1)+' (1% of peak '+(0.01*peak).toFixed(1)+')  alive '+al.toFixed(0)+(dead?'  DEAD':''));
    if(dead&&!pick)pick=T; }
  if(pick)out.push(s+' '+pick); }
console.log('\nDEAD STATES: '+(out.length?out.join(', '):'none'));
fs.writeFileSync(path.join(D,'dead-states.txt'),out.join('\n')+(out.length?'\n':''));
