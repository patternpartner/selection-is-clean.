// lab/skin/analyse.js - the readout pre-registered in lab/PREREG-skin.md.   node lab/skin/analyse.js [dir]
// Built from lab/niche-v3/analyse.js (same used-novelty measure, same builder-dynamics measure), arms S0-S4, seeds 16-18.
// A compound is USED in a window when its mean share of the window's structure income (niche.cUse) is >= 1% OR the mean
// share of organisms carrying its recipe (niche.recU) is >= 1%; compounds are named by composition hash (NICHE_GC).
// Primary: Lu = mean NEW used compounds per window over the late half, and its OLS trend.
// Builder dynamics: ACTIVE builder share (builder bit AND a BUILD op); 'maintained' = mean over the last 3 windows >=
// 0.75 x mean over the first 3 late-half windows AND >= 0.01.
// Skin readouts: share of organisms holding internal stock, inheritance events, own vs leaked catalysis, permeability.
'use strict';
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const D=process.argv[2]||path.join(__dirname,'raw'), ARMS=(process.env.ARMS||'S0 S1 S2 S3 S4').split(' '), SEEDS=(process.env.SEEDS||'16 17 18').split(' ').map(Number), WIN=+(process.env.WIN||15), MIN=0.01;
const BKEEP=0.75, BFLOOR=0.01;
const read=f=>{ const t=fs.existsSync(f)?fs.readFileSync(f,'utf8'):fs.existsSync(f+'.gz')?zlib.gunzipSync(fs.readFileSync(f+'.gz')).toString():null; return t&&t.trim()?t.trim().split('\n').map(JSON.parse):null; };
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=ys.reduce((a,b)=>a+b,0)/n; let sxy=0,sxx=0; ys.forEach((y,i)=>{ sxy+=(i-xm)*(y-ym); sxx+=(i-xm)*(i-xm); }); return sxx?sxy/sxx:0; };
const sum2=(rs,k)=>rs.reduce((x,r)=>x+((r.niche&&r.niche.skin&&r.niche.skin[k])||0),0), pm=rs=>{ const v=rs.filter(r=>r.niche&&r.niche.skin&&r.niche.skin.pMean!==undefined).map(r=>r.niche.skin.pMean); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, res={}, f2=x=>x===null||x===undefined?'-':x.toFixed(2), f3=x=>x===null||x===undefined?'-':x.toFixed(3);
for(const s of SEEDS) for(const a of ARMS){ const rows=read(path.join(D,`${a}.${s}.all.jsonl`)); if(!rows)continue;
  const nW=Math.floor(rows.length/WIN), half=Math.floor(nW/2), everU=new Set(), everI=new Set(), everR=new Set(), pu=[], pi=[], pr=[], bw=[], aw=[]; let maxDepthUsed=0;
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map(), fx=new Map(), dep=new Map();
    for(const r of W){ const n=r.niche||{}; for(const [k,v,d] of (n.cUse||[])){ inc.set(k,(inc.get(k)||0)+v/W.length); dep.set(k,d); } for(const [k,v,d] of (n.recU||[])){ car.set(k,(car.get(k)||0)+v/W.length); dep.set(k,d); }
      for(const e of (n.flux||[])) fx.set(e[0],(fx.get(e[0])||0)+e[1]/W.length); }
    const byInc=[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k), used=new Set([...byInc,...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)]);
    const nu=[...used].filter(k=>!everU.has(k)); nu.forEach(k=>everU.add(k)); pu.push(nu.length); if(w>=half) for(const k of used) maxDepthUsed=Math.max(maxDepthUsed,dep.get(k)||0);
    const ni=byInc.filter(k=>!everI.has(k)); ni.forEach(k=>everI.add(k)); pi.push(ni.length);
    const act=[...fx].filter(([k,v])=>v>=MIN).map(([k])=>k), nr=act.filter(k=>!everR.has(k)); nr.forEach(k=>everR.add(k)); pr.push(nr.length);
    bw.push(W[0].niche&&W[0].niche.builderShare!==undefined?mean(W.map(r=>r.niche.builderShare)):null); aw.push(W[0].niche&&W[0].niche.activeBuilderShare!==undefined?mean(W.map(r=>r.niche.activeBuilderShare)):null); }
  const lr=rows.slice(half*WIN,nW*WIN), lu=pu.slice(half), hasB=bw[0]!==null, lb=hasB?bw.slice(half):null, sum=(k)=>lr.reduce((x,r)=>x+((r.niche&&r.niche[k])||0),0);
  res[a+s]={nW,Lu:mean(lu),tr:ols(lu),Li:mean(pi.slice(half)),Lr:mean(pr.slice(half)),everU:everU.size,maxDepthUsed,
    strInc:mean(lr.map(r=>{ const n=r.niche; return n&&n.income?((n.catIncome||0)+(n.openIncome||0)+(n.buildIncome||0))/n.income:0; })),
    openInc:mean(lr.map(r=>{ const n=r.niche; return n&&n.income?(n.openIncome||0)/n.income:0; })),
    cap:rows.reduce((x,r)=>x+((r.niche&&r.niche.capHit)||0),0), cLiveMax:Math.max(...rows.map(r=>(r.niche&&r.niche.compoundsLive)||0)), cMade:rows.at(-1).niche?rows.at(-1).niche.compoundsMade:0,
    cells:mean(lr.map(r=>r.niche?r.niche.cells:0)), N:mean(lr.map(r=>r.N)), inc:mean(lr.map(r=>r.niche?r.niche.income:0)),
    b0:hasB?bw[0]:null, bMid:hasB?bw[half]:null, bEnd:hasB?bw[nW-1]:null, bSlope:hasB?ols(lb):null, ab:hasB?mean(lr.map(r=>r.niche.activeBuilderShare)):null, aMid:hasB?mean(aw.slice(half,half+3)):null, aEnd:hasB?mean(aw.slice(nW-3)):null, aSlope:hasB?ols(aw.slice(half)):null, aw:hasB?aw.map(x=>x.toFixed(3)).join(','):'-',
    bBirthSh:hasB?(()=>{ const b=sum('bBirth'), f=sum('fBirth'); return b+f?b/(b+f):0; })():null, bE:hasB?mean(lr.map(r=>r.niche.bE)):null, fE:hasB?mean(lr.map(r=>r.niche.fE)):null,
    builds:sum('found')+sum('ext')+sum('recB')+sum('rfound')+sum('rext')+sum('rcopy'), maint:sum('maint')+sum('rmaint'),
    stock:mean(lr.map(r=>r.niche&&r.niche.skin?r.niche.skin.stock:0)), hasSk:!!(rows[0].niche&&rows[0].niche.skin), inh:sum2(lr,'inh'), own:sum2(lr,'own'), leak:sum2(lr,'leak'), lcopy:sum2(lr,'lcopy'),
    hasP:!!(rows[0].niche&&rows[0].niche.skin&&rows[0].niche.skin.pMean!==undefined), p0:pm(rows.slice(0,WIN)), pMid:pm(rows.slice(half*WIN,(half+1)*WIN)), pEnd:pm(rows.slice((nW-1)*WIN,nW*WIN)), pLow:mean(lr.map(r=>r.niche.skin&&r.niche.skin.pLow!==undefined?r.niche.skin.pLow:0)), pHigh:mean(lr.map(r=>r.niche.skin&&r.niche.skin.pHigh!==undefined?r.niche.skin.pHigh:0)),
    pu:pu.join(','), bw:hasB?bw.map(x=>x.toFixed(2)).join(','):'-'}; }
