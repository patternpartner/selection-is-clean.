// Faithfulness test: load the REAL exported genome via the system's OWN applyGenome
// decoder, then run. Tests whether the Node harness reproduces the real system's
// stability (healthy ~N40 with turnover) or artifactually blooms.
// FREEZE=1 runs with evolution off (should mirror cold-ish since metabolicCost~default);
// FREEZE=0 runs with evolution ACTIVE (the real condition) to see if the harness
// drifts the genome into a bloom the real 470k run never showed.
const fs = require('fs');
const FILE = process.env.FILE;
const TICKS = parseInt(process.env.TICKS || '20000', 10);
const FREEZE = process.env.FREEZE === '1';
const SAMPLE = parseInt(process.env.SAMPLE || '2000', 10);

function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='width'||k==='height')return 0;if(k==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
const ELS={};
globalThis.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/',reload(){}};globalThis.history={replaceState(){},pushState(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
let _t=0;globalThis.performance={now:()=>(_t+=16)};
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};
// Node has atob/btoa; ensure escape/unescape exist (used by decodeGenome)
if(typeof escape==='undefined') globalThis.escape=s=>encodeURIComponent(s).replace(/%([0-9A-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))===decodeURIComponent('%'+h)?'%'+h:'%'+h);

const wrap=JSON.parse(fs.readFileSync(FILE,'utf8'));
const B64 = typeof wrap.genome==='string' ? wrap.genome : null;
// Make loadGenome() pick it up from storage natively
globalThis.localStorage={getItem:k=>k==='selection_genome'?B64:null,setItem(){},removeItem(){}};

const code=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const driver=`
;(function(){
  // Apply via the system's OWN decoder (decodeGenome handles base64 + key mapping).
  var applied=false;
  try{ applied=decodeGenome(${JSON.stringify(B64)}); }catch(e){ applied='ERR:'+e.message; }
  // re-init particle field under the loaded genome
  try{ init(); }catch(e){}
  var FREEZE=${FREEZE};
  if(FREEZE){ genome.mutationRate=0; if('mutationScale' in genome) genome.mutationScale=0; }
  function meanAmp(){var a=0,c=0;for(var i=0;i<N;i++){if(amp[i]>0){a+=amp[i];c++}}return c?a/c:0}
  process.stdout.write('applied='+applied+' gen='+genome.generation+' metabolicCost='+genome.metabolicCost+' objW='+JSON.stringify(genome.objWeights)+' boundOps='+(genome.boundOpcodes||[]).length+' userAtoms='+(genome.userAtoms||[]).length+String.fromCharCode(10));
  var peakN=0;
  for(var s=0;s<${TICKS};s++){
    try{loop()}catch(e){}
    if(N>peakN)peakN=N;
    if(s% ${SAMPLE}===0) process.stdout.write('  t'+tick+' N='+N+' amp='+meanAmp().toFixed(3)+' mc='+(+genome.metabolicCost.toFixed(7))+String.fromCharCode(10));
  }
  process.stdout.write('RESULT peakN='+peakN+' finalN='+N+' finalAmp='+meanAmp().toFixed(3)+' finalMetabolicCost='+genome.metabolicCost+' verdict='+(peakN>800?'BLOOMED':'healthy')+String.fromCharCode(10));
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/realrun-sim.js');m.filename=__dirname+'/realrun-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{m._compile(code+driver,m.filename)}catch(e){console.log('COMPILE ERR',e.message)}
