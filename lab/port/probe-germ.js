// #394 - what does a harvest carry? The germline's program is copied every cadenceLineage ticks from the living creature with the
// most AMPLITUDE (selfLearnFromBest). Under one currency amplitude is vestigial (#393). This runs one world to tick T and writes
// two genomes from the SAME world state: <seed>_AMP.genome, the germline as the engine holds it, and <seed>_VIS.genome, the same
// germline with its program replaced by that of the creature richest in the store. It reports how often each of the two creatures
// was paid. Each genome is then booted with probe-reload.js LOAD=. Draws nothing before the save.
//   SEED=s T=3000 OUTDIR=d TASKS=1 node lab/port/probe-germ.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/germ-sim.js'); m.filename='/tmp/germ-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__G=function(T,dir,seed,fs,path){ let errs=0; const pays=new WeakMap();
  __taskOnPay=function(i,F,D){ const g=pGenome[i]; if(g)pays.set(g,(pays.get(g)||0)+1); };
  for(let t=1;t<=T;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,400)); } }
  let a=-1,bA=-1e9,v=-1,bV=-1e9,n=0,paid=0; for(let i=0;i<N;i++){ if(!palive[i]||!pProg[i])continue; n++; if(pays.get(pGenome[i]))paid++; if(amp[i]>bA){bA=amp[i];a=i;} if(pE[i]>bV){bV=pE[i];v=i;} }
  const key=p=>p.map(x=>x[0]+','+(x[1]|0)+','+(x[2]|0)).join(';'); const d=i=>({amp:+amp[i].toFixed(4), store:+pE[i].toFixed(4), age:page[i]|0, len:pProg[i].length, payments:pays.get(pGenome[i])||0});
  const gA=encodeGenome(); const keep=genome.vmProgram; const germIsAmp=key(keep)===key(pProg[a]);
  genome.vmProgram=cloneProg(pProg[v]); const gV=encodeGenome(); genome.vmProgram=keep;
  fs.writeFileSync(path.join(dir,seed+'_AMP.genome'),gA); fs.writeFileSync(path.join(dir,seed+'_VIS.genome'),gV);
  console.log(JSON.stringify({seed, tick:T, alive:n, shareEverPaid:+(paid/n).toFixed(3), ampBest:d(a), storeBest:d(v), germlineIsAmpBestProgram:germIsAmp, samePick:a===v, sameProgram:key(pProg[a])===key(pProg[v]), lenA:gA.length, lenV:gV.length})); };`, m.filename);
const dir=process.env.OUTDIR||'.'; fs.mkdirSync(dir,{recursive:true});
globalThis.__G(parseInt(process.env.T||'3000',10), dir, process.env.SEED||'1', fs, path);
