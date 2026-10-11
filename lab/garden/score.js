// lab/garden/score.js - scores the GARDENER round (lab/GARDENER.md). Draws nothing; reads the jsonl rows core-run.js wrote.
//   node lab/garden/score.js DIR [SEEDS=911,912,913] [ARMS=X,P0,P1,P2,F,SH] [WIN=30] [FLOOR=5]
// Per arm and seed:
//   S      lab/used-novelty.js's S late, exactly (income share >= 1% of net metabolic income, LAG 2, late third of windows)
//   Sf     the same with an ABSOLUTE floor as well: a reaction is used in a window only if it also earned at least FLOOR
//          energy per 1,000 ticks (net). A heavy tax shrinks metabolic income, and a share of a tiny total is easy to reach;
//          the floor stops noise in a starved economy reading as novelty.
//   collapse  mean N over the last quarter of rows under 200
// Secondary, reported, not ruling: windows in the last quarter with a new active reaction (#287/#288's rule 1), reactions
// ever active, the commonest reaction's share of net metabolic income late, metabolic income late, S middle.
'use strict';
const fs=require('fs'), path=require('path'); const UN=require('../used-novelty.js');
const args=Object.fromEntries(process.argv.slice(3).map(a=>a.split('=')));
const DIR=process.argv[2], SEEDS=(args.SEEDS||'911,912,913').split(','), ARMS=(args.ARMS||'X,P0,P1,P2,F,SH').split(',');
const WIN=+(args.WIN||30), FLOOR=+(args.FLOOR||5), MIN=0.01, LAG=2, REL=1.10;
// Sf: used in window w = mean share >= MIN AND mean net income >= FLOOR per 1,000 ticks (rows are 1,000 ticks apart)
function Sfloor(rows){ const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), sh=new Map(), inc=new Map();
    for(const r of W) for(const [k,v] of r.chem.flux||[]){ sh.set(k,(sh.get(k)||0)+v/W.length); inc.set(k,(inc.get(k)||0)+v*r.chem.metab/W.length); }
    used.push(new Set([...sh].filter(([k,v])=>v>=MIN&&inc.get(k)>=FLOOR).map(([k])=>k))); }
  const ever=new Set(), st=[]; for(let w=0;w<nW;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); if(w+LAG<nW)st.push(n.filter(k=>used[w+LAG].has(k)).length); }
  const E=st.length, th=Math.floor(E/3), mean=x=>x.reduce((p,q)=>p+q,0)/x.length; if(th<1)return {late:NaN,middle:NaN};
  return {late:mean(st.slice(E-th)),middle:mean(st.slice(E-2*th,E-th))}; }
function lastQuarter(rows){ return rows.slice(Math.floor(rows.length*3/4)); }
function secondary(rows){ const nW=Math.floor(rows.length/WIN), ever=new Set(), newPer=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), m=new Map(); for(const r of W) for(const [k,v] of r.chem.flux||[]) m.set(k,(m.get(k)||0)+v/W.length);
    const act=[...m].filter(([k,v])=>v>=MIN).map(([k])=>k); newPer.push(act.filter(k=>!ever.has(k)).length); act.forEach(k=>ever.add(k)); }
  const q=newPer.slice(Math.floor(nW*3/4)), L=lastQuarter(rows);
  const top=L.reduce((a,r)=>a+((r.chem.flux&&r.chem.flux[0])?r.chem.flux[0][1]:0),0)/L.length, inc=L.reduce((a,r)=>a+r.chem.metab,0)/L.length;
  return {lqNewWindows:q.filter(x=>x>0).length+'/'+q.length,everActive:ever.size,topShareLate:+top.toFixed(3),metabLate:+inc.toFixed(1),newPerWindow:newPer.join(',')}; }
const res={}; let missing=[];
for(const s of SEEDS){ res[s]={}; for(const a of ARMS){ const f=path.join(DIR,a+'.'+s+'.jsonl'); if(!fs.existsSync(f)){ missing.push(a+'.'+s); continue; }
  const rows=UN.readRows(f).filter(r=>r.chem); const N=lastQuarter(rows).reduce((x,r)=>x+r.N,0)/Math.max(1,lastQuarter(rows).length);
  const s1=UN.S(rows,{WIN,MIN,LAG}), s2=Sfloor(rows);
  res[s][a]={rows:rows.length,S:s1.late,Smid:s1.middle,Sf:s2.late,Sfmid:s2.middle,usedEver:s1.usedEver,collapse:N<200,Nlate:Math.round(N),...secondary(rows)}; } }
if(missing.length)console.log('MISSING: '+missing.join(' '));
const nulls=ARMS.filter(a=>a!=='X'); const verdictOn=key=>{ let wins=0, readable=0, beatsInfo=0; const per=[];
  for(const s of SEEDS){ const A=res[s]; if(!A.X||nulls.some(n=>!A[n]))continue; const nullCol=nulls.filter(n=>A[n].collapse);
    if(nullCol.length){ per.push(s+': UNREADABLE (null collapsed: '+nullCol.join(',')+')'); continue; } readable++;
    const lost=A.X.collapse?['(X collapsed)']:nulls.filter(n=>!(A.X[key]>A[n][key])); if(!lost.length)wins++;
    const info=!A.X.collapse&&['F','SH'].filter(n=>A[n]).every(n=>A.X[key]>A[n][key]); if(info)beatsInfo++;
    per.push(s+': X '+A.X[key].toFixed(2)+' | '+nulls.map(n=>n+' '+A[n][key].toFixed(2)).join(' ')+(lost.length?' | loses to '+lost.join(','):' | beats all')); }
  const rs=SEEDS.filter(s=>res[s].X&&nulls.every(n=>res[s][n]&&!res[s][n].collapse)); const m=a=>rs.reduce((x,s)=>x+res[s][a][key],0)/Math.max(1,rs.length);
  const rel=rs.length?Math.min(...nulls.map(n=>(m('X')+1)/(m(n)+1))):NaN;
  return {key,readable,wins,beatsInfo,rel:+rel.toFixed(3),per}; };
const v1=verdictOn('S'), v2=verdictOn('Sf');
for(const s of SEEDS) for(const a of ARMS) if(res[s][a]){ const r=res[s][a]; console.log(`${s} ${a.padEnd(3)} rows ${r.rows} N ${r.Nlate}${r.collapse?' COLLAPSED':''} | S ${r.S.toFixed(2)} (mid ${r.Smid.toFixed(2)}) Sf ${r.Sf.toFixed(2)} (mid ${r.Sfmid.toFixed(2)}) | usedEver ${r.usedEver} | lastQ new-windows ${r.lqNewWindows} everActive ${r.everActive} top ${r.topShareLate} metab ${r.metabLate}`); }
for(const v of [v1,v2]){ console.log('\n== '+v.key+': readable '+v.readable+', X beats every null on '+v.wins+', beats both F and SH on '+v.beatsInfo+', rel '+v.rel); v.per.forEach(l=>console.log('  '+l)); }
let verdict;
if(v1.readable<2)verdict='INCONCLUSIVE (fewer than 2 readable seeds)';
else if(v1.wins>=2&&v2.wins>=2&&v1.rel>=REL&&v2.rel>=REL)verdict='GO (candidate)';
else if(v1.beatsInfo<2)verdict='NO-GO: TARGETING KILLED (X does not beat both information-free twins F and SH on 2 of the readable seeds, primary S)';
else verdict='NO-GO: NOT SHOWN (targeting beats the information-free twins, but X does not beat every null on both measures)';
console.log('\nVERDICT: '+verdict);
