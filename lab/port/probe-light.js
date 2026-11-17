// #450 - WHAT LIGHT DOES IN TODAY'S WORLD. Over windows of a TASKS world: energy from sunlight against energy from computing, how evenly
// sunlight lies on the ground, and whether a creature's light predicts anything. Reads counters and arrays only; draws nothing.
//   SEED=11 TICKS=6000 node lab/port/probe-light.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
process.env.TASKS='1'; process.env.MIND=process.env.MIND||'20';
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/probe-light.js'); m.filename='/tmp/probe-light.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__T=function(ticks,every){ const rows=[]; let s0=0,i0=0;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; loop();
    if(t%every===0){ const C=FIELD_W*FIELD_H; let mn=1e9,mx=0,sum=0; for(let c=0;c<C;c++){ const v=sunField[c]; sum+=v; if(v<mn)mn=v; if(v>mx)mx=v; }
      let al=0; for(let i=0;i<N;i++) if(palive[i])al++;
      const sun=tEv.sun-s0, inc=tEv.income-i0; s0=tEv.sun; i0=tEv.income;
      rows.push({t,alive:al,sunShare:+(sun/Math.max(1e-9,sun+inc)).toFixed(3),sunPerHead:+(sun/every/Math.max(1,al)).toFixed(5),taskPerHead:+(inc/every/Math.max(1,al)).toFixed(5),ground:{mean:+(sum/C).toFixed(4),min:+mn.toFixed(4),max:+mx.toFixed(4),cap:+(WORLD_ENERGY_MAX/C).toFixed(4)},upkeepAdequacy:+energyAdequacy.toFixed(3)}); } }
  return rows; };`, m.filename);
for(const r of globalThis.__T(+(process.env.TICKS||6000),+(process.env.EVERY||1000))) console.log(JSON.stringify(r));
