// #365 - what makes a booming TASKS world crash? (#362: 9801 TRICKLE fell from 1,700 alive to 2 between 35,000 and 40,000; 9802 TRICKLE
// from about 1,750 to 143 between 5,000 and 10,000.) Every ROW ticks one line: alive, births, prey events, task and sun income,
// payments, how full the pools are, mean store and age, the share in grace, the largest lineage's share, how many programs carry
// INPUT / READ / OUTPUT and predation (155), and any non-finite field cell or amp. Reads counters and arrays; draws nothing.
//   SEED=9802 TASKS=1 TASK_TRICKLE=200 TICKS=10000 ROW=250 node lab/port/probe-crash.js > out.jsonl
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/crash-sim.js'); m.filename='/tmp/crash-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__C=function(ticks,ROW,out){ const lv=()=>(typeof __liveness!=='undefined')?__liveness:{}; let lb=0, lp=0, li=0, ls=0, lpd=0, errs=0, capSum=0;
  for(let T=0;T<TASK_NF;T++)capSum+=tCap[T];
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,300)); }
    if(t%ROW) continue;
    let alive=0, eSum=0, ageSum=0, grace=0, inp=0, rd=0, outp=0, pred=0, badAmp=0; const lin=new Map();
    for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; eSum+=pE[i]; ageSum+=page[i]; if(!Number.isFinite(amp[i]))badAmp++;
      if(typeof specInGrace==='function'&&specInGrace(pLin[i]))grace++; lin.set(pLin[i],(lin.get(pLin[i])||0)+1);
      const p=pProg[i]||[]; let a=0,b=0,c=0,d=0; for(const x of p){ const o=x[0]; if(o===TASK_OP0)a=1; else if(o===TASK_OP0+3)b=1; else if(o===TASK_OP0+4)c=1; else if(o===155)d=1; } inp+=a; rd+=b; outp+=c; pred+=d; }
    let big=0; for(const v of lin.values()) if(v>big)big=v; let res=0; for(let T=0;T<TASK_NF;T++)res+=tRes[T];
    let badField=0, fmax=0; for(let k=0;k<field.length;k++){ const f=field[k]; if(!Number.isFinite(f))badField++; else if(f>fmax)fmax=f; }
    const L=lv(), b=L['repl.birth']|0, pr=L['repl.prey']|0;
    out(JSON.stringify({tick:t, alive, births:b-lb, prey:pr-lp, taskInc:+(tEv.income-li).toFixed(1), sunInc:+(tEv.sun-ls).toFixed(1), paid:tEv.paid-lpd,
      poolFill:+(res/capSum).toFixed(3), meanE:alive?+(eSum/alive).toFixed(3):0, meanAge:alive?Math.round(ageSum/alive):0, grace:alive?+(grace/alive).toFixed(2):0,
      lineages:lin.size, bigLin:alive?+(big/alive).toFixed(2):0, input:inp, read:rd, output:outp, pred155:pred, fieldMax:+fmax.toFixed(2), badField, badAmp}));
    lb=b; lp=pr; li=tEv.income; ls=tEv.sun; lpd=tEv.paid; } };`, m.filename);
globalThis.__C(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.ROW||'250',10), s=>console.log(s));
