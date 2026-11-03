// #369 - every top-level binding of the engine, before and after a population round trip with every per-creature group put back, no tick
// between; per-creature arrays compared over the living in order. What it lists is what the snapshot does not carry. Draws nothing after T.
//   SEED=10102 TASKS=1 T=2000 node lab/port/probe-statediff.js
const fs=require('fs');const ROOT=require('path').join(__dirname,'..','..');
require(ROOT+'/harness-env.js').applyKnobs(globalThis);require(ROOT+'/harness-env.js')(globalThis);
const code=fs.readFileSync(ROOT+'/engine.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const names=new Set(); for(const L of code.split('\n')){ const m=L.match(/^(?:let|const|var)\s+(.*)$/); if(!m)continue;
  let depth=0, cur='', parts=[]; for(const ch of m[1]){ if('([{'.includes(ch))depth++; else if(')]}'.includes(ch))depth--; if(ch===','&&depth===0){parts.push(cur);cur='';} else if(ch===';'&&depth===0)break; else cur+=ch; } parts.push(cur);
  for(const p of parts){ const n=p.trim().match(/^([A-Za-z_$][\w$]*)\s*(=|$)/); if(n)names.add(n[1]); } }
const list=[...names];
const Module=require('module');const m=new Module('/tmp/sd.js');m.filename='/tmp/sd.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`;globalThis.__S=function(T,P){for(let t=0;t<T;t++){globalThis.__detMs+=5;loop();}
 const H=s=>{ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); } return (h>>>0).toString(36); };
 const get={${list.map(n=>`'${n}':()=>${n}`).join(',')}};
 const snap=(live)=>{ const o={}; for(const n in get){ let v; try{ v=get[n](); }catch(e){ continue; } if(typeof v==='function')continue;
   try{ if(ArrayBuffer.isView(v)){ if(v.length&&v.length%CAP===0){ const k=v.length/CAP, a=[]; for(const i of live) for(let q=0;q<k;q++)a.push(v[i*k+q]); o[n]='p'+H(a.join(',')); } else o[n]='a'+H(Array.from(v).join(',')); }
     else if(v instanceof Map||v instanceof Set) o[n]='m'+v.size+':'+H(JSON.stringify([...v])); else if(Array.isArray(v)&&v.length===CAP){ const a=[]; for(const i of live)a.push(JSON.stringify(v[i])); o[n]='P'+H(a.join('|')); } else o[n]=H(JSON.stringify(v)); }catch(e){ o[n]='?'; } } return o; };
 const liveB=[]; for(let i=0;i<N;i++) if(palive[i]&&pGenome[i])liveB.push(i);
 const before=snap(liveB);
 const A=[localRes,collapse,pBroadcast,pReflexHist,pReflexState,pReflexIdx,pInteractionDensity,echox,echoy,echoIdx,clusterID,pMindW,pHomeX,pHomeY,tW,tJ,tDm,tK,tLast,tLastE,tLastJ,tLastDm,tLastK,tIc,tPE,tRd,tRdE,tRdI,tRx,tRy,tRE,tRT,pKey,pDef,pAdq];
 const old=liveB.map(i=>({lin:pLin[i],ph:phase[i],fr:freq[i],vx:vx[i],vy:vy[i],mode:pMode[i],g:pGenome[i],arr:A.map(a=>{ const k=a.length/CAP; return Array.from(a.subarray(i*k,i*k+k)); })}));
 const g=encodeGenome(), s=encodePopulation(popHash(g)); __popGenomeStr=g; const r=decodePopulation(s);
 for(let j=0;j<N;j++){ const o=old[j]; pLin[j]=o.lin; phase[j]=o.ph; freq[j]=o.fr; vx[j]=o.vx; vy[j]=o.vy; pMode[j]=o.mode; pGenome[j]=o.g; A.forEach((a,q)=>{ const k=a.length/CAP; a.set(o.arr[q],j*k); }); }
 const liveA=[]; for(let i=0;i<N;i++) if(palive[i]&&pGenome[i])liveA.push(i);
 const after=snap(liveA);
 const d=Object.keys(after).filter(n=>after[n]!==before[n]);
 console.log('names',Object.keys(before).length,'live',liveB.length,'->',liveA.length,'restored',r,'| differ:',d.join(' '));
};`,m.filename);
globalThis.__S(+process.env.T||300);
