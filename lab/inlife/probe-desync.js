// Does op 225 (PROG_LATERAL_COPY) ever leave a particle running a program its children will not inherit?
// pProg[i] is what the VM runs; addParticle gives a child pGenome[parent].vmProgram. They are the same array until
// op 225 does pProg[i]=cloneProg(pProg[j]) (engine.html, #80's note above seedAtomIntoParticle). This counts, every
// SAMPLE ticks, the living particles where they are no longer the same array, and how many of those run a program
// that differs in content from the inherited one. Reads state only; draws nothing.
//   SEED=1 TICKS=6000 [REPL=1] node lab/inlife/probe-desync.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/desync-sim.js'); m.filename='/tmp/desync-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks,every){ const rows=[];
  for(let s=1;s<=ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if(s%every===0){ let alive=0, split=0, differ=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const g=pGenome[i];
        if(g&&pProg[i]!==g.vmProgram){ split++; if(JSON.stringify(pProg[i])!==JSON.stringify(g.vmProgram))differ++; } }
      rows.push({tick:s,alive,split,differ}); } }
  return rows; };`, m.filename);
const rows=globalThis.__t(parseInt(process.env.TICKS||'6000',10), parseInt(process.env.SAMPLE||'500',10));
console.log(JSON.stringify({seed:process.env.SEED||'1', repl:process.env.REPL||'0', rows}));
