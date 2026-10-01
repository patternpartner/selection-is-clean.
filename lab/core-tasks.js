// lab/core-tasks.js - what the TASKS worlds (#290) computed, over time.
// A function (one of the 256 three-input boolean functions, named by its truth table) is ACTIVE in a window when it earned
// at least MIN of the window's task income. Each is graded by its NAND FORMULA SIZE: the fewest NAND gates in a formula
// that computes it from the three inputs (dynamic programming over all pairs; a formula cannot share a gate, so this is an
// upper bound on circuit size - NOT is 1, NAND 1, AND 2, OR 3, XOR 4, EQU 5 for two-input functions). Reported per window:
// functions active, how many for the first time, the hardest active, task income, and with VIRUS the virions.
//   WIN=30 [MIN=0.01] node lab/core-tasks.js t.1.all.jsonl
'use strict';
const fs=require('fs');
const E=process.env, WIN=+(E.WIN||30), MIN=+(E.MIN||0.01);
// formula size by relaxation: inputs a=0xF0, b=0xCC, c=0xAA cost 0; NAND(x,y) costs size(x)+size(y)+1
const SZ=new Float64Array(256).fill(Infinity); SZ[0xF0]=0; SZ[0xCC]=0; SZ[0xAA]=0;
for(let changed=true;changed;){ changed=false; for(let x=0;x<256;x++){ if(SZ[x]===Infinity)continue; for(let y=x;y<256;y++){ if(SZ[y]===Infinity)continue; const z=(~(x&y))&255, s=SZ[x]+SZ[y]+1; if(s<SZ[z]){ SZ[z]=s; changed=true; } } } }
module.exports={SZ};
if(require.main===module) for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.tasks);
  const ever=new Set(), out=[], newPer=[]; let hardestEver=0;
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN), m=new Map(); let inc=0, vir=0;
    for(const r of W){ for(const [T,v] of r.tasks.flux) m.set(T,(m.get(T)||0)+v/W.length); inc+=r.tasks.income/W.length; vir+=(r.vir?r.vir.virions:0)/W.length; }
    const act=[...m.entries()].filter(([T,v])=>v>=MIN).sort((a,b)=>b[1]-a[1]); const nw=act.filter(([T])=>!ever.has(T)); for(const [T] of act)ever.add(T); newPer.push(nw.length);
    const hard=act.length?Math.max(...act.map(([T])=>SZ[T])):0; hardestEver=Math.max(hardestEver,hard);
    out.push(`  t${W[0].t}-${W.at(-1).t} gen~${W.at(-1).meanGen} N~${Math.round(W.reduce((a,r)=>a+r.N,0)/W.length)} | active ${act.length} (new ${nw.length}: ${nw.slice(0,6).map(([T,v])=>T.toString(16)+'/s'+SZ[T]).join(' ')}) | hardest s${hard} | income ${inc.toFixed(0)}${rows[0].vir?' | virions '+vir.toFixed(0):''}`); }
  console.log('==',f.split('/').pop(),'| functions ever active',ever.size,'| hardest ever (formula size)',hardestEver,'| new per window',newPer.join(','));
  console.log(out.join('\n'));
}
