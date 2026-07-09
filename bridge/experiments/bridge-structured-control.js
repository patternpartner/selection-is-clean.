// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURE-PRESERVING BRIDGE — negative control, re-run.
//
// The flat bridge (harvestNumbers -> bag of floats) failed the control: only
// number-RANGE crossed, and selection erased even that. This prototype replaces
// the flat harvest with a ROLE-BASED translation: each Pe VM instruction
// [op,src,dst,k] becomes a turtle GESTURE chosen by opcode identity, with the
// constant's sign choosing turn direction, PRESERVING instruction order. So a
// Pe program's structure (which opcodes, in what order) maps to L-system
// structure (which symbols, in what order).
//
// Three arms feed the SAME translation:
//   TREATMENT  — real Pe motif/plasmid instruction sequences (order intact)
//   CONTROL-1  — uniform-random instructions (naive)
//   CONTROL-2  — each field independently bootstrap-resampled from the pool of
//                real Pe field values: identical marginals, joint/order structure
//                destroyed. THE KILLER CONTROL.
//
// Because the translation is structure-preserving, treatment WILL differ from
// ctl2 at the injection step almost by construction — that alone proves nothing.
// The real questions:
//   (A) does the difference produce a different DOWNSTREAM outcome, or does
//       selection erase it as before?
//   (B) is a specific Pe structure RECOVERABLE from the evolved L-system
//       population above the ctl2 baseline? (can you read Pe's signature back out)
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const Module = require('module');
const CACHE = '/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/pe-instructions-cache.json';

// ---- env stubs (L-system only; no Pe boot needed, we use the cache) ----
function selfProxy(){ const f=function(){return p;}; const p=new Proxy(f,{get(_t,pr){if(pr===Symbol.toPrimitive)return()=>0;if(pr==='width'||pr==='height')return 0;if(pr==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}}); return p; }
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
  console.warn=()=>{}; const realErr=console.error; console.error=()=>{};
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
  m._compile(code+';globalThis.__lsys={freshGenome,mutateGenome,develop,growthCycle,currentInfluence,interpret,expandString,layoutPlots,get population(){return population;},set population(v){population=v;},get tick(){return tick;},set tick(v){tick=v;},get plots(){return plots;},POP_SIZE,GROWTH_CYCLE,AXIOM,ITER_DEPTH};',m.filename);
  return globalThis.__lsys;
}

// ═══ THE STRUCTURE-PRESERVING TRANSLATION ═══
// opcode identity -> gesture; constant sign -> turn direction; order preserved.
function gestureFor(inst){
  const op=inst[0]|0, k=(+inst[3])||0;
  switch(((op%7)+7)%7){
    case 0: return 'F';
    case 1: return 'FF';
    case 2: return k>=0?'+':'-';
    case 3: return k>=0?'-':'+';
    case 4: return '[F';
    case 5: return 'F]';
    default: return '[+F][-F]';
  }
}
function translate(instructions){
  let s=''; for(const inst of instructions) s+=gestureFor(inst);
  // balance brackets so the turtle string is well-formed (drop unmatched ']')
  let depth=0, out='';
  for(const ch of s){ if(ch==='[')depth++; if(ch===']'){ if(depth<=0)continue; depth--; } out+=ch; }
  while(depth-->0) out+=']';
  return out||'F';
}

// ═══ STATS ═══
function mannWhitney(a,b){
  const na=a.length, nb=b.length;
  const all=a.map(v=>({v,g:0})).concat(b.map(v=>({v,g:1}))); all.sort((x,y)=>x.v-y.v);
  let i=0; while(i<all.length){ let j=i; while(j<all.length&&all[j].v===all[i].v)j++; const r=(i+j-1)/2+1; for(let k=i;k<j;k++)all[k].rank=r; i=j; }
  let R1=0; for(const e of all) if(e.g===0)R1+=e.rank;
  const U1=R1-na*(na+1)/2, U=Math.min(U1,na*nb-U1);
  const mu=na*nb/2, sigma=Math.sqrt(na*nb*(na+nb+1)/12);
  const z=sigma>0?(U-mu)/sigma:0, p=2*(1-normalCdf(Math.abs(z)));
  const cliff=(2*U1)/(na*nb)-1;
  return {U,z,p,cliff};
}
function normalCdf(x){return 0.5*(1+erf(x/Math.SQRT2));}
function erf(x){const t=1/(1+0.3275911*Math.abs(x));const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return x>=0?y:-y;}
function median(a){const s=a.slice().sort((x,y)=>x-y);const n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;}
function mean(a){return a.reduce((s,v)=>s+v,0)/a.length;}
function cliffLabel(d){const a=Math.abs(d);return a<0.147?'negligible':a<0.33?'small':a<0.474?'medium':'large';}

