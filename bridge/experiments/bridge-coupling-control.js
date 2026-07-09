// ═══════════════════════════════════════════════════════════════════════════
// FITNESS COUPLING — does retention move when the receiving substrate rewards
// a trait Pe structure encodes?
//
// Proven so far: the structure-preserving bridge TRANSMITS (signature "-+[F]"
// recoverable at ~8x the structure-destroyed baseline) but selection ERASES it
// (equilibrium fitness identical to control-2; signature stays a ~1.4% transient).
//
// Now test the binding lock: give the L-system a selection regime that rewards
// BRANCH-RICHNESS (a general trait Pe's opcode mix produces more of), and ask
// whether the SPECIFIC, unrelated signature "-+[F]" hitchhikes into retention
// above control-2. Reward is a GENERAL trait; probe is a SPECIFIC substring —
// so a positive result is genuine linkage, not rewarding the answer.
//
// The coupling lives ONLY in this harness (a local parameterized growth cycle);
// the shipped lsystem-growth.html is never modified — the substrate keeps
// evolving on its own merit, and the reward exists only inside the experiment.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const Module = require('module');
const CACHE = '/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/pe-instructions-cache.json';

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,pr){if(pr===Symbol.toPrimitive)return()=>0;if(pr==='width'||pr==='height')return 0;if(pr==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
function installEnv(){
  const CTX=selfProxy();
  function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;},get innerHTML(){return this._text;},set innerHTML(v){this._text=v;},set onclick(_){},set onchange(_){},click(){}};}
  const ELS={};
  globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false;}};
  globalThis.window=globalThis; globalThis.addEventListener=()=>{}; globalThis.removeEventListener=()=>{};
  globalThis.devicePixelRatio=1; globalThis.innerWidth=1280; globalThis.innerHeight=720;
  globalThis.performance={now:()=>Date.now()};
  globalThis.requestAnimationFrame=()=>0; globalThis.setTimeout=()=>0; globalThis.setInterval=()=>0; globalThis.clearInterval=()=>{}; globalThis.clearTimeout=()=>{}; globalThis.cancelAnimationFrame=()=>{};
  globalThis.URL={createObjectURL:()=>'blob:x'}; globalThis.Blob=function(){};
  console.warn=()=>{}; console.error=()=>{};
  const store={}; globalThis.localStorage={getItem:(k)=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
  globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'}; globalThis.history={replaceState(){},pushState(){}};
  globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
  globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
}
function loadLsys(){
  installEnv();
  const html=fs.readFileSync('/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/lsystem-growth.html','utf8');
  let code=html.match(/<script>([\s\S]*)<\/script>/)[1];
  code=code.replace(/\/\/ ═+\s*\/\/ BOOT[\s\S]*$/,'');
  code=code.replace('addEventListener(\'resize\',resize);','W=1280;H=720;');
  const m=new Module('/tmp/lsys-sim.js'); m.filename='/tmp/lsys-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
  m._compile(code+';globalThis.__lsys={freshGenome,mutateGenome,develop,currentInfluence,layoutPlots,get population(){return population;},set population(v){population=v;},get tick(){return tick;},set tick(v){tick=v;},POP_SIZE,GROWTH_CYCLE,AXIOM,ITER_DEPTH};',m.filename);
  return globalThis.__lsys;
}

// translation (identical to the structure-preserving experiment)
function gestureFor(inst){const op=inst[0]|0,k=(+inst[3])||0;switch(((op%7)+7)%7){case 0:return 'F';case 1:return 'FF';case 2:return k>=0?'+':'-';case 3:return k>=0?'-':'+';case 4:return '[F';case 5:return 'F]';default:return '[+F][-F]';}}
function translate(instructions){let s='';for(const inst of instructions)s+=gestureFor(inst);let depth=0,out='';for(const ch of s){if(ch==='[')depth++;if(ch===']'){if(depth<=0)continue;depth--;}out+=ch;}while(depth-->0)out+=']';return out||'F';}

// stats
function mannWhitney(a,b){const na=a.length,nb=b.length;const all=a.map(v=>({v,g:0})).concat(b.map(v=>({v,g:1})));all.sort((x,y)=>x.v-y.v);let i=0;while(i<all.length){let j=i;while(j<all.length&&all[j].v===all[i].v)j++;const r=(i+j-1)/2+1;for(let k=i;k<j;k++)all[k].rank=r;i=j;}let R1=0;for(const e of all)if(e.g===0)R1+=e.rank;const U1=R1-na*(na+1)/2,U=Math.min(U1,na*nb-U1),mu=na*nb/2,sigma=Math.sqrt(na*nb*(na+nb+1)/12),z=sigma>0?(U-mu)/sigma:0,p=2*(1-normalCdf(Math.abs(z))),cliff=(2*U1)/(na*nb)-1;return {U,z,p,cliff};}
function normalCdf(x){return 0.5*(1+erf(x/Math.SQRT2));}
function erf(x){const t=1/(1+0.3275911*Math.abs(x));const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
function median(a){const s=a.slice().sort((x,y)=>x-y);const n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;}
function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}
function cliffLabel(d){const a=Math.abs(d);return a<0.147?'negligible':a<0.33?'small':a<0.474?'medium':'large';}