console.log('arm seed | windows | Lu: new USED compounds/window, late half (primary) | OLS trend of Lu, late | income-only new used/window late | v1 metric new active reactions/window late | used ever | max depth used late | structure share of late income (opened channels) | structure cells late | builds late (incl. random) | maintenances late | compound-cap hits (whole run) | max live compounds | compounds ever made | N late | income/1k late');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue;
  console.log(`${a} ${s} | ${x.nW} | ${x.Lu.toFixed(2)} | ${x.tr.toFixed(3)} | ${x.Li.toFixed(2)} | ${x.Lr.toFixed(2)} | ${x.everU} | ${x.maxDepthUsed} | ${(100*x.strInc).toFixed(1)}% (${(100*x.openInc).toFixed(1)}%) | ${x.cells.toFixed(0)} | ${x.builds} | ${x.maint} | ${x.cap} | ${x.cLiveMax} | ${x.cMade} | ${x.N.toFixed(0)} | ${x.inc.toFixed(0)}`); }
console.log('\nnew used per window:'); for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(x)console.log(`${a} ${s} | ${x.pu}`); }
console.log('\nBUILDER DYNAMICS: arm seed | ACTIVE builder share (bit + BUILD op): first 3 late-half windows | last 3 windows | late-half OLS slope | builder-BIT share: first window, late-half start, final | bit-carriers share of births late | mean store bit-carriers vs others late | active share per window | bit share per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x||x.b0===null)continue;
  console.log(`${a} ${s} | ${f3(x.aMid)} | ${f3(x.aEnd)} | ${x.aSlope.toFixed(4)} | ${f3(x.b0)}, ${f3(x.bMid)}, ${f3(x.bEnd)} | ${f3(x.bBirthSh)} | ${f2(x.bE)} vs ${f2(x.fE)} | ${x.aw} | ${x.bw}`); }
