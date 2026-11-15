// A world's digest under node: positions, stores, amplitudes, the ground, the lifetime count and the next random draw, after TICKS.
// Two engines that print the same line ran the same world.   SEED=3 TICKS=2000 TASKS=1 [INDEX=other-engine.html] node lab/port/digest.js
const fs=require('fs'), path=require('path'), crypto=require('crypto'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis);
require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/digest-sim.js'); m.filename='/tmp/digest-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__D=function(ticks){ let errs=0; const EVERY=+(process.env.EVERY||0), T0=Date.now(); for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){ if(errs++<3)console.error(String(e&&e.stack||e).slice(0,400)); }
    if(EVERY&&t%EVERY===0&&typeof TASKS_ON!=='undefined'&&TASKS_ON){ let al=0; for(let i=0;i<N;i++)if(palive[i])al++; const o=TASK_OPEN?oExport():null; process.stderr.write(String.fromCharCode(10)+JSON.stringify({t,alive:al,seen:tSeenN,paid:tEv.paid,n:o?o.n:5,hist:o?o.hist.slice(5):undefined,win:o?o.win:undefined,ms:Date.now()-T0})); } }
  const h=require('crypto').createHash('sha256'); let alive=0; const f=new Float64Array(4);
  for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; f[0]=px[i]; f[1]=py[i]; f[2]=pE?pE[i]:0; f[3]=amp[i]; h.update(Buffer.from(f.buffer)); }
  const T=(typeof TASKS_ON!=='undefined'&&TASKS_ON); if(T&&typeof tG!=='undefined'&&tG)h.update(Buffer.from(tG.buffer));
  f[0]=Math.random(); h.update(Buffer.from(f.buffer));
  return {digest:h.digest('hex').slice(0,8), alive, seen:T?tSeenN:0, ev:T?{paid:tEv.paid,gReads:tEv.gReads|0,gWrites:tEv.gWrites|0,refused:tEv.refused,dirty:tEv.dirty,trivial:tEv.trivial}:null, open:(T&&TASK_OPEN)?(()=>{ const x=oExport(); let zs=0; for(let q=0;q<oLogN;q++)zs+=oLogZ[q]; return {n:x.n,at:x.at,hist:x.hist,win:x.win,meanZ:+(zs/Math.max(1,oLogN)).toFixed(2)}; })():undefined, errs}; };`, m.filename);
console.log(JSON.stringify(globalThis.__D(parseInt(process.env.TICKS||'2000',10))));
