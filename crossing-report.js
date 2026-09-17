// #137 — the crossing census as a rig. For every kind of self-authored structure, how much exists on
// the germline and how much actually reached the population selection acts on.
//
// This is the report that would have caught #102, #130, #132b and #133b — four separate bugs, one
// shape: structure authored on `genome`, never crossing into `pGenome[i]`, invisible to selection
// while every counter and test said fine.
//
//   TICKS=4000 node crossing-report.js
const fs=require('fs'), path=require('path');
// #217b: KNOBS honoured. #216x fixed four rigs and I called the class swept; a review found the
// real number is 39 node-side rigs that boot engine.html in-process and silently drop every
// KNOBS entry. Same error as the trap itself: I fixed what I was looking at. A no-op when no
// env var is set. NOT added to browser-driven rigs, where node's globalThis never reaches the
// page and the line would only look like a control.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/xing.js'); m.filename='/tmp/xing.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__x=function(ticks){
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  return crossingCensus();
};`, m.filename);

const T=parseInt(process.env.TICKS||'4000',10);
const c=globalThis.__x(T);
const pad=(s,n)=>(s+' '.repeat(n)).slice(0,n);
console.log('CROSSING CENSUS  —  '+T+' ticks, seed '+(process.env.SEED||'unseeded'));
console.log('  '+pad('structure',16)+pad('germline',10)+pad('population',12)+pad('carriers',10)+'verdict');
for(const r of c.rows){
  const v = r.stranded ? 'STRANDED — authored but invisible to selection'
          : r.germline===0 && r.population===0 ? 'nothing authored yet'
          : r.population>0 ? 'crossed' : '—';
  console.log('  '+pad(r.name,16)+pad(String(r.germline),10)+pad(String(r.population),12)
    +pad(r.carriers+'/'+r.alive,10)+v);
}
console.log('\n  '+c.strandedCount+' stranded of '+c.rows.length+' kinds of structure.');
console.log('  '+c.note);
if(c.strandedCount) console.log('\n  A stranded row is the bug that has appeared four times. It is not a\n'
  +'  performance note — that structure cannot be selected for or against at all.');
process.exit(0);
