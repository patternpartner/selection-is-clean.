// REPL-mode probe (#307): births by route (parented/parentless/interference), population, program-driven births, with the VM on or off.
// env: SEED, REPL=1, VMOFF=1 (the three VM entry points become no-ops, as BLANKVM=3), TICKS, EVERY
const fs=require('fs'), path=require('path');
const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
try{ require(path.join(R,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/probe20.js'); m.filename='/tmp/probe20.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__probe=function(TICKS,EVERY,VMOFF){
  const out={rows:[],err:null}; let parented=0, parentless=0, tried=0;
  if(VMOFF){ executeVM=function(){}; executeClusterVM=function(){}; executeSoloVM=function(){}; }
  const orig=addParticle; const n0f=()=>N;
  addParticle=function(x,y,tv,born,pa,pb){ tried++; const n0=N; const r=orig.apply(this,arguments); if(N>n0||r!==undefined&&r>=0){ if(pa>=0)parented++; else parentless++; } return r; };
  for(let t=1;t<=TICKS;t++){ try{ loop(); }catch(e){ out.err=String(e&&e.message||e); break; }
    if(t%EVERY===0){ let alive=0; for(let i=0;i<N;i++) if(palive[i])alive++; out.rows.push({t,alive,tried,parented,parentless}); } }
  return out; };
`, '/tmp/probe20.js');
const o=globalThis.__probe(+(process.env.TICKS||3000),+(process.env.EVERY||500),process.env.VMOFF==='1');
console.log(JSON.stringify({seed:process.env.SEED||'1',repl:process.env.REPL||0,vmoff:process.env.VMOFF||0,err:o.err}));
for(const r of o.rows) console.log(JSON.stringify(r));
