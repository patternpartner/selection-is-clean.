// THE UNIVERSE EDITS A FILM (video/build_edited_by.py reads this). One world, TICKS ticks; every EVERY ticks, the
// living count of each lineage (pLin), the ten largest. Read only: a scan of palive/pLin, no engine function called,
// so it draws nothing and the run is the run it would have been without it.
//   SEED=7 TICKS=9000 EVERY=4 node harness-film.js > out/drawn/edited/run.json
// No backticks in the appended driver: the engine source is compiled as one string.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||9000), EVERY=+(E.EVERY||4);
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/film.js');m.filename='/tmp/film.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__FILM=function(T,EVERY){ const S=[]; let errs=0;
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){errs++;}
    if(s%EVERY===0){ const c=new Map(); let n=0;
      for(let i=0;i<N;i++){ if(!palive[i])continue; n++; const l=pLin[i]|0; c.set(l,(c.get(l)||0)+1); }
      const top=[...c.entries()].sort(function(a,b){return b[1]-a[1]||a[0]-b[0];}).slice(0,10);
      S.push([s,n,c.size,top]); } }
  return {errs,samples:S}; };`,'/tmp/film.js');
const r=globalThis.__FILM(T,EVERY);
console.log(JSON.stringify({seed:E.SEED||'1',ticks:T,every:EVERY,errs:r.errs,samples:r.samples}));
