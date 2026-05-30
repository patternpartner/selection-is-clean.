// Bistability test: cold genome, evolution frozen. Settle, then inject a one-time
// population spike past the suspected tipping point. If the system stays bloomed,
// the ecology is bistable (the bloom is an absorbing attractor), proving the bloom
// is a dynamical tipping phenomenon, not an evolved genome exploit.
// DCOST_MULT lets us test whether stronger density-regulation prevents the tip.
const fs = require('fs');
const SETTLE = parseInt(process.env.SETTLE || '4000', 10);
const PUSH = parseInt(process.env.PUSH || '250', 10);
const RECOVER = parseInt(process.env.RECOVER || '8000', 10);
const DCOST_MULT = parseFloat(process.env.DCOST_MULT || '1');
const NOFIX = process.env.NODEADZONE === '1'; // also brake below N=100 (test the fix)

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

const driver=`
;(function(){
  var SETTLE=${SETTLE},PUSH=${PUSH},RECOVER=${RECOVER},DM=${DCOST_MULT};
  genome.mutationRate=0; if('mutationScale' in genome) genome.mutationScale=0;
  genome.densityCostK=(genome.densityCostK||0.00003)*DM;
  function meanAmp(){var a=0,c=0;for(var i=0;i<N;i++){if(amp[i]>0){a+=amp[i];c++}}return c?a/c:0}
  for(var s=0;s<SETTLE;s++){try{loop()}catch(e){}}
  var beforeN=N, beforeAmp=meanAmp();
  var AMPSPIKE=${process.env.AMP_SPIKE==='1'?'true':'false'};
  // one-time injection: spike population past tipping point
  var added=0;
  for(var j=0;j<PUSH;j++){ if(typeof addParticle==='function'){ var r=addParticle(Math.random()*W,Math.random()*H,(typeof randomTendency==='function'?randomTendency():0),false); if(r>=0)added++; } }
  // optional one-time amplitude spike: drive all particles to the 1.2 clamp
  if(AMPSPIKE){ for(var q=0;q<N;q++){ if(amp[q]>0) amp[q]=1.2; } }
  var spikeN=N, spikeAmp=meanAmp();
  for(var s2=0;s2<RECOVER;s2++){try{loop()}catch(e){}}
  var afterN=N, afterAmp=meanAmp();
  console.log(JSON.stringify({DCOST_MULT:DM,densityCostK:+genome.densityCostK.toFixed(7),
    beforeN:beforeN,beforeAmp:+beforeAmp.toFixed(3),injected:added,spikeN:spikeN,spikeAmp:+spikeAmp.toFixed(3),
    afterN:afterN,afterAmp:+afterAmp.toFixed(3),
    verdict: afterN>2*beforeN?'BLOOMED (stayed high)':'recovered (returned to baseline)'}));
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/bistab-sim.js');m.filename=__dirname+'/bistab-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{m._compile(code+driver,m.filename)}catch(e){console.log(JSON.stringify({error:e.message}))}
