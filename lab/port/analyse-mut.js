// #354 - PREREG-mut.md's rules on lab/port/out-mut.
const fs=require('fs'), D=__dirname+'/out-mut', seeds=[9501,9502,9503,9504,9505,9506,9507,9508,9509,9510];
const load=(s,a)=>{ if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; return fs.readFileSync(`${D}/${s}_${a}.jsonl`,'utf8').trim().split('\n').map(l=>JSON.parse(l)).filter(r=>!r.stopped&&!r.census); };
const arrived=R=>R.length?R[R.length-1].cumArrived:0, reached=R=>R.length?R[R.length-1].tick:0;
const crash=R=>{ let hi=false; for(const r of R){ if(hi&&r.minAlive<5)return true; if(r.maxAlive>20)hi=true; } return false; };
let n=0; const off={OLD:0,NEW:0,MUT:0}, cr={OLD:0,NEW:0,MUT:0}; console.log('seed | arrived OLD NEW MUT | took off OLD NEW MUT | crash OLD NEW MUT | ticks reached');
for(const s of seeds){ const R={OLD:load(s,'OLD'),NEW:load(s,'NEW'),MUT:load(s,'MUT')}; if(!R.OLD||!R.NEW||!R.MUT){ console.log(s,'incomplete'); continue; } n++;
  const a={}, t={}, c={}; for(const k of ['OLD','NEW','MUT']){ a[k]=arrived(R[k]); t[k]=a[k]>=500; c[k]=crash(R[k]); off[k]+=t[k]; cr[k]+=c[k]; }
  console.log(s,'|',a.OLD,a.NEW,a.MUT,'|',['OLD','NEW','MUT'].map(k=>t[k]?'yes':'no').join(' '),'|',['OLD','NEW','MUT'].map(k=>c[k]?'CRASH':'-').join(' '),'|',reached(R.OLD),reached(R.NEW),reached(R.MUT)); }
if(n<10){ console.log(`complete ${n}/10 - no verdict yet`); process.exit(0); }
const A=off.MUT>=8&&off.MUT-off.OLD>=3, G=cr.MUT-cr.OLD>=2;
console.log(`took off: MUT ${off.MUT}/10, NEW ${off.NEW}/10, OLD ${off.OLD}/10 -> A ${A?'CONFIRMED':'NOT CONFIRMED'} | crashes MUT ${cr.MUT} NEW ${cr.NEW} OLD ${cr.OLD} -> guard ${G?'WORSE':'clear'}`);
console.log('SHIP: '+(A&&!G?'yes - TASK_FOUNDER and TASK_MUT become the default':'no'));
