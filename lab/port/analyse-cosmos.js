// #378 - PREREG-cosmos.md's two rules, applied to lab/port/out-cosmos/. Written before the decision runs finished.
//   node lab/port/analyse-cosmos.js [dir]
// Question 1 (retire-or-prove): cosmos (DEF) judged against NOCOSMOS's three replicates on V, S, E, C, as #371, with C used on a seed
// only if every replicate of both arms reached 300 alive. Question 2 (replication of #377's): DEF against FLAT on V.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-cosmos');
const SEEDS=(process.env.SEEDS||'11101 11102 11103').split(/\s+/).filter(Boolean), NWIN=24, ARMS=['DEF','NOCOSMOS','FLAT'];
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done')), fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
const secs=t=>{ try{ return +fs.readFileSync(path.join(D,t+'.secs'),'utf8'); }catch(e){ return null; } };
function m(L){ const R=L.filter(r=>r.fnPaid!==undefined), G=L.filter(r=>r.diag!==undefined);
  const late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.length?a.reduce((s,r)=>s+r[k],0)/a.length:0;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ const a=R[w].alive; if(a>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), S:mean(late,'meanSz'), E:mean(late,'expH'), C:collapse!==null, Ct:collapse,
    reached:R.some(r=>r.alive>=300), alive:mean(late,'alive'), launches:G.reduce((s,r)=>s+(r.launch|0),0), pulls:G.reduce((s,r)=>s+(r.pull|0),0)}; }
let c1=0, c2=0; const t1={WORSE:0,BETTER:0,SPLIT:0,differs:0}, t2={SELECTED:0,'FOOD SUFFICES':0,UNCLEAR:0}; const out=[];
for(const s of SEEDS){ const A={DEF:[],NOCOSMOS:[],FLAT:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ARMS){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; }
    const x=m(lines(t+'.jsonl')); if(x.n!==NWIN){ ok=false; why.push(t+' '+x.n+' windows'); continue; } x.k=k; x.secs=secs(t); A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k])), nC=a=>A[a].filter(x=>x.C).length;
  // Question 1: cosmos (DEF) against NOCOSMOS
  const q1=A.DEF.every(x=>x.launches>0)&&A.NOCOSMOS.every(x=>x.launches===0);
  const cOK=A.DEF.every(x=>x.reached)&&A.NOCOSMOS.every(x=>x.reached);
  const worse={V:hi('DEF','V')<lo('NOCOSMOS','V')&&hi('DEF','V')<0.9*lo('NOCOSMOS','V'), S:hi('DEF','S')<lo('NOCOSMOS','S')-0.25, E:hi('DEF','E')<0.9*lo('NOCOSMOS','E'), C:cOK&&nC('DEF')>=2&&nC('NOCOSMOS')===0};
  const better={V:lo('DEF','V')>hi('NOCOSMOS','V')&&lo('DEF','V')>1.1*hi('NOCOSMOS','V'), S:lo('DEF','S')>hi('NOCOSMOS','S')+0.25, E:lo('DEF','E')>1.1*hi('NOCOSMOS','E'), C:cOK&&nC('NOCOSMOS')>=2&&nC('DEF')===0};
  const W=Object.values(worse).some(Boolean), B=Object.values(better).some(Boolean), v1=(W&&B)?'SPLIT':W?'WORSE':B?'BETTER':'differs';
  // Question 2: DEF against FLAT (#377's rule)
  const q2=A.DEF.every(x=>x.V>=500)&&A.FLAT.every(x=>x.pulls>0);
  const v2=(lo('DEF','V')>hi('FLAT','V')&&lo('DEF','V')>1.25*hi('FLAT','V'))?'SELECTED':(hi('FLAT','V')>=lo('DEF','V'))?'FOOD SUFFICES':'UNCLEAR';
  out.push(s+':  Q1 '+(q1?'COUNTED':'NOT COUNTED')+' -> '+v1+(cOK?'':' (C not used: an arm did not reach 300)')+'  worse '+JSON.stringify(worse)+'  better '+JSON.stringify(better));
  out.push('        Q2 '+(q2?'COUNTED':'NOT COUNTED')+' -> '+v2);
  for(const a of ARMS) out.push('   '+a.padEnd(8)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' S '+fmt(x.S)+' E '+fmt(x.E)+' C '+(x.C?'at '+x.Ct:'no')+' aliveLate '+fmt(x.alive)+' launches '+x.launches+' pulls '+x.pulls+(x.secs!==null?' secs '+x.secs:'')).join('\n            '));
  if(q1){ c1++; t1[v1]++; } if(q2){ c2++; t2[v2]++; } }
console.log(out.join('\n')); const two=(x,c)=>c>0&&x*3>=c*2;
console.log('\nQ1 counted '+c1+' of '+SEEDS.length+'; '+JSON.stringify(t1));
console.log('Q1 VERDICT: '+(c1<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(t1.WORSE,c1)?'WORSE: cosmos goes DORMANT wherever TASKS runs':two(t1.BETTER,c1)?'BETTER: cosmos is PROVEN at the TASKS rung':two(t1.SPLIT,c1)?'SPLIT: no change (follow-up: a longer horizon)':'KEEP: no change'));
console.log('Q2 counted '+c2+' of '+SEEDS.length+'; '+JSON.stringify(t2));
console.log('Q2 VERDICT: '+(c2<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(t2['FOOD SUFFICES'],c2)?'FOOD SUFFICES: AIM is ruled a food source here (follow-up: a flat stipend)':two(t2.SELECTED,c2)?'SELECTED: the purposes are selected':'INCONCLUSIVE'));
