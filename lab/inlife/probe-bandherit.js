// RETIRED IN #332: this needs engine.html at 5f25594 (REPL_COPY / REPL_DIET / REPL_CONTACT were removed after it). On a later engine the knob is silently ignored and every arm runs plain REPL. Run it from a worktree: git worktree add --detach <dir> 5f25594
// #330 - was #329's diet band heritable at all? Two readouts under REPL_DIET:
//   (1) parent-child agreement: at each parented birth the parent's band is recorded against the child's slot; once the
//       child is AGE ticks old (it has run its own program by then) its band is compared with that record. Reported with
//       the agreement expected by chance from the band frequencies at the time (sum of p_b^2).
//   (2) program -> band determinism: every SAMPLE ticks, for each exact op sequence held by at least 5 living particles,
//       the share of its carriers in its commonest band (1 = the program fixes the band; 1/K-ish = it does not).
// Slots followed through compaction (novelty-shadows' COMPACT hook). Reads state only; draws nothing.
//   SEED=s TICKS=10000 REPL=1 REPL_DIET=4 [NULLSHIFT=k] [AGE=20] node lab/inlife/probe-bandherit.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/bh-sim.js'); m.filename='/tmp/bh-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__H=function(ticks,every,AGE,nullshift){
  const CAP=palive.length; let pb=new Int8Array(CAP).fill(-1), born=new Int32Array(CAP); let tick=0;
  let n=0, agree=0, chance=0; const rows=[];
  (${NS.BIRTHS})(function(c,a){ if(a>=0&&a<N&&palive[a]){ pb[c]=pBand[a]; born[c]=tick; } else pb[c]=-1; });
  (${NS.COMPACT})(function(ni){ const P=new Int8Array(CAP).fill(-1), B=new Int32Array(CAP);
    for(let r=0;r<ni.length;r++){ const w=ni[r]; if(w<0)continue; P[w]=pb[r]; B[w]=born[r]; } pb=P; born=B; });
  for(let q=0;q<nullshift;q++) Math.random();
  for(tick=1;tick<=ticks;tick++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    let freq=null;
    for(let i=0;i<N;i++){ if(pb[i]<0)continue; if(!palive[i]){ pb[i]=-1; continue; } if(tick-born[i]<AGE)continue;
      if(!freq){ freq=new Array(DIET_K).fill(0); let t=0; for(let j=0;j<N;j++) if(palive[j]){ freq[pBand[j]]++; t++; } for(let b=0;b<DIET_K;b++) freq[b]/=Math.max(1,t); }
      n++; if(pBand[i]===pb[i]) agree++; let c=0; for(let b=0;b<DIET_K;b++) c+=freq[b]*freq[b]; chance+=c; pb[i]=-1; }
    if(tick%every===0){ const by=new Map(); for(let i=0;i<N;i++){ if(!palive[i])continue; const k=(pProg[i]||[]).map(x=>x?(x[0]|0):-1).join('.');
        let e=by.get(k); if(!e){ e=new Array(DIET_K).fill(0); by.set(k,e); } e[pBand[i]]++; }
      let progs=0, carriers=0, modal=0; by.forEach(e=>{ const s=e.reduce((a,b)=>a+b,0); if(s<5)return; progs++; carriers+=s; modal+=Math.max(...e); });
      rows.push({tick, pairs:n, agreement:n?+(agree/n).toFixed(4):null, chanceAgreement:n?+(chance/n).toFixed(4):null,
        programsWith5:progs, modalBandShare:carriers?+(modal/carriers).toFixed(4):null});
      n=0; agree=0; chance=0; } }
  return {K:DIET_K, AGE, rows}; };`, m.filename);
const r=globalThis.__H(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'1000',10), parseInt(process.env.AGE||'20',10), parseInt(process.env.NULLSHIFT||'0',10)||0);
console.log(JSON.stringify({seed:process.env.SEED||'1', ...r}));
