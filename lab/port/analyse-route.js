// #355 - PREREG-route.md's rules on lab/port/out-route.
const fs=require('fs'), D=__dirname+'/out-route', seeds=[9601,9602,9603,9604,9605,9606,9607,9608,9609,9610], A=['MUTONLY','DEFAULT','OLD'];
const load=(s,a)=>{ if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; return fs.readFileSync(`${D}/${s}_${a}.jsonl`,'utf8').trim().split('\n').map(l=>JSON.parse(l)).filter(r=>!r.stopped&&!r.census); };
const arrived=R=>R.length?R[R.length-1].cumArrived:0, toff=R=>{ const r=R.find(x=>x.cumArrived>=500); return r?r.tick:null; };
const crash=R=>{ let hi=false; for(const r of R){ if(hi&&r.minAlive<5)return true; if(r.maxAlive>20)hi=true; } return false; };
let n=0; const off={}, cr={}; for(const a of A){ off[a]=0; cr[a]=0; } console.log('seed | arrived '+A.join(' ')+' | take-off tick '+A.join(' ')+' | crash');
for(const s of seeds){ const R={}; for(const a of A)R[a]=load(s,a); if(A.some(a=>!R[a])){ console.log(s,'incomplete'); continue; } n++;
  for(const a of A){ if(arrived(R[a])>=500)off[a]++; if(crash(R[a]))cr[a]++; }
  console.log(s,'|',A.map(a=>arrived(R[a])).join(' '),'|',A.map(a=>toff(R[a])||'-').join(' '),'|',A.map(a=>crash(R[a])?'CRASH':'-').join(' ')); }
if(n<10){ console.log(`complete ${n}/10 - no verdict yet`); process.exit(0); }
const m=off.MUTONLY, d=off.DEFAULT, o=off.OLD;
console.log(`took off: MUTONLY ${m}/10, DEFAULT ${d}/10, OLD ${o}/10 | crashes ${A.map(a=>a+' '+cr[a]).join(', ')}`);
console.log('VERDICT: '+((m>=d-1&&m>=o+3)?'EVOLVED ROUTE':(m<=o+1)?'SUPPLIED ROUTE':'PARTIAL'));
