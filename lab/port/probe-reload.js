// #368 - what does a RELOAD cost a TASKS world? A browser save holds the germline genome only (#352a): on reload every
// founder is spawned from the one saved program, and the population - its programs, its reads, the functions it computes - is
// gone. This replays that in node. One row every WIN ticks: alive, task and sun income, payments, functions paid in the window,
// exp(H) and income-weighted mean formula size of the window's income, and distinct programs among the living.
//   SEED=s TASKS=1 TICKS=12000 SAVEAT=4000,8000 SAVEDIR=d node lab/port/probe-reload.js > run.jsonl
//       writes d/<seed>_<tick>.genome: encodeGenome() at each SAVEAT tick, exactly what the browser stores
//   SEED=s TASKS=1 TICKS=4000 LOAD=d/<seed>_<tick>.genome node lab/port/probe-reload.js > reload.jsonl
//       boots a fresh engine from that genome the way a reload does (loadGenome reads location.hash)
// POP=1 (with SAVEAT) also writes d/<seed>_<tick>.pop: encodePopulation(), fingerprinted to that .genome (#368). POPLOAD=file hands it to
// the engine's own boot as storage key 'selection_pop', which is how the browser's shell hands it over.
// newToHistory: functions paid in the window that this universe had never been paid for, before its save (SEEN=file, written beside
// each .genome) or since this boot. everPaid: the size of that history.
// RESEED_AT=t RESEED=k: after tick t the random stream is replaced by one seeded from (SEED, k) - the same world in the same state with
// other draws: a perfect reload, the null band a real reload is judged against.
// Reads counters and arrays; draws nothing. A row's tick is the engine's tick since THIS process booted.
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
if(process.env.LOAD) globalThis.location.hash='#'+fs.readFileSync(process.env.LOAD,'utf8').trim();
if(process.env.POPLOAD){ const pop=fs.readFileSync(process.env.POPLOAD,'utf8'); globalThis.localStorage.getItem=k=>k==='selection_pop'?pop:null; }   // the engine's own boot reads it (#368 popRestore)
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/reload-sim.js'); m.filename='/tmp/reload-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__R=function(ticks,WIN,saveAt,saveDir,seed,out,fs,path){ const prev=new Float64Array(TASK_NF), ever=new Uint8Array(TASK_NF); let li=tEv.income, ls=tEv.sun, lp=tEv.paid, errs=0, aSum=0, aN=0;
  if(process.env.POPLOAD) out(JSON.stringify({popBoot:(typeof __popBoot!=='undefined')?__popBoot:'engine has no #368'}));
  for(let T=0;T<TASK_NF;T++)prev[T]=tE[T];
  if(process.env.SEEN){ for(const T of JSON.parse(fs.readFileSync(process.env.SEEN,'utf8')))ever[T]=1; }   /* the functions this universe paid before its save */
  { let a=0; for(let i=0;i<N;i++) if(palive[i])a++; out(JSON.stringify({boot:true, tick:0, alive:a, loaded:!!process.env.LOAD, germLen:(genome.vmProgram||[]).length})); }
  const RAT=+(process.env.RESEED_AT||0), RK=+(process.env.RESEED||0);
  for(let t=1;t<=ticks;t++){ if(RAT&&t===RAT+1&&RK){ let a=((+seed)*7919+RK*104729)>>>0; Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let x=Math.imul(a^a>>>15,1|a);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;}; out(JSON.stringify({reseeded:RAT, k:RK})); }
    globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.log(JSON.stringify({err:String(e&&e.stack||e).slice(0,300)})); }
    if(t%50===0){ let a=0; for(let i=0;i<N;i++) if(palive[i])a++; aSum+=a; aN++; }
    if(saveAt.includes(t)){ const g=encodeGenome(); fs.writeFileSync(path.join(saveDir,seed+'_'+t+'.genome'),g);
      let pl=-1; if(process.env.POP&&typeof encodePopulation==='function'){ const p=encodePopulation(popHash(g)); fs.writeFileSync(path.join(saveDir,seed+'_'+t+'.pop'),p); pl=p.length; }
      const seen=[]; for(let T=0;T<TASK_NF;T++) if(ever[T]||tE[T]>0)seen.push(T); fs.writeFileSync(path.join(saveDir,seed+'_'+t+'.seen'),JSON.stringify(seen));
      out(JSON.stringify({saved:t, genomeLen:g.length, popLen:pl, everPaid:seen.length})); }
    if(t%WIN) continue;
    let tot=0, H=0, ms=0, nf=0, fresh=0; const inc=[]; for(let T=0;T<TASK_NF;T++){ const d=tE[T]-prev[T]; prev[T]=tE[T]; if(d>0){ inc.push([T,d]); tot+=d; if(!ever[T]){ ever[T]=1; fresh++; } } }
    for(const [T,d] of inc){ const q=d/tot; H-=q*Math.log(q); ms+=q*TASK_SZ4[T]; nf++; }
    const progs=new Set(); let alive=0, rd=0; for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const p=pProg[i]||[]; let k=''; let r=0; for(const x of p){ k+=x[0]+','+(x[1]|0)+','+(x[2]|0)+','+(x[3]|0)+';'; if(x[0]===TASK_OP0+3)r=1; } rd+=r; progs.add(k); }
    out(JSON.stringify({tick:t, alive, meanAlive:aN?Math.round(aSum/aN):alive, taskInc:+(tEv.income-li).toFixed(2), sunInc:+(tEv.sun-ls).toFixed(2), paid:tEv.paid-lp, fnPaid:nf, newToHistory:fresh, everPaid:ever.reduce((a,b)=>a+b,0), expH:+Math.exp(H).toFixed(2), meanSz:+ms.toFixed(3), progs:progs.size, readCarried:rd}));
    li=tEv.income; ls=tEv.sun; lp=tEv.paid; aSum=0; aN=0; } };`, m.filename);
if(!globalThis.TASKS_ON) console.error('warning: TASKS is off - set TASKS=1');
const saveAt=(process.env.SAVEAT||'').split(',').filter(Boolean).map(Number), saveDir=process.env.SAVEDIR||'.';
if(saveAt.length) fs.mkdirSync(saveDir,{recursive:true});
globalThis.__R(parseInt(process.env.TICKS||'4000',10), parseInt(process.env.WIN||'500',10), saveAt, saveDir, process.env.SEED||'1', s=>console.log(s), fs, path);
