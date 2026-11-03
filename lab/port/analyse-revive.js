// #375 - PREREG-revive.md's rule, applied to lab/port/out-revive2/. Written before any dead world was generated.
//   node lab/port/analyse-revive.js
const fs=require('fs'), path=require('path'); const G=path.join(__dirname,'out-gen'), D=path.join(__dirname,'out-revive2'), NWIN=16;
const states=fs.existsSync(path.join(G,'dead-states.txt'))?fs.readFileSync(path.join(G,'dead-states.txt'),'utf8').trim().split('\n').filter(Boolean).map(l=>l.split(' ')):[];
const done=t=>fs.existsSync(path.join(D,t+'.done'));
function m(f){ const L=fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').map(JSON.parse), R=L.filter(r=>r.fnPaid!==undefined), Gd=L.filter(r=>r.diag!==undefined);
  const rev=R.find(r=>r.meanSz>=4&&r.alive>=500);
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), revived:!!rev, T:rev?rev.tick:8000, prey2k:Gd.filter(g=>g.diag<=2000).reduce((s,g)=>s+(g.prey||0),0), aliveEnd:R[R.length-1].alive, sizeEnd:R[R.length-1].meanSz}; }
let counted=0; const tally={BETTER:0,WORSE:0,SPLIT:0,differs:0,identical:0}; const out=[];
for(const [s,T] of states){ const A={DEFAULT:[],REFUGE:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ['DEFAULT','REFUGE']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; } const x=m(t+'.jsonl'); if(x.n!==NWIN){ ok=false; why.push(t+' '+x.n+' windows'); continue; } x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+'@'+T+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const counts=A.DEFAULT.every(x=>x.prey2k>=1000);
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k])), nR=a=>A[a].filter(x=>x.revived).length, all=a=>A[a].every(x=>x.revived);
  const better=(lo('REFUGE','V')>hi('DEFAULT','V')&&lo('REFUGE','V')>1.1*hi('DEFAULT','V'))||(nR('REFUGE')>=2&&nR('DEFAULT')===0)||(all('REFUGE')&&all('DEFAULT')&&hi('REFUGE','T')<lo('DEFAULT','T'));
  const worse=(lo('DEFAULT','V')>hi('REFUGE','V')&&lo('DEFAULT','V')>1.1*hi('REFUGE','V'))||(nR('DEFAULT')>=2&&nR('REFUGE')===0)||(all('REFUGE')&&all('DEFAULT')&&hi('DEFAULT','T')<lo('REFUGE','T'));
  const identical=A.REFUGE.every(x=>{ const o=A.DEFAULT.find(y=>y.k===x.k); return o&&o.V===x.V&&o.T===x.T; });
  const c=identical?'identical':(better&&worse)?'SPLIT':better?'BETTER':worse?'WORSE':'differs';
  out.push(s+'@'+T+': '+(counts?'COUNTED':'NOT COUNTED')+' -> '+c);
  for(const a of ['DEFAULT','REFUGE']) out.push('   '+a.padEnd(7)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' revived '+(x.revived?'at '+x.T:'no')+' prey(first 2k) '+x.prey2k+' end alive '+x.aliveEnd+' size '+x.sizeEnd.toFixed(1)).join('\n           '));
  if(counts){ counted++; tally[c]++; } }
console.log(out.join('\n')); const two=x=>counted>0&&x*3>=counted*2;
console.log('\ndead states '+states.length+', counted '+counted+'; '+JSON.stringify(tally));
console.log('VERDICT: '+(counted<3?'INCONCLUSIVE (fewer than 3 counted dead states)':two(tally.BETTER)?'BETTER: ship REPL_REFUGE=1 wherever TASKS runs':two(tally.WORSE)?'WORSE: delete the knob':tally.identical===counted?'IDENTICAL: delete the knob':'NOT SHIPPED: REPL_REFUGE stays 0'));
