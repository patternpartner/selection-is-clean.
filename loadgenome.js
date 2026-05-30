// Load a captured (evolved) genome, freeze evolution, and run from a cold particle
// start. If it blooms where the cold genome doesn't, the evolved genome carries the
// exploit. ABLATE resets one evolved component back to cold default to isolate the cause.
const fs = require('fs');
const LOADDIR = process.env.LOADDIR || '/tmp/c1';
const PHASE = process.env.PHASE || 'calm';
const ABLATE = process.env.ABLATE || 'none';
const TICKS = parseInt(process.env.TICKS || '12000', 10);

function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='width'||k==='height')return 0;if(k==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
const ELS={};
globalThis.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false}};
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

const driver=`
;(function(){
  var loaded=${JSON.stringify(loaded)};
  var ABLATE=${JSON.stringify(ABLATE)}, TICKS=${TICKS};
  // snapshot cold defaults BEFORE overwriting
  var cold=JSON.parse(JSON.stringify(genome));
  // apply evolved genome wholesale
  for(var k in loaded){ genome[k]=loaded[k]; }
  // optional ablation: restore one evolved component to cold default
  if(ABLATE==='vmProgram'){ genome.vmProgram=JSON.parse(JSON.stringify(cold.vmProgram)); }
  else if(ABLATE==='objWeights'){ genome.objWeights=JSON.parse(JSON.stringify(cold.objWeights)); }
  else if(ABLATE==='fitnessSensors'){ genome.fitnessSensors=JSON.parse(JSON.stringify(cold.fitnessSensors)); }
  else if(ABLATE==='userAtoms'){ genome.userAtoms=JSON.parse(JSON.stringify(cold.userAtoms||[])); }
  else if(ABLATE==='influences'){ for(var kk in cold){ if(/Influence$/.test(kk)) genome[kk]=cold[kk]; } }
  else if(ABLATE==='scalars'){ for(var kk in cold){ if(typeof cold[kk]==='number') genome[kk]=cold[kk]; } }
  else if(ABLATE==='physics'){ ['metabolicCost','creationCost','creationThresh','destructThresh','densityCostK','entropyK','entropyBaseline','deathThreshold'].forEach(function(kk){ genome[kk]=cold[kk]; }); }
  else if(ABLATE==='metabolicCost'){ genome.metabolicCost=cold.metabolicCost; }
  genome.mutationRate=0; if('mutationScale' in genome) genome.mutationScale=0;
  function meanAmp(){var a=0,c=0;for(var i=0;i<N;i++){if(amp[i]>0){a+=amp[i];c++}}return c?a/c:0}
  var peakN=0,bloomTick=-1;
  for(var s=0;s<TICKS;s++){
    try{loop()}catch(e){}
    if(N>peakN)peakN=N;
    if(bloomTick<0 && N>200) bloomTick=s;
  }
  console.log(JSON.stringify({load:${JSON.stringify(LOADDIR+'/'+PHASE)},ablate:ABLATE,
    finalN:N,finalAmp:+meanAmp().toFixed(3),peakN:peakN,bloomTick:bloomTick,
    verdict: N>200?'BLOOMED':(peakN>200?'bloomed-then-fell':'stable')}));
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/load-sim.js');m.filename=__dirname+'/load-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{m._compile(code+driver,m.filename)}catch(e){console.log(JSON.stringify({error:e.message}))}
