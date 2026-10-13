// probe12 (exploratory, no rule): lineages minted after T, by source tag, BLANK vs NUDGE, one seed.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p12.js'); m.filename='/tmp/p12.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p12=function(MODE,K,T,END){ const src=new Map(); let on=false; const oL=createLineage;
  createLineage=function(p,s){ if(on)src.set(s,(src.get(s)||0)+1); return oL.apply(this,arguments); };
  for(let t=1;t<=END;t++){ loop(); if(t===T){ on=true; if(MODE==='NUDGE'){ for(let z=0;z<K;z++)Math.random(); } else { for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } } }
    if(MODE==='BLANK'&&t>T&&(t-T)%20===0){ for(let i=0;i<N;i++){ if(palive[i]&&pGenome[i]&&pProg[i]&&pProg[i].length>0){ const c=[]; pProg[i]=c; pGenome[i].vmProgram=c; } } } }
  return Object.fromEntries(src); };
`, '/tmp/p12.js');
console.log(JSON.stringify({seed:process.env.SEED,mode:process.env.MODE,k:process.env.K,src:globalThis.__p12(process.env.MODE,+(process.env.K||0),1500,4000)}));
