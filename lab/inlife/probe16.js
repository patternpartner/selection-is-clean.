// probe16: which opcodes are CARRIED in living programs and which are EXECUTED. Wraps vmStep (the single dispatch for all four VMs) to tally executions by opcode.
// Reads state only; the wrapper draws no random numbers. Output: executed counts per op for three windows, carried counts at the end.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p16.js'); m.filename='/tmp/p16.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p16=function(END){ const win=[new Map(),new Map(),new Map()]; let cur=0, total=0; const carried=[];
  const ov=vmStep; vmStep=function(op){ const w=win[cur]; w.set(op,(w.get(op)||0)+1); total++; return ov.apply(this,arguments); };
  for(let t=1;t<=END;t++){ cur=t<=2000?0:(t<=END-2000?1:2); loop(); }
  const car=new Map(); let progs=0, instr=0; for(let i=0;i<N;i++){ if(!palive[i]||!pProg[i])continue; progs++; for(const r of pProg[i]){ instr++; car.set(r[0],(car.get(r[0])||0)+1); } }
  const dump=m=>[...m.entries()]; return {total,progs,instr,early:dump(win[0]),mid:dump(win[1]),late:dump(win[2]),carried:dump(car)}; };
`, '/tmp/p16.js');
fs.writeFileSync(process.env.OUT,JSON.stringify({seed:process.env.SEED,...globalThis.__p16(+(process.env.END||8000))}));
console.log('done seed',process.env.SEED);