// ═══ LOAD DATA ═══
if(!fs.existsSync(CACHE)){ console.log('cache missing — run harvest-cache.js first'); process.exit(1); }
const {motifs, plasmids} = JSON.parse(fs.readFileSync(CACHE,'utf8'));
const realSeqs = motifs.concat(plasmids);   // each is an array of [op,src,dst,k]
console.log('loaded real Pe sequences: motifs='+motifs.length+' plasmids='+plasmids.length+' total='+realSeqs.length);

// field pools for structure-destroying control
const poolOp=[], poolSrc=[], poolDst=[], poolK=[];
for(const seq of realSeqs) for(const inst of seq){ poolOp.push(inst[0]|0); poolSrc.push(inst[1]|0); poolDst.push(inst[2]|0); poolK.push((+inst[3])||0); }
function pick(pool){ return pool[(Math.random()*pool.length)|0]; }
function structureDestroyedSeq(len){ const s=new Array(len); for(let i=0;i<len;i++) s[i]=[pick(poolOp),pick(poolSrc),pick(poolDst),pick(poolK)]; return s; }
function uniformSeq(len){ const s=new Array(len); for(let i=0;i<len;i++) s[i]=[(Math.random()*256)|0,(Math.random()*8)|0,(Math.random()*8)|0,(Math.random()*2-1)]; return s; }
function sampleReal(){ return realSeqs[(Math.random()*realSeqs.length)|0]; }

const L = loadLsys();
L.tick=0;

// ═══ helper: seed ONE organism from an explicit rule string ═══
function seedFromRule(rule){
  const ind={rules:{F:rule},angle:30,plotIdx:0,createdTick:0,bridgeInfluence:1};
  L.develop(ind);
  const n=rule.length||1; let cF=0,cP=0,cM=0,cO=0,cC=0;
  for(const ch of rule){ if(ch==='F')cF++;else if(ch==='+')cP++;else if(ch==='-')cM++;else if(ch==='[')cO++;else if(ch===']')cC++; }
  return {coverage:ind.coverage,overgrown:!!ind.overgrown,len:rule.length,bracket:(cO+cC)/n,turn:(cP+cM)/n,rule};
}

// ═══ IMMEDIATE THREE-ARM TEST ═══
const R=3000;
const arms={treat:{cov:[],brk:[],len:[],turn:[]},ctl1:{cov:[],brk:[],len:[],turn:[]},ctl2:{cov:[],brk:[],len:[],turn:[]}};
const seen={treat:new Set(),ctl1:new Set(),ctl2:new Set()};
for(let r=0;r<R;r++){
  const T=sampleReal(); const len=T.length;
  const inputs={treat:T, ctl1:uniformSeq(len), ctl2:structureDestroyedSeq(len)};
  for(const key of ['treat','ctl1','ctl2']){
    const o=seedFromRule(translate(inputs[key]));
    arms[key].cov.push(Math.log10(Math.max(1,o.coverage)));
    arms[key].brk.push(o.bracket); arms[key].len.push(o.len); arms[key].turn.push(o.turn);
    seen[key].add(o.rule);
  }
}
console.log('\n═══ IMMEDIATE (R='+R+'/arm, instruction-count matched per replicate) ═══');
function report(name,key){
  const t=arms.treat[key],c1=arms.ctl1[key],c2=arms.ctl2[key];
  const a=mannWhitney(t,c1),b=mannWhitney(t,c2);
  console.log('  ['+name+'] med treat='+median(t).toFixed(3)+' ctl1='+median(c1).toFixed(3)+' ctl2='+median(c2).toFixed(3));
  console.log('     treat vs ctl1: p='+a.p.toExponential(2)+' δ='+a.cliff.toFixed(3)+' ('+cliffLabel(a.cliff)+')');
  console.log('     treat vs ctl2: p='+b.p.toExponential(2)+' δ='+b.cliff.toFixed(3)+' ('+cliffLabel(b.cliff)+')  <<< KILLER');
}
report('log10 coverage','cov'); report('bracket frac','brk'); report('rule length','len'); report('turn frac','turn');
console.log('  distinct rules: treat='+seen.treat.size+' ctl1='+seen.ctl1.size+' ctl2='+seen.ctl2.size+' (of '+R+')');

