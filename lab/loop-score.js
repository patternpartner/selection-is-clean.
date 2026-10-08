// lab/loop-score.js - score the #292b deciding run against its pre-registered rules (OEE-NOTES #292b).
//   node lab/loop-score.js [RUNS=d2101,d2102,d2103]
// Adopted (module k at pause p, p > k): in assay-p.json every armed draw's s is above every disarmed draw's (verdict SELECTED)
// and Welch t >= 2.2. Prints each world's adoption matrix (rows: modules; columns: pauses; + adopted, - selected against,
// . neither, blank not yet installed) and R1: on each world, one of modules 8, 9, 10 adopted at some pause 9-11.
// R2 needs the knockouts from the pause-11 save and is scored by lab/loop-analyse.js KO=1; this prints which pairs qualify.
'use strict';
const fs=require('fs'), path=require('path');
const RUNS=(process.env.RUNS||'d2101,d2102,d2103').split(','), T_MIN=2.2, LATE=[8,9,10], LAST=11;
const adopted=r=>r.verdict==='SELECTED'&&r.t>=T_MIN, against=r=>r.verdict==='AGAINST'&&r.t<=-T_MIN;
let r1=0;
for(const run of RUNS){ const dir=path.join(__dirname,'loop',run); if(!fs.existsSync(dir)){ console.log(run+': no such run'); continue; }
  const inst=JSON.parse(fs.readFileSync(path.join(dir,'installed.json'),'utf8')).installed, A={};
  for(const f of fs.readdirSync(dir)){ const m=f.match(/^assay-(\d+)\.json$/); if(m)A[+m[1]]=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); }
  const pauses=Object.keys(A).map(Number).sort((a,b)=>a-b);
  console.log(`== ${run}: pauses assayed ${pauses.join(' ')}`);
  console.log('   module'.padEnd(16)+pauses.map(p=>String(p).padStart(3)).join(''));
  const ad=new Map();   // module k -> pauses at which it was adopted
  for(const x of inst){ const k=x.k; let line=`   ${k} ${x.name}`.padEnd(16);
    for(const p of pauses){ if(p<=k){ line+='   '; continue; } const r=A[p].rows.find(y=>y.name===x.name&&y.id===k-1)||A[p].rows.find(y=>y.name===x.name);
      const c=!r?'?':adopted(r)?'+':against(r)?'-':'.'; if(c==='+'){ if(!ad.has(k))ad.set(k,[]); ad.get(k).push(p); } line+=c.padStart(3); }
    console.log(line); }
  const late=LATE.filter(k=>(ad.get(k)||[]).some(p=>p>=9&&p<=LAST));
  const done=pauses.includes(LAST);
  console.log(`   R1: late modules adopted ${late.length?late.map(k=>k+' ('+inst[k-1].name+' at '+ad.get(k).join(',')+')').join(', '):'none'}${done?'':' (run not finished: pauses to '+LAST+' needed)'} => ${late.length?'MET':done?'NOT MET':'pending'}`);
  if(late.length)r1++;
  const ever=[...ad.keys()].map(k=>inst[k-1].name); console.log(`   adopted at some pause: ${ever.join(', ')||'none'}`); }
console.log(`R1 met on ${r1} of ${RUNS.length} worlds (the rule needs all ${RUNS.length})`);
