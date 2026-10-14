// probe18: provable inertness. Skips the effect of the opcodes in OPS (vmStep returns ip untouched) and prints a state fingerprint every 500 ticks. Run once with OPS empty (control), once with the list;
// identical fingerprints mean those opcodes changed nothing in that run. Draws nothing itself.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p18.js'); m.filename='/tmp/p18.js'; m.paths=Module._nodeModulePaths('/tmp');
const OPS=(process.env.OPS||'').split(',').filter(Boolean).map(Number);
m._compile(code+`
;globalThis.__p18=function(END,OPS){ const skip=new Set(OPS); let skipped=0; const ov=vmStep;
  if(skip.size)vmStep=function(op,src,dst,k,si,di,i,j,ip){ if(skip.has(op)){ skipped++; return ip; } return ov.apply(this,arguments); };
  const fp=[]; for(let t=1;t<=END;t++){ loop(); if(t%500===0){ let n=0,sx=0,sy=0,sa=0,st=0; for(let i=0;i<N;i++){ if(!palive[i])continue; n++; sx+=px[i]; sy+=py[i]; sa+=amp[i]; st+=tend[i*DIMS]; } fp.push(n+'|'+sx.toFixed(3)+'|'+sy.toFixed(3)+'|'+sa.toFixed(4)+'|'+st.toFixed(4)); } }
  return {fp,skipped}; };
`, '/tmp/p18.js');
const o=globalThis.__p18(+(process.env.END||3000),OPS); fs.writeFileSync(process.env.OUT,JSON.stringify({seed:process.env.SEED,nops:OPS.length,...o})); console.log('done');
