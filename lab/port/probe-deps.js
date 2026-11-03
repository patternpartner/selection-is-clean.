// #356 - do discoveries become foundations? For every function, its FIRST PAYMENT is recorded: the tick, and the read functions that
// fed the paid word (the engine's per-word read keys, tK, at most 4). DEPTH(T) = 0 if that first payment used no read, else
// 1 + the largest depth among its read functions (a read function never paid counts as depth 0 and is counted as unpaidKey).
// Depth is fixed at first payment, so it cannot cycle. Per BLOCK: alive, functions first paid, their mean and max depth, the
// share with at least one read, the share whose reads were all ALREADY paid (built on earlier discoveries), the cumulative
// repertoire, pools empty (under 1e-6) and under 1% of cap, and the drain's share of task income. Through __taskOnPay; draws nothing.
//   SEED=s TASKS=1 TICKS=200000 WALLMIN=105 node lab/port/probe-deps.js > out.jsonl
// Pools counted only where the cap is above 0 (bare inputs and constants have cap 0). PIN=anc pins every program to the founder's, newborns
// before their first run: the control for depth that read-chains build with no evolution.
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const Module=require('module'); const m=new Module('/tmp/deps-sim.js'); m.filename='/tmp/deps-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__P=function(ticks,BLOCK,wallMs,out){ const t0=Date.now(), first=new Int32Array(TASK_NF).fill(-1), depth=new Int16Array(TASK_NF).fill(-1), used=new Uint32Array(TASK_NF);
  const PIN=process.env.PIN||''; const pin1=i=>{ if(!palive[i]||!pGenome[i])return; const p=REPL_ANCESTOR.map(x=>x.slice()); pGenome[i].vmProgram=p; pProg[i]=p; };
  if(PIN){ for(let i=0;i<N;i++)pin1(i); (${NS.BIRTHS})(function(c){ pin1(c); }); }
  let B={n:0,dsum:0,dmax:0,withRead:0,allEarlier:0,unpaidKey:0}, cum=0, aliveSum=0, aliveN=0, inc0=tEv.income, tr0=tEv.troph, errs=0;
  __taskOnPay=function(i,T,D){ if(first[T]>=0)return; let mk=0, d=0, allE=true;
    for(let q=0;q<4;q++){ const k=tK[D*4+q]; if(k<0)continue; mk++; used[k]++; if(depth[k]<0){ allE=false; B.unpaidKey++; } else if(depth[k]+1>d)d=depth[k]+1; }
    first[T]=tick; depth[T]=mk?Math.max(1,d):0; cum++; B.n++; B.dsum+=depth[T]; if(depth[T]>B.dmax)B.dmax=depth[T]; if(mk){ B.withRead++; if(allE)B.allEarlier++; } };
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,300)); }
    if(t%500===0){ let a=0; for(let i=0;i<N;i++) if(palive[i])a++; aliveSum+=a; aliveN++; }
    const wall=Date.now()-t0>wallMs;
    if(t%BLOCK===0||t===ticks||wall){ let empty=0, low=0; for(let T=0;T<TASK_NF;T++){ if(!(tCap[T]>0))continue; if(tRes[T]<1e-6)empty++; if(tRes[T]<0.01*tCap[T])low++; }
      const di=tEv.income-inc0, dt=tEv.troph-tr0; inc0=tEv.income; tr0=tEv.troph;
      out(JSON.stringify({tick:t, alive:aliveN?Math.round(aliveSum/aliveN):0, firstPaid:B.n, meanDepth:B.n?+(B.dsum/B.n).toFixed(3):null, maxDepth:B.dmax, withRead:B.n?+(B.withRead/B.n).toFixed(3):null, allEarlier:B.n?+(B.allEarlier/B.n).toFixed(3):null, unpaidKey:B.unpaidKey, repertoire:cum, poolsEmpty:empty, poolsUnder1pct:low, drainShare:di>0?+(dt/di).toFixed(3):null, taskIncome:+di.toFixed(2), wallMin:+((Date.now()-t0)/60000).toFixed(1)}));
      B={n:0,dsum:0,dmax:0,withRead:0,allEarlier:0,unpaidKey:0}; aliveSum=0; aliveN=0;
      if(wall){ break; } } }
  let fnd=0, fndMax=0; for(let T=0;T<TASK_NF;T++) if(used[T]>0){ fnd++; if(used[T]>fndMax)fndMax=used[T]; }
  const hist={}; for(let T=0;T<TASK_NF;T++) if(depth[T]>=0){ const d=Math.min(depth[T],20); hist[d]=(hist[d]||0)+1; }
  out(JSON.stringify({final:true, tick, repertoire:cum, foundations:fnd, maxTimesUsed:fndMax, depthHist:hist})); };`, m.filename);
globalThis.__P(parseInt(process.env.TICKS||'200000',10), parseInt(process.env.BLOCK||'5000',10), +(process.env.WALLMIN||105)*60000, s=>console.log(s));
