// RETIRED IN #332: this needs engine.html at 5f25594 (REPL_COPY / REPL_DIET / REPL_CONTACT were removed after it). On a later engine the knob is silently ignored and every arm runs plain REPL. Run it from a worktree: git worktree add --detach <dir> 5f25594
// #324 follow-up: does REPL_COPY lower the top genotype share because each birth VARIES more, rather than because selection
// holds more types? At every parented birth, compares the child's opcode sequence (the key harness-oee's topSeqShare uses)
// with the parent's running program, and reports per window: births, share of children that differ, mean opcode positions
// differing (plus the length difference), and the engine's own copy / inject counts (__liveness, differenced).
// Births through novelty-shadows' BIRTHS hook; reads state only, draws nothing.
//   SEED=s TICKS=10000 REPL=1 REPL_COPY=1            node lab/inlife/probe-birthvar.js
//   SEED=s TICKS=10000 REPL=1 REPL_COPY=2 REPL_INERT=225 node lab/inlife/probe-birthvar.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/bv-sim.js'); m.filename='/tmp/bv-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__B=function(ticks,every,nullshift){
  const ops=p=>Array.isArray(p)?p.map(x=>x?(x[0]|0):-1):[];
  let w={b:0,diff:0,pos:0,dlen:0}; const rows=[];
  (${NS.BIRTHS})(function(c,a){ if(!(a>=0&&a<N&&palive[a]))return; const P=ops(pProg[a]), C=ops(pProg[c]); w.b++;
    let d=Math.abs(P.length-C.length); const n=Math.min(P.length,C.length); for(let q=0;q<n;q++) if(P[q]!==C[q]) d++;
    if(d>0){ w.diff++; w.pos+=d; } w.dlen+=C.length-P.length; });
  const L=k=>(typeof __liveness!=='undefined'&&__liveness)?(__liveness[k]|0):0;
  let c0=L('repl.copy'), i0=L('repl.inject');
  for(let q=0;q<nullshift;q++) Math.random();
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if(t%every===0){ const c1=L('repl.copy'), i1=L('repl.inject'); let alive=0; for(let i=0;i<N;i++) if(palive[i]) alive++;
      rows.push({tick:t, alive, births:w.b, diffShare:w.b?+(w.diff/w.b).toFixed(4):null, posPerBirth:w.b?+(w.pos/w.b).toFixed(3):null,
        dlenPerBirth:w.b?+(w.dlen/w.b).toFixed(3):null, copies:c1-c0, injects:i1-i0});
      c0=c1; i0=i1; w={b:0,diff:0,pos:0,dlen:0}; } }
  return rows; };`, m.filename);
const rows=globalThis.__B(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'1000',10), parseInt(process.env.NULLSHIFT||'0',10)||0);
console.log(JSON.stringify({seed:process.env.SEED||'1', copy:process.env.REPL_COPY||'0', rows}));
