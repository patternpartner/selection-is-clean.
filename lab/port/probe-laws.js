// #370 - every law's value (LAW_DECLARED's getters) each STEP ticks, printed when any changed, beside alive and births. Draws nothing.
//   SEED=s TASKS=1 TICKS=t STEP=50 node lab/port/probe-laws.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/laws-sim.js'); m.filename='/tmp/laws-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__L=function(T,STEP){ let prev=null, lb=0;
  for(let t=1;t<=T;t++){ globalThis.__detMs+=5; loop(); if(t%STEP)continue;
    const now={}; for(const L of LAW_DECLARED){ try{ now[L.name]=+(+L.get()).toPrecision(5); }catch(e){} }
    let alive=0; for(let i=0;i<N;i++) if(palive[i])alive++; const b=(__liveness['repl.birth']|0);
    const ch=prev?Object.keys(now).filter(k=>now[k]!==prev[k]).map(k=>k+' '+prev[k]+'->'+now[k]):['(start) '+Object.keys(now).length+' laws'];
    console.log(JSON.stringify({tick:t, alive, births:b-lb, changed:ch})); prev=now; lb=b; } };`, m.filename);
globalThis.__L(+(process.env.TICKS||1500), +(process.env.STEP||50));
