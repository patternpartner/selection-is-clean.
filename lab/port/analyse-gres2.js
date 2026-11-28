// #482: rule the registered set by PREREG-gres-depth.md (primary: size 17+; guard: count). node lab/port/analyse-gres2.js
const fs=require('fs'), D=__dirname+'/out-gres2-set'; const last=f=>{ const L=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.F!==undefined&&r.t<=1230); return L[L.length-1]; };
const Z=[], R=[]; for(let k=1;k<=8;k++){ if(!fs.existsSync(`${D}/p${k}.done`))continue; const a=last(`${D}/p${k}-base.jsonl`), b=last(`${D}/p${k}-gres2.jsonl`);
  const z=(b.D.ge17||0)/Math.max(1,a.D.ge17||0), r=b.F/a.F; Z.push(z); R.push(r); console.log(`pair ${k}: size17+ ${a.D.ge17} vs ${b.D.ge17} ratio ${z.toFixed(3)} | count ${a.F} vs ${b.F} ratio ${r.toFixed(3)}`); }
const med=a=>{ const s=a.slice().sort((x,y)=>x-y), n=s.length; return n?(n%2?s[n>>1]:(s[n/2-1]+s[n/2])/2):NaN; };
const ahead=Z.filter(z=>z>1).length; console.log(`pairs ${Z.length}, ahead on size17+ ${ahead}, median size17+ ${med(Z).toFixed(3)}, median count ${med(R).toFixed(3)}`);
if(Z.length-ahead>=2) console.log('SHIP unreachable: stop, REMOVED'); else if(Z.length===8) console.log((med(Z)>1&&ahead>=7&&med(R)>=0.95)?'SHIP':'REMOVED');
