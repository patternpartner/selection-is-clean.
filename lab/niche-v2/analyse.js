// lab/niche-v2/analyse.js - the readout pre-registered in lab/PREREG-niche-v2.md.   node lab/niche-v2/analyse.js [dir]
// Windows of 30 samples (30,000 ticks). USED NOVELTY: a compound is USED in a window when its mean share of the window's
// income (catalysis + opened channel, niche.cUse) is at least 1%, OR the mean share of living organisms carrying its recipe
// (niche.recU) is at least 1%. NEW USED = used for the first time in the run. Primary: Lu = mean new used compounds per
// window over the late half, its OLS trend over the late half. Also the v1 metric (new active reactions, niche.flux, 1%).
'use strict';
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const D=process.argv[2]||path.join(__dirname,'raw'), ARMS=(process.env.ARMS||'V0 V1 V2 V3').split(' '), SEEDS=(process.env.SEEDS||'10 11 12').split(' ').map(Number), WIN=30, MIN=0.01;
const read=f=>{ const t=fs.existsSync(f)?fs.readFileSync(f,'utf8'):fs.existsSync(f+'.gz')?zlib.gunzipSync(fs.readFileSync(f+'.gz')).toString():null; return t&&t.trim().split('\n').map(JSON.parse); };
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=ys.reduce((a,b)=>a+b,0)/n; let sxy=0,sxx=0; ys.forEach((y,i)=>{ sxy+=(i-xm)*(y-ym); sxx+=(i-xm)*(i-xm); }); return sxx?sxy/sxx:0; };
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, res={};
for(const s of SEEDS) for(const a of ARMS){ const rows=read(path.join(D,`${a}.${s}.all.jsonl`)); if(!rows)continue;
  const nW=Math.floor(rows.length/WIN), half=Math.floor(nW/2), everU=new Set(), everR=new Set(), everI=new Set(), pu=[], pr=[], pi=[]; let maxDepthUsed=0;
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map(), fx=new Map(), dep=new Map();
    for(const r of W){ const n=r.niche||{}; for(const [k,v,d] of (n.cUse||[])){ inc.set(k,(inc.get(k)||0)+v/W.length); dep.set(k,d); } for(const [k,v,d] of (n.recU||[])){ car.set(k,(car.get(k)||0)+v/W.length); dep.set(k,d); }
      for(const e of (n.flux||(r.chem?r.chem.flux:[]))) fx.set(e[0],(fx.get(e[0])||0)+e[1]/W.length); }
    const used=new Set([...[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k),...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)]);
    const byInc=[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k);
    const nu=[...used].filter(k=>!everU.has(k)); nu.forEach(k=>everU.add(k)); pu.push(nu.length); if(w>=half) for(const k of used) maxDepthUsed=Math.max(maxDepthUsed,dep.get(k)||0);
    const ni=byInc.filter(k=>!everI.has(k)); ni.forEach(k=>everI.add(k)); pi.push(ni.length);
    const act=[...fx].filter(([k,v])=>v>=MIN).map(([k])=>k), nr=act.filter(k=>!everR.has(k)); nr.forEach(k=>everR.add(k)); pr.push(nr.length); }
  const lr=rows.slice(half*WIN,nW*WIN), lu=pu.slice(half);
  res[a+s]={nW,Lu:mean(lu),tr:ols(lu),Li:mean(pi.slice(half)),Lr:mean(pr.slice(half)),everU:everU.size,everR:everR.size,maxDepthUsed,
    strInc:mean(lr.map(r=>{ const n=r.niche; return n&&n.income?((n.catIncome||0)+(n.openIncome||0)+(n.buildIncome||0))/n.income:0; })),
    openInc:mean(lr.map(r=>{ const n=r.niche; return n&&n.income?(n.openIncome||0)/n.income:0; })), ch:rows.at(-1).niche&&rows.at(-1).niche.channels||0,
    cmp:rows.at(-1).niche?rows.at(-1).niche.compounds:0, cap:rows.reduce((x,r)=>x+((r.niche&&r.niche.capHit)||0),0), N:mean(lr.map(r=>r.N)), inc:mean(lr.map(r=>r.niche?r.niche.income:0)), pu:pu.join(',')}; }
console.log('arm seed | windows | Lu: new USED compounds/window, late half (primary) | OLS trend of Lu, late half | income-only new used/window late | v1 metric: new active reactions/window late | used ever | max depth used late | structure share of late income (opened channels) | channels | compounds | memory-cap hits | N late | income/1k late | new used per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue;
  console.log(`${a} ${s} | ${x.nW} | ${x.Lu.toFixed(2)} | ${x.tr.toFixed(3)} | ${x.Li.toFixed(2)} | ${x.Lr.toFixed(2)} | ${x.everU} | ${x.maxDepthUsed} | ${(100*x.strInc).toFixed(1)}% (${(100*x.openInc).toFixed(1)}%) | ${x.ch} | ${x.cmp} | ${x.cap} | ${x.N.toFixed(0)} | ${x.inc.toFixed(0)} | ${x.pu}`); }
console.log('\nVERDICT (open-ended-ish: on ALL 3 seeds, V1 Lu > 0 AND V1 trend >= 0 AND Lu(V1) > Lu(V0) AND Lu(V1) > Lu(V2)):');
let all=true; for(const s of SEEDS){ const v1=res['V1'+s], v0=res['V0'+s], v2=res['V2'+s]; if(!v1||!v0||!v2){ all=false; console.log(`seed ${s}: missing`); continue; }
  const c=[v1.Lu>0,v1.tr>=0,v1.Lu>v0.Lu,v1.Lu>v2.Lu], ok=c.every(Boolean); all=all&&ok;
  console.log(`seed ${s}: V1 ${v1.Lu.toFixed(2)} (trend ${v1.tr.toFixed(3)}) | V0 ${v0.Lu.toFixed(2)} | V2 ${v2.Lu.toFixed(2)} | V3 ${res['V3'+s]?res['V3'+s].Lu.toFixed(2):'-'} -> ${ok?'passes':'FAILS'} [${['Lu>0','trend>=0','>V0','>V2'].filter((_,i)=>!c[i]).join(', ')}]`); }
console.log(all?'=> OPEN-ENDED-ISH by the rule on 3 of 3 seeds.':'=> NOT SHOWN: the rule fails on at least one seed.');
