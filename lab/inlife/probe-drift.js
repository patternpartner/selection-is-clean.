// #326 - is REPL's lineage collapse (#282, #319) a selective sweep or drift on a faster clock?
// Every particle alive at tick 1 gets its own FOUNDER label; a parented child takes its parent's label (parentA), a
// parentless one (refill, rescue) a fresh IMMIGRANT label. Reported every SAMPLE ticks against cumulative births per head
// (generations): founder labels still standing, and K MIXED shadows - the same births and deaths, but each child copies a
// uniformly random living particle's shadow label (novelty-shadows' MIXED null: a well-mixed Moran process on the real
// demography; reproductive skew alone, heritable or not, beats it). Also: how many new pLin ids the engine mints per
// 1,000 births (speciation at birth and specMint cohorts), so the default world's and REPL's lineage counts can be read
// for what they are. Births and compaction through novelty-shadows' hooks; own mulberry stream; draws nothing.
//   SEED=s TICKS=10000 [REPL=1] [REPL_FROZEN=1] [NULLSHIFT=k] [K=20] node lab/inlife/probe-drift.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/drift-sim.js'); m.filename='/tmp/drift-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__D=function(ticks,every,K,nullshift,rng){
  const CAP=palive.length; let lab=new Int32Array(CAP); let sh=[]; for(let k=0;k<K;k++) sh.push(new Int32Array(CAP));
  let F0=0, next=0, births=0, parentless=0, ticksNow=0, aliveSum=0; const seenLin=new Set(); let mints=0, mintBirths=0;
  for(let i=0;i<N;i++) if(palive[i]){ lab[i]=++next; for(let k=0;k<K;k++) sh[k][i]=next; seenLin.add(pLin[i]); }
  F0=next;
  let pool=[];
  (${NS.BIRTHS})(function(c,a){ births++;
    if(a>=0&&a<CAP){ lab[c]=lab[a];
      for(let k=0;k<K;k++){ let r=-1; for(let t=0;t<8&&pool.length;t++){ const q=pool[(rng()*pool.length)|0]; if(q!==c&&palive[q]){ r=q; break; } } sh[k][c]=r>=0?sh[k][r]:lab[a]; } }
    else { parentless++; lab[c]=++next; for(let k=0;k<K;k++) sh[k][c]=next; } });
  (${NS.COMPACT})(function(ni){
    const L=new Int32Array(CAP), S=sh.map(()=>new Int32Array(CAP));
    for(let r=0;r<ni.length;r++){ const w=ni[r]; if(w<0)continue; L[w]=lab[r]; for(let k=0;k<K;k++) S[k][w]=sh[k][r]; }
    lab=L; sh=S; });
  for(let q=0;q<nullshift;q++) Math.random();
  const rows=[];
  for(let t=1;t<=ticks;t++){ pool.length=0; for(let i=0;i<N;i++) if(palive[i]) pool.push(i); aliveSum+=pool.length; ticksNow=t;
    const b0=births; globalThis.__detMs+=5; try{loop();}catch(e){}
    for(let i=0;i<N;i++) if(palive[i]&&!seenLin.has(pLin[i])){ seenLin.add(pLin[i]); mints++; }
    if(t%every===0){ let alive=0; const fr=new Set(), al=new Set(), sf=sh.map(()=>new Set());
      for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; al.add(lab[i]); if(lab[i]<=F0) fr.add(lab[i]);
        for(let k=0;k<K;k++) if(sh[k][i]<=F0) sf[k].add(sh[k][i]); }
      const lin=new Set(); for(let i=0;i<N;i++) if(palive[i]) lin.add(pLin[i]);
      const meanN=aliveSum/t;
      rows.push({tick:t, alive, births, parentless, gens:+(births/Math.max(1,meanN)).toFixed(2), founders:fr.size,
        shadow:sf.map(s=>s.size), labels:al.size, linStanding:lin.size, linMints:mints}); } }
  return {F0,rows}; };`, m.filename);
const r=globalThis.__D(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'500',10), parseInt(process.env.K||'20',10),
  parseInt(process.env.NULLSHIFT||'0',10)||0, NS.mulberry(0xd21f7));
console.log(JSON.stringify({seed:process.env.SEED||'1', repl:process.env.REPL||'0', frozen:process.env.REPL_FROZEN||'0', nullshift:process.env.NULLSHIFT||'0', ...r}));
