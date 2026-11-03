// #373 - PREREG-refuge.md's rule, applied to lab/port/out-refuge/. Written before the decision runs finished.
//   node lab/port/analyse-refuge.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-refuge');
const SEEDS=(process.env.SEEDS||'10601 10602 10603').split(/\s+/).filter(Boolean), NWIN=24;
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done')), fmt=x=>Math.abs(x)>=100?x.toFixed(0):x.toFixed(2);
function m(all){ const R=all.filter(r=>r.fnPaid!==undefined), G=all.filter(r=>r.diag!==undefined), late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ if(R[w].alive>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), S:mean(late,'meanSz'), E:mean(late,'expH'), C:collapse!==null, Ct:collapse, alive:mean(late,'alive'),
    prey:G.reduce((s,g)=>s+(g.prey||0),0), preyMax:Math.max(...G.map(g=>g.prey||0)), storeMin:Math.min(...G.map(g=>g.meanE))}; }
let counted=0; const tally={WORSE:0,BETTER:0,SPLIT:0,differs:0,identical:0}; const out=[];
for(const s of SEEDS){ const A={DEFAULT:[],REFUGE:[]}; let ok=true; const why=[];
  for(const k of [1,2,3]) for(const a of ['DEFAULT','REFUGE']){ const t=s+'_'+a+k; if(!done(t)){ ok=false; why.push(t); continue; } const x=m(lines(t+'.jsonl')); if(x.n!==NWIN){ ok=false; why.push(t+' '+x.n+' windows'); continue; } x.k=k; A[a].push(x); }
  if(!ok){ out.push(s+': INCOMPLETE ('+why.join(', ')+')'); continue; }
  const counts=A.DEFAULT.concat(A.REFUGE).every(x=>x.prey>=1000);
  const lo=(a,k)=>Math.min(...A[a].map(x=>x[k])), hi=(a,k)=>Math.max(...A[a].map(x=>x[k])), nC=a=>A[a].filter(x=>x.C).length;
  const better={V:lo('REFUGE','V')>hi('DEFAULT','V')&&lo('REFUGE','V')>1.1*hi('DEFAULT','V'), S:lo('REFUGE','S')>hi('DEFAULT','S')+0.25, E:lo('REFUGE','E')>1.1*hi('DEFAULT','E'), C:nC('DEFAULT')>=2&&nC('REFUGE')===0};
  const worse={V:hi('REFUGE','V')<lo('DEFAULT','V')&&hi('REFUGE','V')<0.9*lo('DEFAULT','V'), S:hi('REFUGE','S')<lo('DEFAULT','S')-0.25, E:hi('REFUGE','E')<0.9*lo('DEFAULT','E'), C:nC('REFUGE')>=2&&nC('DEFAULT')===0};
  const W=Object.values(worse).some(Boolean), B=Object.values(better).some(Boolean);
  const identical=A.REFUGE.every(x=>{ const o=A.DEFAULT.find(y=>y.k===x.k); return o&&o.V===x.V&&o.S===x.S&&o.E===x.E; });
  const c=identical?'identical':(W&&B)?'SPLIT':W?'WORSE':B?'BETTER':'differs';
  out.push(s+': '+(counts?'COUNTED':'NOT COUNTED')+' -> '+c+'  better '+JSON.stringify(better)+'  worse '+JSON.stringify(worse));
  for(const a of ['DEFAULT','REFUGE']) out.push('   '+a.padEnd(7)+' '+A[a].map(x=>'k'+x.k+' V '+x.V+' S '+fmt(x.S)+' E '+fmt(x.E)+' C '+(x.C?'at '+x.Ct:'no')+' aliveLate '+fmt(x.alive)+' prey '+x.prey+' (max/250 '+x.preyMax+') storeMin '+x.storeMin).join('\n           '));
  if(counts){ counted++; tally[c]++; } }
console.log(out.join('\n')); const two=x=>counted>0&&x*3>=counted*2;
console.log('\ncounted '+counted+' of '+SEEDS.length+'; '+JSON.stringify(tally));
console.log('VERDICT: '+(counted<3?'INCONCLUSIVE (fewer than 3 counted seeds)':two(tally.BETTER)?'BETTER: ship REPL_REFUGE=1 wherever TASKS runs':two(tally.WORSE)?'WORSE: delete the knob':tally.identical===counted?'IDENTICAL: delete the knob':'NOT SHIPPED: REPL_REFUGE stays 0 (DORMANT; follow-up: a longer horizon)'));
