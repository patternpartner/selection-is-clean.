// #394 - what does a harvest carry? The germline's program is copied every cadenceLineage ticks from the living creature with the
// most AMPLITUDE (selfLearnFromBest). Under one currency amplitude is vestigial (#393). This runs one world to tick T and writes
// two genomes from the SAME world state by running the engine's own picks (selfLearnFromBest, decideFromRealWinner) both ways:
// <seed>_AMP.genome with GERM_STORE off (most amplitude), then, with what they wrote put back, <seed>_VIS.genome with GERM_STORE on
// (richest in the store). It reports how often each of the two creatures
// was paid. Each genome is then booted with probe-reload.js LOAD=. Draws nothing before tick T.
// NEEDS the GERM_STORE knob, which #394's verdict removed: run it with INDEX= pointing at engine.html from commit f1b1843.
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
  /* the engine's own two picks, run both ways from the same state: amplitude first, then everything they wrote is put back and the store pick runs */
  const AX=DECIDE_PHYS_AXES.map(x=>x[0]), keep={prog:genome.vmProgram, ax:AX.map(k=>genome[k]), pf:genome.prevDecideFitness, dc:genome.decisionConfidence, nd:Array.from(lastShadowNudgeDir)};
  GERM_STORE=false; selfLearnFromBest(); decideFromRealWinner(); const gA=encodeGenome(); const germIsAmp=key(genome.vmProgram)===key(pProg[a]);
  genome.vmProgram=keep.prog; AX.forEach((k,q)=>genome[k]=keep.ax[q]); genome.prevDecideFitness=keep.pf; genome.decisionConfidence=keep.dc; for(let q=0;q<keep.nd.length;q++)lastShadowNudgeDir[q]=keep.nd[q];
  GERM_STORE=true; selfLearnFromBest(); decideFromRealWinner(); const gV=encodeGenome(); const germIsStore=key(genome.vmProgram)===key(pProg[v]);
  fs.writeFileSync(path.join(dir,seed+'_AMP.genome'),gA); fs.writeFileSync(path.join(dir,seed+'_VIS.genome'),gV);
  console.log(JSON.stringify({seed, tick:T, alive:n, shareEverPaid:+(paid/n).toFixed(3), ampBest:d(a), storeBest:d(v), ampGermIsAmpBest:germIsAmp, storeGermIsStoreBest:germIsStore, storeDeath:STORE_DEATH, samePick:a===v, sameProgram:key(pProg[a])===key(pProg[v]), lenA:gA.length, lenV:gV.length})); };`, m.filename);
const dir=process.env.OUTDIR||'.'; fs.mkdirSync(dir,{recursive:true});
globalThis.__G(parseInt(process.env.T||'3000',10), dir, process.env.SEED||'1', fs, path);
