// #132 acceptance test. Two questions, and the second is the one that matters:
//   1. does the system actually author verbs, drive them, and do they ACT?
//   2. does CONSERVED mode actually conserve, including under drives larger than either side holds?
// (2) is the safety property the whole design rests on. If a conserved transfer can mint amplitude,
// and does the conserved mode conserve? The last one is the safety property the whole design
// rests on: if a conserved transfer can mint amplitude, this is a free-energy pump.
const fs=require('fs');
require('./harness-env.js')(globalThis);
const html=fs.readFileSync(process.env.INDEX||(__dirname+'/engine.html'),'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/verb-sim.js');m.filename='/tmp/verb-sim.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__verbs=function(ticks,every){
  const out=[];
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){}
    if((s+1)%every===0){
      const fx=genome.userEffects||[];
      out.push({tick,N,
        verbs:fx.length,
        used:fx.filter(e=>(e.uses|0)>0).length,
        conservedVerbs:fx.filter(e=>e.m===1).length,
        targets:fx.map(e=>EFFECT_TARGETS[e.t].n+(e.m?'*':'')).join(','),
        fires:__effectFires, conservedFires:__effectConserved,
        emitOps:(function(){let c=0;for(let i=0;i<N;i++){const p=pProg[i];if(!p)continue;for(const ins of p)if((ins[0]|0)===236)c++;}return c;})()
      });
    }
  }
  return out;
};
// CONSERVATION AUDIT — drive every paired target in conserved mode by hand and check the pair sum.
globalThis.__conserve=function(){
  const res=[];
  const pick=(name)=>EFFECT_TARGETS.findIndex(t=>t.n===name);
  for(const name of ['amp','provision','localRes','tend0','phase']){
    const t=pick(name); if(t<0){res.push([name,'MISSING']);continue;}
    const i=0,j=1;
    const read=()=>{ switch(name){
      case 'amp':return [amp[i],amp[j]];
      case 'provision':return [pProvision[i],pProvision[j]];
      case 'localRes':return [localRes[i],localRes[j]];
      case 'tend0':return [tend[i*DIMS],tend[j*DIMS]];
      case 'phase':return [phase[i],phase[j]]; } };
    // seed both sides with something to trade
    if(name==='amp'){amp[i]=0.7;amp[j]=0.9;} if(name==='provision'){pProvision[i]=0.4;pProvision[j]=0.6;}
    if(name==='localRes'){localRes[i]=0.5;localRes[j]=0.8;} if(name==='tend0'){tend[i*DIMS]=0.3;tend[j*DIMS]=-0.4;}
    if(name==='phase'){phase[i]=1.0;phase[j]=2.0;}
    const before=read(); const sum0=before[0]+before[1];
    let worst=0;
    for(let k=0;k<400;k++){
      const amt=(Math.random()*2-1)*0.35;                 // includes amounts larger than either side holds
      applyUserEffect({t,m:1,s:1},i,j,amt,0);
      const now=read(); worst=Math.max(worst,Math.abs((now[0]+now[1])-sum0));
    }
    const after=read();
    res.push([name,{sumDrift:+worst.toExponential(2),moved:+Math.abs(after[0]-before[0]).toFixed(4),
                    nonNeg:(name==='amp'||name==='provision'||name==='localRes')?(after[0]>=0&&after[1]>=0):true}]);
  }
  return res;
};
`,m.filename);

const rows=globalThis.__verbs(parseInt(process.env.TICKS||'3000',10),2000);
for(const r of rows)console.log(JSON.stringify(r));
console.log('\n=== CONSERVATION AUDIT (mode=1, 400 random drives incl. oversized) ===');
let bad=0;
for(const [name,r] of globalThis.__conserve()){
  if(typeof r==='string'){console.log('  '+name+': '+r);bad++;continue;}
  const ok=r.sumDrift<1e-5 && r.nonNeg && r.moved>0;
  if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+name.padEnd(10)+' pair-sum drift '+r.sumDrift+'   moved '+r.moved+'   stayed valid: '+r.nonNeg);
}
console.log(bad? '\n'+bad+' FAILED' : '\nconservation holds on every paired target');
process.exit(bad?1:0);
