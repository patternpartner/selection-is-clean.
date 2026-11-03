// #379 - PREREG-refuge2.md's rule, applied to lab/port/out-refuge2/. Written before the decision runs finished.
//   node lab/port/analyse-refuge2.js [dir]
// Pairs: one seed run as DEF and as REFUGE. A pair counts if its DEF world had an outbreak (a window with >=10,000 prey events and
// >=50 op-155 carriers). Primary: one-sided exact Wilcoxon signed-rank on log(V_refuge/V_def) over counted pairs, both directions.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-refuge2');
const SEEDS=(process.env.SEEDS||Array.from({length:20},(_,i)=>String(11201+i)).join(' ')).split(/\s+/).filter(Boolean), NWIN=24, MIN=8;
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done'));
function m(L){ const R=L.filter(r=>r.fnPaid!==undefined), G=L.filter(r=>r.diag!==undefined), late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.length?a.reduce((s,r)=>s+r[k],0)/a.length:0;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ if(R[w].alive>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), C:collapse!==null, Ct:collapse, alive:mean(late,'alive'),
    prey:G.reduce((s,g)=>s+(g.prey||0),0), outbreak:G.some(g=>(g.prey||0)>=10000&&(g.pred155||0)>=50), p155:Math.max(0,...G.map(g=>g.pred155||0)), Emin:Math.min(...G.map(g=>g.meanE))}; }
// exact one-sided Wilcoxon signed-rank: P(W+ >= observed) under the null, by enumerating the rank-sum distribution (average ranks for ties)
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const P=[], out=[]; let missing=[];
for(const s of SEEDS){ const t1=s+'_DEF', t2=s+'_REFUGE'; if(!done(t1)||!done(t2)){ missing.push(s); continue; }
  const a=m(lines(t1+'.jsonl')), b=m(lines(t2+'.jsonl')); if(a.n!==NWIN||b.n!==NWIN){ missing.push(s+'(windows)'); continue; }
  P.push({s,d:a,r:b}); out.push(s+(a.outbreak?' COUNTED ':' -       ')+'DEF V '+a.V+(a.C?' C@'+a.Ct:'')+' alive '+a.alive.toFixed(0)+' prey '+a.prey+' p155 '+a.p155+' Emin '+a.Emin+
    '  |  REFUGE V '+b.V+(b.C?' C@'+b.Ct:'')+' alive '+b.alive.toFixed(0)+' prey '+b.prey+' p155 '+b.p155+' Emin '+b.Emin+'  ratio '+(Math.max(1,b.V)/Math.max(1,a.V)).toFixed(2)); }
console.log(out.join('\n')); if(missing.length) console.log('INCOMPLETE: '+missing.join(' '));
const lr=p=>Math.log(Math.max(1,p.r.V)/Math.max(1,p.d.V)), med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?b[(b.length-1)>>1]:0; };
const C=P.filter(p=>p.d.outbreak), W=wilcoxon(C.map(lr)), Wall=wilcoxon(P.filter(p=>p.d.prey>=1000).map(lr));
const onlyD=C.filter(p=>p.d.C&&!p.r.C).length, onlyR=C.filter(p=>p.r.C&&!p.d.C).length;
const guard=med(C.map(p=>p.r.alive))>=0.5*med(C.map(p=>p.d.alive));
console.log('\ncounted pairs (DEF outbreak): '+C.length+' of '+P.length+' complete');
console.log('primary Wilcoxon on log(V_refuge/V_def): n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(refuge greater) '+W.pGreater.toFixed(4)+', p(refuge less) '+W.pLess.toFixed(4)+'; refuge ahead in '+C.filter(p=>lr(p)>0).length+' of '+C.length);
console.log('reported: all predation pairs (DEF prey >= 1000): n '+Wall.n+', p(greater) '+Wall.pGreater.toFixed(4)+', p(less) '+Wall.pLess.toFixed(4)+'; collapse discordance on counted pairs: only DEF '+onlyD+', only REFUGE '+onlyR);
console.log('guard (median REFUGE alive-late >= half DEF\'s): '+(guard?'holds':'FAILS'));
console.log('VERDICT: '+(missing.length?'INCOMPLETE':C.length<MIN?'INCONCLUSIVE (fewer than '+MIN+' counted pairs)':W.pGreater<0.05?(guard?'BETTER: ship REPL_REFUGE=1 wherever TASKS runs':'BETTER but the guard fails: not shipped'):W.pLess<0.05?'WORSE: delete the knob':'neither: the knob stays 0'));
