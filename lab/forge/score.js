// lab/forge/score.js - FORGE deciding round (lab/FORGE.md). S = used-novelty.js MIN 0.002, WIN 10, LAG 2, late third (locked).
'use strict';
const fs=require('fs'),path=require('path'),UN=require('../used-novelty.js');
const DIR=process.argv[2],SEEDS=['7961','7962','7963'],ARMS=['X','XP','SH','B'],arms={},miss=[];
for(const s of SEEDS){arms[s]={};for(const a of ARMS){const f=path.join(DIR,a+'.'+s+'.jsonl');if(!fs.existsSync(f)){miss.push(a+'.'+s);continue;}
 const rows=UN.readRows(f).filter(r=>r.chem),LQ=rows.slice(Math.floor(rows.length*3/4)),N=LQ.reduce((x,r)=>x+r.N,0)/Math.max(1,LQ.length);
 const v=UN.S(rows,{WIN:10,MIN:0.002,LAG:2}),lig=LQ.reduce((x,r)=>x+r.chem.flux.filter(([k])=>k>=262144).reduce((y,[k,u])=>y+u,0),0)/Math.max(1,LQ.length);
 arms[s][a]={S:v.late,collapse:N<200};console.log(`${s} ${a.padEnd(2)} rows ${rows.length} N ${Math.round(N)}${N<200?' COLLAPSED':''} | S ${v.late.toFixed(3)} (mid ${v.middle.toFixed(3)}) usedEver ${v.usedEver} | late ligation share ${lig.toFixed(3)}`);}}
if(miss.length){console.log('MISSING: '+miss.join(' ')+'\nVERDICT: INCOMPLETE');process.exit(0);}
const b=UN.bar(arms),rd=SEEDS.filter(s=>!arms[s].X.collapse),mX=rd.reduce((x,s)=>x+arms[s].X.S,0)/Math.max(1,rd.length);
const moves=rd.length>=2&&rd.every(s=>arms[s].X.S>0)&&mX>=0.5;
console.log(JSON.stringify(b.per));console.log(`bar: wins ${b.wins}/${b.seeds} (need ${b.need}) rel ${b.rel.toFixed(3)} (>=1.10 ${b.relPass}) collapse [${b.collapse}] | X moves ${moves} (mean S ${mX.toFixed(3)}) | means ${JSON.stringify(b.means)}`);
console.log('\nVERDICT: '+(b.pass&&moves?'GO - FORGE: generative ligation chemistry lifts sticky income novelty past every null (candidate only; flag stays off)':'NO-GO - FORGE KILLED: delete FORGE from oee-core.js and lab/forge runners; branch keeps the record'));