console.log('\nSKIN: arm seed | share of organisms holding internal stock, late | stock inheritance events late | CATAL on own stock late | CATAL on a neighbour\'s stock (leak) late | recipes copied through membranes late | permeability mean: first window, late-half start, final | late share p<0.1 | late share p>0.5');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x||!x.hasSk)continue;
  console.log(`${a} ${s} | ${f3(x.stock)} | ${x.inh} | ${x.own} | ${x.leak} | ${x.lcopy} | ${x.hasP?f3(x.p0)+', '+f3(x.pMid)+', '+f3(x.pEnd):'- (sealed)'} | ${x.hasP?f3(x.pLow):'-'} | ${x.hasP?f3(x.pHigh):'-'}`); }
console.log(`\nVERDICT (POSITIVE only if ONE skin arm X, S1 or S2, passes on ALL 3 seeds: Lu(X) > 0 AND trend(X) >= 0 AND Lu(X) > Lu(S0) AND Lu(X) > Lu(S3) AND Lu(X) > Lu(S4) AND X active builder share maintained: last-3-window mean >= ${BKEEP} x first-3-late-half-window mean AND >= ${BFLOOR}):`);
const pass={S1:true,S2:true}, perSeedEither=[];
for(const s of SEEDS){ const s0=res['S0'+s], s3=res['S3'+s], s4=res['S4'+s]; let either=false;
  for(const X of ['S1','S2']){ const x=res[X+s]; if(!x||!s0||!s3||!s4){ pass[X]=false; console.log(`seed ${s} ${X}: missing`); continue; }
    const c=[x.Lu>0,x.tr>=0,x.Lu>s0.Lu,x.Lu>s3.Lu,x.Lu>s4.Lu,x.aEnd>=BKEEP*x.aMid&&x.aEnd>=BFLOOR], ok=c.every(Boolean); pass[X]=pass[X]&&ok; either=either||ok;
    console.log(`seed ${s} ${X}: ${x.Lu.toFixed(2)} (trend ${x.tr.toFixed(3)}, active builders ${f3(x.aMid)}->${f3(x.aEnd)}) | S0 ${s0.Lu.toFixed(2)} | S3 ${s3.Lu.toFixed(2)} | S4 ${s4.Lu.toFixed(2)} -> ${ok?'passes':'FAILS'} [${['Lu>0','trend>=0','>S0','>S3','>S4','builders maintained'].filter((_,i)=>!c[i]).join(', ')}]`); }
  perSeedEither.push(either); }
const caps=Object.entries(res).filter(([k,x])=>x.cap>0).map(([k,x])=>k+':'+x.cap); console.log('compound-cap hits: '+(caps.length?caps.join(' '):'none in any run'));
console.log(`secondary (no verdict weight): seeds where S1 or S2 passes: ${perSeedEither.filter(Boolean).length} of ${SEEDS.length}`);
console.log(pass.S1||pass.S2?`=> POSITIVE by the pre-registered rule: ${['S1','S2'].filter(X=>pass[X]).join(' and ')} passes on 3 of 3 seeds.`:'=> NOT SHOWN: neither S1 nor S2 passes on all 3 seeds.');
