// #369 - how many living creatures run a program that is not their genome's (op 225's lateral copies), and whether the logic ops differ.
//   SEED=10102 TASKS=1 T=2000 [LATERAL_HERIT=1] node lab/port/probe-desync.js
const fs=require('fs');const ROOT=require('path').join(__dirname,'..','..');
require(ROOT+'/harness-env.js').applyKnobs(globalThis);require(ROOT+'/harness-env.js')(globalThis);
const code=fs.readFileSync(ROOT+'/engine.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/pa.js');m.filename='/tmp/pa.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`;globalThis.__P=function(T){ for(let t=1;t<=T;t++){globalThis.__detMs+=5;loop();
  if(t%(T/4|0)===0){ let live=0, sameRef=0, sameContent=0, tasksDiff=0, carry225=0; for(let i=0;i<N;i++){ if(!palive[i]||!pGenome[i])continue; live++; if((pProg[i]||[]).some(x=>x[0]===225))carry225++; const a=pProg[i], b=pGenome[i].vmProgram; if(a===b){sameRef++;continue;} if(JSON.stringify(a)===JSON.stringify(b))sameContent++;
      else { const ops=p=>(p||[]).filter(x=>x[0]>=TASK_OP0&&x[0]<TASK_OP0+5).map(x=>x.join(':')).join(' '); if(ops(a)!==ops(b))tasksDiff++; } }
    console.log('tick',t,'live',live,'pProg===genome.vmProgram',sameRef,'same content, other array',sameContent,'DIFFERENT',live-sameRef-sameContent,'(task ops differ in',tasksDiff+')','carrying op 225',carry225); } } };`,m.filename);
globalThis.__P(+process.env.T||2000);
