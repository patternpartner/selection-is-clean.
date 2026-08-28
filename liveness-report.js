// #134 — run the world and ask which of its mechanisms actually HAPPEN.
// Not "did it help" (expensive: needs seeds and controls). Just "did it ever run".
// Three mechanisms written in a single session turned out to be decorative — they parsed, passed
// their property tests, and never executed. This is the cheapest possible guard against that.
//   node liveness-report.js            (default 20000 ticks)
//   TICKS=60000 node liveness-report.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/liveness-sim.js'); m.filename='/tmp/liveness-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`;globalThis.__go=function(t){for(let s=0;s<t;s++){globalThis.__detMs+=5;try{loop();}catch(e){}}
  return livenessCensus();};`, m.filename);
const T=parseInt(process.env.TICKS||'20000',10);
const c=globalThis.__go(T);
const pad=(x,n)=>String(x).padEnd(n);
console.log('LIVENESS CENSUS  —  '+T+' ticks, seed '+(process.env.SEED||'unseeded'));
console.log('  declared '+c.declared+'   live '+c.live.length+'   rare '+c.rare.length+'   NEVER '+c.neverCount+'\n');
if(c.live.length){ console.log('  RAN'); for(const x of c.live) console.log('    '+x); }
if(c.rare.length){ console.log('\n  BARELY RAN (<5 times in the whole run)'); for(const x of c.rare) console.log('    '+x); }
if(c.never.length){ console.log('\n  NEVER RAN'); for(const x of c.never) console.log('    '+pad(x,28)+'  <- decorative in this condition'); }
console.log('\n  "never" is a fact about THIS RUN, not proof the code is dead. Four honest reasons a');
console.log('  mechanism can read zero here:');
console.log('    - it needs PEERS      network.migrantAccepted, alien.predict — one process has none');
console.log('    - it needs a PERSON   attention.field (#135) only fires when someone is actually looking,');
console.log('                          so headless it is correctly zero and attention-test.js proves it works');
console.log('    - it needs a REAL     world.signal (#136) reads the actual wall clock, and a seeded');
console.log('      CLOCK               replay must not depend on the time of day it ran — so every');
console.log('                          harness deliberately silences it. Zero here is the guard working;');
console.log('                          worldsignal-test.js lifts it and proves the term is live');
console.log('    - it needs TIME       a mature atom bank, or more ticks than this run had');
console.log('  Anything left over after those is the interesting kind of zero. It is the question, not');
console.log('  the verdict — but nothing was even asking before.');