const {motifs, plasmids} = JSON.parse(fs.readFileSync(CACHE,'utf8'));
const realSeqs=motifs.concat(plasmids);
const poolOp=[],poolSrc=[],poolDst=[],poolK=[];
for(const seq of realSeqs)for(const inst of seq){poolOp.push(inst[0]|0);poolSrc.push(inst[1]|0);poolDst.push(inst[2]|0);poolK.push((+inst[3])||0);}
function pick(pool){return pool[(Math.random()*pool.length)|0];}
function structureDestroyedSeq(len){const s=new Array(len);for(let i=0;i<len;i++)s[i]=[pick(poolOp),pick(poolSrc),pick(poolDst),pick(poolK)];return s;}
function uniformSeq(len){const s=new Array(len);for(let i=0;i<len;i++)s[i]=[(Math.random()*256)|0,(Math.random()*8)|0,(Math.random()*8)|0,(Math.random()*2-1)];return s;}
function sampleReal(){return realSeqs[(Math.random()*realSeqs.length)|0];}

const L=loadLsys(); L.tick=0;

// target signature = modal translated motif (>=4 chars)
const rc=new Map(); for(const seq of motifs){const rl=translate(seq);rc.set(rl,(rc.get(rl)||0)+1);}
let target=null,tc=-1; for(const [rl,c] of rc){if(rl.length>=4&&c>tc){tc=c;target=rl;}}

function branchCount(rule){let n=0;for(const ch of rule)if(ch==='[')n++;return n;}

// harness-local parameterized tournament growth cycle (mirrors the file's logic
// exactly, but fitness is injectable so we can swap selection regimes)
function growthCycleWith(fit){
  const pop=L.population;
  let worstIdx=-1,worstV=Infinity,bestIdx=-1,bestV=-Infinity;
  for(let k=0;k<6;k++){
    const idx=(Math.random()*pop.length)|0;
    const v=pop[idx].overgrown?-1:fit(pop[idx]);
    if(v<worstV){worstV=v;worstIdx=idx;}
    if(v>bestV){bestV=v;bestIdx=idx;}
  }
  if(worstIdx<0||bestIdx<0||worstIdx===bestIdx)return;
  const parent=pop[bestIdx];
  const m=L.mutateGenome(parent);
  const child={rules:{F:m.rules.F},angle:m.angle,plotIdx:worstIdx,createdTick:L.tick,reproducedCount:0,bridgeInfluence:m.bridgeInfluence};
  pop[worstIdx]=child; L.develop(child);
}

const FITS={
  coverage:(ind)=>ind.overgrown?-1:ind.coverage,                                    // the substrate's own rule
  branch:  (ind)=>ind.overgrown?-1:branchCount(ind.rules.F)+0.05*Math.log10(Math.max(1,ind.coverage)) // Pe-coupled: reward branch-richness
};

function dripEvolve(seqFn, fit, reps, cycles){
  const contain=[], branchMean=[];
  for(let rep=0;rep<reps;rep++){
    L.tick=0;
    const pop=[];
    for(let i=0;i<L.POP_SIZE;i++){const g=L.freshGenome(0);pop.push({rules:{F:g.rules.F},angle:g.angle,plotIdx:i,createdTick:0,reproducedCount:0,bridgeInfluence:0});}
    L.population=pop; L.layoutPlots(); for(const ind of pop)L.develop(ind);
    for(let cyc=0;cyc<cycles;cyc++){
      L.tick=L.tick+L.GROWTH_CYCLE;
      const rule=translate(seqFn());
      const idx=(Math.random()*L.POP_SIZE)|0;
      const child={rules:{F:rule},angle:30,plotIdx:idx,createdTick:L.tick,reproducedCount:0,bridgeInfluence:1};
      L.population[idx]=child; L.develop(child);
      growthCycleWith(fit);
    }
    let c=0,bsum=0;
    for(const ind of L.population){if(ind.rules.F.indexOf(target)>=0)c++;bsum+=branchCount(ind.rules.F);}
    contain.push(c/L.POP_SIZE); branchMean.push(bsum/L.POP_SIZE);
  }
  return {contain, branchMean};
}

const REPS=250, CYCLES=300;
console.log('target signature: "'+target+'" (modal translated motif, '+(100*tc/motifs.length).toFixed(1)+'% of injections)');
console.log('probe = specific substring; coupling reward = general branch-richness. Positive = hitchhiking, not rewarding the answer.\n');

for(const regime of ['coverage','branch']){
  const fit=FITS[regime];
  const dT=dripEvolve(sampleReal, fit, REPS, CYCLES);
  const dC2=dripEvolve(()=>structureDestroyedSeq(3), fit, REPS, CYCLES);
  const s=mannWhitney(dT.contain,dC2.contain);
  console.log('═══ selection regime: '+regime.toUpperCase()+(regime==='branch'?'  (Pe-coupled)':'  (substrate default)')+' ═══');
  console.log('  signature retention (fraction of evolved pop containing "'+target+'"):');
  console.log('    treat='+mean(dT.contain).toFixed(4)+'   ctl2(structure-destroyed)='+mean(dC2.contain).toFixed(4)+'   ratio='+(mean(dT.contain)/Math.max(1e-9,mean(dC2.contain))).toFixed(1)+'x');
  console.log('    treat vs ctl2: p='+s.p.toExponential(2)+'  Cliff δ='+s.cliff.toFixed(3)+' ('+cliffLabel(s.cliff)+')');
  console.log('  (sanity) mean branch-count/individual: treat='+mean(dT.branchMean).toFixed(2)+' ctl2='+mean(dC2.branchMean).toFixed(2)+'\n');
}
console.log('DONE.');
