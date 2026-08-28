// #136 acceptance test — an environment nobody authored, without breaking reproducibility.
// The dangerous property first: this is the only mechanism in the file whose input is the actual
// wall clock, and a seeded replay must NOT depend on what time of day it ran. If that guard fails,
// every off-arm-identical claim this project makes quietly stops being true.
//   1. SUPPRESSED UNDER DETERMINISM — with a harness clock present, every real-world term is 0 and
//      the seasonal curve is the pure sine it always was.
//   2. A FAKED CLOCK CANNOT MOVE A SEEDED RUN — same seed, wall clock moved by thirty millennia and
//      the hour hand moved to the far side of the day: byte-identical world state.
//   3. LIVE WHEN NOT SUPPRESSED — lift the guard and the diurnal term actually varies by hour, so
//      the mechanism is real rather than permanently neutral (the decoration failure).
//   4. BOUNDED — real signal can never claim more than WORLD_SIGNAL_WEIGHT of the seasonal swing.
//
// NOTE ON (2): a comparison is only evidence if the clock is the ONLY thing that differs between the
// two runs. Booting twice in one process does not give you that for free — the seeded PRNG and the
// __detMs counter are globals that carry state out of the first run into the second, so two boots
// disagree even with the clock untouched. reseed() below restores both before every boot; without it
// this check fails for a reason that has nothing to do with the world signal.
// Exits non-zero on any failure.   node worldsignal-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const src=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const SEED=(parseInt(process.env.SEED||'1',10)|0)>>>0;
const RUNTICKS=parseInt(process.env.TICKS||'600',10);

function reseed(){
  let a=SEED;
  globalThis.Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  globalThis.__detMs=0;
}

function boot(tag){
  reseed();
  const m=new Module('/tmp/ws-'+tag+'.js'); m.filename='/tmp/ws-'+tag+'.js';
  m.paths=Module._nodeModulePaths('/tmp');
  m._compile(src+`
;globalThis.__api_${tag}={
  run:function(t){ for(let s=0;s<t;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    let a=0,b=0; for(let i=0;i<N;i++){ a+=amp[i]; for(let d=0;d<DIMS;d++) b+=tend[i*DIMS+d]; }
    return {N, amp:+a.toFixed(6), tend:+b.toFixed(6), tick}; },
  probe:function(){ return {suppressed:worldSignalSuppressed(), bias:worldSignalSeasonBias(),
    diurnal:__wsDiurnal, cadence:__wsCadence, weight:WORLD_SIGNAL_WEIGHT}; },
  unguard:function(hour){
    // lift the guard by hand and pin a fake hour, to prove the term is live rather than dead code
    const realD=globalThis.Date;
    globalThis.Date=function(){ return {getHours:()=>hour, getMinutes:()=>0}; };
    const savedDet=globalThis.__DETERMINISTIC, savedMs=globalThis.__detMs;
    globalThis.__DETERMINISTIC=0; delete globalThis.__detMs;
    globalThis.__FORCE_WORLD_SIGNAL=1;   // also clears the structural Node guard
    updateWorldSignal();
    const out={diurnal:__wsDiurnal, bias:worldSignalSeasonBias()};
    delete globalThis.__FORCE_WORLD_SIGNAL;
    globalThis.Date=realD; globalThis.__DETERMINISTIC=savedDet; globalThis.__detMs=savedMs;
    updateWorldSignal();
    return out; },
  // (5) with EVERY opt-in marker removed, a Node rig must STILL be suppressed — five real rigs
  // set no marker at all, so the structural detection is what actually protects them.
  probeNoMarkers:function(){
    const savedDet=globalThis.__DETERMINISTIC, savedMs=globalThis.__detMs;
    delete globalThis.__DETERMINISTIC; delete globalThis.__detMs;
    const r=worldSignalSuppressed();
    globalThis.__DETERMINISTIC=savedDet; globalThis.__detMs=savedMs;
    return r; },
};`, m.filename);
  return globalThis['__api_'+tag];
}

const out={};
const A=boot('a');
out.suppressedUnderHarness = A.probe().suppressed===true && A.probe().bias===0;
const stateA=A.run(RUNTICKS);

// (2) same seed, wildly different wall clock — the run must not notice.
// Both faces of the clock are moved: Date.now (cadence's input) and the hour hand that `new Date()`
// reports (diurnal's input). Moving only one would leave the other untested.
const realDate=globalThis.Date, realNow=Date.now;
function fakeClock(ms,hour){
  const F=function(){ return {getHours:()=>hour, getMinutes:()=>0}; };
  F.now=()=>ms; globalThis.Date=F;
}
fakeClock(0,3);            const stateB=boot('b').run(RUNTICKS);
fakeClock(1e12,21);        const stateC=boot('c').run(RUNTICKS);   // ~year 33658, other side of the day
globalThis.Date=realDate; globalThis.Date.now=realNow;
out.clockCannotMoveSeededRun = JSON.stringify(stateB)===JSON.stringify(stateC)
                            && JSON.stringify(stateA)===JSON.stringify(stateB);

// (3) with the guard lifted, the hour actually changes the world's weather.
// 06:00 and 18:00 are BOTH zero-crossings of a diurnal sine — dawn and dusk are the same light
// level, so comparing those two proves nothing. Noon against midnight is the real swing.
const midnight=A.unguard(0), noon=A.unguard(12), dawn=A.unguard(6);
out.diurnalIsLive = Math.abs(noon.diurnal-midnight.diurnal)>1.5   // full swing, ~+1 vs ~-1
                 && Math.abs(noon.diurnal-dawn.diurnal)>0.5
                 && Math.abs(noon.bias-midnight.bias)>0.5;        // and it reaches the season
out.guardRestored = A.probe().suppressed===true && A.probe().bias===0;

// (5) the structural guard, not the remembered one: strip every opt-in marker and a Node rig is
// still silent. This is the check that covers the five seeded rigs that set no marker.
out.unmarkedRigStillSafe = A.probeNoMarkers()===true;

// (4) bounded authority
const w=A.probe().weight;
out.boundedAuthority = w>0 && w<=0.5
  && [midnight,noon,dawn].every(x=>Math.abs(x.bias)<=1.0000001);

const checks=[
 ['suppressedUnderHarness','real-world signal is silent under a harness clock'],
 ['clockCannotMoveSeededRun','a seeded run is identical across wall-clock times'],
 ['diurnalIsLive','with the guard lifted, the hour really does change the weather'],
 ['guardRestored','the guard is back on after the probe'],
 ['boundedAuthority','real signal cannot claim more than its share of the season'],
 ['unmarkedRigStillSafe','a rig that sets no marker at all is still suppressed'],
];
let bad=0;
for(const [k,d] of checks){ const ok=out[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
console.log('\n  diurnal at 00:00 '+midnight.diurnal.toFixed(3)+'   06:00 '+dawn.diurnal.toFixed(3)
  +'   12:00 '+noon.diurnal.toFixed(3)+'   weight '+w);
console.log(bad? '\n'+bad+' FAILED' : '\nthe world has weather nobody wrote, and replays stay reproducible');
process.exit(bad?1:0);
