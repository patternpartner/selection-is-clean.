// Counts pairwise VM invocations per tick + real wall-clock per tick.
const fs = require('fs');
function selfProxy(){const f=function(){return p};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p},apply(){return p}});return p}
const CTX=selfProxy();
function makeEl(){return{getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text},set textContent(v){this._text=v}}}
const ELS={};
globalThis.document={getElementById:id=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
// REAL clock this time — so time-budget gates behave like the browser.
const t0=Date.now();
globalThis.performance={now:()=>Date.now()-t0};
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};
const html=fs.readFileSync(__dirname+'/index.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];
// Instrument: count pairwise VM invocations (the two calls inside processGrid's pair loop).
globalThis.__pairs=0;
code=code.replace('executeVM(_drv,_oth,sim,d);','(globalThis.__pairs++,executeVM(_drv,_oth,sim,d));');
const driver=`
;globalThis.__run=function(ticks){
  const out=[];
  for(let s=0;s<ticks;s++){
    globalThis.__pairs=0;
    const a=Date.now();
    try{loop();}catch(e){}
    out.push({tick,N,pairs:globalThis.__pairs,ms:Date.now()-a});
  }
  return out;
};`;
const Module=require('module');
const m=new Module(__dirname+'/bench-sim.js');m.filename=__dirname+'/bench-sim.js';m.paths=Module._nodeModulePaths(__dirname);
m._compile(code+driver,m.filename);
const TICKS=parseInt(process.env.TICKS||'120',10);
const rows=globalThis.__run(TICKS);
// summarize in buckets of 20
for(let b=0;b<rows.length;b+=20){
  const seg=rows.slice(b,b+20);
  const ms=seg.reduce((a,r)=>a+r.ms,0)/seg.length;
  const pr=seg.reduce((a,r)=>a+r.pairs,0)/seg.length;
  const last=seg[seg.length-1];
  console.log(`ticks ${seg[0].tick}-${last.tick}  N=${last.N}  avg pairs/tick=${pr.toFixed(0)}  avg ms/tick=${ms.toFixed(1)}  us/pairVM=${(1000*ms/Math.max(1,pr)).toFixed(1)}`);
}
