// lab/ceiling/score.js - scores the CEILING diagnostic (lab/CEILING.md). S = lab/used-novelty.js S late, unchanged
// (income share >= 1%, WIN 30, LAG 2, late third), the same S every killed round used. K = total sticky new tricks over the run.
'use strict';
const fs=require('fs'), path=require('path'); const UN=require('../used-novelty.js');
const DIR=process.argv[2], SEEDS=['7921','7922','7923'], ARMS=['L','LP','B','BP','BR'], CAND=['L','B','BR'];
const res={}, miss=[];
for(const s of SEEDS){ res[s]={}; for(const a of ARMS){ const f=path.join(DIR,a+'.'+s+'.jsonl'); if(!fs.existsSync(f)){miss.push(a+'.'+s);continue;}
  const rows=UN.readRows(f).filter(r=>r.chem); const LQ=rows.slice(Math.floor(rows.length*3/4)), N=LQ.reduce((x,r)=>x+r.N,0)/Math.max(1,LQ.length);
  const v=UN.S(rows,{WIN:30,MIN:0.01,LAG:2}); res[s][a]={rows:rows.length,S:v.late,Smid:v.middle,K:v.K.length?v.K[v.K.length-1]:0,ever:v.usedEver,collapse:N<200,N:Math.round(N)};
  const r=res[s][a]; console.log(`${s} ${a.padEnd(2)} rows ${r.rows} N ${r.N}${r.collapse?' COLLAPSED':''} | S ${r.S.toFixed(2)} (mid ${r.Smid.toFixed(2)}) K ${r.K} usedEver ${r.ever}`); } }
if(miss.length)console.log('MISSING: '+miss.join(' '));
let go=[]; for(const a of CAND){ const ok=SEEDS.filter(s=>res[s][a]&&!res[s][a].collapse); if(ok.length<2){console.log(a+': unreadable');continue;}
  const m=ok.reduce((x,s)=>x+res[s][a].S,0)/ok.length, pos=ok.filter(s=>res[s][a].S>0).length, mK=ok.reduce((x,s)=>x+res[s][a].K,0)/ok.length;
  const pass=pos===ok.length&&m>=0.5; console.log(`${a}: readable ${ok.length}, S>0 on ${pos}, mean S ${m.toFixed(3)}, mean K ${mK.toFixed(1)} -> ${pass?'MOVES':'floor'}`); if(pass)go.push(a); }
const mean=(a,k)=>{const ok=SEEDS.filter(s=>res[s][a]);return ok.reduce((x,s)=>x+res[s][a][k],0)/Math.max(1,ok.length);};
console.log(`descriptive: twin gaps |L-LP| S ${Math.abs(mean('L','S')-mean('LP','S')).toFixed(3)}, |B-BP| S ${Math.abs(mean('B','S')-mean('BP','S')).toFixed(3)}; B-L mean S ${(mean('B','S')-mean('L','S')).toFixed(3)}, K ${(mean('B','K')-mean('L','K')).toFixed(1)}`);
console.log('\nVERDICT: '+(go.length?'GO - SCORE CAN MOVE (arms '+go.join(',')+')':'NO-GO - FLOOR: no chemistry arm, lean, big or rich, lifts S late off zero; the metric cannot rank interventions on this core'));
