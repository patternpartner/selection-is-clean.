// lab/chance/chance-diag.js - POST-HOC DIAGNOSTIC (added 2026-10-04 12:40 BST, before stage-2 results; NOT part of the go criterion).
// Evolvable randomness (R2) vs nulls, from the per-1000-tick JSONL samples only (no rerun):
//  1. trajectory of the evolved randomness: population mean rate multiplier (body.ch.rate) and tail exponent (body.ch.alpha);
//  2. churn vs use: per window, catalyst types arriving in the readout (carried by >= 0.2% of organisms or >= 0.2% of income) that are
//     GENUINELY NEW (never seen before in the run) vs RE-APPEARANCES (seen in an earlier window, absent in the previous one);
//     persistence = share of genuinely new types still present 1, 2 and 4 windows later;
//  3. corr over windows of the rate with (a) used novelty (Lu rule, new used per window) and (b) 2-window persistence;
//  4. "stuck" response: corr(rate change in window w, new-used in w-1) (negative = randomness rises when stuck) and corr(rate in w,
//     new-used in w+1) (positive = use rises after). Pooled over seeds after per-seed z-scoring.
// LIMITS: the samples only list types above 0.2%, so a "re-appearance" can be a true re-discovery OR a type that survived below the
// readout threshold; true per-capture re-discovery needs the capture-event wrapper (lab/chance/capdiag.js) and a rerun.
//   DIR=/home/box/chance-runs/s1 SEEDS='110 111 112' ARMS='R2 R1 RANDCAP DIRECT-R2 DRIFT-R2 SHUF-R2' WIN=5 node lab/chance/chance-diag.js
'use strict'; const fs=require('fs'), path=require('path'), E=process.env;
const D=E.DIR, SEEDS=(E.SEEDS||'110 111 112').split(' '), ARMS=(E.ARMS||'R2 R1 RANDCAP DIRECT-R2 DRIFT-R2 SHUF-R2').split(' '), WIN=+(E.WIN||5), MIN=0.01, VIS=0.002;
const read=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8').trim().split('\n').filter(x=>x.startsWith('{')).map(JSON.parse):null;
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
const corr=(x,y)=>{ const P=x.map((v,i)=>[v,y[i]]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)); if(P.length<4)return NaN; const mx=mean(P.map(p=>p[0])), my=mean(P.map(p=>p[1])); let sxy=0,sxx=0,syy=0; for(const [a,b] of P){ sxy+=(a-mx)*(b-my); sxx+=(a-mx)**2; syy+=(b-my)**2; } return sxx&&syy?sxy/Math.sqrt(sxx*syy):NaN; };
const z=a=>{ const f=a.filter(Number.isFinite), m=mean(f), s=Math.sqrt(mean(f.map(v=>(v-m)**2)))||1; return a.map(v=>(v-m)/s); };
const ols=ys=>{ const n=ys.length, xm=(n-1)/2, ym=mean(ys); let a=0,b=0; ys.forEach((y,i)=>{ a+=(i-xm)*(y-ym); b+=(i-xm)**2; }); return b?a/b:0; };
const f2=v=>Number.isFinite(v)?v.toFixed(2):'-', pc=v=>Number.isFinite(v)?(100*v).toFixed(0)+'%':'-';
const res={}; const pool={};
for(const a of ARMS){ pool[a]={dr:[],puPrev:[],rate:[],puNext:[],pu:[],pers:[]};
  for(const s of SEEDS){ const rows=read(path.join(D,`${a}-${s}.jsonl`)); if(!rows)continue; const nW=Math.floor(rows.length/WIN);
    const seen=new Set(), everUsed=new Set(), present=[], newT=[], reT=[], pu=[], rate=[], alpha=[], t=[];
    for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map(), pres=new Set();
      for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[])){ inc.set(k,(inc.get(k)||0)+v/W.length); if(v>=VIS)pres.add(k); } for(const [k,v] of (b.bC||[])){ car.set(k,(car.get(k)||0)+v/W.length); if(v>=VIS)pres.add(k); } }
      const used=new Set([...[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k),...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)]);
      let nu=0; for(const k of used) if(!everUsed.has(k)){ everUsed.add(k); nu++; } pu.push(nu);
      const prev=w?present[w-1]:new Set(), nw=new Set(), re=new Set(); for(const k of pres){ if(prev.has(k))continue; if(seen.has(k))re.add(k); else nw.add(k); }
      for(const k of pres)seen.add(k); present.push(pres); newT.push(nw); reT.push(re);
      rate.push(mean(W.map(r=>r.body&&r.body.ch?r.body.ch.rate:NaN))); alpha.push(mean(W.map(r=>r.body&&r.body.ch?r.body.ch.alpha:NaN))); t.push(W.at(-1).t); }
    const persK=k=>newT.map((S,w)=>w+k<nW&&S.size?[...S].filter(x=>present[w+k].has(x)).length/S.size:NaN);
    const p1=persK(1), p2=persK(2), p4=persK(4), arr=newT.map(x=>x.size), rea=reT.map(x=>x.size), reShare=arr.map((n,i)=>(n+rea[i])?rea[i]/(n+rea[i]):NaN);
    const hasCh=rate.some(Number.isFinite), dr=rate.map((v,i)=>i?v-rate[i-1]:NaN), puPrev=pu.map((v,i)=>i?pu[i-1]:NaN), puNext=pu.map((v,i)=>i+1<nW?pu[i+1]:NaN);
    const th=Math.floor(nW/3), late=x=>mean(x.slice(nW-th).filter(Number.isFinite)), early=x=>mean(x.slice(0,th).filter(Number.isFinite));
    res[a+s]={nW,hasCh,rate,alpha,t,pu,arr,rea,reShare,p1,p2,p4,rLate:late(rate),rEarly:early(rate),aLate:late(alpha),rTrend:hasCh?ols(rate.map(v=>Number.isFinite(v)?v:0)):NaN,
      cRateLu:corr(rate,pu),cRatePers:corr(rate,p2),cStuck:corr(dr,puPrev),cAfter:corr(rate,puNext),reLate:late(reShare),reAll:mean(reShare.filter(Number.isFinite)),p2All:mean(p2.filter(Number.isFinite)),puLate:late(pu)};
    if(hasCh){ const P=pool[a]; P.dr.push(...z(dr)); P.puPrev.push(...z(puPrev)); P.rate.push(...z(rate)); P.puNext.push(...z(puNext)); P.pu.push(...z(pu)); P.pers.push(...z(p2)); } } }
