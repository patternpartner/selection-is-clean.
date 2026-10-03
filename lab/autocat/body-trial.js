// lab/autocat/body-trial.js - Phase A3 readout (TRIAL seeds only). Used novelty for BODY catalysts, by the same rule as the
// compound measure: a catalyst (key q*256+t) is USED in a window when its mean share of chemical income (base METAB + body) is
// >= 1% OR it is carried by >= 1% of organisms. Lu = mean NEW used catalysts per window over the late half; OLS trend.
// Body income share (criterion) = body / (base METAB + body + light taken directly), late half; also reported vs chem only.
//   DIR=/tmp/hb/B1 ARMS='FULL NOINH RANDCAP SHUF FIXED BASE' SEEDS='70 71 72' WIN=10 [JSON=out.json] node lab/autocat/body-trial.js
'use strict'; const fs=require('fs'), path=require('path'), E=process.env;
const D=E.DIR, ARMS=(E.ARMS||'FULL NOINH RANDCAP SHUF FIXED BASE').split(' '), SEEDS=(E.SEEDS||'70 71 72').split(' '), WIN=+(E.WIN||10), MIN=0.01;
const read=f=>{ if(!fs.existsSync(f))return null; const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(x=>x.startsWith('{')); return L.length?L.map(JSON.parse):null; };
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=ys.reduce((a,b)=>a+b,0)/n; let sxy=0,sxx=0; ys.forEach((y,i)=>{ sxy+=(i-xm)*(y-ym); sxx+=(i-xm)*(i-xm); }); return sxx?sxy/sxx:0; };
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, sum=a=>a.reduce((x,y)=>x+y,0), res={};
for(const s of SEEDS) for(const a of ARMS){ const rows=read(path.join(D,`${a}-${s}.jsonl`)); if(!rows)continue;
  const nW=Math.floor(rows.length/WIN), half=Math.floor(nW/2), ever=new Set(), pu=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (b.bC||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    const used=new Set([...[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k),...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)]);
    const nu=[...used].filter(k=>!ever.has(k)); nu.forEach(k=>ever.add(k)); pu.push(nu.length); }
  const lr=rows.slice(half*WIN,nW*WIN), g=k=>sum(lr.map(r=>(r.body&&r.body[k])||0)), inc=g('inc'), met=g('metab'), li=g('light');
  res[a+s]={t:rows.at(-1).t,nW,Lu:mean(pu.slice(half)),tr:ols(pu.slice(half)),ever:ever.size,share:inc/((inc+met+li)||1),shareChem:inc/((inc+met)||1),
    size:mean(lr.map(r=>(r.body&&r.body.size)||0)),kinds:mean(lr.map(r=>(r.body&&r.body.kinds)||0)),N:mean(lr.map(r=>r.N)),Nmin:Math.min(...rows.map(r=>r.N)),reseeds:rows.at(-1).reseeds||0,wall:rows.at(-1).wallS,pu:pu.join(',')}; }
if(E.JSON)fs.writeFileSync(E.JSON,JSON.stringify(res));
console.log('arm seed | ticks | windows | Lu late (new used body catalysts/window) | trend | used ever | body share of ALL late income (incl. direct light) | body share of chemical income | mean body size late | catalyst kinds late | N late | N min | reseeds | wall s | new used per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue; console.log(`${a} ${s} | ${x.t} | ${x.nW} | ${x.Lu.toFixed(2)} | ${x.tr.toFixed(3)} | ${x.ever} | ${(100*x.share).toFixed(1)}% | ${(100*x.shareChem).toFixed(1)}% | ${x.size.toFixed(2)} | ${x.kinds.toFixed(0)} | ${x.N.toFixed(0)} | ${x.Nmin} | ${x.reseeds} | ${x.wall} | ${x.pu}`); }
