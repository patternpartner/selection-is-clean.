// DOES MUTATION RATE CAUSE PERSISTENCE? — the intervention the field could not provide.
//
// WHY THIS EXISTS. The nine-universe field measurement showed a correlation between low mutationRate
// and #130's persistence count: Pearson r = -0.712 across eight universes, which technically clears
// p<.05 (|r|>0.71 at n=8). It should not be believed, for four reasons, and only the last one is
// fixable by more data:
//   1. Remove u7 and r FLIPS SIGN, -0.712 -> +0.288. u7 held 12 of the field's 16 persistences. A
//      result that inverts on one of eight points describes u7, not mutation rates.
//   2. 93% of the outcome had not arrived: 208 candidates pending against 16 resolved.
//   3. The nine trade migrants continuously, so they are not independent draws. Effective n < 8.
//   4. THE REAL ONE: nobody SET those rates. They evolved, so mutationRate is entangled with
//      everything that evolved beside it — u7 also had the lowest growth bias, the most atoms and the
//      highest novelty. A hundred observed universes would carry the identical confound.
//
// So: set the rate, hold it, and look. Three rates spanning and exceeding the observed field range
// (0.0297..0.0764), four seeds each, run past the persistence lag.
//
// WHAT IS BEING HELD, stated plainly: mutationRate is PINNED every tick. That also suppresses the
// post-extinction mutation burst, which is part of the normal machinery (#148). So this measures
// "does a creature held at rate X accumulate persistent computations", NOT "does the evolved rate
// matter". Those are different questions and this rig answers only the first.
//
//   RATE=0.06 SEED=1 TICKS=40000 node harness-mutrate.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/mr.js'); m.filename='/tmp/mr.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__run=function(ticks,rate){
  for(let s=0;s<ticks;s++){
    globalThis.__detMs+=5;
    genome.mutationRate=rate;          // the intervention: pinned, every tick
    try{loop();}catch(e){}
  }
  const uas=genome.userAtoms||[];
  const links=(function(){const o=genome.opStacks;if(!o)return 0;let n=0;for(const k in o)n+=o[k].length;return n;})();
  const D=(oeeLog||[]).filter(r=>Array.isArray(r)&&(r[1]|0)>0).map(r=>r[1]);
  return {
    ticks:genome.totalTicks|0, N:N, gen:genome.generation|0, ext:genome.extinctions|0,
    atoms:uas.length, adopted:uas.filter(a=>(a.uses|0)>0).length,
    slots:(genome.boundOpcodes||[]).length, links:links, dims:genome.tendDims|0,
    novel:oeeNovel|0, persist:oeePersist|0, pending:(__oeePending||[]).length,
    epochs:(oeeLog||[]).length, meanD:D.length?+(D.reduce((s,v)=>s+v,0)/D.length).toFixed(1):0,
    fit:+((genome.peakFitness||0).toFixed(3)),
    lastPop:(genome.epochs||[]).length?(genome.epochs[genome.epochs.length-1][1]|0):0
  };
};`,'/tmp/mr.js');
const RATE=parseFloat(process.env.RATE||'0.06');
const TICKS=parseInt(process.env.TICKS||'40000',10);
const r=globalThis.__run(TICKS,RATE);
r.rate=RATE; r.seed=parseInt(process.env.SEED||'1',10);
console.log(JSON.stringify(r));
