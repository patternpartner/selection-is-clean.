// lab/niche/analyse.js - the readout pre-registered in lab/PREREG-niche.md.
//   node lab/niche/analyse.js [dir]    (reads N<k>.<seed>.all.jsonl or .jsonl.gz)
// A reaction is ACTIVE in a 30,000-tick window (WIN=30 samples) when its mean share of the window's income is at least 1%
// (#287's rule). Income = METAB + structure building + catalysis (niche.flux); N0 has no structures, so its chem.flux is used.
// NEW = active for the first time in that run. Keys: 0-1023 METAB (species*4+j); 1024+ founding a structure from (a,b);
// 70000+ extending structure B with a; 2000000+ a catalysed transformation a->t (only compounds, NICHE 2 and 3).
'use strict';
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const D=process.argv[2]||path.join(__dirname,'raw'), ARMS=['N0','N1','N2','N3'], SEEDS=(process.env.SEEDS||'7 8 9').split(' ').map(Number), WIN=30, MIN=0.01;
const read=f=>{ const t=fs.existsSync(f)?fs.readFileSync(f,'utf8'):fs.existsSync(f+'.gz')?zlib.gunzipSync(fs.readFileSync(f+'.gz')).toString():null; return t&&t.trim().split('\n').map(JSON.parse); };
const kind=k=>k<1024?'metab':k<70000?'found':k<2000000?'extend':'catal';
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=ys.reduce((a,b)=>a+b,0)/n; let sxy=0,sxx=0; ys.forEach((y,i)=>{ sxy+=(i-xm)*(y-ym); sxx+=(i-xm)*(i-xm); }); return sxx?sxy/sxx:0; };
const res={};
for(const s of SEEDS) for(const a of ARMS){ const rows=read(path.join(D,`${a}.${s}.all.jsonl`)); if(!rows)continue;
  const ever=new Set(), per=[], perK=[], lateNewKinds={metab:0,found:0,extend:0,catal:0};
  const nW=Math.floor(rows.length/WIN), half=Math.floor(nW/2);
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), m=new Map();
    for(const r of W){ const fl=r.niche?r.niche.flux:(r.chem?r.chem.flux:[]); for(const e of fl) m.set(e[0],(m.get(e[0])||0)+e[1]/W.length); }
    const act=[...m.entries()].filter(([k,v])=>v>=MIN).map(([k])=>k), nw=act.filter(k=>!ever.has(k)); for(const k of act)ever.add(k); per.push(nw.length);
    if(w>=half) for(const k of nw) lateNewKinds[kind(k)]++; }
  const late=per.slice(half), L=late.reduce((x,y)=>x+y,0)/late.length;
  const q=Math.floor(nW/4), cum=i=>per.slice(0,i).reduce((x,y)=>x+y,0), q2=cum(2*q)-cum(q), q4=cum(4*q)-cum(3*q);
  const lr=rows.slice(half*WIN, nW*WIN), mean=f=>lr.length?lr.reduce((x,r)=>x+f(r),0)/lr.length:0;
  const strInc=mean(r=>r.niche&&r.niche.income?(r.niche.buildIncome+r.niche.catIncome)/r.niche.income:0);
  const cu=new Map(); for(const r of lr) for(const [k,v,d] of ((r.niche&&r.niche.cUse)||[])){ const o=cu.get(k)||{v:0,d}; o.v+=v/lr.length; cu.set(k,o); }
  const usedC=[...cu.entries()].filter(([k,o])=>o.v>=MIN);
  res[a+s]={a,s,nW,L,slope:ols(late),q2,q4,ever:ever.size,lateNewKinds,strInc,
    bC:mean(r=>r.niche?r.niche.buildCarriers:r.opShare[29]), cC:mean(r=>r.niche?r.niche.catalCarriers:r.opShare[30]),
    usedC:usedC.length, usedDepth:usedC.length?Math.max(...usedC.map(([k,o])=>o.d)):0, compounds:rows.at(-1).niche?rows.at(-1).niche.compounds:0,
    cells:mean(r=>r.niche?r.niche.cells:0), N:mean(r=>r.N), reseeds:rows.at(-1).reseeds||0, per:per.join(',')}; }
console.log('arm seed | windows | L: new active reactions per window, late half (primary) | OLS trend of new/window, late half | Q2 -> Q4 new | ever active | late new by kind metab/found/extend/catal | structure share of late income | BUILD / CATAL carriers late | compounds with >=1% of income late (max depth) | compounds ever | structured cells late | N late | new per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue; const k=x.lateNewKinds;
  console.log(`${a} ${s} | ${x.nW} | ${x.L.toFixed(2)} | ${x.slope.toFixed(3)} | ${x.q2} -> ${x.q4} | ${x.ever} | ${k.metab}/${k.found}/${k.extend}/${k.catal} | ${(100*x.strInc).toFixed(2)}% | ${x.bC.toFixed(3)} / ${x.cC.toFixed(3)} | ${x.usedC} (d${x.usedDepth}) | ${x.compounds} | ${x.cells.toFixed(0)} | ${x.N.toFixed(0)} | ${x.per}`); }
console.log('\nVERDICT (open-ended-ish: on ALL 3 seeds, N2 late L > 0 AND L(N2) > L(N1) AND L(N2) > L(N3)):');
let all=true; for(const s of SEEDS){ const n2=res['N2'+s], n1=res['N1'+s], n3=res['N3'+s]; if(!n2||!n1||!n3){ all=false; console.log(`seed ${s}: missing`); continue; }
  const ok=n2.L>0&&n2.L>n1.L&&n2.L>n3.L; all=all&&ok;
  console.log(`seed ${s}: N2 ${n2.L.toFixed(2)} | N1 ${n1.L.toFixed(2)} | N3 ${n3.L.toFixed(2)} | N0 ${res['N0'+s]?res['N0'+s].L.toFixed(2):'-'} -> ${ok?'passes':'FAILS'} (${n2.L>0?'':'N2 not > 0; '}${n2.L>n1.L?'':'N2 not > N1; '}${n2.L>n3.L?'':'N2 not > N3'})`); }
console.log(all?'=> OPEN-ENDED-ISH by the rule: N2 keeps adding new active reactions late, beyond both controls, on 3 of 3 seeds.':'=> NOT SHOWN: the rule fails on at least one seed.');
