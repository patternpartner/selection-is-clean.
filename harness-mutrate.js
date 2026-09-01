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
// FIRST RUN WAS UNDERPOWERED, and it is recorded here rather than quietly re-run. Twelve creatures
// from scratch at 40,000 ticks produced meanD 1.3-2.8 and 2-7 novel computations each, against the
// live field's 24-39 and 24-44. With ~4 novel events per run and a 3-epoch lag out of 7 epochs,
// persistence could not have appeared at ANY rate, and it did not. That is a null from a rig with no
// power, not evidence about mutation. The run was sized by ticks without checking it would generate
// enough events to measure — the same error class this notebook keeps recording, one level up.
//
// SEED_FROM fixes it: start every arm from the SAME mature genome, so all twelve begin in the state
// where novelty is actually happening, and the only difference between them is the pinned rate and
// the PRNG stream. That is what a controlled experiment looks like here.
//
//   RATE=0.06 SEED=1 TICKS=40000 node harness-mutrate.js
//   RATE=0.06 SEED=1 TICKS=40000 SEED_FROM=/path/to/genome.json node harness-mutrate.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/mr.js'); m.filename='/tmp/mr.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__seedFrom=function(txt){
  if(!decodeGenome(txt))return false;
  N=0; const n=Math.min(300,(W*H/3000)|0);
  for(let i=0;i<n;i++) addParticle(Math.random()*W,Math.random()*H,randomTendency(),false);
  return true;
};
globalThis.__run=function(ticks,rate){
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
if(process.env.SEED_FROM){
  const ok=globalThis.__seedFrom(fs.readFileSync(process.env.SEED_FROM,'utf8'));
  if(!ok){ console.log(JSON.stringify({error:'seed genome failed to load'})); process.exit(1); }
}
const r=globalThis.__run(TICKS,RATE);
r.seededFrom=process.env.SEED_FROM?path.basename(process.env.SEED_FROM):null;
r.rate=RATE; r.seed=parseInt(process.env.SEED||'1',10);
console.log(JSON.stringify(r));
