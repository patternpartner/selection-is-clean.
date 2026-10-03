// lab/autocat/trial.js - Phase A feasibility readout (TRIAL seeds only, no verdict weight). Same used-novelty measure as
// lab/skin/analyse.js and lab/niche-v3/analyse.js: a compound is USED in a window when its mean share of structure income
// (niche.cUse) or of organisms carrying its recipe (niche.recU) is >= 1%; Lu = mean NEW used compounds per window over the
// late half, with its OLS trend.   DIR=/tmp/ac/feas ARMS='FULL NOAC RAND SHUF W1' SEEDS='90 91' WIN=10 node lab/autocat/trial.js
'use strict'; const fs=require('fs'), zlib=require('zlib'), path=require('path'), E=process.env;
const D=E.DIR||'/tmp/ac/feas', ARMS=(E.ARMS||'FULL NOAC RAND SHUF W1').split(' '), SEEDS=(E.SEEDS||'90 91 92').split(' '), WIN=+(E.WIN||10), MIN=0.01, PRE=E.PRE||'';
const read=f=>{ const t=fs.existsSync(f)?fs.readFileSync(f,'utf8'):fs.existsSync(f+'.gz')?zlib.gunzipSync(fs.readFileSync(f+'.gz')).toString():null; if(!t)return null; const L=t.trim().split('\n').filter(x=>x.startsWith('{')); return L.length?L.map(JSON.parse):null; };
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=ys.reduce((a,b)=>a+b,0)/n; let sxy=0,sxx=0; ys.forEach((y,i)=>{ sxy+=(i-xm)*(y-ym); sxx+=(i-xm)*(i-xm); }); return sxx?sxy/sxx:0; };
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, res={};
for(const s of SEEDS) for(const a of ARMS){ const rows=read(path.join(D,`${PRE}${a}-${s}.jsonl`)); if(!rows)continue;
  const nW=Math.floor(rows.length/WIN), half=Math.floor(nW/2), everU=new Set(), pu=[], aw=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const n=r.niche||{}; for(const [k,v] of (n.cUse||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (n.recU||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    const used=new Set([...[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k),...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)]);
    const nu=[...used].filter(k=>!everU.has(k)); nu.forEach(k=>everU.add(k)); pu.push(nu.length); aw.push(mean(W.map(r=>(r.niche&&r.niche.activeBuilderShare)||0))); }
  const lr=rows.slice(half*WIN,nW*WIN), sum=(rs,k)=>rs.reduce((x,r)=>x+((r.niche&&r.niche[k])||0),0), T=rows.at(-1).t;
  res[a+s]={t:T,nW,Lu:mean(pu.slice(half)),tr:ols(pu.slice(half)),everU:everU.size,found10k:sum(rows,'found')/T*1e4,rfound10k:sum(rows,'rfound')/T*1e4,builds:sum(rows,'found')+sum(rows,'ext')+sum(rows,'recB')+sum(rows,'rfound')+sum(rows,'rext')+sum(rows,'rcopy'),
    made:rows.at(-1).niche?rows.at(-1).niche.compoundsMade:0, live:Math.max(...rows.map(r=>(r.niche&&r.niche.compoundsLive)||0)), cap:sum(rows,'capHit'), aMid:mean(aw.slice(half,half+3)), aEnd:mean(aw.slice(nW-3)),
    strInc:mean(lr.map(r=>{ const n=r.niche; return n&&n.income?((n.catIncome||0)+(n.openIncome||0)+(n.buildIncome||0))/n.income:0; })), stock:mean(lr.map(r=>r.niche&&r.niche.skin?r.niche.skin.stock:0)), wall:rows.at(-1).wallS, pu:pu.join(','), N:mean(lr.map(r=>r.N)), Nmin:Math.min(...rows.map(r=>r.N)), reseeds:rows.at(-1).reseeds||0}; }
console.log('arm seed | ticks | windows | Lu late | trend | used ever | founds/10k (organism) | random founds/10k | all builds | compounds made | max live | cap hits | active builders mid->end | struct income late | stock late | wall s | N late mean | N min (whole run) | reseeds | new used per window');
for(const s of SEEDS) for(const a of ARMS){ const x=res[a+s]; if(!x)continue; console.log(`${a} ${s} | ${x.t} | ${x.nW} | ${x.Lu.toFixed(2)} | ${x.tr.toFixed(3)} | ${x.everU} | ${x.found10k.toFixed(1)} | ${x.rfound10k.toFixed(1)} | ${x.builds} | ${x.made} | ${x.live} | ${x.cap} | ${x.aMid.toFixed(3)}->${x.aEnd.toFixed(3)} | ${(100*x.strInc).toFixed(1)}% | ${x.stock.toFixed(3)} | ${x.wall} | ${x.N.toFixed(0)} | ${x.Nmin} | ${x.reseeds} | ${x.pu}`); }
if(E.JSON)require('fs').writeFileSync(E.JSON,JSON.stringify(res));
if(ARMS.includes('FULL')){ console.log('\nFEASIBILITY (no verdict weight): FULL vs each other arm on Lu, per seed');
  for(const s of SEEDS){ const f=res['FULL'+s]; if(!f)continue; console.log(`seed ${s}: FULL Lu ${f.Lu.toFixed(2)} trend ${f.tr.toFixed(3)} | `+ARMS.filter(a=>a!=='FULL'&&res[a+s]).map(a=>`${a} ${res[a+s].Lu.toFixed(2)} (${f.Lu>res[a+s].Lu?'FULL ahead':'FULL not ahead'})`).join(' | ')); } }
