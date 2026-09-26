// #231 — THE EXECUTED RUNG, per machine and per opcode. CLAUDE.md's ladder is DECLARED -> CARRIED ->
// EXECUTED -> READING -> VARYING -> SELECTED, and "establish that the thing ever ran once" before reporting
// anything above it. #229 counted opcodes CARRIED in sampled programs; this counts what EXECUTES, in which
// machine (particle / plasmid / cluster / solo, via vmStep's __vmMode), and the first tick each watched op
// ran. It also logs every law change with its tick, because #231c blamed an op for a population rise that
// a kept law had caused, and the two records side by side are what separated them.
//
// Draws nothing: a counter in vmStep's first line and reads of LAW_DECLARED every 250 ticks.
//   TICKS=4000 SEED=1 INDEX=engine.html WATCH=9,13,16,20,53,179,226 node harness-opexec.js
// Output: one JSON object - per machine {instructions, distinctOps, opsCarrying90pct, top},
// per watched op {count per machine, firstTick per machine}, and laws [[tick,name,from,to],...].
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const T=+(process.env.TICKS||4000);
const WATCH=(process.env.WATCH||'9,13,16,20,53,179,226').split(',').filter(Boolean).map(Number);
let code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const A='function vmStep(op,src,dst,k,si,di,i,j,ip){';
if(code.split(A).length!==2){ console.log(JSON.stringify({error:'vmStep anchor found '+(code.split(A).length-1)+' times, expected 1'})); process.exit(1); }
code=code.replace(A,A+'{const _o=__vmMode*512+((op|0)&511);__ox[_o]++;if(!__oxFirst[_o])__oxFirst[_o]=tick;}');
const Module=require('module');const m=new Module('/tmp/opexec.js');m.filename='/tmp/opexec.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile('var __ox=new Float64Array(2048),__oxFirst=new Float64Array(2048);\n'+code+`
;globalThis.__OX=function(T){ const laws=[];let prev=null;let errs=0;
  const snap=()=>{const o={};for(const r of LAW_DECLARED){try{o[r.name]=+r.get();}catch(_){}}return o;};
  prev=snap();
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    if(s%250===0){ const cur=snap(); for(const k in cur) if(cur[k]!==prev[k]) laws.push([s,k,+(+prev[k]).toPrecision(4),+(+cur[k]).toPrecision(4)]); prev=cur; } }
  return {errs,N,laws,ox:__ox,first:__oxFirst};};`,'/tmp/opexec.js');
const r=globalThis.__OX(T);
const M=['particle','plasmid','cluster','solo'];const machines={};
for(let k=0;k<4;k++){ let tot=0;const ops=[];for(let o=0;o<512;o++){const c=r.ox[k*512+o];tot+=c;if(c>0)ops.push([o,c]);}
  ops.sort((a,b)=>b[1]-a[1]);let cum=0,n90=0;for(const [,c] of ops){cum+=c;n90++;if(cum>=0.9*tot)break;}
  machines[M[k]]={instructions:tot,distinctOps:ops.length,opsCarrying90pct:tot?n90:0,top:ops.slice(0,8).map(x=>x[0])}; }
const watched={};
for(const o of WATCH){ watched[o]={}; for(let k=0;k<4;k++){ const c=r.ox[k*512+o]; if(c) watched[o][M[k]]={count:c,firstTick:r.first[k*512+o]}; } }
console.log(JSON.stringify({ticks:T,seed:process.env.SEED||'1',loopErrors:r.errs,N:r.N,machines,watched,laws:r.laws}));
