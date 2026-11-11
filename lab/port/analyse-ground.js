// #397 - PREREG-ground.md's rule, applied to lab/port/out-ground. Written before the decision runs.
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'out-ground');
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
const load=f=>{ try{ return fs.readFileSync(path.join(D,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined); }catch(e){ return []; } };
const at=(L,t)=>{ const r=L.find(x=>x.t===t); return r?r.F:null; };
const D25=[], R={300:[],600:[],900:[],1500:[]}; const missing=[];
for(let i=1;i<=8;i++){ const a=load('p'+i+'-today.jsonl'), b=load('p'+i+'-ground.jsonl'); const fa=a[a.length-1], fb=b[b.length-1];
  if(!fs.existsSync(path.join(D,'p'+i+'.done'))||!fa||!fb||!fa.final||!fb.final||fa.bad||fb.bad){ missing.push(i); continue; }
  for(const t of [300,600,900]){ const x=at(a,t), y=at(b,t); if(x&&y)R[t].push(y/x); } R[1500].push(fb.F/fa.F); D25.push(Math.log(fb.F/fa.F));
  console.log('pair '+i+'  today F '+fa.F+' K '+fa.K+' A '+fa.A+' read '+Math.max(...a.map(r=>r.read))+'s M '+fa.M+'  |  ground F '+fb.F+' K '+fb.K+' A '+fb.A+' read '+Math.max(...b.map(r=>r.read))+'s M '+fb.M+'  ratio '+(fb.F/fa.F).toFixed(2)+
    '  (5/10/15 min: '+[300,600,900].map(t=>{ const x=at(a,t), y=at(b,t); return x&&y?(y/x).toFixed(2):'-'; }).join(' / ')+')'); }
if(missing.length)console.log('INCOMPLETE or not counted: pairs '+missing.join(' '));
const w=wilcoxon(D25); console.log('complete pairs '+D25.length+' (floor 6); F at 1,500 s: W+ '+w.Wp+' of '+w.max+', p(ground greater) '+w.pGreater.toFixed(4)+', p(ground less) '+w.pLess.toFixed(4)+'; ground ahead in '+D25.filter(x=>x>0).length+' of '+D25.length+'; median ratio '+med(R[1500]).toFixed(2));
console.log('median ratio at 5, 10, 15 min: '+[300,600,900].map(t=>med(R[t]).toFixed(2)).join(', '));
console.log('verdict: '+(D25.length<6?'INCONCLUSIVE (floor)':w.pGreater<=0.05?'BETTER':w.pLess<=0.05?'WORSE':'no difference'));
{ const a=load('ps-ground.jsonl'), b=load('ps-shuffle.jsonl'); const fa=a[a.length-1], fb=b[b.length-1];
  if(fa&&fb&&fa.final&&fb.final) console.log('control: ground F '+fa.F+', ground + shuffle F '+fb.F+' ('+(fb.F/fa.F).toFixed(3)+' of its twin) -> '+(fb.F<0.5*fa.F?'selected':'NOT selected'));
  else console.log('control: not complete'); }
