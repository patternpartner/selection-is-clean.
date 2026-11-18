// A world's digest under node: positions, stores, amplitudes, the ground, the lifetime count and the next random draw, after TICKS.
// Two engines that print the same line ran the same world.   SEED=3 TICKS=2000 TASKS=1 [INDEX=other-engine.html] node lab/port/digest.js
const fs=require('fs'), path=require('path'), crypto=require('crypto'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/digest-sim.js'); m.filename='/tmp/digest-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__D=function(ticks){ let errs=0; const EVERY=+(process.env.EVERY||0), T0=Date.now(); for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,400)); }
    if(EVERY&&t%EVERY===0&&typeof TASKS_ON!=='undefined'&&TASKS_ON){ let al=0; for(let i=0;i<N;i++)if(palive[i])al++; const o=TASK_OPEN?oExport():null; let L=0,C=0,TK=0,mx=0; for(let i=0;i<N;i++)if(palive[i]){ const p=pProg[i]||[]; L+=p.length; if(p.length>mx)mx=p.length; C+=(pGenome[i]&&pGenome[i].vmMaxInstructions)||0; for(const ins of p)if(ins[0]>=TASK_OP0&&ins[0]<TASK_OP0+5)TK++; }
      process.stderr.write(String.fromCharCode(10)+JSON.stringify({t,alive:al,len:+(L/Math.max(1,al)).toFixed(1),maxLen:mx,cap:+(C/Math.max(1,al)).toFixed(1),taskOps:+(TK/Math.max(1,al)).toFixed(1),seen:tSeenN,paid:tEv.paid,n:o?o.n:5,hist:o?o.hist.slice(5):undefined,win:o?o.win:undefined,ze:o?o.ze:undefined,ms:Date.now()-T0})); } }
  const h=require('crypto').createHash('sha256'); let alive=0; const f=new Float64Array(4);
  for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; f[0]=px[i]; f[1]=py[i]; f[2]=pE?pE[i]:0; f[3]=amp[i]; h.update(Buffer.from(f.buffer)); }
  const T=(typeof TASKS_ON!=='undefined'&&TASKS_ON); if(T&&typeof tG!=='undefined'&&tG)h.update(Buffer.from(tG.buffer));
  f[0]=Math.random(); h.update(Buffer.from(f.buffer));
  return {digest:h.digest('hex').slice(0,8), alive, seen:T?tSeenN:0, ev:T?{paid:tEv.paid,gReads:tEv.gReads|0,gWrites:tEv.gWrites|0,refused:tEv.refused,dirty:tEv.dirty,trivial:tEv.trivial,glow:tEv.glowReads|0,glowHits:tEv.glowHits|0,glowMean:+((tEv.glowSum|0)/Math.max(1,tEv.glowHits|0)).toFixed(2),glowPaid:tEv.glowPaid|0,glowNew:tEv.glowNew|0,lightOut:tEv.lightOut|0,mkt:+(tEv.mkt||0).toFixed(1),mktHeld:+(()=>{ let x=0; if(typeof tSlots!=='undefined'&&tSlots)for(let n=0;n<tSlotN;n++){ const T=tSlots[n]; if(tRes[T]>tCap[T])x+=tRes[T]-tCap[T]; } return x; })().toFixed(1),mktN:tEv.mktN|0,mktZ:+((tEv.mktZ||0)/Math.max(1e-9,tEv.mkt||0)).toFixed(2),incZ:+((tEv.incZ||0)/Math.max(1e-9,(tEv.income||0)+(tEv.mkt||0))).toFixed(2),income:+(tEv.income||0).toFixed(1),dilMean:+((typeof __dilSum!=='undefined'?__dilSum:0)/Math.max(1,typeof __dilN!=='undefined'?__dilN:0)).toFixed(3)}:null, open:(T&&TASK_OPEN)?(()=>{ const x=oExport(); let zs=0; for(let q=0;q<oLogN;q++)zs+=oLogZ[q]; return {n:x.n,at:x.at,hist:x.hist,win:x.win,meanZ:+(zs/Math.max(1,oLogN)).toFixed(2)}; })():undefined, errs}; };`, m.filename);
console.log(JSON.stringify(globalThis.__D(parseInt(process.env.TICKS||'2000',10))));
