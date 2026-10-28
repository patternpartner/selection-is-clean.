// #359b - in a dead TASKS world, what kills the founders? Runs to T0, then compares the germline genome with the living
// genomes on the parameters that decide life and death, then follows every parentless birth for FOLLOW ticks: its lifespan,
// and its store (pE), the share of upkeep it met (pAdq) and its age in the last tick it was seen alive. Draws nothing.
//   SEED=9701 TASKS=1 T0=90000 FOLLOW=1000 node lab/port/probe-founders.js
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
require(path.join(ROOT,'harness-env.js')).applyKnobs(globalThis); require(path.join(ROOT,'harness-env.js'))(globalThis);
const NS=require(path.join(ROOT,'novelty-shadows.js'));
const code=fs.readFileSync(process.env.INDEX||path.join(ROOT,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module'); const m=new Module('/tmp/fnd.js'); m.filename='/tmp/fnd.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__F=function(T0,FOLLOW){ const PARAMS=['deathThreshold','lifespanBias','metabolicCost','vmMaxInstructions','entropyK','mutationRate','tickRate','cellScale','somaRepair','vmGain','ruleScale','vmInfluence'];
  for(let t=1;t<=T0;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} if(t%10000===0)console.error('t',t,'N',N); }
  const pick=g=>{ const o={}; for(const k of PARAMS){ const v=g&&g[k]; o[k]=(typeof v==='number'&&isFinite(v))?+v.toFixed(4):v; } return o; };
  const live=[]; for(let i=0;i<N;i++) if(palive[i])live.push(i);
  const mean={}; for(const k of PARAMS){ const v=live.map(i=>pGenome[i]&&pGenome[i][k]).filter(x=>typeof x==='number'&&isFinite(x)); mean[k]=v.length?+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(4):null; }
  { const names=['field','field2','detritalField','rootField','crystalField','inhibitorField','cellProgStr','sunField','corpseField','localRes','pProvision','pE','pAdq','amp','vx','vy','px','py','tend','pMem','pSignalReceive','pResistance','collapse','tRes','pNov','fieldOwnership'];
    const bad={}; for(const n of names){ let A; try{ A=eval(n); }catch(e){ continue; } if(!A||typeof A.length!=='number')continue; let k=0, ex=-1; for(let q=0;q<A.length;q++) if(!Number.isFinite(A[q])){ k++; if(ex<0)ex=q; } if(k)bad[n]={count:k, first:ex, val:String(A[ex])}; }
    let ws=0; try{ ws=worldEnergy; }catch(e){} console.log(JSON.stringify({nonFinite:bad, worldEnergy:String(ws), energyAdequacy:String(typeof energyAdequacy!=='undefined'?energyAdequacy:'-')})); }
  const ph=live.map(i=>phase[i]); const fin=ph.filter(Number.isFinite); const big=fin.filter(x=>Math.abs(x)>1e6).length;
  console.log(JSON.stringify({phaseFinite:fin.length, phaseNonFinite:ph.length-fin.length, phaseAbsOver1e6:big, phaseSample:ph.slice(0,8), ampSample:live.slice(0,8).map(i=>amp[i]), freqSample:live.slice(0,8).map(i=>freq[i])}));
  console.log(JSON.stringify({tick, alive:live.length, germline:pick(genome), livingMean:mean, livingAgeMean:Math.round(live.reduce((a,i)=>a+page[i],0)/Math.max(1,live.length)), germProgOps:(genome.vmProgram||[]).map(r=>r[0]).join(',')}));
  const tag=new Int32Array(CAP).fill(-1); const rec=[]; let born=0;
  (${NS.BIRTHS})(function(c,pa){ if(pa>=0)return; tag[c]=rec.length; rec.push({born:tick, last:null, prog:(pProg[c]||[]).map(r=>r[0]).join(','), gm:pick(pGenome[c])}); born++; });
  (${NS.COMPACT})(function(ni){ ${NS.compactArray.toString()}; compactArray(tag,ni,1); for(let r=0;r<ni.length;r++) if(ni[r]<0)tag[r]=-1; });
  for(let t=1;t<=FOLLOW;t++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    for(let i=0;i<N;i++){ const k=tag[i]; if(k<0)continue; if(!palive[i]){ tag[i]=-1; continue; } rec[k].last={tick, age:page[i], pE:+pE[i].toFixed(3), pAdq:+pAdq[i].toFixed(3), amp:String(amp[i]), phase:String(phase[i]), freq:String(freq[i])}; } }
  const life=rec.map(r=>r.last?r.last.tick-r.born:0).sort((a,b)=>a-b);
  console.log(JSON.stringify({followed:FOLLOW, parentlessBorn:born, lifespanMedian:life[life.length>>1]||0, lifespanMax:life[life.length-1]||0, stillAlive:(()=>{let n=0;for(let i=0;i<N;i++)if(palive[i]&&tag[i]>=0)n++;return n;})(), sample:rec.slice(0,6)}));
};`, m.filename);
globalThis.__F(parseInt(process.env.T0||'90000',10), parseInt(process.env.FOLLOW||'1000',10));
