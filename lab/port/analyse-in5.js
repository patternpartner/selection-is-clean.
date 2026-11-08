// #392 - PREREG-in5.md's rule, applied to lab/port/out-in5/. Written before the decision runs finished.
//   node lab/port/analyse-in5.js [dir]
// Pairs: one seed run as IN4 and as IN5. R = new functions per CPU-hour (CPU from bash's time, user+sys). Primary: one-sided exact
// Wilcoxon signed-rank on log(R_in5/R_in4), both directions; guard: median V_in5/V_in4 >= 0.5. Floor: >= 15 pairs, <= 2 IN5 worlds refused for a full table.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-in5');
const SEEDS=Array.from({length:20},(_,i)=>String(11601+i)), NWIN=24, MIN=15;
const lines=f=>fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const done=t=>fs.existsSync(path.join(D,t+'.done'));
function cpu(t){ const s=fs.readFileSync(path.join(D,t+'.time'),'utf8'); let tot=0; for(const k of ['user','sys']){ const m=s.match(new RegExp(k+'\\s+(\\d+)m([\\d.]+)s')); if(m)tot+=(+m[1])*60+(+m[2]); } return tot; }
function m(t){ const L=lines(t+'.jsonl'), R=L.filter(r=>r.fnPaid!==undefined), G=L.filter(r=>r.diag!==undefined);
  let peak=0, reached=false, collapse=null; for(let w=0;w<R.length;w++){ if(R[w].alive>=300)reached=true;
    if(reached&&w>0&&R[w].alive<0.25*peak&&R[w-1].alive<0.25*peak&&collapse===null)collapse=R[w].tick; peak=Math.max(peak, w>0?R[w-1].alive:0); }
  const V=R.reduce((s,r)=>s+r.newToHistory,0), c=cpu(t);
  return {n:R.length, V, cpu:c, Rate:c>0?V/(c/3600):0, C:collapse, alive:R.length?R.reduce((s,r)=>s+r.meanAlive,0)/R.length:0,
    pulls:G.reduce((s,g)=>s+(g.pull|0),0), unprov:G.reduce((s,g)=>s+(g.unprovisioned|0),0),
    early:R.slice(0,6).reduce((s,r)=>s+r.newToHistory,0), late:R.slice(18,24).reduce((s,r)=>s+r.newToHistory,0), full:R.length?(R[R.length-1].full|0):0, slots:R.length?(R[R.length-1].slots|0):0, szLate:R.length?R[R.length-1].meanSz:0}; }
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const P=[], out=[], missing=[];
for(const s of SEEDS){ const a=s+'_IN4', b=s+'_IN5'; if(!done(a)||!done(b)){ missing.push(s); continue; }
  const o=m(a), c=m(b); if(o.n!==NWIN||c.n!==NWIN){ missing.push(s+'(windows)'); continue; } P.push({s,o,c});
  out.push(s+(c.full===0?' ok     ':' FULL   ')+' IN4 V '+o.V+' cpu '+(o.cpu/60).toFixed(1)+'m R '+Math.round(o.Rate)+' alive '+o.alive.toFixed(0)+(o.C?' C@'+o.C:'')+
    ' late/early '+(o.late/Math.max(1,o.early)).toFixed(2)+'  |  IN5 V '+c.V+' cpu '+(c.cpu/60).toFixed(1)+'m R '+Math.round(c.Rate)+' alive '+c.alive.toFixed(0)+(c.C?' C@'+c.C:'')+' late/early '+(c.late/Math.max(1,c.early)).toFixed(2)+' slots '+c.slots+'  R ratio '+(c.Rate/Math.max(1e-9,o.Rate)).toFixed(2)+'  V ratio '+(Math.max(1,c.V)/Math.max(1,o.V)).toFixed(2)); }
console.log(out.join('\n')); if(missing.length) console.log('INCOMPLETE: '+missing.join(' '));
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
const bad=P.filter(p=>p.c.full>0).map(p=>p.s);
const W=wilcoxon(P.map(p=>Math.log(Math.max(1e-9,p.c.Rate)/Math.max(1e-9,p.o.Rate)))), Wv=wilcoxon(P.map(p=>Math.log(Math.max(1,p.c.V)/Math.max(1,p.o.V))));
const vmed=med(P.map(p=>Math.max(1,p.c.V)/Math.max(1,p.o.V))), guard=vmed>=0.5;
console.log('\ncomplete pairs: '+P.length+'; IN5 worlds that refused for a full table: '+(bad.length?bad.join(' '):'none'));
console.log('primary Wilcoxon on log(R_in5/R_in4) (per CPU-hour): n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(in5 greater) '+W.pGreater.toFixed(4)+', p(in5 less) '+W.pLess.toFixed(4)+'; in5 ahead in '+P.filter(p=>p.c.Rate>p.o.Rate).length+' of '+P.length+'; median R ratio '+med(P.map(p=>p.c.Rate/Math.max(1e-9,p.o.Rate))).toFixed(2));
console.log('reported: per tick (V): p(greater) '+Wv.pGreater.toFixed(4)+', p(less) '+Wv.pLess.toFixed(4)+'; collapses IN4 '+P.filter(p=>p.o.C).length+', IN5 '+P.filter(p=>p.c.C).length);
console.log('reported: late/early (windows 19-24 over 1-6): median IN4 '+med(P.map(p=>p.o.late/Math.max(1,p.o.early))).toFixed(2)+', IN5 '+med(P.map(p=>p.c.late/Math.max(1,p.c.early))).toFixed(2)+'; IN5 higher in '+P.filter(p=>p.c.late/Math.max(1,p.c.early)>p.o.late/Math.max(1,p.o.early)).length+' of '+P.length);
console.log('guard (median V_in5/V_in4 >= 0.5): '+vmed.toFixed(2)+' '+(guard?'holds':'FAILS'));
for(let s=11601;s<=11603;s++){ const t=s+'_IN5SHUF'; if(!done(t)) continue; const x=m(t), p=P.find(q=>q.s===String(s)); console.log('shuffle (reported): '+s+' IN5+SHUFFLE V '+x.V+(p?' against IN5 V '+p.c.V:'')); }
console.log('VERDICT: '+(missing.length?'INCOMPLETE':bad.length>2?'INCONCLUSIVE (more than 2 IN5 worlds refused for a full table)':P.length<MIN?'INCONCLUSIVE (fewer than '+MIN+' complete pairs)':W.pGreater<0.05?(guard?'BETTER: TASK_IN 5 becomes the TASKS default IF the field check passes':'BETTER but the guard fails: not shipped'):W.pLess<0.05?'WORSE: delete TASK_IN':'neither: no default moves'));
