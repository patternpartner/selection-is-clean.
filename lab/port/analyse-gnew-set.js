// #457b: rule the registered set by PREREG-gnew-set.md. node lab/port/analyse-gnew-set.js
const fs=require('fs'), D=__dirname+'/out-gnew-set'; const last=f=>{ const L=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.F!==undefined); return L[L.length-1]; };
const R=[], Z=[]; for(let k=1;k<=8;k++){ if(!fs.existsSync(`${D}/p${k}.done`))continue; const a=last(`${D}/p${k}-base.jsonl`), b=last(`${D}/p${k}-gnew.jsonl`);
  const r=b.F/a.F, z=(b.D.ge17||0)/Math.max(1,a.D.ge17||0); R.push(r); Z.push(z); console.log(`pair ${k}: shipped ${a.F} (t ${a.t}) switch ${b.F} (t ${b.t}) ratio ${r.toFixed(3)} | size17+ ${a.D.ge17} vs ${b.D.ge17} ratio ${z.toFixed(3)}`); }
const med=a=>{ const s=a.slice().sort((x,y)=>x-y), n=s.length; return n?(n%2?s[n>>1]:(s[n/2-1]+s[n/2])/2):NaN; };
const ahead=R.filter(r=>r>1).length; console.log(`pairs ${R.length}, ahead ${ahead}, median ratio ${med(R).toFixed(3)}, median size17+ ratio ${med(Z).toFixed(3)}`);
if(R.length===8) console.log((med(R)>1&&ahead>=7&&med(Z)>=0.9)?'SHIP':'REMOVED');
