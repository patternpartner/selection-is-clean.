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
let _t=0;globalThis.performance={now:()=>(_t+=16)};
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
console.error=()=>{};console.warn=()=>{};
const REPO=__dirname;
const html=fs.readFileSync(REPO+'/index.html','utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];

const TICKS=parseInt(process.env.TICKS||'400',10);
const FNS=['gravity','executeSoloVM','processGrid','updateField','updateParticles','detectClusters','runShadowSim','mutateGenome','clusterDiversity','trackClusterPersistence','attemptClusterBudding','updateClusterReflex','updateParticleReflex','decayNeighborModels','applyEntropy','applyRootForces','applyCreditAssignment','networkBroadcast','networkReceive','exogenousPerturbation','profileVM','inferBoundary','updateBridges','updateHomeostatStack','rebuildFieldLineageCache','selfLearnFromBest','collectClusterUpstream','evolvePlasmids','attemptHGT','render'];
const driver=`
;(function(){
  globalThis.__P={}; globalThis.__USE_HRT=true;
  const names=${JSON.stringify(FNS)};
  const hr=()=>{const t=process.hrtime.bigint();return Number(t)/1e6;};
  for(const nm of names){
    try{
      const orig=eval(nm);
      if(typeof orig!=='function')continue;
      globalThis.__P[nm]=0;
      const wrapped=function(){const s=hr();try{return orig.apply(this,arguments);}finally{globalThis.__P[nm]+=hr()-s;}};
      eval(nm+'=wrapped;');
    }catch(e){}
  }
  globalThis.__run=function(ticks){ for(let i=0;i<ticks;i++){ try{loop();}catch(e){} } };
})();
`;
const Module=require('module');
const m=new Module(REPO+'/prof-sim.js'); m.filename=REPO+'/prof-sim.js'; m.paths=Module._nodeModulePaths(REPO);
m._compile(code+driver, m.filename);
const t0=process.hrtime.bigint();
globalThis.__run(TICKS);
const totalMs=Number(process.hrtime.bigint()-t0)/1e6;
const P=globalThis.__P;
const rows=Object.keys(P).map(k=>[k,P[k]]).filter(r=>r[1]>0.5).sort((a,b)=>b[1]-a[1]);
let acc=0; rows.forEach(r=>acc+=r[1]);
console.log('TICKS',TICKS,' total loop ms',totalMs.toFixed(0),' per-tick ms',(totalMs/TICKS).toFixed(1),' N',(typeof globalThis.N!=='undefined'?'?':'?'));
console.log('measured fns sum ms',acc.toFixed(0),'('+(100*acc/totalMs).toFixed(0)+'% of loop)');
console.log('--- top functions (ms total / % of loop / per-tick ms) ---');
for(const [k,v] of rows){ console.log(k.padEnd(26), v.toFixed(0).padStart(7), (100*v/totalMs).toFixed(1).padStart(6)+'%', (v/TICKS).toFixed(2).padStart(8)); }
