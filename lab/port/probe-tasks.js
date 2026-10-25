// #350 - the TASKS layer in the engine (lab/PORT-PLAN.md). Runs one world and every SAMPLE ticks reports: alive, births,
// the layer's threshold-free readouts (taskStats: effective number of functions, income-weighted formula size), the
// income split between computing and sunlight over the last window, and how many living programs carry each logic op.
// Reads only counters and arrays; draws nothing.
//   SEED=s TICKS=10000 TASKS=1 node lab/port/probe-tasks.js        (FULL=1 adds every function's cumulative income)
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/tasks-sim.js'); m.filename='/tmp/tasks-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__T=function(ticks,every,full){ let births=0; (${NS.BIRTHS})(function(){ births++; }); const rows=[]; let lastInc=0, lastSun=0, errs=0;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,400)); }
    if(t%every===0){ let alive=0, len=0; const carry=[0,0,0,0,0]; for(let i=0;i<N;i++) if(palive[i]){ alive++; const p=pProg[i]||[]; len+=p.length; const seen=[0,0,0,0,0]; if(typeof TASKS_ON!=="undefined"&&TASKS_ON)
        for(const ins of p){ const o=ins[0]-TASK_OP0; if(o>=0&&o<5)seen[o]=1; } for(let q=0;q<5;q++)carry[q]+=seen[q]; }
      const row={tick:t, alive, births, meanLen:alive?+(len/alive).toFixed(2):0};
      if(typeof TASKS_ON!=="undefined"&&TASKS_ON){ const S=taskStats(); row.expH=S.expH; row.meanSz=S.meanSz; row.nfun=S.full.length; row.ev=S.ev;
        row.taskW=+(S.ev.income-lastInc).toFixed(4); row.sunW=+(S.ev.sun-lastSun).toFixed(4); lastInc=S.ev.income; lastSun=S.ev.sun; row.carry=carry;
        if(full) row.full=S.full; }
      rows.push(row); } }
  return rows; };`, m.filename);
const rows=globalThis.__T(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'500',10), (process.env.FULL|0)===1);
console.log(JSON.stringify({seed:process.env.SEED||'1', tasks:process.env.TASKS||'0', rows}));
