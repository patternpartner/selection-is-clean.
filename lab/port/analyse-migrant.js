// #393 - PREREG-migrant.md's rule, applied to lab/port/out-migrant/ (the #392 field analysis with the arms renamed, a manipulation check on M). Written before the decision runs finished.
//   node lab/port/analyse-field.js [dir]
// Pairs: an AMP field and a VIS field run together. F = distinct functions ever paid anywhere in the field (the union of every
// universe's canonical truth tables). Primary: one-sided exact Wilcoxon on log(F_vis/F_amp) at 1,800 s, both directions; the fix ships
// unless WORSE. Manipulation check: VIS accepted more migrants (M) in at least 5 of 6 pairs. Switch check: every universe five-input.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-migrant');
const PAIRS=6, SECS=1800, MIN=5, AT=[300,600,1200,1800];
const SW={amp:{storeDeath:1,crowdK:450,provBirth:0,aim:0}, vis:{storeDeath:1,crowdK:450,provBirth:0,aim:0}};   // both arms are today's shipped economy
const BUILT=/^(u\d+|collective)$/;
function read(i,arm){ const f=path.join(D,'p'+i+'-'+arm+'.jsonl'); if(!fs.existsSync(f)) return null;
  const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const S=L.filter(o=>o.F!==undefined), fin=S.find(o=>o.final), fatal=L.find(o=>o.fatal), pe=L.find(o=>o.pageErrors);
  const swOk=S.length>0&&S.every(o=>o.sw&&Object.keys(SW[arm]).every(k=>o.sw[k]===SW[arm][k])&&o.n5===o.U);   // in5 itself is checked from the jsonl's per-universe reports below
  const at=t=>{ let r=null; for(const o of S) if(o.t<=t+5) r=o; return r; };
  let save5=null; for(const o of S){ const b=(o.slots||[]).filter(s=>BUILT.test(s[0])&&s[1]>=1800).length; if(b>=5){ save5=o.t; break; } }
  return {S, fin, fatal, pe, swOk, complete:!!fin&&fin.t>=SECS&&!fatal&&!pe&&(fin.errs|0)===0, at, save5}; }
function wilcoxon(diffs){ const d=diffs.filter(x=>x!==0); const n=d.length; if(!n) return {n:0,Wp:0,max:0,pGreater:1,pLess:1};
  const a=d.map((x,i)=>({x,abs:Math.abs(x),i})).sort((p,q)=>p.abs-q.abs); const rank=new Array(n);
  for(let i=0;i<n;){ let j=i; while(j+1<n&&a[j+1].abs===a[i].abs)j++; const r=(i+j+2)/2; for(let k=i;k<=j;k++)rank[a[k].i]=r; i=j+1; }
  const R2=rank.map(r=>Math.round(r*2)); const Wp2=d.reduce((s,x,i)=>s+(x>0?R2[i]:0),0), tot=R2.reduce((s,r)=>s+r,0);
  let dist=new Map([[0,1]]); for(const r of R2){ const nd=new Map(dist); for(const [k,v] of dist) nd.set(k+r,(nd.get(k+r)||0)+v); dist=nd; }
  const all=2**n; let ge=0, le=0; for(const [k,v] of dist){ if(k>=Wp2)ge+=v; if(k<=Wp2)le+=v; }
  return {n, Wp:Wp2/2, max:tot/2, pGreater:ge/all, pLess:le/all}; }
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?(b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2):0; };
const P=[], missing=[], badSw=[];
for(let i=1;i<=PAIRS;i++){ const o=read(i,'amp'), c=read(i,'vis');
  if(!o||!c||!fs.existsSync(path.join(D,'p'+i+'.done'))){ missing.push('p'+i); continue; }
  if(!o.swOk) badSw.push('p'+i+'-amp'); if(!c.swOk) badSw.push('p'+i+'-vis');
  if(!o.complete||!c.complete){ missing.push('p'+i+'(incomplete)'); continue; }
  P.push({i,o,c});
  const fmt=(x,t)=>{ const r=x.at(t); return r?r.F:'-'; };
  console.log('p'+i+'  F at '+AT.join('/')+' s:  AMP '+AT.map(t=>fmt(o,t)).join('/')+'  VIS '+AT.map(t=>fmt(c,t)).join('/')+
    '  ratio '+(c.fin.F/Math.max(1,o.fin.F)).toFixed(2)+'  |  migrants '+o.fin.M+' / '+c.fin.M+'  S '+o.fin.S+' / '+c.fin.S+'  ticks '+o.fin.K+' / '+c.fin.K+
    '  alive '+o.fin.A+' / '+c.fin.A+'  universes '+o.fin.U+' / '+c.fin.U+'  5 of 9 built saved at '+(o.save5||'never')+' / '+(c.save5||'never')+' s  longest read '+Math.max(...o.S.map(x=>x.read|0))+' / '+Math.max(...c.S.map(x=>x.read|0))+' s  missed at final '+o.fin.bad+' / '+c.fin.bad); }
