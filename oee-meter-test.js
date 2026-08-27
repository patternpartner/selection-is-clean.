// Assertions for the #131 open-endedness meter (v2). Runs the REAL flushEpoch against a hand-built
// atom bank and checks the two things v1 got wrong, plus the contracts the fix depends on:
//   - a uaLocalStep CONSTANT jitter must not change the canonical key at all;
//   - a uaLocalStep VARIABLE swap changes the key but inherits the replaced expression's `uses`,
//     so it must not mint an innovation until the new computation is shown to actually run;
//   - identifiers containing digits (Math.log1p, Math.atan2) must survive canonicalisation distinct;
//   - the first flush adopts the standing bank as history, never as innovation;
//   - resetOeeRuntime() clears the runtime history, which decodeGenome relies on.
// Exits non-zero on any failure.  node oee-meter-test.js
const fs=require('fs');
require('./harness-env.js')(globalThis);
const src=fs.readFileSync(process.env.INDEX||(__dirname+'/engine.html'),'utf8');
const code=src.match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/m2-sim.js');m.filename='/tmp/m2-sim.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const K=uaOeeKey;
  const out={};
  // 1) constant jitter must NOT change the key; a variable swap MUST.
  const base='(a*1.25)+Math.tanh(b-0.50)';
  out.constJitter_sameKey = K(base)===K('(a*1.19)+Math.tanh(b-0.73)');
  out.varSwap_newKey      = K(base)!==K('(c*1.25)+Math.tanh(b-0.50)');
  out.structure_newKey    = K(base)!==K('(a*1.25)*Math.tanh(b-0.50)');
  // 2) identifiers containing digits must not be mangled into each other.
  out.log1p_vs_atan2_distinct = K('Math.log1p(a)')!==K('Math.atan2(a,b)');
  out.log1p_survives          = K('Math.log1p(a)')!==K('Math.exp(a)');
  // 3) per-epoch delta gating, against the two things uaLocalStep actually does.
  const EP=i=>({idx:i,n:1,popSum:10,popPeak:1,extStart:0,fitSum:0,clPeak:0,mut:0,popMin:1,divSum:0});
  genome.userAtoms=[{expression:'(a*1.25)+b',compiled:null,failed:false,uses:5,state:0,creditTrace:0}];
  flushEpoch(EP(0));                       // first sighting -> baseline only
  const n0=oeeNovel;
  genome.userAtoms[0].uses=12;             // it runs, but it was already in the bank at seed time
  flushEpoch(EP(1));
  // Contract: the first flush adopts the standing bank as HISTORY. An atom already present when
  // observation began is not an innovation no matter how much it later runs — that is the
  // pre-existing-atoms guard, and it is why a mid-run import must reset the runtime state.
  out.seedFlushAbsorbsStandingBank = (oeeNovel===n0);
  const n1=oeeNovel;
  // uaLocalStep branch A: constant jitter. New string, SAME canonical key, uses preserved.
  genome.userAtoms[0].expression='(a*1.19)+b';
  flushEpoch(EP(2));
  out.constJitter_mintsNothing = (oeeNovel===n1);
  // uaLocalStep branch B: variable swap. New string AND new key, uses still preserved, nothing ran.
  // This is the case that slipped through the first cut of the fix.
  genome.userAtoms[0].expression='(c*1.19)+b';
  flushEpoch(EP(3));
  out.varSwapWithoutExecution_mintsNothing = (oeeNovel===n1);
  genome.userAtoms[0].uses=20;             // now the swapped computation actually runs
  flushEpoch(EP(4));
  out.varSwapThenExecution_mintsInnovation = (oeeNovel===n1+1);
  out.oeeVer = oeeVer;
  // 4) load must clear the runtime history
  out.resetClearsSeen = (function(){ resetOeeRuntime(); return __oeeSeen===null&&__oeePending===null&&__oeeLastUses===null; })();
  return out;
};`,m.filename);
const r=globalThis.__t();
let bad=0;
for(const [k,v] of Object.entries(r)){ const ok=(k==='oeeVer')?v===2:v===true; if(!ok)bad++; console.log((ok?'  PASS  ':'  FAIL  ')+k+' = '+v); }
console.log(bad? '\n'+bad+' FAILED' : '\nall assertions pass');
process.exit(bad?1:0);
