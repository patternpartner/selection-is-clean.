// #333 - the "1-instruction rock": does a REPL world whose every program is just the reproduction instruction [4,2,4,1]
// live as well as REPL itself? ROCK=1 pins every living particle's program (pProg and pGenome.vmProgram, newborns
// included) to that one instruction after every tick; ROCK=0 is plain REPL, same probe. Every SAMPLE ticks: alive and
// cumulative births. Pinning draws nothing; the pinned program never runs op 155, 156 or 146, so a ROCK world has no
// predation, gifts or scavenging - it eats only the sunlight sunStep hands out.
//   SEED=s TICKS=10000 REPL=1 ROCK=1 node lab/inlife/probe-rock.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
try{ require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/rock-sim.js'); m.filename='/tmp/rock-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__R=function(ticks,every,rock){ let births=0; (${NS.BIRTHS})(function(){ births++; }); const rows=[];
  const pin=()=>{ for(let i=0;i<N;i++){ if(!palive[i]||!pGenome[i])continue; const p=[[4,2,4,1.0]]; pGenome[i].vmProgram=p; pProg[i]=p; } };
  if(rock) pin();
  for(let t=1;t<=ticks;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} if(rock) pin();
    if(t%every===0){ let alive=0, len=0; for(let i=0;i<N;i++) if(palive[i]){ alive++; len+=(pProg[i]||[]).length; }
      rows.push({tick:t, alive, births, meanLen:alive?+(len/alive).toFixed(2):0}); } }
  return rows; };`, m.filename);
const rows=globalThis.__R(parseInt(process.env.TICKS||'10000',10), parseInt(process.env.SAMPLE||'500',10), (process.env.ROCK|0)===1);
console.log(JSON.stringify({seed:process.env.SEED||'1', rock:process.env.ROCK||'0', rows}));
