// THE DYNAMIC READ CENSUS (#210) — A READ SITE IS NOT A READ
//
// #209 classified all 191 genome keys STATICALLY: 181 LIVE (a read site exists outside the genome's
// own machinery), 7 META_ONLY, 3 INERT. That census is deliberately budget-free and trajectory-free,
// and it says so about itself: it gives a FLOOR, not a verdict. A read site can sit behind a gate that
// never opens, which is exactly what #208 measured for the atom cull -- atomIdleTolerance is LIVE by
// the static census and its site was evaluated ZERO times in 36,000 ticks.
//
// #208 established that for ONE gene, at the cost of a bespoke sole-blocker audit. This does it for
// all 191 at once: wrap the genome in a counting Proxy and read the numbers off.
//
// THE REBINDING, which is the part that would have made this silently wrong. The engine repoints the
// ambient `genome` at a PARTICLE's genome in four places (applyMetabolism, executeSoloVM, the
// field-driver block, scoreProbes) and restores it in a finally. So a wrapper installed once at boot
// would be swapped out for an unwrapped object for the duration of every one of those blocks, and
// every read inside them -- which is most of the per-particle work in the engine -- would go
// uncounted. Each swap is wrapped too, and __wrapG is idempotent, so the restores hand back an
// already-counted object rather than double-wrapping it.
//
// WHAT ZERO MEANS HERE, and it is not what it means in #209. This rig HAS a trajectory and a budget,
// so a zero is "not read in this run", not "never read". Two classes produce zeros for opposite
// reasons and the run reports what is needed to tell them apart:
//   - EVENT-TRIGGERED reads. #207 found stableMotifs is read only at extinction, so a seed with no
//     extinctions reads it zero times and nothing is wrong. extinctions is reported for exactly this.
//   - UNREACHED reads. The site exists, the event happens, and the gate never opens. That is #208.
// A gene that reads zero in a run WITH extinctions and at several budgets is the interesting case,
// and it is the one this rig exists to nominate -- not to convict.
//
// Env: SEED  TICKS (default 3000)  TOP (default 30)
const fs=require('fs');
const TICKS=parseInt(process.env.TICKS||'3000',10);
const TOP=parseInt(process.env.TOP||'30',10);

function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
const CTX=selfProxy();
function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1,height:1,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
const ELS={};
globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
globalThis.BroadcastChannel=class{constructor(){}postMessage(){}addEventListener(){}close(){}set onmessage(_){}};
globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;
globalThis.innerWidth=1280;globalThis.innerHeight=720;
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

// ── THE COUNTER. get only: set, has, ownKeys and the rest fall through to Reflect defaults, which
// matters because mutateChildGenome enumerates keys generically (#181) and a broken ownKeys would
// change what the child path mutates. Identity is safe to proxy here: engine.html contains no
// genome===/!== comparison (checked), so nothing can tell the wrapper from the object.
globalThis.__R=Object.create(null);
const WRAPPED=new WeakSet();
const PROXIES=new WeakMap();
globalThis.__wrapG=function(g){
  if(!g||typeof g!=='object')return g;
  if(WRAPPED.has(g))return g;                 // already a wrapper
  const had=PROXIES.get(g); if(had)return had; // same target, same wrapper — so the restores are stable
  const p=new Proxy(g,{ get(t,k,r){ if(typeof k==='string')globalThis.__R[k]=(globalThis.__R[k]||0)+1; return Reflect.get(t,k,r); } });
  WRAPPED.add(p); PROXIES.set(g,p); return p;
};

const html=fs.readFileSync(__dirname+'/engine.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

const fails=[];
function patch(anchor,replacement,label,expect){
  const n=code.split(anchor).length-1;
  if(n!==(expect===undefined?1:expect)){ fails.push(label+': expected '+(expect===undefined?1:expect)+', found '+n); return; }
  code=code.split(anchor).join(replacement);
}
// Installed at the top of loop() rather than at the literal, so there is no need to find where a
// 4,500-line object literal ends — and it is idempotent, so once per tick costs one WeakSet lookup.
patch("function loop(){","function loop(){ genome=globalThis.__wrapG(genome);",'loop');
// Every repoint at a particle's genome. Five sites; the restores need no patch because they assign
// back a reference that was already wrapped when it was read.
patch("genome=pGenome[","genome=globalThis.__wrapG(pGenome[",'swap',5);
code=code.replace(/genome=globalThis\.__wrapG\(pGenome\[(\w+)\]\|\|genome/g,'genome=globalThis.__wrapG(pGenome[$1])||genome');
code=code.replace(/genome=globalThis\.__wrapG\(pGenome\[_pk\];/g,'genome=globalThis.__wrapG(pGenome[_pk]);');

// Key list, read from the literal itself so it cannot go stale (same method as harness-orphans.js).
const lines=code.split('\n');
let ls=-1; for(let i=0;i<lines.length;i++) if(/^let genome=\{/.test(lines[i])){ ls=i; break; }
let d=0,le=-1;
for(let i=ls;i<lines.length;i++){ for(const ch of lines[i]){ if(ch==='{')d++; else if(ch==='}')d--; } if(d===0){ le=i; break; } }
const keys=[];
for(let i=ls;i<=le;i++){ const m=lines[i].match(/^\s{2}([A-Za-z_$][A-Za-z0-9_$]*)\s*:/); if(m&&!keys.includes(m[1]))keys.push(m[1]); }

if(fails.length){ console.log(JSON.stringify({error:'ANCHORS',fails},null,1)); process.exit(1); }
const Module=require('module');
const driver=`
(function(){
  globalThis.__run=function(n){ for(let s=0;s<n;s++){ globalThis.__detMs+=5;
    try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; } } };
  globalThis.__state=function(){ try{ let alive=0; for(let i=0;i<N;i++)if(palive[i])alive++;
    return {alive, extinctions:genome.extinctions|0, generation:genome.generation|0, totalTicks:genome.totalTicks|0,
            atoms:(genome.userAtoms||[]).length, clusters:(typeof clusters!=='undefined')?clusters.length:-1};
  }catch(e){ return {error:String(e&&e.message||e)}; } };
})();
`;
const m=new Module(__dirname+'/reads-sim.js');m.filename=__dirname+'/reads-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }
globalThis.__run(TICKS);
const st=globalThis.__state();

const R=globalThis.__R;
// __state() itself reads six keys off the wrapped genome after the run. Subtracting them keeps the
// instrument out of its own measurement -- small, but a rig that counts its own probe as evidence has
// no business nominating anything.
for(const k of ['extinctions','generation','totalTicks','userAtoms']) if(R[k])R[k]-=1;
const rows=keys.map(k=>({key:k, reads:R[k]|0})).sort((a,b)=>b.reads-a.reads);
const zero=rows.filter(r=>r.reads===0);
const nonKeyReads=Object.keys(R).filter(k=>!keys.includes(k)).length;

console.log(JSON.stringify({
  arm:{seed:process.env.SEED||null,ticks:TICKS},
  state:st,
  keysInLiteral:keys.length,
  readAtLeastOnce:rows.length-zero.length,
  neverReadThisRun:zero.length,
  // The nomination list. Not a verdict: see the header on event-triggered versus unreached.
  neverRead:zero.map(r=>r.key),
  mostRead:rows.slice(0,TOP),
  // Properties read off the genome that are NOT keys of the literal — lazily created genes (#181),
  // and a cheap check that the wrapper is seeing real traffic rather than nothing.
  nonLiteralPropsRead:nonKeyReads,
  loopErrors,lastErr,driverErr:globalThis.__driverErr||0
},null,1));
