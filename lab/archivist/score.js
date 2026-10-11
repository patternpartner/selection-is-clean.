// lab/archivist/score.js - scores the ARCHIVIST round (lab/ARCHIVIST.md). S and Sf copied unchanged from lab/dreamer/score.js
// (S = lab/used-novelty.js S late: income share >= 1% of net metabolic income, WIN 30 rows, LAG 2, late third; Sf = the same
// with an absolute floor of FLOOR energy per 1,000 ticks). New here, ruling: Sn = S with every key the arm ever WROTE
// (any METAB pair in any program the archivist wrote, from the rows' arch.wnew) removed from the income lists, so the
// archivist gets no credit for what it hands back, only for novelty the world finds downstream. Collapse: mean N, last quarter, < 200.
//   node lab/archivist/score.js DIR [SEEDS=7611,7612,7613] [ARMS=X,P0,P1,P2,BT,BG]
// Arms: X archivist (ARCHIVE 1); P0 plain + coroner (ARCHIVE 4, proven identical to plain); P1,P2 plain (NULLSHIFT 1,2);
// BT blind time/place (ARCHIVE 2); BG wrong genome (ARCHIVE 3). Draws nothing.
'use strict';
const fs=require('fs'), path=require('path'); const UN=require('../used-novelty.js');
const args=Object.fromEntries(process.argv.slice(3).map(a=>a.split('=')));
const DIR=process.argv[2], SEEDS=(args.SEEDS||'7611,7612,7613').split(','), ARMS=(args.ARMS||'X,P0,P1,P2,BT,BG').split(',');
const WIN=+(args.WIN||30), FLOOR=+(args.FLOOR||5), MIN=0.01, LAG=2, REL=1.10;
function Sfloor(rows){ const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), sh=new Map(), inc=new Map();
    for(const r of W) for(const [k,v] of r.chem.flux||[]){ sh.set(k,(sh.get(k)||0)+v/W.length); inc.set(k,(inc.get(k)||0)+v*r.chem.metab/W.length); }
    used.push(new Set([...sh].filter(([k,v])=>v>=MIN&&inc.get(k)>=FLOOR).map(([k])=>k))); }
  const ever=new Set(), st=[]; for(let w=0;w<nW;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); if(w+LAG<nW)st.push(n.filter(k=>used[w+LAG].has(k)).length); }
  const E=st.length, th=Math.floor(E/3), mean=x=>x.reduce((p,q)=>p+q,0)/x.length; if(th<1)return {late:NaN,middle:NaN};
  return {late:mean(st.slice(E-th)),middle:mean(st.slice(E-2*th,E-th))}; }
const med=a=>{ if(!a.length)return NaN; const b=[...a].sort((x,y)=>x-y), m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; };
function coroner(rows){ if(!rows[0].arch)return null; const D=[], R=[]; for(const r of rows){ for(const d of r.arch.deathsNew)D.push(d); for(const x of r.arch.revsNew)R.push([r.t,x[0]]); }
  const on=(k,a,b)=>rows.some(r=>r.t>a&&r.t<=b&&(r.chem.flux||[]).some(([kk,v])=>kk===k&&v>=0.01));
  const car=D.map(d=>d[2]).filter(x=>x!==null);
  return {deaths:D.length,subRatioMed:+med(D.map(d=>d[1])).toFixed(3),subRecovered:+(D.filter(d=>d[1]>=1).length/Math.max(1,D.length)).toFixed(2),carriersGone:+(car.filter(x=>x===0).length/Math.max(1,car.length)).toFixed(2),
    revs:R.length,reEarn5k:R.filter(([t,k])=>on(k,t,t+5000)).length,on20to30k:R.filter(([t,k])=>on(k,t+20000,t+30000)).length}; }
const lastQuarter=rows=>rows.slice(Math.floor(rows.length*3/4));
const res={}; const missing=[];
for(const s of SEEDS){ res[s]={}; for(const a of ARMS){ const f=path.join(DIR,a+'.'+s+'.jsonl'); if(!fs.existsSync(f)){ missing.push(a+'.'+s); continue; }
  const rows=UN.readRows(f).filter(r=>r.chem); const LQ=lastQuarter(rows), N=LQ.reduce((x,r)=>x+r.N,0)/Math.max(1,LQ.length);
  const WK=new Set(); for(const r of rows) if(r.arch) for(const k of r.arch.wnew)WK.add(k);
  const s1=UN.S(rows,{WIN,MIN,LAG}), s2=Sfloor(rows), s3=UN.S(rows.map(r=>Object.assign({},r,{chem:Object.assign({},r.chem,{flux:(r.chem.flux||[]).filter(([k])=>!WK.has(k))})})),{WIN,MIN,LAG});
  const inc=LQ.reduce((x,r)=>x+r.chem.metab,0)/Math.max(1,LQ.length), last=rows[rows.length-1];
  res[s][a]={rows:rows.length,S:s1.late,Smid:s1.middle,Sf:s2.late,Sn:s3.late,Snmid:s3.middle,usedEver:s1.usedEver,collapse:N<200,Nlate:Math.round(N),wkeys:WK.size,writes:last.arch?last.arch.writes:0,metabLate:+inc.toFixed(1),cor:coroner(rows)}; } }
