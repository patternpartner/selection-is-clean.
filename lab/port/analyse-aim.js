// #377 - PREREG-aim.md's two rules, applied to lab/port/out-aim/. Written before the decision runs finished.
//   node lab/port/analyse-aim.js [dir]
// Question 1 (retire-or-prove): DEF judged against NOAIM's three replicates on V, S, E, C, as #371.
// Question 2 (selected or food): DEF against FLAT on V, as #376.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-aim');
const SEEDS=(process.env.SEEDS||'11001 11002 11003').split(/\s+/).filter(Boolean), NWIN=24, ARMS=['DEF','NOAIM','FLAT'];
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done')), fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
function m(L){ const R=L.filter(r=>r.fnPaid!==undefined), G=L.filter(r=>r.diag!==undefined);
  const late=R.filter(r=>r.tick>6000), lateG=G.filter(r=>r.diag>6000), mean=(a,k)=>a.length?a.reduce((s,r)=>s+r[k],0)/a.length:0;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ const a=R[w].alive; if(a>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), S:mean(late,'meanSz'), E:mean(late,'expH'), C:collapse!==null, Ct:collapse,
    alive:mean(late,'alive'), pulls:G.reduce((s,r)=>s+(r.pull|0),0), amp:mean(lateG,'meanAmp'), aims:mean(lateG,'aims')}; }
let c1=0, c2=0; const t1={WORSE:0,BETTER:0,SPLIT:0,differs:0}, t2={SELECTED:0,'FOOD SUFFICES':0,UNCLEAR:0}; const out=[];
for(const s of SEEDS){ const A={DEF:[],NOAIM:[],FLAT:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ARMS){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; }
    const x=m(lines(t+'.jsonl')); if(x.n!==NWIN){ ok=false; why.push(t+' '+x.n+' windows'); continue; } x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k])), nC=a=>A[a].filter(x=>x.C).length;
  // Question 1: AIM (DEF) against NOAIM
  const q1=A.DEF.every(x=>x.pulls>0)&&A.NOAIM.every(x=>x.pulls===0);
  const better={V:lo('DEF','V')>hi('NOAIM','V')&&lo('DEF','V')>1.1*hi('NOAIM','V'), S:lo('DEF','S')>hi('NOAIM','S')+0.25, E:lo('DEF','E')>1.1*hi('NOAIM','E'), C:nC('NOAIM')>=2&&nC('DEF')===0};
  const worse={V:hi('DEF','V')<lo('NOAIM','V')&&hi('DEF','V')<0.9*lo('NOAIM','V'), S:hi('DEF','S')<lo('NOAIM','S')-0.25, E:hi('DEF','E')<0.9*lo('NOAIM','E'), C:nC('DEF')>=2&&nC('NOAIM')===0};
  const B=Object.values(better).some(Boolean), W=Object.values(worse).some(Boolean), v1=(W&&B)?'SPLIT':W?'WORSE':B?'BETTER':'differs';
  // Question 2: DEF against FLAT
  const q2=A.DEF.every(x=>x.V>=500)&&A.FLAT.every(x=>x.pulls>0);
  const v2=(lo('DEF','V')>hi('FLAT','V')&&lo('DEF','V')>1.25*hi('FLAT','V'))?'SELECTED':(hi('FLAT','V')>=lo('DEF','V'))?'FOOD SUFFICES':'UNCLEAR';
  out.push(s+':  Q1 '+(q1?'COUNTED':'NOT COUNTED')+' -> '+v1+'  better '+JSON.stringify(better)+'  worse '+JSON.stringify(worse));
  out.push('        Q2 '+(q2?'COUNTED':'NOT COUNTED')+' -> '+v2);
  for(const a of ARMS) out.push('   '+a.padEnd(5)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' S '+fmt(x.S)+' E '+fmt(x.E)+' C '+(x.C?'at '+x.Ct:'no')+' aliveLate '+fmt(x.alive)+' pulls '+x.pulls+' amp '+fmt(x.amp)+' aims '+fmt(x.aims)).join('\n         '));
  if(q1){ c1++; t1[v1]++; } if(q2){ c2++; t2[v2]++; } }
console.log(out.join('\n')); const two=(x,c)=>c>0&&x*3>=c*2;
console.log('\nQ1 counted '+c1+' of '+SEEDS.length+'; '+JSON.stringify(t1));
console.log('Q1 VERDICT: '+(c1<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(t1.BETTER,c1)?'BETTER: AIM is PROVEN at the TASKS rung':two(t1.WORSE,c1)?'WORSE: AIM goes DORMANT wherever TASKS runs':'KEEP: no change'));
console.log('Q2 counted '+c2+' of '+SEEDS.length+'; '+JSON.stringify(t2));
console.log('Q2 VERDICT: '+(c2<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(t2.SELECTED,c2)?'SELECTED: aim satisfaction is selected at this rung':two(t2['FOOD SUFFICES'],c2)?'FOOD SUFFICES: AIM acts as food here (follow-up: a flat stipend)':'INCONCLUSIVE'));
