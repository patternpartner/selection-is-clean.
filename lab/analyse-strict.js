// analysis for PREREG-strict.md (#336) and PREREG-strict2.md (#337).  [SEEDS=7201,7202,7203] node lab/analyse-strict.js <dir>   (o1 = STRICT, o2 = CONTROL)
// Joins each world's chunk files in order, then applies #290's activity definition (lab/core-tasks.js: ACTIVE = at least MIN
// of the window's task income and at least MINABS income per sample) over 30,000-tick windows.
'use strict';
const fs=require('fs'); const {SZ,CSZ}=require('./core-tasks.js');
const D=process.argv[2], WIN=30, MIN=0.01, MINABS=100, seeds=(process.env.SEEDS||'7101,7102,7103').split(',').map(Number);
const rowsOf=w=>{ const out=[]; for(let k=0;k<8;k++){ const f=`${D}/${w}.${k}.jsonl`; if(!fs.existsSync(f))break; for(const l of fs.readFileSync(f,'utf8').trim().split('\n')){ try{ out.push(JSON.parse(l)); }catch(e){} } } return out; };
function windows(rows){ const ever=new Set(), per=[]; let hardest=0, hardestC=0, firstAct=-1; const dep=[0,0,0,0], deep=new Map(); const R=rows.filter(r=>r.N>0&&r.tasks);
  for(let w0=0,wi=0;w0+WIN<=R.length;w0+=WIN,wi++){ const W=R.slice(w0,w0+WIN), m=new Map(); let inc=0;
    for(const r of W){ for(const [T,v] of r.tasks.flux) m.set(T,(m.get(T)||0)+v/W.length); inc+=r.tasks.income/W.length; }
    const act=[...m.entries()].filter(([T,v])=>v>=MIN&&v*inc>=MINABS), nw=act.filter(([T])=>!ever.has(T)); for(const [T] of act) ever.add(T);
    const hard=act.length?Math.max(...act.map(([T])=>SZ[T])):0, hardC=act.length?Math.max(...act.map(([T])=>CSZ[T])):0; hardest=Math.max(hardest,hard); hardestC=Math.max(hardestC,hardC);
    for(const r of W) if(r.tasks.depth){ r.tasks.depth.paid.forEach((v,k)=>dep[k]+=v); for(const [T,a,b,c,d] of r.tasks.depth.deep) deep.set(T,(deep.get(T)||0)+c+d); } if(act.length&&firstAct<0) firstAct=wi;
    per.push({active:act.length, newN:nw.length, ever:ever.size, hard, hardC}); }
  return {per, ever:ever.size, hardest, hardestC, firstAct, dep, deep:[...deep.entries()].sort((x,y)=>y[1]-x[1]).slice(0,6).map(([T,n])=>T.toString(16)+' f'+SZ[T]+'/c'+CSZ[T]+' x'+Math.round(n))}; }
const res={};
for(const s of seeds) for(const o of [1,2]){ const w=`${s}_o${o}`, rows=rowsOf(w); const x=windows(rows);
  const half=rows.slice(Math.floor(rows.length/2)); let reads=0, hits=0, refused=0, notRef=0; for(const r of half){ const e=r.ev||{}; reads+=e.reads||0; hits+=e.readHits||0; refused+=e.copyRefused||0; notRef+=e.notRefused||0; }
  res[w]={...x, ticks:rows.length?rows.at(-1).t:0, hitShare:reads?hits/reads:0, refused, notRef, Nlast:rows.length?rows.at(-1).N:0};
  const p=x.per; console.log(`${w}: ticks ${res[w].ticks} windows ${p.length} | ever active ${x.ever} | hardest formula ${x.hardest} circuit ${x.hardestC} | first active window ${x.firstAct} | new/window ${p.map(q=>q.newN).join(',')} | hardest/window ${p.map(q=>q.hard).join(',')} | read hits ${(100*res[w].hitShare).toFixed(2)}% (2nd half), copies refused ${refused} complements refused ${notRef} | N ${res[w].Nlast} | paid by depth 0/1/2/3+ ${x.dep.map(Math.round).join('/')} | depth 2+ top ${x.deep.join(', ')}`);
  console.log(`    circuit hardest per window ${x.per.map(q=>q.hardC).join(',')}`); }
const counted=seeds.filter(s=>{ const L=res[`${s}_o1`], C=res[`${s}_o2`]; return L.ticks>=1200000&&C.ticks>=1200000&&L.hitShare>=0.01; });
console.log(`\ncounted seeds: ${counted.length}/3 (${counted.join(',')})`);
if(counted.length<3){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
// #337 (PREREG-strict2.md): SUSTAINED hardness - the median, over windows 21-40, of each window's hardest active circuit size.
const med=a=>{ const b=[...a].sort((x,y)=>x-y), n=b.length; return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):0; };
const sus=w=>med(res[w].per.slice(20,40).map(q=>q.hardC));
for(const s of seeds) console.log(`#337 ${s}: sustained hardest circuit (median, windows 21-40) STRICT ${sus(`${s}_o1`)} CONTROL ${sus(`${s}_o2`)} | first-half median ${med(res[`${s}_o1`].per.slice(0,20).map(q=>q.hardC))} / ${med(res[`${s}_o2`].per.slice(0,20).map(q=>q.hardC))} | ever active ${res[`${s}_o1`].ever} / ${res[`${s}_o2`].ever}`);
const sA=seeds.filter(s=>sus(`${s}_o1`)>=5&&sus(`${s}_o1`)>=sus(`${s}_o2`)+2).length, sB=seeds.filter(s=>res[`${s}_o1`].ever>res[`${s}_o2`].ever).length;
console.log(`#337 rule A sustained (STRICT >= 5 and >= CONTROL + 2): ${sA}/3 seeds | rule B ever active (STRICT > CONTROL): ${sB}/3 seeds`);
console.log('#337 VERDICT: '+(sA>=2&&sB>=2?'CONFIRMED':sA>=2?'HARDER, NOT BROADER':'NOT CONFIRMED'));
const lastNew=w=>res[w].per.slice(-10).filter(q=>q.newN>0).length, growth=(w,a,b)=>{ const p=res[w].per; return (p[b-1]?p[b-1].ever:0)-(a>0&&p[a-1]?p[a-1].ever:0); };
const exh=s=>res[`${s}_o1`].ever>=200;
const r1=seeds.every(s=>exh(s)||lastNew(`${s}_o1`)>=5)&&(seeds.reduce((a,s)=>a+lastNew(`${s}_o1`),0)>seeds.reduce((a,s)=>a+lastNew(`${s}_o2`),0)||seeds.every(exh));
const r2=seeds.every(s=>exh(s)||growth(`${s}_o1`,30,40)>=0.5*growth(`${s}_o1`,10,20));
const r3=seeds.filter(s=>res[`${s}_o1`].hardestC>=6&&res[`${s}_o1`].hardestC>res[`${s}_o2`].hardestC).length>=2;   // #336: by circuit size
console.log(`rule 1 sustained ${r1} | rule 2 no deceleration ${r2} | rule 3 the wall ${r3}`);
console.log('VERDICT: '+(!r3?'NOT SUPPORTED':(r1&&r2)?'BREAKS THE WALL BY COMPOSITION':'BREAKS THE WALL, THEN PLATEAUS'));
