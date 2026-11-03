// #352: a universe saved in the old default world, reloaded under TASKS (browser, playwright). Prints what its particles run, what the layer pays and how many REPL births, beside a fresh TASKS universe.
//   node lab/port/reload-test.js   (from the repo root; about 2.5 minutes)
const {chromium}=require('playwright'); const path=require('path'); const U='file://'+path.resolve('engine.html');
const probe=()=>{ let alive=0, withOps=0, withRepro=0; for(let i=0;i<N;i++) if(palive[i]){ alive++; const p=pProg[i]||[]; if(p.some(x=>x[0]>=TASK_OP0&&x[0]<TASK_OP0+5))withOps++; if(p.some(x=>x[0]===4))withRepro++; }
  return {TASKS_ON, tick, alive, withOps, withRepro, paid:tEv.paid, ev:JSON.stringify(tEv), epoch:tEpoch, stime:typeof __STIME!=='undefined'?__STIME:null, maxI:genome.vmMaxInstructions, head:JSON.stringify((pProg[0]||[]).slice(0,6)), births:__liveness['repl.birth']||0, gProgOps:genome.vmProgram.filter(x=>x[0]>=TASK_OP0&&x[0]<TASK_OP0+5).length, gLen:genome.vmProgram.length}; };
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext();
  const p0=await ctx.newPage(); await p0.goto(U+'#reset'); await p0.waitForTimeout(1500); await p0.close();
  const p1=await ctx.newPage(); await p1.goto(U+'#notasks'); await p1.waitForTimeout(40000); await p1.evaluate(()=>{ try{ saveGenome(); }catch(e){} try{ const g=trimGenomeToBudget(); if(g)localStorage.setItem('selection_genome',g); }catch(e){} });
  console.log('old world', JSON.stringify(await p1.evaluate(()=>({tick, N, saved:(localStorage.getItem('selection_genome')||'').length})))); await p1.close();
  const p2=await ctx.newPage(); await p2.goto(U); await p2.waitForTimeout(200); console.log('old germline loaded', JSON.stringify(await p2.evaluate(()=>({ops:genome.vmProgram.filter(x=>x[0]>=TASK_OP0&&x[0]<TASK_OP0+5).length, repro:genome.vmProgram.filter(x=>x[0]===4).length, len:genome.vmProgram.length})))); await p2.waitForTimeout(1500); console.log('reloaded, early', JSON.stringify(await p2.evaluate(probe)));
  await p2.waitForTimeout(40000); console.log('reloaded, later', JSON.stringify(await p2.evaluate(probe))); await p2.close();
  const p3=await ctx.newPage(); await p3.goto(U+'#reset'); await p3.waitForTimeout(41500); console.log('fresh TASKS', JSON.stringify(await p3.evaluate(probe))); await b.close(); })();
