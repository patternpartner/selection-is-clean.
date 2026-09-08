// #176 acceptance test — HOW MUCH OF THE BANK ACTUALLY RUNS.
//
// The 93.1h harvest says a universe with 104 atoms, 179 filled bound slots and a 6-instruction
// germline program names ONE distinct authored opcode. If that were the whole truth the system
// would be authoring a library it can never open. But the germline program is not what the
// population runs — #102 and #132b are this file's most-repeated lesson, and both were exactly this
// mistake — so the germline number is a floor of unknown tightness and the save had no way to say
// how loose. #176 records what the POPULATION executed.
//
// What this checks, hardest-to-get-wrong first:
//   1. IT COUNTS REAL EXECUTION. A slot that ran is marked; a slot that did not is not. A bitmap
//      that marks everything is as useless as one that marks nothing, and both look "wired".
//   2. IT SURVIVES THE ROUND TRIP. An unmeasured save must come back EMPTY, not zero-filled — a
//      pre-#176 save has no reach data and must not be made to look like a universe that ran none.
//   3. THE PROFILER IS EXCLUDED. profileVM runs the germline program every 100 ticks to price
//      instructions. Counting it would mark every slot the germline names whether or not any
//      creature executed it — the exact number this instrument exists to check.
//   4. IT RESETS PER EPOCH, and the log grows one row per epoch.
//   5. THE FLAG IS RESTORED ON EVERY EXIT of profileVM, including a throw.
// Exits non-zero on any failure.   node reach-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/reach.js'); m.filename='/tmp/reach.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={errors:[]};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,160)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});
  const count=()=>{ let n=0; for(let k=0;k<__opReach.length;k++) if(__opReach[k])n++; return n; };

  // 1. DOES IT COUNT REAL EXECUTION?
  out.marks=run('marks',()=>{
    __opReach.fill(0);
    const before=count();
    uaChain(mk('(a)+(b)'),5,1,1);
    const afterOne=count(), slot5=__opReach[5], slot6=__opReach[6];
    uaChain(mk('(a)+(b)'),9,1,1);
    const afterTwo=count();
    uaChain(mk('(a)+(b)'),5,2,2);          // same slot again — a SET, not a counter
    const afterRepeat=count();
    uaChain(mk('(a)+(b)'),-1,1,1);         // an unbound dispatch marks nothing
    const afterUnbound=count();
    const past=MAX_BOUND_OPCODES+3; uaChain(mk('(a)+(b)'),past,1,1);
    const afterPast=count();
    __opReach.fill(0);
    return {before,afterOne,slot5,slot6,afterTwo,afterRepeat,afterUnbound,afterPast};
  });

  // 3. IS THE PROFILER EXCLUDED?
  out.prof=run('prof',()=>{
    for(let s=0;s<250;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }   // give it a real bank
    __opReach.fill(0);
    profileVM();
    const afterProfile=count();
    const flagAfter=__profiling;
    return {afterProfile,flagAfter,bank:(genome.userAtoms||[]).length};
  });

  // 5. IS THE FLAG RESTORED IF profileVM THROWS?
  out.throws=run('throws',()=>{
    const saved=genome.vmProgram;
    let threw=false;
    try{ genome.vmProgram={length:2}; profileVM(); }catch(e){ threw=true; }
    genome.vmProgram=saved;
    return {threw,flagAfter:__profiling};
  });

  // 1b. does a LIVE run mark anything at all, and 4. does the log grow?
  out.live=run('live',()=>{
    __opReach.fill(0);
    const rows0=__opReachLog.length;
    const t0=tick;
    for(let s=0;s<6000;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }   // must cross EPOCH_TICKS
    return {ran:tick-t0, marked:count(), rows0, rows1:__opReachLog.length,
            log:__opReachLog.slice(-3), bank:(genome.userAtoms||[]).length,
            bound:(genome.boundOpcodes||[]).filter(x=>x>=0).length};
  });

  // 2. ROUND TRIP — and the pre-#176 save
  out.trip=run('trip',()=>{
    // encodeGenome returns the plain object the save is built from; a save/load must carry RCH.
    __opReachLog=[[5000,3,10],[10000,4,14]];
    // encodeGenome returns base64(JSON) and decodeGenome takes that STRING, not the object —
    // and decodeGenome's own try/catch swallows a wrong-typed argument and returns silently, so
    // the first version of this test "passed a save through" and measured nothing at all.
    const enc=encodeGenome();
    const saved=JSON.parse(__b64dec(enc)).RCH;
    __opReachLog=[];
    decodeGenome(enc);
    const afterNew=__opReachLog.slice();
    // A PRE-#176 SAVE. Not a hypothetical: every save the field has ever written is one, and a
    // decoder that turns "never measured" into "measured zero" would put a fabricated flat line
    // under the first real reading.
    const old=JSON.parse(__b64dec(enc)); delete old.RCH;
    __opReachLog=[[1,1,1]];
    decodeGenome(__b64enc(JSON.stringify(old)));
    const afterOld=__opReachLog.slice();
    return {saved,afterNew,afterOld};
  });
  return out;
};`,'/tmp/reach.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };
const M=r.marks||{}, P=r.prof||{}, T=r.throws||{}, L=r.live||{}, R=r.trip||{};

ck('an executed slot is marked', M.afterOne===1&&M.slot5===1, JSON.stringify({after:M.afterOne,slot5:M.slot5}));
ck('and only that slot', M.slot6===0);
ck('a second slot adds a second mark', M.afterTwo===2, 'count '+M.afterTwo);
ck('re-running the same slot does not double-count', M.afterRepeat===2, 'count '+M.afterRepeat);
ck('an unbound dispatch marks nothing', M.afterUnbound===2, 'count '+M.afterUnbound);
ck('a slot past the array marks nothing', M.afterPast===2, 'count '+M.afterPast);
ck('profileVM marks NOTHING — pricing is not execution', P.afterProfile===0,
   'bank '+P.bank+', slots marked by the profiler: '+P.afterProfile);
ck('and it clears its own flag', P.flagAfter===false);
ck('the flag is restored even when profileVM throws', T.flagAfter===false, 'threw: '+T.threw);
ck('a live run executes at least one bound slot', L.marked>0,
   L.ran+' ticks, bank '+L.bank+', bound '+L.bound+', slots executed '+L.marked);
ck('and it does NOT mark every slot it has bound', L.marked<Math.max(2,L.bound),
   L.marked+' of '+L.bound+' filled slots ran');
ck('the epoch log grew', L.rows1>L.rows0, (L.rows1-L.rows0)+' rows added: '+JSON.stringify(L.log));
ck('each row is [tickEnd, slotsExecuted, bankSize]',
   Array.isArray(L.log)&&L.log.length>0&&L.log.every(x=>x.length===3&&x[0]>0&&x[1]>=0&&x[2]>=0));
ck('the log is written into the save', Array.isArray(R.saved)&&R.saved.length===2, JSON.stringify(R.saved));
ck('and read back out of it', Array.isArray(R.afterNew)&&R.afterNew.length===2&&R.afterNew[1][1]===4,
   JSON.stringify(R.afterNew));
ck('a pre-#176 save comes back EMPTY, not zero-filled',
   Array.isArray(R.afterOld)&&R.afterOld.length===0, JSON.stringify(R.afterOld));
ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
