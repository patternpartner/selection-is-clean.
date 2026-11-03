// #371 - PREREG-laws.md's rule, applied to lab/port/out-laws/. Written before the decision runs finished.
//   node lab/port/analyse-laws.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-laws');
const SEEDS=(process.env.SEEDS||'10501 10502 10503').split(/\s+/).filter(Boolean), NWIN=24;
const rows=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.fnPaid!==undefined);
const done=t=>fs.existsSync(path.join(D,t+'.done')), fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
function m(R){ const late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ const a=R[w].alive; if(a>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  const tried=[]; let last=null; for(const r of R){ if(r.lawTrial&&r.lawTrial!==last)tried.push(r.lawTrial+'@'+r.tick); last=r.lawTrial; }
  const L=R[R.length-1]; return {V:R.reduce((s,r)=>s+r.newToHistory,0), S:mean(late,'meanSz'), E:mean(late,'expH'), C:collapse!==null, Ct:collapse, alive:mean(late,'alive'), laws:L.laws|0, kept:L.lawKept|0, rev:L.lawRevert|0, tried}; }
let counted=0; const tally={WORSE:0,BETTER:0,SPLIT:0,differs:0,identical:0}; const out=[];
for(const s of SEEDS){ const A={LAWS:[],NOLAW:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ['LAWS','NOLAW']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; } const R=rows(t+'.jsonl'); if(R.length!==NWIN){ ok=false; why.push(t+' '+R.length+' windows'); continue; } const x=m(R); x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const counts=A.LAWS.every(x=>x.laws>=2)&&A.NOLAW.every(x=>x.laws===0);
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k])), nC=a=>A[a].filter(x=>x.C).length;
  const worse={V:hi('LAWS','V')<lo('NOLAW','V')&&hi('LAWS','V')<0.9*lo('NOLAW','V'), S:hi('LAWS','S')<lo('NOLAW','S')-0.25, E:hi('LAWS','E')<0.9*lo('NOLAW','E'), C:nC('LAWS')>=2&&nC('NOLAW')===0};
  const better={V:lo('LAWS','V')>hi('NOLAW','V')&&lo('LAWS','V')>1.1*hi('NOLAW','V'), S:lo('LAWS','S')>hi('NOLAW','S')+0.25, E:lo('LAWS','E')>1.1*hi('NOLAW','E'), C:nC('NOLAW')>=2&&nC('LAWS')===0};
  const W=Object.values(worse).some(Boolean), B=Object.values(better).some(Boolean);
  const identical=A.LAWS.every(x=>{ const o=A.NOLAW.find(y=>y.k===x.k); return o&&o.V===x.V&&o.S===x.S&&o.E===x.E; });
  const c=identical?'identical':(W&&B)?'SPLIT':W?'WORSE':B?'BETTER':'differs';
  out.push(s+': '+(counts?'COUNTED':'NOT COUNTED')+' -> '+c+'  worse '+JSON.stringify(worse)+'  better '+JSON.stringify(better));
  for(const a of ['LAWS','NOLAW']) out.push('   '+a.padEnd(5)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' S '+fmt(x.S)+' E '+fmt(x.E)+' C '+(x.C?'at '+x.Ct:'no')+' aliveLate '+fmt(x.alive)+' laws '+x.laws+'/'+x.kept+'k/'+x.rev+'r '+x.tried.join(',')).join('\n         '));
  if(counts){ counted++; tally[c]++; } }
console.log(out.join('\n')); const two=x=>counted>0&&x*3>=counted*2;
console.log('\ncounted '+counted+' of '+SEEDS.length+'; '+JSON.stringify(tally));
console.log('VERDICT: '+(counted<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(tally.WORSE)?'WORSE: the law process goes DORMANT wherever TASKS runs':two(tally.SPLIT)?'SPLIT: no change (follow-up: relative steps)':'KEEP: no change'));
