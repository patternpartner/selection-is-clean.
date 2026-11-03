// #353 - PREREG-founder.md's rules on lab/port/out-founder.
const fs=require('fs'), D=__dirname+'/out-founder', seeds=[9401,9402,9403,9404,9405,9406,9407,9408,9409,9410];
const load=(s,a)=>{ if(!fs.existsSync(`${D}/${s}_${a}.done`))return null; return fs.readFileSync(`${D}/${s}_${a}.jsonl`,'utf8').trim().split('\n').map(l=>JSON.parse(l)).filter(r=>!r.stopped); };
const arrived=R=>R.length?R[R.length-1].cumArrived:0, reached=R=>R.length?R[R.length-1].tick:0;
const crash=R=>{ let hi=false; for(const r of R){ if(hi&&r.minAlive<5)return true; if(r.maxAlive>20)hi=true; } return false; };
let n=0, offN=0, offO=0, crN=0, crO=0, B=0; console.log('seed | arrived OLD NEW PIN | took off OLD NEW | crash OLD NEW | ticks reached OLD NEW PIN | late alive OLD NEW');
for(const s of seeds){ const O=load(s,'OLD'), W=load(s,'NEW'), P=load(s,'PIN'); if(!O||!W||!P){ console.log(s,'incomplete'); continue; } n++;
  const a=[arrived(O),arrived(W),arrived(P)], to=[a[0]>=500,a[1]>=500], cr=[crash(O),crash(W)];
  offO+=to[0]; offN+=to[1]; crO+=cr[0]; crN+=cr[1]; if(a[1]>a[2])B++;
  const la=R=>R.slice(-3).reduce((x,r)=>x+r.alive,0)/Math.max(1,Math.min(3,R.length));
  console.log(s,'|',a.join(' '),'|',to.map(x=>x?'yes':'no').join(' '),'|',cr.map(x=>x?'CRASH':'-').join(' '),'|',[reached(O),reached(W),reached(P)].join(' '),'|',Math.round(la(O)),Math.round(la(W))); }
if(n<10){ console.log(`complete ${n}/10 - no verdict yet`); process.exit(0); }
const A=offN>=8&&offN-offO>=3, G=crN-crO>=2;
console.log(`took off: NEW ${offN}/10, OLD ${offO}/10 -> A ${A?'CONFIRMED':'NOT CONFIRMED'} | crashes NEW ${crN} OLD ${crO} -> guard ${G?'WORSE':'clear'} | B: NEW > PIN on ${B}/10 -> ${B>=8?'CONFIRMED':'NOT CONFIRMED'}`);
console.log('SHIP: '+(A&&!G?'yes - TASK_FOUNDER becomes the default':'no'));
