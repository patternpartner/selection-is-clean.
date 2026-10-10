// THE UNIVERSE EDITS A FILM, WITH INHERITANCE (video/build_evolving.py reads this). As harness-film.js - every EVERY
// ticks the ten largest lineages - plus the family tree of LINEAGES: the first time a lineage id appears on a newborn,
// the lineage of its first parent. Read only: the birth hook wraps addParticle/addCompound to read pLin after they
// return (novelty-shadows' BIRTHS pattern), and nothing the engine draws from is touched.
//   SEED=9 TICKS=9000 EVERY=4 node harness-film2.js > out/drawn/evolving/run.json
// No backticks in the appended driver: the engine source is compiled as one string.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||9000), EVERY=+(E.EVERY||4);
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/film2.js');m.filename='/tmp/film2.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__FILM2=function(T,EVERY){ const S=[], B=[]; let errs=0; const seen=new Set();
  for(let i=0;i<N;i++) if(palive[i]) seen.add(pLin[i]|0);
  const note=function(r,pa){ if(r<0)return; const l=pLin[r]|0; if(seen.has(l))return; seen.add(l);
    const p=(typeof pa==='number'&&pa>=0&&pa<N)?(pLin[pa]|0):-1; B.push([tick,l,p]); };
  const _ap=addParticle,_ac=addCompound;
  addParticle=function(){const r=_ap.apply(this,arguments); note(r,arguments[4]); return r;};
  addCompound=function(){const r=_ac.apply(this,arguments); note(r,arguments[8]); return r;};
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    if(s%EVERY===0){ const c=new Map(); let n=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; n++; const l=pLin[i]|0; c.set(l,(c.get(l)||0)+1);
        if(!seen.has(l)){ seen.add(l); B.push([s,l,-2]); } }
      const top=[...c.entries()].sort(function(a,b){return b[1]-a[1]||a[0]-b[0];}).slice(0,10);
      S.push([s,n,c.size,top]); } }
  return {errs,samples:S,births:B}; };`,'/tmp/film2.js');
const r=globalThis.__FILM2(T,EVERY);
console.log(JSON.stringify({seed:E.SEED||'1',ticks:T,every:EVERY,errs:r.errs,samples:r.samples,births:r.births}));
