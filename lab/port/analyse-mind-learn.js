// #431 - PREREG-mind-learn.md rule over lab/port/out-mind (tags p1-p6): #427's analysis with its arms renamed. Written and committed before the decision runs.
//   node lab/port/analyse-mind-learn.js [dir]
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-mind');
const PAIRS=6, FLOOR=5, SECS=1500, T=[300,600,900,1200];
const SW={ship:{storeDeath:1,crowdK:100,provBirth:0,aim:0,mindMode:'learn'}, off:{storeDeath:1,crowdK:100,provBirth:0,aim:0,mindMode:'uniform'}};   // ship = LEARN, off = DRAW
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; } return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
function load(tag,arm){ const f=path.join(D,tag+'-'+(arm==='ship'?'learn':'draw')+'.jsonl'); if(!fs.existsSync(f)) return null;
  const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.F!==undefined); if(!L.length) return null;
  const z=L[L.length-1], swOk=L.every(r=>r.sw&&Object.keys(SW[arm]).every(k=>r.sw[k]===SW[arm][k]));
  let g17=0; for(const r of L) if(r.D&&r.D.n) g17+=r.D.ge17|0;
  const last=L.filter(r=>r.t>SECS-300&&r.D&&r.D.n); const ln=last.reduce((s,r)=>s+r.D.n,0), lm=ln?last.reduce((s,r)=>s+r.D.mean*r.D.n,0)/ln:0;
  const at=t=>{ const r=L.find(x=>x.t===t); return r?r.F:null; };
  const low=(z.slots||[]).filter(s=>(s[2]|0)<20).length;
  return {L, z, swOk, g17, depthLast:lm, at, low, complete:z.t>=SECS&&!!z.final&&!(z.bad|0)}; }
const P=[], miss=[], badSw=[];
for(let i=1;i<=PAIRS;i++){ const tag='p'+i, s=load(tag,'ship'), k=load(tag,'off');
  if(!s||!k||!fs.existsSync(path.join(D,tag+'.done'))){ miss.push(tag); continue; }
  if(!s.swOk) badSw.push(tag+'-ship'); if(!k.swOk) badSw.push(tag+'-off');
  if(!s.complete||!k.complete){ miss.push(tag+'(incomplete)'); continue; }
  P.push({i,s,k});
  console.log(tag+'  F  learn '+s.z.F+'  draw '+k.z.F+'  ratio '+(k.z.F/s.z.F).toFixed(2)+'  (5/10/15/20 min: '+T.map(t=>{ const a=s.at(t), b=k.at(t); return a&&b?(b/a).toFixed(2):'-'; }).join(' / ')+')'+
    '  |  size 17+ '+s.g17+' / '+k.g17+'  depth last 5 min '+s.depthLast.toFixed(2)+' / '+k.depthLast.toFixed(2)+
    '  |  ticks '+s.z.K+' / '+k.z.K+'  alive '+s.z.A+' / '+k.z.A+'  universes under 20 '+s.low+' / '+k.low+'  of '+s.z.U+' / '+k.z.U); }
if(miss.length) console.log('INCOMPLETE or not counted: '+miss.join(' '));
const W=wilcoxon(P.map(p=>Math.log(p.k.z.F/p.s.z.F)));
const mF=med(P.map(p=>p.k.z.F/p.s.z.F)), mD=med(P.map(p=>Math.max(1,p.k.g17)/Math.max(1,p.s.g17)));
console.log('\ncomplete pairs '+P.length+' (floor '+FLOOR+'); runs failing the switch check: '+(badSw.length?badSw.join(' '):'none'));
console.log('primary Wilcoxon on log(F_draw/F_learn) at '+SECS+' s: n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(draw greater) '+W.pGreater.toFixed(4)+', p(draw less) '+W.pLess.toFixed(4)+
  '; draw ahead in '+P.filter(p=>p.k.z.F>p.s.z.F).length+' of '+P.length);
console.log('guards: median F ratio '+mF.toFixed(3)+' (needs >= 0.95), median size 17+ ratio '+mD.toFixed(3)+' (needs >= 0.90)');
console.log('reported: median F ratio at 5, 10, 15, 20 min: '+T.map(t=>med(P.map(p=>{ const a=p.s.at(t), b=p.k.at(t); return a&&b?b/a:null; }).filter(x=>x!==null)).toFixed(2)).join(', '));
console.log('reported: median ticks ratio '+med(P.map(p=>p.k.z.K/p.s.z.K)).toFixed(2)+', median alive ratio '+med(P.map(p=>p.k.z.A/p.s.z.A)).toFixed(2)+
  ', universes under 20 creatures at the end, summed: learn '+P.reduce((x,p)=>x+p.s.low,0)+', draw '+P.reduce((x,p)=>x+p.k.low,0));
console.log('VERDICT: '+(badSw.length?'INCONCLUSIVE (switch check failed)':P.length<FLOOR?'INCONCLUSIVE (fewer than '+FLOOR+' complete pairs)':
  W.pLess<0.05?'WORSE: the field misses the learning; the mind earns its place AS A LEARNER and stays as it is':(mF>=0.95&&mD>=0.90)?('NOT WORSE, guards hold'+(W.pGreater<0.05?' (and BETTER)':'')+': the learning goes DORMANT under TASKS (the drawn writes become the default)'):'INCONCLUSIVE (a guard fails): the learning stays'));
