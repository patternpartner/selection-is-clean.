// #329 manipulation check for REPL_DIET: how the living are spread across the diet bands their programs compute, every
// SAMPLE ticks, with the population and the number of distinct exact programs in each band. Reads state only; draws nothing.
//   SEED=s TICKS=10000 REPL=1 REPL_DIET=4 [NULLSHIFT=k] node lab/inlife/probe-diet.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/diet-sim.js'); m.filename='/tmp/diet-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__Q=function(ticks,every,nullshift){ const rows=[]; for(let q=0;q<nullshift;q++) Math.random();
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if(t%every===0){ const K=DIET_K||1, n=new Array(K).fill(0), progs=Array.from({length:K},()=>new Set()); let alive=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const b=DIET_K?pBand[i]:0; n[b]++; progs[b].add((pProg[i]||[]).map(x=>x?(x[0]|0):-1).join('.')); }
      rows.push({tick:t, alive, band:n, programsPerBand:progs.map(s=>s.size), bandsOccupied:n.filter(v=>v>=5).length}); } }
  return {K:DIET_K, rows}; };`, m.filename);
const r=globalThis.__Q(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'1000',10), parseInt(process.env.NULLSHIFT||'0',10)||0);
console.log(JSON.stringify({seed:process.env.SEED||'1', diet:process.env.REPL_DIET||'0', ...r}));
