// #366f - WHICH FORCE flings a whole TASKS world out of its bounds? (#366e: at 9801 TRICKLE's tick 34,069 every particle starts moving
// the same way, mean speed multiplying each tick, and all of them escape within 9 ticks.) Wraps every engine function whose source
// writes vx/vy; for ticks FROM..TO each call adds its change in the summed velocity (and in summed speed) to a per-tick ledger, and
// whatever loop() changes outside them is the remainder. Wrappers read arrays only and draw nothing, so the trajectory is the same.
//   SEED=9801 TASKS=1 TASK_TRICKLE=200 FROM=34066 TO=34072 node lab/port/probe-force.js > out.jsonl
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
// the candidates: every top-level function declaration whose body assigns into vx[ or vy[
const names=[]; const re=/\nfunction\s+([A-Za-z_$][\w$]*)\s*\(/g; let m; const starts=[];
while((m=re.exec(code)))starts.push([m[1],m.index]);
for(let k=0;k<starts.length;k++){ const body=code.slice(starts[k][1], k+1<starts.length?starts[k+1][1]:code.length);
  if(/v[xy]\[[^\]]+\]\s*(\+=|-=|\*=|=)/.test(body)&&starts[k][0]!=='loop')names.push(starts[k][0]); }
console.error('wrapping '+names.length+': '+names.join(' '));
const Module=require('module'); const mod=new Module('/tmp/force-sim.js'); mod.filename='/tmp/force-sim.js'; mod.paths=Module._nodeModulePaths('/tmp');
mod._compile(code+`
;(function(){ const NAMES=${JSON.stringify(names)}; globalThis.__led=null;
  const sum=()=>{ let a=0,b=0,c=0; for(let i=0;i<N;i++){ if(!palive[i])continue; a+=vx[i]; b+=vy[i]; c+=Math.hypot(vx[i],vy[i]); } return [a,b,c]; };
  globalThis.__sum=sum;
  for(const nm of NAMES){ let f; try{ f=eval(nm); }catch(e){ continue; } if(typeof f!=='function')continue;
    const w=function(){ const L=globalThis.__led; if(!L)return f.apply(this,arguments); const s0=sum(); const r=f.apply(this,arguments); const s1=sum();
      const e=L[nm]||(L[nm]=[0,0,0,0]); e[0]+=s1[0]-s0[0]; e[1]+=s1[1]-s0[1]; e[2]+=s1[2]-s0[2]; e[3]++; return r; };
    try{ eval(nm+'=w'); }catch(e){ console.error('could not wrap '+nm); } } })();
;globalThis.__R=function(T,FROM,TO,out){ for(let t=1;t<=T;t++){ globalThis.__detMs+=5;
    const on=tick+1>=FROM&&tick+1<=TO; let s0=null; if(on){ globalThis.__led={}; s0=__sum(); }
    try{ loop(); }catch(e){ console.error(String(e).slice(0,200)); }
    if(on){ const s1=__sum(), L=globalThis.__led; globalThis.__led=null; let a=0,b=0,c=0; for(const k in L){ a+=L[k][0]; b+=L[k][1]; c+=L[k][2]; }
      const rows=Object.entries(L).map(([k,e])=>[k,+e[0].toPrecision(4),+e[1].toPrecision(4),+e[2].toPrecision(4),e[3]]).sort((x,y)=>Math.abs(y[3])-Math.abs(x[3])).filter(r=>r[3]!==0||r[1]!==0||r[2]!==0);
      out(JSON.stringify({tick, alive:N?(()=>{let n=0;for(let i=0;i<N;i++)if(palive[i])n++;return n;})():0, total:[+(s1[0]-s0[0]).toPrecision(4),+(s1[1]-s0[1]).toPrecision(4),+(s1[2]-s0[2]).toPrecision(4)],
        remainder:[+((s1[0]-s0[0])-a).toPrecision(4),+((s1[1]-s0[1])-b).toPrecision(4),+((s1[2]-s0[2])-c).toPrecision(4)], byFunction:rows.slice(0,15)})); }
    if(tick>TO)return; } };`, mod.filename);
globalThis.__R(parseInt(process.env.TICKS||'40000',10), +(process.env.FROM||0), +(process.env.TO||0), s=>console.log(s));
