// #394 - PREREG-germ.md's rule, applied to lab/port/out-germ (primary) and lab/port/out-germ-guard (guard). Written before the decision runs finished.
const fs=require('fs'), path=require('path'); const P=path.join(__dirname,'out-germ'), G=path.join(__dirname,'out-germ-guard');
const rows=(d,f)=>fs.readFileSync(path.join(d,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.fnPaid!==undefined);
const ok=(d,t)=>fs.existsSync(path.join(d,t+'.done'));
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
console.log('PRIMARY: what a harvest finds in 2,000 ticks');
const D=[], ratios=[]; let missing=[];
for(let s=12101;s<=12112;s++){ if(!ok(P,s+'_AMP')||!ok(P,s+'_VIS')||!ok(P,s+'.save')){ missing.push(s); continue; }
  const sv=JSON.parse(fs.readFileSync(path.join(P,s+'.save.json'),'utf8')); const differ=fs.readFileSync(path.join(P,s+'_AMP.genome'),'utf8')!==fs.readFileSync(path.join(P,s+'_VIS.genome'),'utf8');
  const A=rows(P,s+'_AMP.jsonl'), V=rows(P,s+'_VIS.jsonl'); const va=A.reduce((x,r)=>x+r.newToHistory,0), vv=V.reduce((x,r)=>x+r.newToHistory,0);
  const counted=!sv.samePick&&differ&&A.length===8&&V.length===8;
  console.log(s+' T '+sv.tick+(counted?' counted ':' NOT COUNTED ')+' amp-pick V '+va+' (payments '+sv.ampBest.payments+', store '+sv.ampBest.store+')  store-pick V '+vv+' (payments '+sv.storeBest.payments+', store '+sv.storeBest.store+')  ratio '+(vv/Math.max(1,va)).toFixed(2)+'  adopted own program: amp '+sv.ampGermIsAmpBest+' store '+sv.storeGermIsStoreBest+'  end alive '+A[A.length-1].alive+'/'+V[V.length-1].alive);
  if(counted){ D.push(Math.log(Math.max(1,vv)/Math.max(1,va))); ratios.push(vv/Math.max(1,va)); } }
if(missing.length)console.log('INCOMPLETE: '+missing.join(' '));
const w=wilcoxon(D); console.log('counted '+D.length+' (floor 9); Wilcoxon W+ '+w.Wp+' of '+w.max+', p(store greater) '+w.pGreater.toFixed(4)+', p(store less) '+w.pLess.toFixed(4)+'; store ahead in '+D.filter(x=>x>0).length+' of '+D.length+'; median ratio '+med(ratios).toFixed(2));
console.log('primary: '+(D.length<9?'INCONCLUSIVE (floor)':w.pGreater<=0.05?'BETTER':w.pLess<=0.05?'WORSE':'no difference'));
if(!fs.existsSync(G)) process.exit(0);
console.log('\nGUARD: the running world, new functions per CPU-hour');
function cpu(t){ const s=fs.readFileSync(path.join(G,t+'.time'),'utf8'); let tot=0; for(const k of ['user','sys']){ const m=s.match(new RegExp(k+'\\s+(\\d+)m([\\d.]+)s')); if(m)tot+=(+m[1])*60+(+m[2]); } return tot; }
function gm(t){ const R=rows(G,t+'.jsonl'); let peak=0, reached=false, C=null; for(let i=0;i<R.length;i++){ if(R[i].alive>=300)reached=true; if(reached&&i>0&&R[i].alive<0.25*peak&&R[i-1].alive<0.25*peak&&C===null)C=R[i].tick; peak=Math.max(peak,i>0?R[i-1].alive:0); }
  const V=R.reduce((x,r)=>x+r.newToHistory,0), c=cpu(t); return {V,c,R:V/(c/3600),C,n:R.length,alive:Math.round(R.reduce((x,r)=>x+r.meanAlive,0)/R.length)}; }
const GD=[], gr=[]; let c0=0,c1=0; missing=[];
for(let s=12113;s<=12120;s++){ if(!ok(G,s+'_G0')||!ok(G,s+'_G1')){ missing.push(s); continue; } const a=gm(s+'_G0'), b=gm(s+'_G1'); if(a.C)c0++; if(b.C)c1++;
  console.log(s+' amp V '+a.V+' cpu '+(a.c/60).toFixed(1)+'m R '+Math.round(a.R)+' alive '+a.alive+(a.C?' C@'+a.C:'')+'  |  store V '+b.V+' cpu '+(b.c/60).toFixed(1)+'m R '+Math.round(b.R)+' alive '+b.alive+(b.C?' C@'+b.C:'')+'  ratio '+(b.R/a.R).toFixed(2));
  GD.push(Math.log(b.R/a.R)); gr.push(b.R/a.R); }
if(missing.length)console.log('INCOMPLETE: '+missing.join(' '));
const g=wilcoxon(GD); console.log('pairs '+GD.length+'; Wilcoxon W+ '+g.Wp+' of '+g.max+', p(store less) '+g.pLess.toFixed(4)+', p(store greater) '+g.pGreater.toFixed(4)+'; median ratio '+med(gr).toFixed(2)+'; collapses amp '+c0+', store '+c1);
console.log('guard: '+((g.pLess<=0.05||c1-c0>=3)?'WORSE':'not worse'));
