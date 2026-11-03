// #376 - PREREG-shuffle.md's rule, applied to lab/port/out-shuffle/. Written before the decision runs finished.
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-shuffle'), NWIN=24;
const SEEDS=(process.env.SEEDS||'10901 10902 10903').split(/\s+/).filter(Boolean);
const done=t=>fs.existsSync(path.join(D,t+'.done')), fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
function m(f){ const R=fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.fnPaid!==undefined), late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length;
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), ever:R[R.length-1].everPaid, paid:R.reduce((s,r)=>s+r.paid,0), S:mean(late,'meanSz'), E:mean(late,'expH'), alive:mean(late,'alive')}; }
let counted=0; const tally={SELECTED:0,DRIFT:0,UNCLEAR:0}; const out=[];
for(const s of SEEDS){ const A={PAID:[],SHUFFLE:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ['PAID','SHUFFLE']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; } const x=m(t+'.jsonl'); if(x.n!==NWIN){ ok=false; why.push(t+' '+x.n+' windows'); continue; } x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const counts=A.PAID.every(x=>x.ever>=500)&&A.SHUFFLE.every(x=>x.paid>=1000);
  const loP=Math.min(...A.PAID.map(x=>x.V)), hiS=Math.max(...A.SHUFFLE.map(x=>x.V));
  const c=(loP>hiS&&loP>1.25*hiS)?'SELECTED':(hiS>=loP)?'DRIFT':'UNCLEAR';
  out.push(s+': '+(counts?'COUNTED':'NOT COUNTED')+' -> '+c+'  (lowest PAID V '+loP+', highest SHUFFLE V '+hiS+')');
  for(const a of ['PAID','SHUFFLE']) out.push('   '+a.padEnd(7)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' ever '+x.ever+' paid '+x.paid+' S '+fmt(x.S)+' E '+fmt(x.E)+' aliveLate '+fmt(x.alive)).join('\n           '));
  if(counts){ counted++; tally[c==='DRIFT'?'DRIFT':c]++; } }
console.log(out.join('\n')); const two=x=>counted>0&&x*3>=counted*2;
console.log('\ncounted '+counted+' of '+SEEDS.length+'; '+JSON.stringify(tally));
console.log('VERDICT: '+(counted<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(tally.SELECTED)?'SELECTED: new functions arrive because the computer is fed':two(tally.DRIFT)?'DRIFT SUFFICES: new functions arrive as well when computing earns nothing':'INCONCLUSIVE'));
