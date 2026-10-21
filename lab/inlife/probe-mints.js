// #327 - where do new lineages come from, and why does REPL make almost none (#326: 0.1-5.5 pLin mints per 1,000 births
// against the default world's 280-464)? Every SAMPLE ticks: lineages ever created, by mint site (the registry's own `src`:
// founder|speciate|cluster|bud|specMint|specDeme), lineages standing by mint site, and at every parented birth through
// addParticle, the child's trait distance from parentA - the quantity addParticle's 'speciate' gate compares with
// SPECIATE_DIST - split into births that cleared it and births that did not. Reads state only; draws nothing.
//   SEED=s TICKS=10000 [REPL=1] node lab/inlife/probe-mints.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/mints-sim.js'); m.filename='/tmp/mints-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__M=function(ticks,every){
  let par=0, over=0, dsum=0, viaCompound=0; const rows=[];
  const _ap=addParticle, _ac=addCompound;
  addParticle=function(){ const c=_ap.apply(this,arguments), a=arguments[4];
    if(c>=0&&a>=0&&a<N&&palive[a]){ par++; let d2=0; for(let d=0;d<DIMS;d++){ const v=tend[c*DIMS+d]-tend[a*DIMS+d]; d2+=v*v; } dsum+=Math.sqrt(d2); if(d2>SPECIATE_DIST*SPECIATE_DIST) over++; }
    return c; };
  addCompound=function(){ const c=_ac.apply(this,arguments); if(c>=0) viaCompound++; return c; };
  const bySrc=()=>{ const all={}, live={}; const alive=new Set(); for(let i=0;i<N;i++) if(palive[i]) alive.add(pLin[i]);
    lineageRegistry.forEach((e,id)=>{ const s=(e&&e.src)||'?'; all[s]=(all[s]||0)+1; if(alive.has(id)) live[s]=(live[s]||0)+1; }); return {all,live}; };
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if(t%every===0){ const b=bySrc(); let alive=0; for(let i=0;i<N;i++) if(palive[i]) alive++;
      rows.push({tick:t, alive, parentedAddParticle:par, overSpeciateDist:over, meanStep:par?+(dsum/par).toFixed(3):null, viaCompound, created:b.all, standing:b.live}); } }
  return {SPECIATE_DIST, rows}; };`, m.filename);
const r=globalThis.__M(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'1000',10));
console.log(JSON.stringify({seed:process.env.SEED||'1', repl:process.env.REPL||'0', ...r}));
