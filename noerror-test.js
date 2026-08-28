// #142 acceptance test — the engine must not throw, and something has to be willing to notice.
//
// Every rig in this repo steps the sim with `try{ loop(); }catch(e){}`. That is correct for a rig —
// one bad tick should not end a 30,000-tick measurement — but it has a cost nobody had paid attention
// to: an engine that throws on EVERY tick still passes all thirty of them. #142 lived that way for
// as long as atom authoring has existed. mutateGenome threw ReferenceError on every atom birth,
// aborting ~270 lines of itself and triggering loop()'s recovery path, which clears birthQueue. The
// person running the artwork on their phone found it, because it printed "runtime recovered" over
// the top of the picture. Thirty rigs did not.
//
// So this rig does the opposite of all the others: it does NOT swallow. Anything loop() throws is a
// failure, reported with its message.
//
//   1. THE LOOP DOES NOT THROW, across a run long enough to author atoms and verbs.
//   2. mutateGenome DOES NOT THROW when forced to author — the specific path that hid #142, driven
//      hard rather than waited for, since at the natural rate it fires about five times in 6,000
//      ticks and a short rig would miss it by luck.
//   3. THE BIRTH IS RECORDED. ua_birth reaching the event log is the proof the line is in scope,
//      not merely that nothing exploded.
// Exits non-zero on any failure.   node noerror-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/noerr.js'); m.filename='/tmp/noerr.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks,forced){
  const out={loopErrors:[], mutateErrors:[]};
  const note=(list,e)=>{ const msg=(e&&e.message?e.message:String(e)).slice(0,120);
    if(!list.some(x=>x.msg===msg)) list.push({msg, where:(e&&e.stack?String(e.stack).split('\\n')[1]||'':'').trim().slice(0,110)}); };
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5;
    try{ loop(); }catch(e){ note(out.loopErrors,e); }        // deliberately NOT swallowed
  }
  // drive the authoring path hard: at the natural rate it fires ~5 times in 6,000 ticks, so a short
  // run passes by luck rather than by correctness.
  const before=(__liveness['atom.author']|0);
  const savedRate=genome.mutationRate;
  for(let i=0;i<120;i++){
    genome.mutationRate=0.9;
    try{ mutateGenome(); }catch(e){ note(out.mutateErrors,e); }
  }
  genome.mutationRate=savedRate;
  out.forcedBirths=(__liveness['atom.author']|0)-before;
  out.uaBirthEvents=(genome.eventLog||[]).filter(e=>e&&e.k==='ua_birth').length;
  return out;
};`, m.filename);

const T=parseInt(process.env.TICKS||'3000',10);
const r=globalThis.__t(T);
const checks=[
  ['loopDoesNotThrow', r.loopErrors.length===0, 'loop() runs clean for '+T+' ticks'],
  ['mutateDoesNotThrow', r.mutateErrors.length===0, 'mutateGenome survives being forced to author'],
  ['birthIsRecorded', r.forcedBirths>0 && r.uaBirthEvents>0, 'an authored atom reaches the event log'],
];
let bad=0;
for(const [k,ok,d] of checks){ if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(22)+d); }
for(const e of r.loopErrors)   console.log('    loop:    '+e.msg+'   @ '+e.where);
for(const e of r.mutateErrors) console.log('    mutate:  '+e.msg+'   @ '+e.where);
console.log('\n  '+r.forcedBirths+' atoms authored under force, '+r.uaBirthEvents+' ua_birth events logged');
console.log(bad? '\n'+bad+' FAILED' : '\nthe engine runs without throwing, and something is finally watching for it');
process.exit(bad?1:0);
