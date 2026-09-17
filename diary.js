// #138 — print the creature's diary. Everything it says is read out of records it already keeps.
//   TICKS=20000 node diary.js
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
const m=new Module('/tmp/diary.js'); m.filename='/tmp/diary.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__d=function(t){ for(let s=0;s<t;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  return theDiary(); };`, m.filename);
const T=parseInt(process.env.TICKS||'12000',10);
const lines=globalThis.__d(T);
console.log('');
for(const l of lines) console.log('  '+l.replace(/(.{1,88})(\s|$)/g,'$1\n   ').trimEnd());
console.log('');
