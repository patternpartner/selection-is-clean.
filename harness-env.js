// Shared headless browser-API stubs for the small test rigs. The big harnesses each carry their
// own copy inline; this exists so new checks do not have to paste 20 lines of shims to boot the sim.
module.exports=function(g){
function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='width'||k==='height')return 0;if(k==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},setAttribute(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
const ELS={};
g.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),querySelector:()=>null,addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false}};
g.window=g;g.addEventListener=()=>{};g.removeEventListener=()=>{};
g.location={hash:'',pathname:'/',search:'',href:'http://x/'};g.history={replaceState(){},pushState(){}};
g.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
g.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
g.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
g.fetch=()=>new Promise(()=>{});g.devicePixelRatio=1;g.innerWidth=1280;g.innerHeight=720;
g.__detMs=0;g.performance={now:()=>g.__detMs};
let a=(parseInt(process.env.SEED||'1',10)|0)>>>0;
Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
g.requestAnimationFrame=()=>0;g.cancelAnimationFrame=()=>{};g.setTimeout=()=>0;g.clearTimeout=()=>{};g.setInterval=()=>0;g.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};};

// Knob plumbing. The engine resolves every gate from globalThis.__NAME, never from process.env, so a
// knob with no explicit env line is unreachable from a harness — harness-strip.js states the rule
// outright: "a knob that cannot be turned off is not a control, so the plumbing goes in before any
// ablation claim does."
// #131's own repairs deliberately carry NO knob: selection already holds a finer dial on each (whether
// programs keep ops 232-235, genome.opnovStrength, genome.reachGain). Listing them here would have
// been worse than useless — an env var that silently does nothing is the same trap one level down.
// What is listed is the set that is genuinely dormant AND genuinely togglable.
module.exports.KNOBS = ['MUTUALISM','RQ_TRAIT','GENO_PARASITE','SELF_PREDICT','GRIP_SEED','MEME_TRANSFER'];
module.exports.applyKnobs = function(g){
  for (const kn of module.exports.KNOBS)
    if (process.env[kn] !== undefined) g['__'+kn] = parseInt(process.env[kn], 10);
};
