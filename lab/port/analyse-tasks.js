// #350 - PREREG-tasks.md's rules on lab/port/out-tasks. Late = samples at ticks 7,000-10,000.
const fs=require('fs'), D=__dirname+'/out-tasks'; const L=r=>r.rows.filter(x=>x.tick>=7000);
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
let A=[0,0], B=[0,0]; console.log('seed | TASKS ANC ROCK REPL late alive | ROCK/TASKS ANC/TASKS | ignited | expH meanSz nfun | task/sun late');
for(const s of [9101,9102,9103]){ const g=a=>{ const f=`${D}/${s}_${a}.json`; return fs.existsSync(`${D}/${s}_${a}.done`)?JSON.parse(fs.readFileSync(f,'utf8')):null; };
  const T=g('TASKS'), N=g('ANC'), R=g('ROCK'), P=g('REPL'); if(!T||!N||!R){ console.log(s,'incomplete'); continue; }
  const al=x=>mean(L(x).map(y=>y.alive)), t=al(T), n=al(N), r=al(R), p=P?al(P):NaN, last=T.rows[T.rows.length-1];
  const ran=last.ev.income>0, ign=last.carry[3]>0.1*last.alive, tw=mean(L(T).map(y=>y.taskW)), sw=mean(L(T).map(y=>y.sunW));
  if(ran){ A[r<0.5*t?0:1]++; B[n<0.5*t?0:1]++; }
  console.log(s,'|',t.toFixed(0),n.toFixed(0),r.toFixed(0),isNaN(p)?'-':p.toFixed(0),'|',(r/t).toFixed(2),(n/t).toFixed(2),'|',ran?(ign?'yes':'no'):'NOT RUN','|',last.expH,last.meanSz,last.nfun,'|',(tw/sw).toFixed(2)); }
const v=(x,yes,no)=>x[0]>=2?yes:x[1]>=2?no:'INCONCLUSIVE';
console.log('A (ROCK < half of TASKS):',A[0],'of',A[0]+A[1],'->',v(A,'CONFIRMED','NOT CONFIRMED'));
console.log('B (ANC < half of TASKS):',B[0],'of',B[0]+B[1],'->',v(B,'CONFIRMED','NOT CONFIRMED'));
