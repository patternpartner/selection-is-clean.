// Replicated ablation: compile a FRESH sim per replicate (independent RNG), load an
// evolved genome, optionally ablate one component back to cold, run, and tally the
// bloom fraction. Separates real causal levers from stochastic single-run noise.
const fs = require('fs');
const LOADDIR = process.env.LOADDIR || '/tmp/c1';
const PHASE = process.env.PHASE || 'bloom';
const REPS = parseInt(process.env.REPS || '6', 10);
const TICKS = parseInt(process.env.TICKS || '8000', 10);
const ABLATES = (process.env.ABLATES || 'none,metabolicCost,objWeights,fitnessSensors,vmProgram').split(',');
const BLOOM_N = 800;

function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='width'||k==='height')return 0;if(k==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
let _t=0;globalThis.performance={now:()=>(_t+=16)};
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};

const code=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const loaded=JSON.parse(fs.readFileSync(LOADDIR+'/genome_'+PHASE+'.json','utf8')).genome;
const Module=require('module');

function runOne(ablate){
  // fresh DOM element registry per rep
  const ELS={}; globalThis.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false}};
  globalThis.__OUT=null;
  const driver=`
  ;(function(){
    var loaded=${JSON.stringify(loaded)};
    var ABLATE=${JSON.stringify(ablate)}, TICKS=${TICKS};
    var cold=JSON.parse(JSON.stringify(genome));
    for(var k in loaded){ genome[k]=loaded[k]; }
    if(ABLATE==='vmProgram') genome.vmProgram=JSON.parse(JSON.stringify(cold.vmProgram));
    else if(ABLATE==='objWeights') genome.objWeights=JSON.parse(JSON.stringify(cold.objWeights));
    else if(ABLATE==='fitnessSensors') genome.fitnessSensors=JSON.parse(JSON.stringify(cold.fitnessSensors));
    else if(ABLATE==='metabolicCost') genome.metabolicCost=cold.metabolicCost;
    else if(ABLATE==='physics'){ ['metabolicCost','creationCost','creationThresh','destructThresh','densityCostK','entropyK','entropyBaseline','deathThreshold'].forEach(function(kk){genome[kk]=cold[kk]}); }
    genome.mutationRate=0; if('mutationScale' in genome) genome.mutationScale=0;
    var peakN=0;
    for(var s=0;s<TICKS;s++){ try{loop()}catch(e){} if(N>peakN)peakN=N; }
    globalThis.__OUT=peakN;
  })();`;
  const m=new Module(__dirname+'/rep-sim.js'); m.filename=__dirname+'/rep-sim.js'; m.paths=Module._nodeModulePaths(__dirname);
  try{ m._compile(code+driver,m.filename); }catch(e){ return -1; }
  return globalThis.__OUT;
}

const results={};
for(const ab of ABLATES){
  const peaks=[]; let blooms=0;
  for(let r=0;r<REPS;r++){ const pk=runOne(ab); peaks.push(pk); if(pk>BLOOM_N)blooms++; }
  results[ab]={bloomFrac:`${blooms}/${REPS}`, peaks};
  process.stdout.write(`${ab.padEnd(16)} blooms ${blooms}/${REPS}  peaks=[${peaks.join(',')}]\n`);
}
