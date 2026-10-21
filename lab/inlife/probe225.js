// #322 - op 225 (PROG_LATERAL_COPY) under REPL: does running a borrowed program earn births ("somatic mimicry")?
// Readouts (PREREG-op225.md):
//   world:    share of the living whose GERMLINE program (pGenome[i].vmProgram) carries op 225, every SAMPLE ticks
//   particle: each particle the first time it copies (REPL=1) or would have copied (REPL_INERT=225), matched at the end
//             of that tick to an unflagged living particle with the nearest pNeighborCount (a crowding control);
//             both are followed for WINDOW ticks or until death, counting children (as either parent).
// Tracking lives outside the engine: births and compaction through novelty-shadows' BIRTHS / COMPACT hooks, op 225
// through the engine's __on225 hook (#322). Particles change slots every 45 ticks, so every per-slot array is moved on
// compaction, and identity is checked each tick against the pGenome object the slot held at birth. The probe's own
// choices use its own mulberry stream: it draws nothing from Math.random.
//   SEED=s TICKS=10000 REPL=1 [REPL_INERT=225] [NULLSHIFT=k] node lab/inlife/probe225.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p225-sim.js'); m.filename='/tmp/p225-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__P=function(ticks,every,win,nullshift,rng){
  const CAP=palive.length;
  let uid=new Int32Array(CAP), role=new Int8Array(CAP), kids=new Int32Array(CAP), endT=new Int32Array(CAP), t0=new Int32Array(CAP), nbA=new Int32Array(CAP), pid=new Int32Array(CAP), gref=new Array(CAP).fill(null);
  let nextUid=0, pairN=0, tick=0, idMismatch=0, flagCalls=[0,0];
  const flagged=new Set(), pending=new Set(), recs=[], series=[];
  for(let i=0;i<N;i++) if(palive[i]){ uid[i]=++nextUid; gref[i]=pGenome[i]; }
  const fin=(i,died)=>{ recs.push({role:role[i],pair:pid[i],kids:kids[i],nb:nbA[i],t0:t0[i],len:(died?tick:endT[i])-t0[i],died:died?1:0}); role[i]=0; };
  const born=function(c,a,b){ if(role[c]>0)fin(c,1); uid[c]=++nextUid; gref[c]=pGenome[c]; role[c]=0;
    for(const p of [a,b]) if(p>=0&&p<CAP&&role[p]>0&&tick<endT[p]) kids[p]++; };
  (${NS.BIRTHS})(born);
  (${NS.COMPACT})(function(ni){
    for(let r=0;r<ni.length;r++) if(ni[r]<0&&role[r]>0) fin(r,1);
    const U=new Int32Array(CAP), R=new Int8Array(CAP), K=new Int32Array(CAP), E=new Int32Array(CAP), T=new Int32Array(CAP), B=new Int32Array(CAP), Q=new Int32Array(CAP), G=new Array(CAP).fill(null);
    for(let r=0;r<ni.length;r++){ const w=ni[r]; if(w<0)continue; U[w]=uid[r]; R[w]=role[r]; K[w]=kids[r]; E[w]=endT[r]; T[w]=t0[r]; B[w]=nbA[r]; Q[w]=pid[r]; G[w]=gref[r]; }
    uid=U; role=R; kids=K; endT=E; t0=T; nbA=B; pid=Q; gref=G;
    const P2=[...pending]; pending.clear(); for(const i of P2){ const w=i<ni.length?ni[i]:-1; if(w>=0)pending.add(w); } });
  __on225=function(i,act){ flagCalls[act]++; if(!flagged.has(uid[i])) pending.add(i); };
  for(let q=0;q<nullshift;q++) Math.random();
  for(tick=1;tick<=ticks;tick++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    for(let i=0;i<N;i++){ if(palive[i]&&gref[i]!==pGenome[i]){ idMismatch++; gref[i]=pGenome[i]; }
      if(role[i]>0&&(!palive[i]||tick>=endT[i])) fin(i,!palive[i]); }
    for(const i of pending){ if(!palive[i]||flagged.has(uid[i])||role[i]>0)continue;
      flagged.add(uid[i]); role[i]=1; kids[i]=0; t0[i]=tick; endT[i]=tick+win; nbA[i]=pNeighborCount[i]; pid[i]=++pairN;
      let best=1e9, cand=[];
      for(let c=0;c<N;c++){ if(!palive[c]||role[c]>0||flagged.has(uid[c]))continue; const d=Math.abs(pNeighborCount[c]-nbA[i]);
        if(d<best){ best=d; cand=[c]; } else if(d===best) cand.push(c); }
      if(cand.length){ const c=cand[(rng()*cand.length)|0]; role[c]=2; kids[c]=0; t0[c]=tick; endT[c]=tick+win; nbA[c]=pNeighborCount[c]; pid[c]=pairN; } }
    pending.clear();
    if(tick%every===0){ let alive=0, germ=0, run=0, split=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const g=pGenome[i];
        if(g&&Array.isArray(g.vmProgram)&&g.vmProgram.some(x=>x&&(x[0]|0)===225))germ++;
        if(Array.isArray(pProg[i])&&pProg[i].some(x=>x&&(x[0]|0)===225))run++;
        if(g&&pProg[i]!==g.vmProgram)split++; }
      series.push({tick,alive,germ225:germ,run225:run,split,copies:flagCalls[1],would:flagCalls[0]}); } }
  for(let i=0;i<CAP;i++) if(role[i]>0) fin(i,0);
  return {series,recs,flagCalls,idMismatch,nextUid};
};`, m.filename);
const r=globalThis.__P(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'500',10),
  parseInt(process.env.WINDOW||'500',10), parseInt(process.env.NULLSHIFT||'0',10)||0, NS.mulberry(0x225));
console.log(JSON.stringify({seed:process.env.SEED||'1', repl:process.env.REPL||'0', inert:process.env.REPL_INERT||'', nullshift:process.env.NULLSHIFT||'0', ...r}));