const out=[]; const L=x=>out.push(x);
L(`# chance-diag (post-hoc, not a go criterion): DIR ${D}, seeds ${SEEDS.join(' ')}, WIN ${WIN} samples (${WIN*1000} ticks)`);
L('\n## 1. Evolved randomness trajectory (population mean rate multiplier exp(temperature), start 1; tail alpha, start 1.5)');
for(const a of ARMS) for(const s of SEEDS){ const x=res[a+s]; if(!x||!x.hasCh)continue; const step=Math.max(1,Math.floor(x.nW/10));
  L(`${a} ${s}: rate early ${f2(x.rEarly)} late ${f2(x.rLate)} (trend ${x.rTrend.toFixed(4)}/window), alpha late ${f2(x.aLate)} | rate by window: ${x.rate.filter((_,i)=>i%step===0||i===x.nW-1).map(f2).join(',')} | alpha: ${x.alpha.filter((_,i)=>i%step===0||i===x.nW-1).map(f2).join(',')}`); }
L('\n## 2. Churn vs use (types arriving in the readout per window: genuinely new vs re-appearing; persistence of new types)');
L('arm seed | windows | arrivals/window new | re-appearances/window | re-appearance share (all / late third) | new types still present +1 / +2 / +4 windows | new USED/window late third');
for(const a of ARMS) for(const s of SEEDS){ const x=res[a+s]; if(!x)continue; L(`${a} ${s} | ${x.nW} | ${mean(x.arr).toFixed(1)} | ${mean(x.rea).toFixed(1)} | ${pc(x.reAll)} / ${pc(x.reLate)} | ${pc(mean(x.p1.filter(Number.isFinite)))} / ${pc(x.p2All)} / ${pc(mean(x.p4.filter(Number.isFinite)))} | ${f2(x.puLate)}`); }
L('\n## 3-4. Correlations over windows (arms with evolvable randomness only)');
L('arm seed | corr(rate, new used) | corr(rate, persistence +2) | corr(rate change in w, new used in w-1) [<0 = rises when stuck] | corr(rate in w, new used in w+1) [>0 = use follows]');
for(const a of ARMS) for(const s of SEEDS){ const x=res[a+s]; if(!x||!x.hasCh)continue; L(`${a} ${s} | ${f2(x.cRateLu)} | ${f2(x.cRatePers)} | ${f2(x.cStuck)} | ${f2(x.cAfter)}`); }
for(const a of ARMS){ const P=pool[a]; if(!P.rate.length)continue; L(`${a} pooled (z-scored per seed, n=${P.rate.length}) | ${f2(corr(P.rate,P.pu))} | ${f2(corr(P.rate,P.pers))} | ${f2(corr(P.dr,P.puPrev))} | ${f2(corr(P.rate,P.puNext))}`); }
// ---- classification (rule written with this script, before stage 2; uses the design arm with evolvable randomness, default R2)
const DA=E.DESIGN||'R2', ds=SEEDS.map(s=>res[DA+s]).filter(x=>x&&x.hasCh);
L(`\n## Classification (${DA}; rule: outcome 1 if late rate <= 0.5 on >= 2 seeds; outcome 2 if late rate >= 2 and late re-appearance share >= 50% and late new-used not above R1/RANDCAP on >= 2 seeds; outcome 3 if pooled corr(rate change, previous new-used) <= -0.3 AND pooled corr(rate, next new-used) >= +0.3; otherwise mixed)`);
if(!ds.length) L('no arm with evolvable randomness found: not classifiable');
else { const o1=ds.filter(x=>x.rLate<=0.5).length, ref=s=>Math.max(...['R1','RANDCAP'].map(b=>res[b+s]?res[b+s].puLate:-Infinity));
  const o2=SEEDS.filter(s=>{ const x=res[DA+s]; return x&&x.hasCh&&x.rLate>=2&&x.reLate>=0.5&&!(x.puLate>ref(s)); }).length, P=pool[DA], cs=corr(P.dr,P.puPrev), ca=corr(P.rate,P.puNext);
  const o3=cs<=-0.3&&ca>=0.3; let v='MIXED / none of the three'; if(o1>=2)v='OUTCOME 1: randomness drifts toward ~0 (selection turns chance down)'; else if(o2>=2)v='OUTCOME 2: high randomness, flat use, mostly re-appearances'; else if(o3)v='OUTCOME 3: randomness tracks being stuck and use rises after';
  L(`seeds with late rate <= 0.5: ${o1}/${ds.length}; outcome-2 seeds: ${o2}; pooled stuck corr ${f2(cs)}, after corr ${f2(ca)}`); L(`=> ${v}`); }
console.log(out.join('\n')); if(E.OUT)fs.writeFileSync(E.OUT,out.join('\n')+'\n');
