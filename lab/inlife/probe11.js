// probe11 (exploratory, no rule): does the engine ever mint a new lineage? Counts _linNext, and speciation events, by tick.
const fs=require('fs'), path=require('path'); const R=path.join(__dirname,'..','..');
require(path.join(R,'harness-env.js'))(globalThis);
const code=fs.readFileSync(path.join(R,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/p11.js'); m.filename='/tmp/p11.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__p11=function(END){ const rows=[]; let dmax=0,dn=0,dover=0,dsum=0;
  const oP=addParticle,oC=addCompound; 
  for(let t=1;t<=END;t++){ loop();
    if(t%1000===0){ rows.push({t,linNext:nextLineageID,alive:(()=>{let n=0;for(let i=0;i<N;i++)if(palive[i])n++;return n;})(),totalTicks:genome.totalTicks,SPECIATE_DIST:SPECIATE_DIST,SPECIATE_MIN_AGE:SPECIATE_MIN_AGE,DIMS}); } }
  return rows; };
`, '/tmp/p11.js');
console.log(JSON.stringify(globalThis.__p11(+(process.env.END||9000))));
