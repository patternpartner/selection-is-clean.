// #377 design: what do the creatures of a TASKS world aim at? Run the default world, then at given ticks census every living
// creature's aims (sense, weight, tolerance) and whether the sense moved and how near the target it sits. Draws nothing.
//   SEED=s TASKS=1 TICKS=3000 AT=500,1500,3000 node lab/port/probe-aims.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(ROOT+'/harness-env.js').applyKnobs(globalThis); require(ROOT+'/harness-env.js')(globalThis);
const code=fs.readFileSync(ROOT+'/engine.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/aimc.js'); m.filename='/tmp/aimc.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__C=function(ticks,at){ for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; loop(); if(!at.includes(t))continue;
  const names=AIM_SENSES.map(e=>e.n).concat(Array.from({length:MEM_SIZE},(_,q)=>'mem'+q)); const by={}; let alive=0, na=0, memW=0;
  for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const as=aimsOf(pGenome[i]); if(!as)continue;
    for(const a of as){ if(!a)continue; na++; const n=aimSenseCount(), kk=(((a.sense|0)%n)+n)%n, nm=names[kk]; const w=Math.max(0,Math.min(AIM_WEIGHT_MAX,+a.weight||0));
      const sv=aimSense(a.sense|0,i), sp=aimSpan(a.sense|0), tol=Math.max(AIM_TOL_LO,Math.min(AIM_TOL_HI,+a.tol||1));
      const sat=sv===null?0:Math.max(0,1-Math.abs(sv-(+a.target||0))/(sp||1)/tol); const mv=pAimMoved[i*AIM_NSENSE+(kk%AIM_NSENSE)];
      const b=by[nm]||(by[nm]={n:0,w:0,sat:0,mv:0,pay:0}); b.n++; b.w+=w; b.sat+=sat; b.mv+=mv; b.pay+=w*(sat*2/(1+tol)*mv-AIM_TAX); } }
  const rows=Object.entries(by).sort((a,b)=>b[1].n-a[1].n).map(([k,b])=>k+': n '+b.n+' w '+(b.w/b.n).toFixed(2)+' sat '+(b.sat/b.n).toFixed(2)+' moved '+(b.mv/b.n).toFixed(2)+' netPayPerAim '+(b.pay/b.n).toFixed(3));
  let am=0; for(let i=0;i<N;i++) if(palive[i])am+=amp[i];
  console.log(JSON.stringify({tick:t, alive, aimsPerCreature:+(na/alive).toFixed(2), meanAmp:+(am/alive).toFixed(3), deathThreshold:genome.deathThreshold}));
  console.log('  '+rows.join('\\n  ')); } };`, m.filename);
globalThis.__C(+(process.env.TICKS||2000), (process.env.AT||'500,1000,2000').split(',').map(Number));
