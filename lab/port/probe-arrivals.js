// #352 - do new functions keep arriving in the ENGINE under TASKS? (#349 asked it in the lab: FADES.) Exploratory, not a
// decision. Every WIN ticks the income each function earned in that window is the difference of the engine's cumulative
// tE. A function ARRIVES the first time it earns at least ARRIVE (default 0.25, one birth's cost) in one window. Every BLOCK
// ticks one row: arrivals in the block, functions active in the block (at least ARRIVE in some window of it), exp(H) of
// the block's income vector, its income-weighted mean formula size, task and sun income, mean alive. Runs to TICKS or until
// WALLMIN minutes of wall clock, whichever is first, and says which. Reads only counters and arrays; draws nothing.
//   SEED=s TASKS=1 TICKS=100000 WALLMIN=105 node lab/port/probe-arrivals.js > out.jsonl     (one JSON line per block)
// PIN=anc (#353) pins every living program, newborns included before their first run, to the founder's (REPL_ANCESTOR): nothing evolves.
// Rows also carry crash bookkeeping: maxAlive and minAlive over the block's windows.
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const Module=require('module'); const m=new Module('/tmp/arr-sim.js'); m.filename='/tmp/arr-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__A=function(ticks,WIN,BLOCK,ARRIVE,wallMs,out){ const t0=Date.now(), prev=new Float64Array(TASK_NF), blk=new Float64Array(TASK_NF), first=new Int32Array(TASK_NF).fill(-1);
  const PIN=process.env.PIN||''; const pin1=i=>{ if(!palive[i]||!pGenome[i])return; const p=REPL_ANCESTOR.map(x=>x.slice()); pGenome[i].vmProgram=p; pProg[i]=p; };
  if(PIN){ for(let i=0;i<N;i++)pin1(i); (${NS.BIRTHS})(function(c){ pin1(c); }); }
  let mx=0, mn=1e9, arr=0, act=new Uint8Array(TASK_NF), aliveSum=0, aliveN=0, lastInc=0, lastSun=0, errs=0, cum=0;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,300)); }
    if(t%WIN===0){ let a=0; for(let i=0;i<N;i++) if(palive[i])a++; aliveSum+=a; aliveN++; if(a>mx)mx=a; if(a<mn)mn=a;
      for(let T=0;T<TASK_NF;T++){ const d=tE[T]-prev[T]; if(d>0){ blk[T]+=d; prev[T]=tE[T]; if(d>=ARRIVE){ act[T]=1; if(first[T]<0){ first[T]=t; arr++; cum++; } } } } }
    if(t%BLOCK===0||t===ticks||Date.now()-t0>wallMs){ let tot=0, H=0, ms=0, na=0; for(let T=0;T<TASK_NF;T++)tot+=blk[T];
      for(let T=0;T<TASK_NF;T++){ const x=blk[T]; if(x>0){ const q=x/tot; H-=q*Math.log(q); ms+=q*TASK_SZ4[T]; } if(act[T])na++; }
      const row={tick:t, arrivals:arr, cumArrived:cum, active:na, expH:+Math.exp(H).toFixed(2), meanSz:+ms.toFixed(3), taskIncome:+(tEv.income-lastInc).toFixed(3), sunIncome:+(tEv.sun-lastSun).toFixed(3), alive:aliveN?Math.round(aliveSum/aliveN):0, maxAlive:mx, minAlive:mn===1e9?0:mn, wallMin:+((Date.now()-t0)/60000).toFixed(1)};
      out(JSON.stringify(row)); lastInc=tEv.income; lastSun=tEv.sun; arr=0; act.fill(0); blk.fill(0); aliveSum=0; aliveN=0; mx=0; mn=1e9;
      if(Date.now()-t0>wallMs){ out(JSON.stringify({stopped:'wall', tick:t})); return; } } }
  out(JSON.stringify({stopped:'ticks', tick:ticks})); };`, m.filename);
if(!globalThis.TASKS_ON && !(process.env.TASKS|0)) console.error('warning: TASKS is off - set TASKS=1');
globalThis.__A(parseInt(process.env.TICKS||'100000',10), parseInt(process.env.WIN||'500',10), parseInt(process.env.BLOCK||'5000',10), +(process.env.ARRIVE||0.25), +(process.env.WALLMIN||105)*60000, s=>console.log(s));
