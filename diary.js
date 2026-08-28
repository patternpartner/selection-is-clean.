// #138 — print the creature's diary. Everything it says is read out of records it already keeps.
//   TICKS=20000 node diary.js
const fs=require('fs'), path=require('path');
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
