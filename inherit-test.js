// #140 acceptance test — what a CHILD actually inherits.
//
// This is the third crossing. Structure has to survive three of them, and each one has had its own
// silent failure this session:
//   germline -> population   #102/#130/#132b/#133b, caught by crossingCensus
//   save     -> load         #139b/#139c, caught by roundtrip-test
//   parent   -> child        this file
//
// cloneGenome does `{...src}`: scalars copy by value, objects copy BY REFERENCE. Deep-copying the
// heritable structures is therefore a manual list, and a manual list is a thing you forget. A
// heritable structure left shared cannot diverge — the whole population would edit one object — and
// nothing would report it, because sharing looks exactly like inheriting until two lineages disagree.
//
//   1. HERITABLE STRUCTURE IS OWNED. Every self-authored structure is deep-copied, and mutating the
//      child's copy leaves the parent's untouched.
//   2. THE JOURNALS STAY SHARED, deliberately — they are the self's bookkeeping, not the lineage's.
//      Asserted rather than assumed, so moving one across is a decision and not an accident.
//   3. BIRTH DOES NOT WALK THE CLOCK. mutateChildGenome perturbs genes; totalTicks, generation and
//      extinctions are records and must come through a birth unchanged.
// Exits non-zero on any failure.   node inherit-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/inh.js'); m.filename='/tmp/inh.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={};
  // give the parent one of everything, so nothing is empty-and-therefore-untestable
  genome.userAtoms=[{expression:'c+1',compiled:null,failed:false,uses:5,state:0}];
  genome.boundOpcodes=[0];
  genome.userEffects=[{t:2,m:1,s:0.6,nx:-1,ax:0,uses:4,creditTrace:0.2}];

  const MUST_OWN=['userAtoms','userEffects','boundOpcodes','vmProgram','objWeights',
                  'objCreditTrace','prevObjValues','rend','draw','fitnessSensors'];
  const MUST_SHARE=['eventLog','epochs','lineage','metaCredit','shadowScenarioBank'];

  const child=cloneGenome(genome);
  out.heritableIsOwned = MUST_OWN.every(k=>{
    const p=genome[k], c=child[k];
    if(p===undefined||p===null)return true;
    return typeof p!=='object' || p!==c;            // must NOT be the same object
  });
  out.journalsStayShared = MUST_SHARE.every(k=>{
    const p=genome[k], c=child[k];
    if(p===undefined||p===null)return true;
    return p===c;
  });
  // the sharp version of (1): editing the child must not reach the parent
  const beforeAtoms=genome.userAtoms.length, beforeVerbs=genome.userEffects.length,
        beforeBound=genome.boundOpcodes.length;
  child.userAtoms.push({expression:'zzz',compiled:null,failed:false,uses:0,state:0});
  child.userEffects.push({t:9,m:0,s:0.1,nx:-1,ax:-1,uses:0,creditTrace:0});
  child.boundOpcodes.push(7);
  child.vmProgram.push([0,0,0,0]);
  out.childEditsDoNotReachParent = genome.userAtoms.length===beforeAtoms
                                && genome.userEffects.length===beforeVerbs
                                && genome.boundOpcodes.length===beforeBound;
  // and the verb OBJECTS must be distinct, not the same objects in a copied array
  const c2=cloneGenome(genome);
  out.verbObjectsAreDistinct = genome.userEffects.every((e,i)=>e!==c2.userEffects[i]);
  out.atomObjectsAreDistinct = genome.userAtoms.every((a,i)=>a!==c2.userAtoms[i]);

  // (3) a birth must not walk the clock
  const watch=['totalTicks','generation','extinctions'];
  const before={}; for(const k of watch) before[k]=genome[k];
  let drifted=[];
  for(let trial=0;trial<300;trial++){
    const kid=mutateChildGenome(cloneGenome(genome));
    for(const k of watch)
      if(typeof kid[k]==='number' && kid[k]!==before[k] && drifted.indexOf(k)<0) drifted.push(k);
  }
  out.birthDoesNotWalkTheClock = drifted.length===0;
  out.detail={drifted, owned:MUST_OWN.filter(k=>genome[k]&&typeof genome[k]==='object').length,
              shared:MUST_SHARE.filter(k=>genome[k]&&typeof genome[k]==='object').length};
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'600',10));
const checks=[
  ['heritableIsOwned','every self-authored structure is deep-copied, not shared'],
  ['childEditsDoNotReachParent','editing a child leaves the parent alone'],
  ['verbObjectsAreDistinct','verbs are copied as objects, not aliased'],
  ['atomObjectsAreDistinct','atoms are copied as objects, not aliased'],
  ['journalsStayShared','the self’s journals stay shared, deliberately'],
  ['birthDoesNotWalkTheClock','totalTicks, generation and extinctions survive a birth'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(28)+d); }
console.log('\n  '+r.detail.owned+' structures owned by the child, '+r.detail.shared+' journals shared'
  +(r.detail.drifted.length?'   drifted: '+r.detail.drifted.join(', '):''));
console.log(bad? '\n'+bad+' FAILED' : '\na child owns what it inherits, and a birth does not rewrite the record');
process.exit(bad?1:0);
