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
// Clock: real by default; deterministic (5ms per tick, frozen within a tick) when SEED is set,
// so time-budget gates fire identically across A/B runs.
const t0=Date.now();
globalThis.__detMs=0;
globalThis.performance=process.env.SEED?{now:()=>globalThis.__detMs}:{now:()=>Date.now()-t0};
// Seeded RNG (mulberry32) for exact replay across code variants.
if(process.env.SEED){
  let a=(parseInt(process.env.SEED,10)|0)>>>0;
  Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};
const html=fs.readFileSync(process.env.INDEX||(__dirname+'/index.html'),'utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];
// Instrument: count pairwise VM invocations (the two calls inside processGrid's pair loop).
globalThis.__pairs=0;
code=code.replace('executeVM(_drv,_oth,sim,d);','(globalThis.__pairs++,executeVM(_drv,_oth,sim,d));');
const driver=`
;globalThis.__run=function(ticks){
  const out=[];
  for(let s=0;s<ticks;s++){
    globalThis.__pairs=0;
    globalThis.__detMs+=5;
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
if(process.env.DUMP){for(const r of rows)console.log(JSON.stringify({t:r.tick,N:r.N,p:r.pairs}));process.exit(0);}
// summarize in buckets of 20
for(let b=0;b<rows.length;b+=20){
  const seg=rows.slice(b,b+20);
  const ms=seg.reduce((a,r)=>a+r.ms,0)/seg.length;
  const pr=seg.reduce((a,r)=>a+r.pairs,0)/seg.length;
  const last=seg[seg.length-1];
  console.log(`ticks ${seg[0].tick}-${last.tick}  N=${last.N}  avg pairs/tick=${pr.toFixed(0)}  avg ms/tick=${ms.toFixed(1)}  us/pairVM=${(1000*ms/Math.max(1,pr)).toFixed(1)}`);
}
