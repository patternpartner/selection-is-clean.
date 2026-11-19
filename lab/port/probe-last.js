// #458: FIRST WORD OR LAST? A creature is paid for its FIRST clean word of an epoch. This probe compares, per creature-epoch, that
// word with the creature's LAST clean word of the same epoch (clean, not trivial, not a copy of a read): how often each is new to
// the universe and its grade. Follows creatures across compaction (taskMove). Patches its own copy of the engine; draws nothing.
//   SEED=11 TASKS=1 MIND=20 TICKS=6000 EVERY=2000 node lab/port/probe-last.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
let code=fs.readFileSync(path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const A="  if(tPE[i]===e)return; const T=oSlot(key,m); if(T<0)return;", B="function taskMove(w,r){";
if(code.split(A).length!==2||code.split(B).length!==2){ console.error('pattern count'); process.exit(1); }
code=code.replace(A,"  globalThis.__wordHook(i,key,m,e,tPE[i]===e); if(tPE[i]===e)return; const T=oSlot(key,m); if(T<0)return;");
code=code.replace(B,B+" globalThis.__moveHook(w,r);");
globalThis.__wordHook=()=>{}; globalThis.__moveHook=()=>{};   // defined before the engine loads: its top level runs VM steps, and a missing hook would throw inside them
const Module=require('module'); const m=new Module('/tmp/last-sim.js'); m.filename='/tmp/last-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;function seenHas(F){ const M=tSet5.length-1; let h=(Math.imul(F,2654435761)>>>0)&M; while(true){ const k=tSet5[h]; if(k===F)return true; if(k===0)return false; h=(h+1)&M; } }
globalThis.__P=function(ticks){ const C=CAP; const fE=new Int32Array(C).fill(-1), fNew=new Uint8Array(C), fZ=new Float64Array(C), lE=new Int32Array(C).fill(-1), lNew=new Uint8Array(C), lZ=new Float64Array(C), lK=new Uint32Array(C), fK=new Uint32Array(C);
  const S={ep:0,firstNew:0,lastNew:0,sameWord:0,firstZ:0,lastZ:0,lastDeeper:0,lastShallower:0};
  const close=i=>{ if(fE[i]<0||lE[i]!==fE[i])return; S.ep++; S.firstNew+=fNew[i]; S.lastNew+=lNew[i]; S.firstZ+=fZ[i]; S.lastZ+=lZ[i]; if(lK[i]===fK[i])S.sameWord++; else if(lZ[i]>fZ[i])S.lastDeeper++; else if(lZ[i]<fZ[i])S.lastShallower++; fE[i]=-1; lE[i]=-1; };
  const grade=(key,m)=>m===5?taskSz5(key):Math.max(1,Math.min(255,oSz(0,m,false)));
  globalThis.__wordHook=(i,key,m,e,already)=>{ const isNew=seenHas(key)?0:1, z=grade(key,m);
    if(!already){ close(i); fE[i]=e; fNew[i]=isNew; fZ[i]=z; fK[i]=key; }
    if(fE[i]===e){ lE[i]=e; lNew[i]=isNew; lZ[i]=z; lK[i]=key; } };
  globalThis.__moveHook=(w,r)=>{ fE[w]=fE[r]; fNew[w]=fNew[r]; fZ[w]=fZ[r]; fK[w]=fK[r]; lE[w]=lE[r]; lNew[w]=lNew[r]; lZ[w]=lZ[r]; lK[w]=lK[r]; fE[r]=-1; lE[r]=-1; };
  const EVERY=+(process.env.EVERY||2000); let e0=-1;
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{ loop(); }catch(err){ if((globalThis.__errN=(globalThis.__errN|0)+1)<3)process.stderr.write("ERR "+String(err&&err.stack||err).slice(0,300)+String.fromCharCode(10)); }
    if(tEpoch!==e0){ for(let i=0;i<N;i++) if(fE[i]>=0&&fE[i]<tEpoch)close(i); e0=tEpoch; }
    if(t%EVERY===0){ const n=Math.max(1,S.ep); process.stderr.write(JSON.stringify({t,inputs:tNin,seen:tSeenN,epochs:S.ep,firstNewPct:+(100*S.firstNew/n).toFixed(2),lastNewPct:+(100*S.lastNew/n).toFixed(2),
      sameWordPct:+(100*S.sameWord/n).toFixed(1),lastDeeperPct:+(100*S.lastDeeper/n).toFixed(1),lastShallowerPct:+(100*S.lastShallower/n).toFixed(1),firstZ:+(S.firstZ/n).toFixed(2),lastZ:+(S.lastZ/n).toFixed(2)})+String.fromCharCode(10)); } }
  const h=require('crypto').createHash('sha256'); const f=new Float64Array(4); for(let i=0;i<N;i++){ if(!palive[i])continue; f[0]=px[i]; f[1]=py[i]; f[2]=pE[i]; f[3]=amp[i]; h.update(Buffer.from(f.buffer)); }
  h.update(Buffer.from(tG.buffer)); f[0]=Math.random(); h.update(Buffer.from(f.buffer)); return h.digest('hex').slice(0,8); };
console.log(JSON.stringify({digest:globalThis.__P(parseInt(process.env.TICKS||'2000',10))}));`,'/tmp/last-sim.js');
