// probe17: causal REACH of each opcode. Wraps vmStep; keeps, per register, the set of non-original opcodes (anything but 0-4) whose output flowed into it;
// when an emitted action changes, credits those opcodes with the reach count and the magnitude |delta action|. Memory (pMem) round trips are not tracked, so reach is a lower bound.
// Reads state only; draws nothing. Output: per opcode executions, register-changing executions, reach events, reach magnitude.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p17.js'); m.filename='/tmp/p17.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p17=function(END){
  const RCMAX=vmRegs.length, NA=vmActions.length, ORIG=new Set([0,1,2,3,4]);
  const tr=[]; for(let r=0;r<RCMAX;r++)tr.push([]); const bR=new Float32Array(RCMAX), bA=new Float32Array(NA);
  const exec=new Map(), chg=new Map(), rEv=new Map(), rMag=new Map(); let baseMag=0, baseEv=0, totMag=0;
  const bump=(mp,k,v)=>mp.set(k,(mp.get(k)||0)+v);
  const uni=(a,b,op)=>{ const s=new Set(a); for(const x of b)s.add(x); if(op>4)s.add(op); return s.size>8?[...s].slice(0,8):[...s]; };
  const ov=vmStep;
  vmStep=function(op,src,dst,k,si,di,i,j,ip){
    if(ip===0){ for(let r=0;r<RCMAX;r++)tr[r]=[]; }
    const rc=Math.min(__vmRC,RCMAX); for(let r=0;r<rc;r++)bR[r]=vmRegs[r]; for(let a=0;a<NA;a++)bA[a]=vmActions[a];
    const srcT=(si>=0&&si<RCMAX)?tr[si]:[]; bump(exec,op,1);
    const out=ov.apply(this,arguments);
    let changed=false;
    for(let r=0;r<rc;r++){ if(vmRegs[r]!==bR[r]){ changed=true; tr[r]=uni(srcT,tr[r],op); } }
    if(changed)bump(chg,op,1);
    for(let a=0;a<NA;a++){ const d=vmActions[a]-bA[a]; if(d!==0){ const ad=Math.abs(d); const T=uni(srcT,[],op); totMag+=ad; if(T.length===0){ baseMag+=ad; baseEv++; } else for(const o of T){ bump(rEv,o,1); bump(rMag,o,ad); } } }
    return out; };
  for(let t=1;t<=END;t++)loop();
  const d=mp=>[...mp.entries()]; return {exec:d(exec),chg:d(chg),rEv:d(rEv),rMag:d(rMag),baseMag,baseEv,totMag}; };
`, '/tmp/p17.js');
fs.writeFileSync(process.env.OUT,JSON.stringify({seed:process.env.SEED,...globalThis.__p17(+(process.env.END||4000))})); console.log('done',process.env.SEED);