if(missing.length)console.log('MISSING: '+missing.join(' '));
const nulls=ARMS.filter(a=>a!=='X'), plain=nulls.filter(a=>/^P/.test(a)), blind=nulls.filter(a=>/^B/.test(a));
const beats=(A,key,set)=>!A.X.collapse&&set.every(n=>A.X[key]>A[n][key]);
function verdictOn(key){ let readable=0, all=0, vsPlain=0, vsBlind=0; const per=[];
  for(const s of SEEDS){ const A=res[s]; if(!A.X||nulls.some(n=>!A[n]))continue; const nc=nulls.filter(n=>A[n].collapse);
    if(nc.length){ per.push(s+': UNREADABLE (null collapsed: '+nc.join(',')+')'); continue; } readable++;
    if(beats(A,key,nulls))all++; if(beats(A,key,plain))vsPlain++; if(beats(A,key,blind))vsBlind++;
    const lost=A.X.collapse?['(X collapsed)']:nulls.filter(n=>!(A.X[key]>A[n][key]));
    per.push(s+': X '+A.X[key].toFixed(2)+' | '+nulls.map(n=>n+' '+A[n][key].toFixed(2)).join(' ')+(lost.length?' | loses/ties to '+lost.join(','):' | beats all')); }
  const rs=SEEDS.filter(s=>res[s].X&&nulls.every(n=>res[s][n]&&!res[s][n].collapse)), m=a=>rs.reduce((x,s)=>x+res[s][a][key],0)/Math.max(1,rs.length);
  const rel=rs.length?Math.min(...nulls.map(n=>(m('X')+1)/(m(n)+1))):NaN;
  return {key,readable,all,vsPlain,vsBlind,rel:+rel.toFixed(3),means:Object.fromEntries(ARMS.map(a=>[a,+m(a).toFixed(3)])),per}; }
for(const s of SEEDS) for(const a of ARMS) if(res[s][a]){ const r=res[s][a]; console.log(`${s} ${a.padEnd(3)} rows ${r.rows} N ${r.Nlate}${r.collapse?' COLLAPSED':''} | S ${r.S.toFixed(2)} (mid ${r.Smid.toFixed(2)}) Sf ${r.Sf.toFixed(2)} Sn ${r.Sn.toFixed(2)} (mid ${r.Snmid.toFixed(2)}) | usedEver ${r.usedEver} metab ${r.metabLate} | writes ${r.writes} written keys ${r.wkeys} | coroner ${JSON.stringify(r.cor)}`); }
const v1=verdictOn('S'), v2=verdictOn('Sf'), v3=verdictOn('Sn');
for(const v of [v1,v2,v3]){ console.log(`\n== ${v.key}: readable ${v.readable}; X beats every null on ${v.all}, the plain band on ${v.vsPlain}, both blind archivists on ${v.vsBlind}; rel ${v.rel}; means ${JSON.stringify(v.means)}`); v.per.forEach(l=>console.log('  '+l)); }
let verdict;
if(v1.readable<2)verdict='INCONCLUSIVE (fewer than 2 readable seeds)';
else if(v1.all>=2&&v2.all>=2&&v3.all>=2&&v1.rel>=REL&&v3.rel>=REL)verdict='GO (candidate)';
else if(v1.vsPlain<2)verdict='NO-GO: RETENTION KILLED (the archivist does not beat the plain band P0,P1,P2 on S on 2 readable seeds)';
else if(v3.vsPlain<2)verdict='NO-GO: LIFE SUPPORT ONLY (X beats the plain band on S, but not on Sn - written keys removed - on 2 readable seeds)';
else if(v1.vsBlind<2||v3.vsBlind<2)verdict='NO-GO: MEMORY NOT SHOWN (X beats the plain band on S and Sn, but not both blind archivists BT and BG, on 2 readable seeds)';
else verdict='NO-GO: NOT SHOWN (X beats plain and blind on S and Sn on 2 seeds, but fails Sf or the 1.10 mean ratio)';
console.log('\nVERDICT: '+verdict);
