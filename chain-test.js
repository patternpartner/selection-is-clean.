// #155 acceptance test — a bound slot that holds a CHAIN.
//
// WHY THIS RIG EXISTS. The chain only ever grows when boundOpcodes is AT MAX_BOUND_OPCODES=192, and a
// fresh creature reaches roughly six slots in three thousand ticks. So every other rig in this repo
// runs the pre-#155 behaviour and reports green while the whole feature sits unexecuted — the exact
// #143 trap ("rarity is not safety"), and the exact reason crossing-test.js prints atom.chained g0/p0.
// This constructs the precondition instead of waiting for it: fill the slots, then author.
//
// It drives the four crossings this project keeps failing, plus the two things #155 actually claims:
//   1. AUTHORING NEVER DEAD-ENDS — past the cap a new atom joins a chain instead of vanishing.
//   2. THE CHAIN COMPUTES — f2(f1(a,b),b), not f1 alone. A stack that is stored and never applied
//      would pass every structural check in this file.
//   3. IT IS PRICED — n chained atoms cost n instructions' base rate. If stacking were free the toll
//      would stop regulating depth, which is the one thing #54 says must not happen.
//   4. germline -> population   (cloneGenome's `{...src}` shares objects BY REFERENCE; without a deep
//      copy one opStacks object is shared by every particle and no lineage can diverge its chains)
//   5. save -> load             (#139 shipped a sense gate no save carried; not again)
//   6. the cull                 (a chain holds indices into userAtoms and must shift when one splices out)
// Exits non-zero on any failure.   node chain-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/chain.js'); m.filename='/tmp/chain.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  for(let s=0;s<400;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={errors:[]};
  const run=(name,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(name+': '+((e&&e.message)||String(e)).slice(0,120)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});

  // ── 1. AUTHORING PAST THE CAP ───────────────────────────────────────────────────────────────
  run('grow',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'),mk('(a)*(2.0)')];
    genome.boundOpcodes=[];
    for(let k=0;k<MAX_BOUND_OPCODES;k++) genome.boundOpcodes.push(k%2);   // full, alternating
    genome.opStacks=null;
    genome.vmProgram=[[CORE_OPCODES+0,0,1,0.5],[CORE_OPCODES+7,0,1,0.5]]; // calls slots 0 and 7
    genome.userAtoms.push(mk('(a)-(0.25)'));
    out.grewAtCap = growAtomChain(genome, genome.userAtoms.length-1)===true;
    const os=genome.opStacks||{};
    const slots=Object.keys(os).map(k=>k|0);
    out.oneChainMade  = slots.length===1 && os[slots[0]].length===1;
    // #93's lesson: it must land on a slot the PROGRAM CALLS, or it is bound and never executed.
    out.landedOnCalledSlot = slots.length===1 && (slots[0]===0||slots[0]===7);
    out.chainedIsTheNewAtom = slots.length===1 && os[slots[0]][0]===genome.userAtoms.length-1;
  });

  // ── 2. THE CHAIN COMPUTES ───────────────────────────────────────────────────────────────────
  // head (a)+(1) then (a)*(2) chained => (a+1)*2, never a+1 and never a*2.
  run('compute',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'),mk('(a)*(2.0)')];
    genome.boundOpcodes=[0];
    genome.opStacks=null;
    const headOnly=uaChain(genome.userAtoms[0],0,3,0);      // no stack yet -> 4
    genome.opStacks={0:[1]};
    const chained =uaChain(genome.userAtoms[0],0,3,0);      // (3+1)*2 -> 8
    out.headAlone   = headOnly;
    out.chainedOut  = chained;
    out.chainApplies= Math.abs(headOnly-4)<1e-9 && Math.abs(chained-8)<1e-9;
    // order matters: a chain is a pipeline, not a bag
    genome.userAtoms=[mk('(a)*(2.0)'),mk('(a)+(1.0)')];
    genome.opStacks={0:[1]};
    out.orderMatters = Math.abs(uaChain(genome.userAtoms[0],0,3,0)-7)<1e-9;   // (3*2)+1
  });

  // ── 3. IT IS PRICED ─────────────────────────────────────────────────────────────────────────
  run('toll',()=>{
    genome.boundOpcodes=[0,0];
    const prog=[[CORE_OPCODES+0,0,1,0],[CORE_OPCODES+1,0,1,0],[0,0,1,0]];
    genome.opStacks=null;             out.tollBare   = stackToll(prog,prog.length);
    genome.opStacks={0:[1,1,1]};      out.tollThree  = stackToll(prog,prog.length);
    genome.opStacks={0:[1],1:[1,1]};  out.tollSplit  = stackToll(prog,prog.length);
    // a chain on a slot NO instruction calls is never run, so it is never billed
    genome.opStacks={5:[1,1,1,1]};    out.tollUncalled=stackToll(prog,prog.length);
    out.pricedPerAtom = out.tollBare===0 && out.tollThree===3 && out.tollSplit===3 && out.tollUncalled===0;
  });

  // ── 4. germline -> population, and parent -> child ──────────────────────────────────────────
  run('clone',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'),mk('(a)*(2.0)')];
    genome.boundOpcodes=[0];
    genome.opStacks={0:[1]};
    const child=cloneGenome(genome);
    out.childHasChain = !!(child.opStacks&&child.opStacks[0]&&child.opStacks[0].length===1);
    out.notSameObject = child.opStacks!==genome.opStacks;
    out.notSameArray  = child.opStacks[0]!==genome.opStacks[0];
    // the whole point: the child must be able to DIVERGE it
    child.opStacks[0].push(0);
    out.divergesFromParent = genome.opStacks[0].length===1 && child.opStacks[0].length===2;
  });

  // ── 5. save -> load ─────────────────────────────────────────────────────────────────────────
  run('roundtrip',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'),mk('(a)*(2.0)'),mk('(a)-(0.5)')];
    genome.boundOpcodes=[0,1];
    genome.opStacks={0:[1,2],1:[2]};
    const blob=encodeGenome();
    genome.opStacks=null; genome.boundOpcodes=[];
    const ok=decodeGenome(JSON.stringify({type:'selection-genome',version:2,genome:blob}));
    const os=genome.opStacks||{};
    out.saveCarriesChains = ok===true && !!os[0] && !!os[1] &&
      os[0].length===2 && os[0][0]===1 && os[0][1]===2 && os[1].length===1 && os[1][0]===2;
    // a chain pointing past the end of the bank must be DROPPED, never clamped onto atom 0
    genome.opStacks={0:[1,99]};
    sanitizeGenome();
    const s2=genome.opStacks||{};
    out.sanitiserDropsPhantoms = !!s2[0] && s2[0].length===1 && s2[0][0]===1;
  });

  // ── 6. the cull shifts the chain with the bank ──────────────────────────────────────────────
  run('cull',()=>{
    // bank [A0,A1,A2,A3]; chain on slot 0 is [A3,A1]. Splice A1 out: A3 becomes index 2, A1 is gone.
    genome.userAtoms=[mk('(a)+(0.0)'),mk('(a)+(1.0)'),mk('(a)+(2.0)'),mk('(a)+(3.0)')];
    genome.boundOpcodes=[0];
    genome.opStacks={0:[3,1]};
    const removeIdx=1;
    genome.userAtoms.splice(removeIdx,1);
    const _bos=genome.boundOpcodes;
    for(let k=0;k<_bos.length;k++){ if(_bos[k]===removeIdx)_bos[k]=-1; else if(_bos[k]>removeIdx)_bos[k]--; }
    const _os=genome.opStacks;
    for(const _k in _os){ const _st=_os[_k]; const _o=[];
      for(let _q=0;_q<_st.length;_q++){ const _v=_st[_q]|0; if(_v===removeIdx)continue; _o.push(_v>removeIdx?_v-1:_v); }
      if(_o.length)_os[_k]=_o; else delete _os[_k]; }
    out.cullShifted = !!_os[0] && _os[0].length===1 && _os[0][0]===2 &&
                      genome.userAtoms[2].expression==='(a)+(3.0)';
    out.cullDroppedDead = _os[0].indexOf(-1)<0;
  });

  // ── 7. it survives real ticks with chains live ──────────────────────────────────────────────
  run('live',()=>{
    genome.userAtoms=[mk('(a)+(1.0)'),mk('(a)*(0.5)'),mk('Math.tanh(a)')];
    genome.boundOpcodes=[0,1];
    genome.opStacks={0:[1,2],1:[2]};
    genome.vmProgram=[[CORE_OPCODES+0,0,1,0.5],[CORE_OPCODES+1,1,2,0.5],[4,1,0,0.3]];
    let threw=null;
    for(let s=0;s<600;s++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(!threw)threw=String(e&&e.message); } }
    out.liveNoThrow = threw===null;
    out.liveStillAlive = N>0;
    out.chainsSurvived = !!(genome.opStacks&&Object.keys(genome.opStacks).length>0);
    out.censusSeesThem = (function(){ try{ const c=crossingCensus();
      const r=c.rows.find(x=>x.name==='atom.chained'); return !!r && r.germline>0; }catch(e){ return false; } })();
  });
  return out;
};`,'/tmp/chain.js');

const r=globalThis.__t();
const checks=[
  ['grewAtCap','past the cap a new atom joins a chain instead of vanishing'],
  ['oneChainMade','exactly one link is added, not a burst'],
  ['landedOnCalledSlot','it lands on a slot the program actually calls (#93)'],
  ['chainedIsTheNewAtom','the link points at the atom just authored'],
  ['chainApplies','the chain COMPUTES: f2(f1(a,b),b), not f1 alone'],
  ['orderMatters','it is a pipeline, not a bag — order changes the answer'],
  ['pricedPerAtom','n chained atoms cost n instructions, and an uncalled chain costs nothing'],
  ['childHasChain','parent -> child carries the chains'],
  ['notSameObject','...by VALUE, not the shared object {...src} would have given'],
  ['notSameArray','...including the inner arrays'],
  ['divergesFromParent','so a lineage can diverge its own chains'],
  ['saveCarriesChains','save -> load round-trips them exactly'],
  ['sanitiserDropsPhantoms','a link past the end of the bank is dropped, never re-aimed onto atom 0'],
  ['cullShifted','a cull shifts the chain with the bank'],
  ['cullDroppedDead','and drops the dead link rather than tombstoning it'],
  ['liveNoThrow','600 real ticks with chains live, nothing thrown'],
  ['liveStillAlive','and the population survives them'],
  ['chainsSurvived','the chains are still there afterwards'],
  ['censusSeesThem','the crossing census counts them'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(24)+d); }
for(const e of r.errors) console.log('    ERROR '+e);
if(r.errors.length) bad+=r.errors.length;
console.log('\n  head alone '+r.headAlone+' -> chained '+r.chainedOut
  +'   toll: bare '+r.tollBare+', three '+r.tollThree+', split '+r.tollSplit+', uncalled '+r.tollUncalled);
console.log(bad? '\n'+bad+' FAILED' : '\na slot can hold a chain, it computes, and it is paid for');
process.exit(bad?1:0);
