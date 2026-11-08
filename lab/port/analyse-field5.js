// #392 field check - PREREG-in5.md's field rule, applied to lab/port/out-field5/ (the #383 analysis with the arms renamed). Written before the decision runs finished.
//   node lab/port/analyse-field.js [dir]
// Pairs: an IN4 field and an IN5 field run together. F = distinct functions ever paid anywhere in the field (the union of every
// universe's lifetime record: function indices at four inputs, canonical truth tables at five). Primary: one-sided exact Wilcoxon
// signed-rank on log(F_in5/F_in4) at 1,800 s, both directions. Switch check: every IN5 sample has all universes reporting in5, every IN4 none.
const fs=require('fs'), path=require('path'); const D=process.argv[2]||path.join(__dirname,'out-field5');
const PAIRS=8, SECS=1800, MIN=6, AT=[300,600,1200,1800];
const SW={in4:{storeDeath:1,crowdK:450,provBirth:0,aim:0}, in5:{storeDeath:1,crowdK:450,provBirth:0,aim:0}};   // both arms are today's shipped economy
const BUILT=/^(u\d+|collective)$/;
function read(i,arm){ const f=path.join(D,'p'+i+'-'+arm+'.jsonl'); if(!fs.existsSync(f)) return null;
  const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const S=L.filter(o=>o.F!==undefined), fin=S.find(o=>o.final), fatal=L.find(o=>o.fatal), pe=L.find(o=>o.pageErrors);
  const swOk=S.length>0&&S.every(o=>o.sw&&Object.keys(SW[arm]).every(k=>o.sw[k]===SW[arm][k])&&(arm==='in5'?o.n5===o.U:o.n5===0));   // in5 itself is checked from the jsonl's per-universe reports below
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
for(let i=1;i<=PAIRS;i++){ const o=read(i,'in4'), c=read(i,'in5');
  if(!o||!c||!fs.existsSync(path.join(D,'p'+i+'.done'))){ missing.push('p'+i); continue; }
  if(!o.swOk) badSw.push('p'+i+'-in4'); if(!c.swOk) badSw.push('p'+i+'-in5');
  if(!o.complete||!c.complete){ missing.push('p'+i+'(incomplete)'); continue; }
  P.push({i,o,c});
  const fmt=(x,t)=>{ const r=x.at(t); return r?r.F:'-'; };
  console.log('p'+i+'  F at '+AT.join('/')+' s:  IN4 '+AT.map(t=>fmt(o,t)).join('/')+'  IN5 '+AT.map(t=>fmt(c,t)).join('/')+
    '  ratio '+(c.fin.F/Math.max(1,o.fin.F)).toFixed(2)+'  |  S '+o.fin.S+' / '+c.fin.S+'  ticks '+o.fin.K+' / '+c.fin.K+
    '  alive '+o.fin.A+' / '+c.fin.A+'  universes '+o.fin.U+' / '+c.fin.U+'  5 of 9 built saved at '+(o.save5||'never')+' / '+(c.save5||'never')+' s  longest read '+Math.max(...o.S.map(x=>x.read|0))+' / '+Math.max(...c.S.map(x=>x.read|0))+' s  missed at final '+o.fin.bad+' / '+c.fin.bad); }
if(missing.length) console.log('INCOMPLETE: '+missing.join(' '));
const W=wilcoxon(P.map(p=>Math.log(Math.max(1,p.c.fin.F)/Math.max(1,p.o.fin.F))));
console.log('\ncomplete pairs: '+P.length+'; runs failing the switch check: '+(badSw.length?badSw.join(' '):'none'));
console.log('primary Wilcoxon on log(F_in5/F_in4) at '+SECS+' s: n '+W.n+', W+ '+W.Wp+' of '+W.max+', p(in5 greater) '+W.pGreater.toFixed(4)+
  ', p(in5 less) '+W.pLess.toFixed(4)+'; in5 ahead in '+P.filter(p=>p.c.fin.F>p.o.fin.F).length+' of '+P.length+'; median ratio '+med(P.map(p=>p.c.fin.F/Math.max(1,p.o.fin.F))).toFixed(2));
for(const t of AT.slice(0,3)){ const r=P.map(p=>{ const a=p.o.at(t), b=p.c.at(t); return a&&b?b.F/Math.max(1,a.F):null; }).filter(x=>x!==null);
  console.log('reported: median F ratio at '+t+' s: '+med(r).toFixed(2)+' ('+r.length+' pairs)'); }
console.log('reported: median time for 5 of the built nine to pass tick 1,800: IN4 '+med(P.map(p=>p.o.save5||9999))+' s, IN5 '+med(P.map(p=>p.c.save5||9999))+' s');
console.log('VERDICT: '+(missing.length&&P.length<PAIRS?'INCOMPLETE ('+P.length+' complete)':'')+' '+(badSw.length?'INCONCLUSIVE (switch check failed)':P.length<MIN?'INCONCLUSIVE (fewer than '+MIN+' complete pairs)':
  W.pGreater<0.05?'FIELD CHECK PASSES: TASK_IN 5 ships':W.pLess<0.05?'FIELD CHECK FAILS (IN5 lower): the ship is held':'FIELD CHECK FAILS (no direction): the ship is held'));
