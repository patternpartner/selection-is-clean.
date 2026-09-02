// #157 acceptance test — a creature that is throwing must still save itself.
//
// THE FAILURE THIS LOCKS DOWN, reported from the device: the field reached 300,000 ticks, the
// individual universes went almost blank, and a reload came back at 198,000. Everything after that
// tick was lost. The cause was the SHAPE of loop(), not any single bug:
//
//     function loop(){ try{
//         tick++; genome.totalTicks++;                    <- clock advances FIRST
//         ... several hundred lines ...
//         if(tick%900===0) archiveGenome();               <- the ONLY autosave, downstream
//       }catch(e){ genEl.textContent='runtime recovered'; }   <- the ONLY warning
//     }
//
// So ANY exception in between left the creature running, ageing, and persisting nothing — and the
// single warning went to a HUD that a field hides with #cleanart (#144). Silent by construction.
// #142 was the same class of bug and was caught only because the author could SEE the message.
//
// The checks below do not test a specific bug. They test that the STRUCTURE cannot lose data again:
// inject a throw into the tick, and require the save to happen anyway.
// Exits non-zero on any failure.   node autosave-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/as.js'); m.filename='/tmp/as.js'; m.paths=Module._nodeModulePaths('/tmp');

// Capture every localStorage write the engine makes, with the tick it was made at.
const saves=[];
globalThis.localStorage={ getItem:()=>null, removeItem(){},
  setItem(k,v){ if(k==='selection_genome') saves.push({len:String(v).length}); } };

m._compile(code+`
;globalThis.__spin=function(t){ for(let s=0;s<t;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} } };
globalThis.__state=function(){ return {tick:tick, total:genome.totalTicks|0,
  errs:(typeof __loopErrors!=='undefined')?__loopErrors|0:-1,
  msg:(typeof __loopErrLast!=='undefined')?__loopErrLast:null }; };
// Inject a throw partway through the tick, in the place the real failure lives: after the counters
// have advanced and before the autosave would have run under the old layout.
globalThis.__breakTick=function(on){
  if(on){ if(!globalThis.__origApplyEntropy) globalThis.__origApplyEntropy=applyEntropy;
          applyEntropy=function(){ throw new Error('injected: expression is not defined'); }; }
  else if(globalThis.__origApplyEntropy){ applyEntropy=globalThis.__origApplyEntropy; }
};
globalThis.__hasApplyEntropy=function(){ return typeof applyEntropy==='function'; };
`,'/tmp/as.js');

const out={};
// ── 1. a healthy creature saves on the 900-tick cadence ─────────────────────────────────────
// The guard is `tick%900===0 && tick>900`, so the FIRST save lands at tick 1800, not 900. An earlier
// version of this check ran 1,100 ticks, saw zero saves and failed — the test was wrong, the engine
// was right, which is the failure mode this file exists to catch turned on itself.
globalThis.__spin(1900);
const healthy=saves.length;
out.healthySaves = healthy>0;
const s1=globalThis.__state();

// ── 2. now make every tick throw, exactly where the real failure lives ───────────────────────
out.injectionPossible = globalThis.__hasApplyEntropy()===true;
globalThis.__breakTick(true);
const before=saves.length, t0=globalThis.__state();
globalThis.__spin(1900);
const t1=globalThis.__state();
const during=saves.length-before;

out.clockKeptAdvancing = (t1.total - t0.total) >= 1800;   // the symptom: it keeps ageing
out.errorsWereCounted  = t1.errs >= 1800;                 // and now they are COUNTED
out.errorMessageKept   = typeof t1.msg==='string' && t1.msg.indexOf('injected')>=0;
out.SAVED_WHILE_BROKEN = during > 0;                      // THE FIX: it still saved

// ── 3. and it recovers cleanly when the fault clears ────────────────────────────────────────
globalThis.__breakTick(false);
const before2=saves.length;
globalThis.__spin(1100);
out.savesAfterRecovery = (saves.length-before2) > 0;

const checks=[
  ['healthySaves','a healthy creature autosaves on its 900-tick cadence'],
  ['injectionPossible','the fault can be injected mid-tick (the test is testing something)'],
  ['clockKeptAdvancing','a throwing creature still ages — the reported symptom'],
  ['errorsWereCounted','...and every caught tick is now counted, not swallowed'],
  ['errorMessageKept','...with the message kept for the field to display'],
  ['SAVED_WHILE_BROKEN','THE FIX: it still saves while every single tick is throwing'],
  ['savesAfterRecovery','and it keeps saving once the fault clears'],
];
let bad=0;
for(const [k,d] of checks){ const ok=out[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(22)+d); }
console.log('\n  healthy run: '+healthy+' saves.  while every tick threw: '+during+' saves, '
  +t1.errs+' caught ticks, clock +'+(t1.total-t0.total));
console.log('  last error kept: '+JSON.stringify(t1.msg));
console.log(bad? '\n'+bad+' FAILED' : '\na creature that is throwing still saves itself, and says so');
process.exit(bad?1:0);
