// #398 - PREREG-ground-memory.md's rule over lab/port/out-ground-control (tags p1-p6). Written before the decision runs.
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-ground-control');
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; } return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
const load=f=>{ try{ return fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined); }catch(e){ return []; } };
const at=(L,t)=>{ const r=L.find(x=>x.t===t); return r?r.F:null; }; const T=[300,600,900,1200]; const R={}, Dl=[], RR=[]; for(const t of T)R[t]=[]; const miss=[];
for(let i=1;i<=6;i++){ const a=load('p'+i+'-ground.jsonl'), b=load('p'+i+'-mode2.jsonl'), fa=a[a.length-1], fb=b[b.length-1];
  if(!fs.existsSync(path.join(D,'p'+i+'.done'))||!fa||!fb||!fa.final||!fb.final||fa.bad||fb.bad){ miss.push(i); continue; }
  for(const t of T){ const x=at(a,t), y=at(b,t); if(x&&y)R[t].push(x/y); } Dl.push(Math.log(fa.F/fb.F)); RR.push(fa.F/fb.F);
  console.log('pair '+i+'  remember F '+fa.F+' K '+fa.K+' A '+fa.A+'  |  forget F '+fb.F+' K '+fb.K+' A '+fb.A+'  ratio '+(fa.F/fb.F).toFixed(2)+'  (5/10/15/20 min: '+T.map(t=>{ const x=at(a,t), y=at(b,t); return x&&y?(x/y).toFixed(2):'-'; }).join(' / ')+')'); }
if(miss.length)console.log('INCOMPLETE or not counted: pairs '+miss.join(' '));
const w=wilcoxon(Dl); console.log('complete pairs '+Dl.length+' (floor 5); W+ '+w.Wp+' of '+w.max+', p(remember greater) '+w.pGreater.toFixed(4)+', p(remember less) '+w.pLess.toFixed(4)+'; remember ahead in '+Dl.filter(x=>x>0).length+' of '+Dl.length+'; median ratio '+med(RR).toFixed(2));
console.log('median ratio at 5, 10, 15, 20 min: '+T.map(t=>med(R[t]).toFixed(2)).join(', '));
console.log('verdict: '+(Dl.length<5?'INCONCLUSIVE (floor)':w.pGreater<=0.05?'MEMORY':w.pLess<=0.05?'FORGETTING BETTER':'NOT SHOWN'));