// ═══ (B) SIGNATURE RECOVERY ═══
// The modal real motif translates to a specific target substring. Drip-inject
// translated organisms into an evolving population (like the real bridge), then
// ask: does that target substring appear in the evolved population more under
// treatment (structure intact, motif arrives whole & repeatedly) than under
// ctl2 (same opcodes, scrambled)? This is "can you read Pe's signature back out".
const ruleCount=new Map();
for(const seq of motifs){ const rl=translate(seq); ruleCount.set(rl,(ruleCount.get(rl)||0)+1); }
let target=null,tc=-1;
for(const [rl,c] of ruleCount){ if(rl.length>=4 && c>tc){ tc=c; target=rl; } }
console.log('\n═══ (B) SIGNATURE RECOVERY ═══');
console.log('  modal translated motif (target substring): "'+target+'"  injected in '+tc+'/'+motifs.length+' motifs ('+(100*tc/motifs.length).toFixed(1)+'%)');

function dripEvolve(seqFn, reps, cycles){
  const containFrac=[]; const equilCov=[];
  for(let rep=0;rep<reps;rep++){
    L.tick=0;
    // fresh random population
    const pop=[];
    for(let i=0;i<L.POP_SIZE;i++){ const g=L.freshGenome(0); pop.push({rules:{F:g.rules.F},angle:g.angle,plotIdx:i,createdTick:0,reproducedCount:0,bridgeInfluence:0}); }
    L.population=pop; L.layoutPlots(); for(const ind of pop)L.develop(ind);
    for(let cyc=0;cyc<cycles;cyc++){
      L.tick=L.tick+L.GROWTH_CYCLE;
      // drip: inject one translated organism from this arm into a random slot
      const rule=translate(seqFn());
      const idx=(Math.random()*L.POP_SIZE)|0;
      const child={rules:{F:rule},angle:30,plotIdx:idx,createdTick:L.tick,reproducedCount:0,bridgeInfluence:1};
      L.population[idx]=child; L.develop(child);
      L.growthCycle();
    }
    let contain=0; const covs=[];
    for(const ind of L.population){ if(ind.rules.F.indexOf(target)>=0) contain++; if(!ind.overgrown) covs.push(Math.log10(Math.max(1,ind.coverage))); }
    containFrac.push(contain/L.POP_SIZE);
    equilCov.push(covs.length?mean(covs):0);
  }
  return {containFrac, equilCov};
}
const REPS=250, CYCLES=300;
const dT=dripEvolve(sampleReal, REPS, CYCLES);
const dC1=dripEvolve(()=>uniformSeq(3), REPS, CYCLES);
const dC2=dripEvolve(()=>structureDestroyedSeq(3), REPS, CYCLES);
console.log('  target-substring presence in evolved pop ('+REPS+' pops, '+CYCLES+' drip cycles):');
console.log('    mean fraction containing target: treat='+mean(dT.containFrac).toFixed(4)+' ctl1='+mean(dC1.containFrac).toFixed(4)+' ctl2='+mean(dC2.containFrac).toFixed(4));
const sT2=mannWhitney(dT.containFrac,dC2.containFrac), sT1=mannWhitney(dT.containFrac,dC1.containFrac);
console.log('    treat vs ctl1: p='+sT1.p.toExponential(2)+' δ='+sT1.cliff.toFixed(3)+' ('+cliffLabel(sT1.cliff)+')');
console.log('    treat vs ctl2: p='+sT2.p.toExponential(2)+' δ='+sT2.cliff.toFixed(3)+' ('+cliffLabel(sT2.cliff)+')  <<< can you read Pe back out?');

// ═══ (A) DOWNSTREAM FITNESS PERSISTENCE ═══
console.log('\n═══ (A) DOWNSTREAM FITNESS after selection ═══');
console.log('  equilibrium mean log10-coverage under continuous drip:');
console.log('    treat med='+median(dT.equilCov).toFixed(4)+' ctl1='+median(dC1.equilCov).toFixed(4)+' ctl2='+median(dC2.equilCov).toFixed(4));
const eT2=mannWhitney(dT.equilCov,dC2.equilCov), eT1=mannWhitney(dT.equilCov,dC1.equilCov);
console.log('    treat vs ctl1: p='+eT1.p.toExponential(2)+' δ='+eT1.cliff.toFixed(3)+' ('+cliffLabel(eT1.cliff)+')');
console.log('    treat vs ctl2: p='+eT2.p.toExponential(2)+' δ='+eT2.cliff.toFixed(3)+' ('+cliffLabel(eT2.cliff)+')  <<< does structure change the OUTCOME?');

console.log('\nDONE.');
