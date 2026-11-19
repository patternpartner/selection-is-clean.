// #457: DISCOVERIES THE WORLD DOES NOT RECORD. An output that is clean, not trivial and not a copy reaches the payment check; if its
// creature was already paid this epoch (tPE) or the slot table is full, nothing is paid and nothing is recorded (tSeen, the ground
// and the lifetime record are written only at payment). This probe counts those outputs whose function was NEW to the universe at
// that moment, and whether each was paid later anyway. It patches a counter into its own copy of the engine source (engine.html is
// untouched) and draws nothing: the world's digest must equal digest.js's on the same seed.
//   SEED=11 TASKS=1 MIND=20 TICKS=12000 EVERY=2000 node lab/port/probe-lost.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
let code=fs.readFileSync(path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const A="  if(tPE[i]===e)return; const T=oSlot(key,m); if(T<0)return;";
if(code.split(A).length!==2){ console.error('pattern count'); process.exit(1); }
code=code.replace(A,"  if(tPE[i]===e||tSlotN>=TASK_NF*0.9){ globalThis.__lostHook(key,tPE[i]===e?0:1,TASK_SZ5OF(key,m)); if(tPE[i]===e)return; } const T=oSlot(key,m); if(T<0)return;");
const Module=require('module'); const m=new Module('/tmp/lost-sim.js'); m.filename='/tmp/lost-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;function TASK_SZ5OF(key,m){ return m===5?taskSz5(key):Math.max(1,Math.min(255,oSz(0,m,false))); }
function seenHas(F){ const M=tSet5.length-1; let h=(Math.imul(F,2654435761)>>>0)&M; while(true){ const k=tSet5[h]; if(k===F)return true; if(k===0)return false; h=(h+1)&M; } }
globalThis.__P=function(ticks){ const lost=new Map(); let ev=[0,0], evNew=[0,0], szSum=0, szN=0, paidSz=0, paidN=0;
  globalThis.__lostHook=(key,why,z)=>{ ev[why]++; if(seenHas(key))return; evNew[why]++; if(!lost.has(key)){ lost.set(key,tick); szSum+=z; szN++; } };
  __taskOnPay=(i,T)=>{ paidSz+=TASK_SZ[T]; paidN++; };
  const EVERY=+(process.env.EVERY||2000); let seen0=tSeenN, lost0=0;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{ loop(); }catch(e){}
    if(t%EVERY===0){ let later=0; for(const [k] of lost) if(seenHas(k))later++; let al=0; for(let i=0;i<N;i++)if(palive[i])al++;
      process.stderr.write(JSON.stringify({t,alive:al,inputs:tNin,recorded:tSeenN,recordedWin:tSeenN-seen0,lostDistinct:lost.size,lostWin:lost.size-lost0,lostLaterPaid:later,
        alreadyPaidOutputs:ev[0],tableFull:ev[1],newAtCheck:evNew,lostMeanGrade:+(szSum/Math.max(1,szN)).toFixed(2),paidMeanGrade:+(paidSz/Math.max(1,paidN)).toFixed(2)})+String.fromCharCode(10)); seen0=tSeenN; lost0=lost.size; } }
  const h=require('crypto').createHash('sha256'); const f=new Float64Array(4); for(let i=0;i<N;i++){ if(!palive[i])continue; f[0]=px[i]; f[1]=py[i]; f[2]=pE[i]; f[3]=amp[i]; h.update(Buffer.from(f.buffer)); }
  h.update(Buffer.from(tG.buffer)); f[0]=Math.random(); h.update(Buffer.from(f.buffer)); return h.digest('hex').slice(0,8); };
console.log(JSON.stringify({digest:globalThis.__P(parseInt(process.env.TICKS||'2000',10))}));`,'/tmp/lost-sim.js');
