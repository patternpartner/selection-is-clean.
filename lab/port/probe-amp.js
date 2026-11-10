// #394 - the amplitude census. Under one currency (STORE_DEATH, #381) amplitude no longer kills. This asks what still READS it:
// its distribution, how often each amp gate would pass, whether the creature with the most amplitude (the one the germline
// copies its program and physics from) is rich in the store, and every liveness counter, so two arms can be diffed.
// Reads arrays and counters only; draws nothing.
//   SEED=s TICKS=3000 TASKS=1 node lab/port/probe-amp.js        (add PROV_BIRTH=1 STORE_DEATH=0 AIM=1 REPL_CROWD_K=0 for two currencies)
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/amp-sim.js'); m.filename='/tmp/amp-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__A=function(ticks,every,out){ let errs=0;
  /* who is paid: keyed by the creature's genome OBJECT (a slot changes owner at compaction, the object does not), read-only hook */
  let paidW=new WeakSet(), paidEver=new WeakSet(), incW=new WeakMap();
  __taskOnPay=function(i,T,D){ const g=pGenome[i]; if(!g)return; paidW.add(g); paidEver.add(g); incW.set(g,(incW.get(g)||0)+1); };
  const q=(a,p)=>a.length?+a[Math.min(a.length-1,Math.floor(p*a.length))].toFixed(4):null;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,400)); }
    if(t%every) continue;
    const A=[],E=[]; let best=-1,bA=-1e9,bestE=-1,bE=-1e9,cl=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; A.push(amp[i]); E.push(pE[i]); if(amp[i]>bA){bA=amp[i];best=i;} if(pE[i]>bE){bE=pE[i];bestE=i;} if(clusterID[i]>=0)cl++; }
    const n=A.length; const sh=(x)=>n?+(A.filter(v=>v>x).length/n).toFixed(4):0;
    let below=0; if(best>=0) for(const e of E) if(e<pE[best])below++;
    const As=A.slice().sort((a,b)=>a-b), Es=E.slice().sort((a,b)=>a-b);
    let pw=0,pe=0,zero=0,hungry=0,old=0,oldUnpaid=0; const cnt=[]; for(let i=0;i<N;i++){ if(!palive[i])continue; const g=pGenome[i]; if(paidW.has(g)){pw++;cnt.push(incW.get(g)||0);} if(paidEver.has(g))pe++; if(pE[i]<=0)zero++; if(pAdq[i]<1)hungry++; if(page[i]>=every){ old++; if(!paidEver.has(g))oldUnpaid++; } }
    cnt.sort((a,b)=>b-a); const totP=cnt.reduce((a,b)=>a+b,0), top=cnt.slice(0,Math.ceil(n*0.1)).reduce((a,b)=>a+b,0);
    out(JSON.stringify({pay:t, alive:n, paidInWindow:n?+(pw/n).toFixed(3):0, paidEver:n?+(pe/n).toFixed(3):0, storeEmpty:n?+(zero/n).toFixed(3):0, underfed:n?+(hungry/n).toFixed(3):0,
      olderThanWindow:n?+(old/n).toFixed(3):0, oldNeverPaid:old?+(oldUnpaid/old).toFixed(3):0, paymentsToTop10pct:totP?+(top/totP).toFixed(3):0, meanAge:n?Math.round(Array.from({length:N},(_,i)=>palive[i]?page[i]:0).reduce((a,b)=>a+b,0)/n):0}));
    paidW=new WeakSet(); incW=new WeakMap();
    out(JSON.stringify({tick:t, alive:n, amp:{q05:q(As,0.05),q50:q(As,0.5),q95:q(As,0.95),max:q(As,0.9999)}, pE:{q05:q(Es,0.05),q50:q(Es,0.5),q95:q(Es,0.95)},
      gt:{selfwrite:sh(SELFWRITE_COST), p2:sh(0.2), p4:sh(0.4), p65:sh(0.65), soft:sh(AMP_SOFT-1e-9)}, inCluster:n?+(cl/n).toFixed(3):0,
      ampBestStorePct:n?+(below/n).toFixed(3):null, ampBestE:best>=0?+pE[best].toFixed(4):null, storeBestE:bestE>=0?+bE.toFixed(4):null, sameBest:best===bestE})); }
  out(JSON.stringify({liveness:__liveness, flags:{STORE_DEATH, TASKS_ON, REPL_ON, TASK_IN:(typeof TASK_IN!=='undefined'?TASK_IN:null)}})); };`, m.filename);
globalThis.__A(parseInt(process.env.TICKS||'3000',10), parseInt(process.env.SAMPLE||'500',10), s=>console.log(s));