if(missing.length) console.log('INCOMPLETE: '+missing.join(' '));
// AMENDMENT (before pairs 4-6): M was netStats.accepted, every heritable packet type, not migrants. The check is now MA (the engine's
// network.migrantAccepted) on the pairs that carry it, and requires all of them; pairs 1-3 carry none.
const PM=P.filter(p=>p.c.fin.MA!==undefined&&p.o.fin.MA!==undefined), manip=PM.filter(p=>(p.c.fin.MA|0)>(p.o.fin.MA|0)).length, manipOk=PM.length>=3&&manip===PM.length;
console.log('manipulation check (accepted MIGRANTS, pairs with the counter): VIS more than AMP in '+manip+' of '+PM.length+(manipOk?' (holds)':' (FAILS)')+'  ['+PM.map(p=>'p'+p.i+' '+p.o.fin.MA+'/'+p.c.fin.MA).join(', ')+']');
console.log('reported, all heritable packets accepted (the first, wrong instrument): '+P.map(p=>'p'+p.i+' '+p.o.fin.M+'/'+p.c.fin.M).join(', '));
const W=wilcoxon(P.map(p=>Math.log(Math.max(1,p.c.fin.F)/Math.max(1,p.o.fin.F))));
console.log('\ncomplete pairs: '+P.length+'; runs failing the switch check: '+(badSw.length?badSw.join(' '):'none'));
console.log('primary Wilcoxon on log(F_vis/F_amp) at '+SECS+' s: n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(vis greater) '+W.pGreater.toFixed(4)+
  ', p(vis less) '+W.pLess.toFixed(4)+'; vis ahead in '+P.filter(p=>p.c.fin.F>p.o.fin.F).length+' of '+P.length+'; median ratio '+med(P.map(p=>p.c.fin.F/Math.max(1,p.o.fin.F))).toFixed(2));
for(const t of AT.slice(0,3)){ const r=P.map(p=>{ const a=p.o.at(t), b=p.c.at(t); return a&&b?b.F/Math.max(1,a.F):null; }).filter(x=>x!==null);
  console.log('reported: median F ratio at '+t+' s: '+med(r).toFixed(2)+' ('+r.length+' pairs)'); }
console.log('reported: median time for 5 of the built nine to pass tick 1,800: AMP '+med(P.map(p=>p.o.save5||9999))+' s, VIS '+med(P.map(p=>p.c.save5||9999))+' s');
console.log('VERDICT: '+(missing.length&&P.length<PAIRS?'INCOMPLETE ('+P.length+' complete)':'')+' '+(badSw.length?'INCONCLUSIVE (switch check failed)':P.length<MIN?'INCONCLUSIVE (fewer than '+MIN+' complete pairs)':
  !manipOk?'INCONCLUSIVE (manipulation check failed): held':W.pLess<0.05?'WORSE: the fix is held':W.pGreater<0.05?'BETTER: the fix ships':'NOT WORSE: the fix ships'));
