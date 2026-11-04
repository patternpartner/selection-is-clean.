// #381 - PREREG-one.md's rule, applied to lab/port/out-one/. Written before the decision runs finished.
//   node lab/port/analyse-one.js [dir]
// Pairs: one seed run as DEF and as ONE (PROV_BIRTH=0 STORE_DEATH=1 AIM=0). Every complete pair counts; the ONE arm must show 0 aim
// pulls and 0 unprovisioned refusals. Primary: one-sided exact Wilcoxon signed-rank on log(V_one/V_def), both directions.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-one');
const SEEDS=(process.env.SEEDS||Array.from({length:20},(_,i)=>String(11401+i)).join(' ')).split(/\s+/).filter(Boolean), NWIN=24, MIN=15;
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done'));
function m(L){ const R=L.filter(r=>r.fnPaid!==undefined), G=L.filter(r=>r.diag!==undefined), late=R.filter(r=>r.tick>6000), mean=(a,k)=>a.length?a.reduce((s,r)=>s+r[k],0)/a.length:0;
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ if(R[w].alive>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  return {n:R.length, V:R.reduce((s,r)=>s+r.newToHistory,0), C:collapse!==null, Ct:collapse, alive:mean(late,'alive'),
    prey:G.reduce((s,g)=>s+(g.prey||0),0), outbreak:G.some(g=>(g.prey||0)>=10000&&(g.pred155||0)>=50), p155:Math.max(0,...G.map(g=>g.pred155||0)), Emin:Math.min(...G.map(g=>g.meanE)), pulls:G.reduce((s,g)=>s+(g.pull|0),0), unprov:G.reduce((s,g)=>s+(g.unprovisioned|0),0), S:mean(late,'meanSz'), E:mean(late,'expH')}; }
// exact one-sided Wilcoxon signed-rank: P(W+ >= observed) under the null, by enumerating the rank-sum distribution (average ranks for ties)
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const P=[], out=[]; let missing=[];
for(const s of SEEDS){ const t1=s+'_DEF', t2=s+'_ONE'; if(!done(t1)||!done(t2)){ missing.push(s); continue; }
  const a=m(lines(t1+'.jsonl')), b=m(lines(t2+'.jsonl')); if(a.n!==NWIN||b.n!==NWIN){ missing.push(s+'(windows)'); continue; }
  P.push({s,d:a,r:b}); out.push(s+(b.pulls===0&&b.unprov===0?' ok     ':' SWITCH?')+(a.outbreak?' outbreak ':'          ')+'DEF V '+a.V+(a.C?' C@'+a.Ct:'')+' alive '+a.alive.toFixed(0)+' prey '+a.prey+' p155 '+a.p155+' Emin '+a.Emin+
    ' S '+a.S.toFixed(2)+'  |  ONE V '+b.V+(b.C?' C@'+b.Ct:'')+' alive '+b.alive.toFixed(0)+' prey '+b.prey+' p155 '+b.p155+' Emin '+b.Emin+' S '+b.S.toFixed(2)+' pulls '+b.pulls+' unprov '+b.unprov+'  ratio '+(Math.max(1,b.V)/Math.max(1,a.V)).toFixed(2)); }
console.log(out.join('\n')); if(missing.length) console.log('INCOMPLETE: '+missing.join(' '));
const lr=p=>Math.log(Math.max(1,p.r.V)/Math.max(1,p.d.V)), med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?b[(b.length-1)>>1]:0; };
const C=P, W=wilcoxon(C.map(lr)), Wob=wilcoxon(P.filter(p=>p.d.outbreak).map(lr)), bad=P.filter(p=>!(p.r.pulls===0&&p.r.unprov===0)).map(p=>p.s);
const onlyD=C.filter(p=>p.d.C&&!p.r.C).length, onlyR=C.filter(p=>p.r.C&&!p.d.C).length;
const guard=med(C.map(p=>p.r.alive))>=0.5*med(C.map(p=>p.d.alive));
console.log('\ncomplete pairs: '+P.length+'; ONE arms failing the switch check: '+(bad.length?bad.join(' '):'none'));
console.log('primary Wilcoxon on log(V_one/V_def): n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(one greater) '+W.pGreater.toFixed(4)+', p(one less) '+W.pLess.toFixed(4)+'; one ahead in '+C.filter(p=>lr(p)>0).length+' of '+C.length);
console.log('reported: outbreak pairs only: n '+Wob.n+', p(greater) '+Wob.pGreater.toFixed(4)+', p(less) '+Wob.pLess.toFixed(4)+'; collapse discordance on counted pairs: only DEF '+onlyD+', only ONE '+onlyR+'; geometric-mean ratio '+Math.exp(C.reduce((x,p)=>x+lr(p),0)/Math.max(1,C.length)).toFixed(2));
console.log('guard (median ONE alive-late >= half DEF\'s): '+(guard?'holds':'FAILS'));
for(let s=11401;s<=11405;s++){ const t=s+'_ONESHUF'; if(!done(t)) continue; const x=m(lines(t+'.jsonl')), o=P.find(p=>p.s===String(s)); console.log('shuffle (reported): '+s+' ONE+SHUFFLE V '+x.V+(o?' against ONE V '+o.r.V:'')); }
console.log('VERDICT: '+(missing.length?'INCOMPLETE':bad.length?'INCONCLUSIVE (a ONE arm failed the switch check)':C.length<MIN?'INCONCLUSIVE (fewer than '+MIN+' complete pairs)':W.pGreater<0.05?(guard?'BETTER: ship one currency wherever TASKS runs':'BETTER but the guard fails: not shipped'):W.pLess<0.05?'WORSE: delete STORE_DEATH':'neither: no default moves'));
