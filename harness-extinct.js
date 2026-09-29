// #259 — THE EXTINCTION CENSUS: does a world survive? Population only, so it is cheap enough to run many seeds.
// #258b deleted swing #21's lineage pull and recorded the cost as population swings; #258c then saw two of twelve
// current-engine runs go extinct by 40k and none with the pull. Too few runs to tell. This rig answers the survival
// question alone: one world, TICKS ticks, the living count every EVERY ticks. Draws nothing of its own.
//   SEED=161 TICKS=40000 node harness-extinct.js        (INDEX=<engine.html> to run another engine)
// Output: one JSON object - seed, final living, the floor, the tick of the first extinction (null if none), the number
// of samples below 50 living, and the series every 1,000 ticks.
// No backticks in the appended driver's comments: the engine source is compiled as one string.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||40000), EVERY=+(E.EVERY||100);
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/extinct.js');m.filename='/tmp/extinct.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__EX=function(T,EVERY){ let floor=Infinity, extinctAt=null, below50=0, errs=0; const series=[];
  const alive=function(){ let n=0; for(let i=0;i<N;i++) if(palive[i])n++; return n; };
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    if(s%EVERY===0){ const n=alive(); if(n<floor)floor=n; if(n===0&&extinctAt===null)extinctAt=s; if(n<50)below50++; if(s%1000===0)series.push(n); } }
  return {alive:alive(),floor,extinctAt,below50,errs,series}; };`,'/tmp/extinct.js');
const r=globalThis.__EX(T,EVERY);
console.log(JSON.stringify(Object.assign({seed:E.SEED||'1',ticks:T,index:E.INDEX||'engine.html'},r)));
