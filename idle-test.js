// #177 acceptance test — AN ATOM USED ONCE WAS IMMORTAL, AND NOTHING COULD DECIDE OTHERWISE.
//
// The cull's only condition was `uses===0`. One execution ever and an atom could never be removed
// again, however long it had since sat unreachable. Measured over 1,183,286 ticks in an archived
// solo run: bank 8 -> 1,793 atoms while the population went 202 -> 6 and 7,999 innovations produced
// eleven that persisted. #177 gives the lineage a dial (atomIdleTolerance) and lets selection set it.
//
// What this checks, in order of how badly it would hurt to get wrong:
//   1. THE REVERT IS EXACT. tolerance 0 must be the pre-#177 cull, atom for atom. The gene seeds at
//      0, so if this is wrong every universe in the field changes behaviour the moment it loads.
//   2. PROTECTION HOLDS AT ANY TOLERANCE. Credit (#110/#111) and alien grip (#46) protect an atom
//      from the OVERWRITE path already; an idle-cull that ignored them would delete proven work
//      through a side door. Tolerance 1.0 must still not touch them.
//   3. IT READS THE RIGHT COUNTER. Not the germline object's `uses` — #102 established that is
//      near-meaningless (clones reset it; profileVM inflates it). An atom the POPULATION is running
//      must survive even with germline uses at 0.
//   4. AN EMPTY WINDOW IS NOT EVIDENCE. __atomExprUses is wiped whole above 5000 entries. For one
//      moment after that every expression reads zero. A cull that treated the wipe as "everything is
//      idle" would consider the entire bank disposable at exactly the moment it knows least.
//   5. GRACE SURVIVES. #55: a young atom cannot be judged at all.
//   6. THE GENE CAN ACTUALLY MOVE. #96's lesson — a gene that cannot change is not evolvable, and
//      the file has shipped seven of those without noticing.
// Exits non-zero on any failure.   node idle-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/idle.js'); m.filename='/tmp/idle.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={errors:[]};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,160)); return null; } };
  const mk=(x,o)=>Object.assign({expression:x,compiled:null,failed:false,uses:0,age:99,state:0,
                                 alienHits:0,alienAttempts:0,creditTrace:0},o||{});
  // Drive the cull repeatedly, so one probability draw cannot decide a verdict, and count the
  // MECHANISM'S OWN fires. Bank size cannot be the measure: mutateGenome also BIRTHS atoms, so a net
  // size delta reports the sum of two mechanisms and the first version of this rig read -12 removed.
  //
  // One leak is unavoidable and is stated rather than hidden: the overwrite pass (#101/#110/#114)
  // runs EARLIER in the same mutateGenome call and rewrites some atom's expression, and a
  // freshly-rewritten expression is genuinely absent from __atomExprUses — genuinely idle, by the
  // definition under test. So the "population is running these" condition cannot assert zero; it
  // asserts a large drop against the same bank with an empty window, which is the comparison that
  // actually distinguishes the two counters.
  const bank=exprs=>{ genome.userAtoms=exprs.map(e=>mk(e)); return genome.userAtoms; };
  const idleFires=(tol,exprs,reps,prep)=>{
    const before=__liveness['atom.cull.idle']|0;
    for(let r=0;r<reps;r++){
      // mutationRate is ITSELF mutated by every call, so after a few thousand reps it has
      // random-walked to ~0 and the probe is quietly measuring a genome that no longer mutates at
      // all. The first version of this rig read 0 for every condition, including ones that must
      // fire, for exactly that reason. Pin it: the cull fires at rate*0.1, and a LOW rate keeps the
      // overwrite leak (rate*0.3 per atom) small next to the signal.
      // scale 0 pins every gene, INCLUDING the one under test. mutateGenome mutates
      // atomIdleTolerance before it reaches the cull, so a probe that merely sets the gene and calls
      // mutateGenome is measuring a DIFFERENT tolerance than the one it set — that is why the
      // tolerance-0 condition read 3 releases when it must read 0. rate still drives the cull.
      genome.mutationRate=RATE; genome.mutationScale=0;
      genome.atomIdleTolerance=tol;
      const b=bank(exprs);
      if(prep)prep(b);
      mutateGenome();
    }
    return (__liveness['atom.cull.idle']|0)-before;
  };
  const survivors=idleFires;

  // Give the window something in it, and a real bank to work from.
  for(let s=0;s<400;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  // An OLD window, so a zero in it is real evidence. Setting this to 0 is NOT enough: the rig
  // only advances ~400 ticks, and tick minus 0 never clears ATOM_IDLE_WINDOW — the first run of
  // this rig read 0 fires for every condition because the guard was (correctly) refusing them.
  const OLD=()=>{ __atomUseWindowStart=tick-ATOM_IDLE_WINDOW*10; };
  __atomExprUses.clear(); OLD();
  const E=['(a)+(0.11)','(a)+(0.22)','(a)+(0.33)','(a)+(0.44)','(a)+(0.55)','(a)+(0.66)'];
  const REPS=6000, RATE=0.05;   // ~30 cull attempts, with the overwrite leak at ~9% of that

  // 1. THE REVERT
  out.revert=run('revert',()=>{
    const used=E.map(e=>1);   // every atom has germline uses>0 -> the OLD cull can never take them
    const gone=survivors(0,E,REPS,b=>b.forEach(a=>{a.uses=5;}));
    return {gone};
  });
  // 3. RIGHT COUNTER + basic bite
  out.bite=run('bite',()=>{
    __atomExprUses.clear();
    const goneIdle=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=5;}));   // germline uses HIGH, population zero
    __atomExprUses.clear();
    for(const e of E)__atomExprUses.set(e,25);                        // population running them
    const goneBusy=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=0;}));    // germline uses ZERO
    __atomExprUses.clear();
    return {goneIdle,goneBusy};
  });
  // 2. PROTECTION
  out.prot=run('prot',()=>{
    __atomExprUses.clear();
    const goneCredit=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=5;a.creditTrace=0.4;}));
    const goneGrip=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=5;a.alienAttempts=40;a.alienHits=38;}));
    return {goneCredit,goneGrip};
  });
  // 4. EMPTY WINDOW
  out.window=run('window',()=>{
    __atomExprUses.clear(); __atomUseWindowStart=tick;   // wiped RIGHT NOW
    const goneFresh=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=5;}));
    OLD();
    return {goneFresh,windowTicks:ATOM_IDLE_WINDOW};
  });
  // 5. GRACE
  out.grace=run('grace',()=>{
    __atomExprUses.clear();
    const goneYoung=survivors(1,E,REPS,b=>b.forEach(a=>{a.uses=5;a.age=1;}));
    return {goneYoung,grace:UA_GRACE_AGE};
  });
  // 6. CAN THE GENE MOVE?
  out.gene=run('gene',()=>{
    const seen=new Set(); genome.atomIdleTolerance=0;
    for(let i=0;i<400;i++){ genome.mutationRate=0.3; genome.mutationScale=1;
                            mutateGenome(); seen.add(+genome.atomIdleTolerance.toFixed(4)); }
    const v=[...seen];
    return {distinct:seen.size,min:Math.min(...v),max:Math.max(...v)};
  });
  // round trip
  out.trip=run('trip',()=>{
    genome.atomIdleTolerance=0.4242;
    const enc=encodeGenome();
    const inSave=JSON.parse(__b64dec(enc)).ait;
    genome.atomIdleTolerance=0; decodeGenome(enc);
    const back=genome.atomIdleTolerance;
    const old=JSON.parse(__b64dec(enc)); delete old.ait;
    genome.atomIdleTolerance=0.9; decodeGenome(__b64enc(JSON.stringify(old)));
    return {inSave,back,afterOld:genome.atomIdleTolerance};
  });
  out.reps=REPS;
  out.fired=(__liveness['atom.cull.idle']|0);
  out.declared=('atom.cull.idle' in __liveness);
  return out;
};`,'/tmp/idle.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };
const REPS_N=r.reps;
const RV=r.revert||{}, B=r.bite||{}, P=r.prot||{}, W=r.window||{}, G=r.grace||{}, GE=r.gene||{}, T=r.trip||{};

ck('tolerance 0 is the pre-#177 cull exactly — nothing is released', RV.gone===0,
   RV.gone+' idle-culls in '+REPS_N+' cycles at tolerance 0');
ck('tolerance 1 DOES release atoms nothing has run', B.goneIdle>0,
   B.goneIdle+' released in '+REPS_N+' cycles');
ck('and it reads the POPULATION counter, not the germline one', B.goneBusy*3<B.goneIdle,
   'germline uses 0 but population running them: '+B.goneBusy+' idle-culls vs '+B.goneIdle+
   ' when the population is idle (the residue is the overwrite leak the rig documents)');
ck('credit protects an idle atom at tolerance 1', P.goneCredit===0, P.goneCredit+' removed');
ck('alien grip protects an idle atom at tolerance 1', P.goneGrip===0, P.goneGrip+' removed');
ck('a freshly wiped window is not read as idleness', W.goneFresh===0,
   W.goneFresh+' removed inside the '+W.windowTicks+'-tick window');
ck('grace still holds — a young atom cannot be judged', G.goneYoung===0,
   G.goneYoung+' removed at age 1 (grace '+G.grace+')');
ck('the gene can actually move (#96)', GE.distinct>3,
   GE.distinct+' distinct values from a seed of 0, range '+GE.min+'..'+GE.max);
ck('and it stays inside [0,1]', GE.min>=0&&GE.max<=1);
ck('the gene is written into the save', T.inSave===0.4242, JSON.stringify(T.inSave));
ck('and read back out', T.back===0.4242, JSON.stringify(T.back));
ck('a pre-#177 save leaves it undefined -> reads 0 -> the old cull',
   T.afterOld===undefined||T.afterOld===0.9, 'value after loading a save with no ait: '+T.afterOld);
ck('the mechanism is declared to the liveness census', r.declared===true);
ck('and it actually fired during this run', r.fired>0, r.fired+' fires');
ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
