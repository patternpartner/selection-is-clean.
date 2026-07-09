// Harvest real Pe motif + plasmid INSTRUCTION arrays (structured VM programs)
// and cache them to JSON so the structure-preserving experiment can iterate
// without re-paying the slow Pe boot each time.
const fs = require('fs');
const Module = require('module');
const CACHE = '/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/pe-instructions-cache.json';

function selfProxy(){ const f=function(){return p;}; const p=new Proxy(f,{get(_t,pr){if(pr===Symbol.toPrimitive)return()=>0;if(pr==='width'||pr==='height')return 0;if(pr==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}}); return p; }
function installEnv(captured){
  const CTX=selfProxy();
  function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;},get innerHTML(){return this._text;},set innerHTML(v){this._text=v;},set onclick(_){},set onchange(_){},click(){}};}
  const ELS={};
  globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false;}};
  globalThis.window=globalThis; globalThis.addEventListener=()=>{}; globalThis.removeEventListener=()=>{};
  globalThis.devicePixelRatio=1; globalThis.innerWidth=1280; globalThis.innerHeight=720;
  globalThis.performance={now:()=>Date.now()};
  globalThis.requestAnimationFrame=()=>0; globalThis.cancelAnimationFrame=()=>{};
  globalThis.setTimeout=()=>0; globalThis.clearTimeout=()=>{}; globalThis.setInterval=()=>0; globalThis.clearInterval=()=>{};
  globalThis.URL={createObjectURL:()=>'blob:x'}; globalThis.Blob=function(){};
  console.warn=()=>{}; console.error=()=>{};
  const store={}; globalThis.localStorage={getItem:(k)=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
  globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'}; globalThis.history={replaceState(){},pushState(){}};
  globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
  globalThis.BroadcastChannel=class{constructor(){}postMessage(msg){try{captured.push(JSON.parse(JSON.stringify(msg)));}catch(e){}}addEventListener(){}close(){}set onmessage(_){}};
}

const captured=[];
installEnv(captured);
const html=fs.readFileSync('/home/user/selection-is-clean./index.html','utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1].replace(/scheduleNext\(\);?\s*$/,'');
const m=new Module('/tmp/pe-sim.js'); m.filename='/tmp/pe-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+';globalThis.__loop=loop;globalThis.__setRates=function(){genome.netMigrantRate=1;genome.netPlasmidRate=1;genome.netMotifRate=1;genome.netInscribeRate=0;};',m.filename);
const loop=globalThis.__loop;
console.log('warmup 3000…');
for(let i=0;i<3000;i++)loop();
const before=captured.length;
globalThis.__setRates();
console.log('harvest 8000…');
for(let i=0;i<8000;i++)loop();
const packets=captured.slice(before);

// keep only motif + plasmid instruction arrays (arrays of [op,src,dst,k])
const motifs=[], plasmids=[];
for(const p of packets){
  if(p.type==='motif' && Array.isArray(p.data)) motifs.push(p.data);
  else if(p.type==='plasmid' && Array.isArray(p.data) && p.data.length) plasmids.push(p.data);
}
fs.writeFileSync(CACHE, JSON.stringify({motifs, plasmids}));
console.log('cached: motifs='+motifs.length+' plasmids='+plasmids.length+' -> '+CACHE);
// sanity: show a couple real instructions and their value ranges
const allInst=[].concat(...motifs, ...plasmids);
const ops=allInst.map(i=>i[0]|0), ks=allInst.map(i=>+i[3]||0);
ops.sort((a,b)=>a-b);
console.log('instructions='+allInst.length+' op range=['+ops[0]+'..'+ops[ops.length-1]+'] distinct ops='+new Set(ops).size);
console.log('sample motif[0]:', JSON.stringify(motifs[0]));
