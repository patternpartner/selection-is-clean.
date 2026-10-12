// lab/fine/score.js - FINE stage 1 (lab/FINE.md). S = used-novelty.js with MIN 0.002, WIN 10, LAG 2 (locked before runs).
'use strict';
const fs=require('fs'),path=require('path'),UN=require('../used-novelty.js');
const DIR=process.argv[2],SEEDS=['7931','7932','7933'],ARMS=['L','LP','B','BP'],res={},miss=[];
for(const s of SEEDS){res[s]={};for(const a of ARMS){const f=path.join(DIR,a+'.'+s+'.jsonl');if(!fs.existsSync(f)){miss.push(a+'.'+s);continue;}
 const rows=UN.readRows(f).filter(r=>r.chem),LQ=rows.slice(Math.floor(rows.length*3/4)),N=LQ.reduce((x,r)=>x+r.N,0)/Math.max(1,LQ.length);
 const v=UN.S(rows,{WIN:10,MIN:0.002,LAG:2});res[s][a]={S:v.late,Smid:v.middle,ever:v.usedEver,collapse:N<200,N:Math.round(N)};
 const r=res[s][a];console.log(`${s} ${a.padEnd(2)} N ${r.N}${r.collapse?' COLLAPSED':''} | S ${r.S.toFixed(2)} (mid ${r.Smid.toFixed(2)}) usedEver ${r.ever}`);}}
if(miss.length)console.log('MISSING: '+miss.join(' '));
const ok=a=>SEEDS.filter(s=>res[s][a]&&!res[s][a].collapse),mean=a=>{const k=ok(a);return k.reduce((x,s)=>x+res[s][a].S,0)/Math.max(1,k.length);};
const moves=a=>{const k=ok(a);return k.length>=2&&k.every(s=>res[s][a].S>0)&&mean(a)>=0.5;};
const both=SEEDS.filter(s=>['B','L'].every(a=>res[s][a]&&!res[s][a].collapse)),bl=both.filter(s=>res[s].B.S!==res[s].L.S).length;
console.log(`B moves ${moves('B')} (mean ${mean('B').toFixed(3)}); L moves ${moves('L')} (mean ${mean('L').toFixed(3)}); B!=L on ${bl}/${both.length}; twins BP ${mean('BP').toFixed(3)} LP ${mean('LP').toFixed(3)}`);
const go=moves('B')&&both.length>=2&&bl>=2;
console.log('\nVERDICT: '+(go?'GO - FINE SCORE MOVES on CHEM_BIG and separates it from lean -> stage 2 (Locksmith on CHEM_BIG vs its nulls, fine S)':'NO-GO - FINE FLOOR: delete lab/fine; next step changes the chemistry, not the metric'));
