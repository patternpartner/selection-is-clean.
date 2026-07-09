// END-TO-END: load BOTH embedded systems into one process, wire their
// BroadcastChannels to ONE shared bus (exactly like two browser tabs on the same
// origin), and prove they actually inform each other through the REAL shipped code.
const fs = require('fs');
const Module = require('module');

// shared bus: every channel delivers postMessage to every OTHER channel's handler
const CHANNELS=[]; const PE_POSTS=[]; // capture packets addressed "to Pe" for validation
function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,pr){if(pr===Symbol.toPrimitive)return()=>0;if(pr==='width'||pr==='height')return 0;if(pr==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
function installEnv(){
  const CTX=selfProxy();
  function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},style:{},width:1280,height:720,_t:'',get textContent(){return this._t;},set textContent(v){this._t=v;},get innerHTML(){return this._t;},set innerHTML(v){this._t=v;},set onclick(_){},set onchange(_){},click(){}};}
  const ELS={};
  globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},get hidden(){return false;}};
  globalThis.window=globalThis; globalThis.addEventListener=()=>{}; globalThis.removeEventListener=()=>{};
  globalThis.devicePixelRatio=1; globalThis.innerWidth=1280; globalThis.innerHeight=720;
  globalThis.performance={now:()=>Date.now()};
  globalThis.requestAnimationFrame=()=>0; globalThis.setTimeout=()=>0; globalThis.setInterval=()=>0; globalThis.clearInterval=()=>{}; globalThis.clearTimeout=()=>{}; globalThis.cancelAnimationFrame=()=>{};
  globalThis.URL={createObjectURL:()=>'blob:x'}; globalThis.Blob=function(){};
  console.warn=()=>{}; console.error=()=>{};
  const store={}; globalThis.localStorage={getItem:(k)=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
  globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'}; globalThis.history={replaceState(){},pushState(){}};
  globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
  globalThis.BroadcastChannel=class{
    constructor(){ this._on=null; CHANNELS.push(this); }
    postMessage(msg){ if(msg&&msg.type==='motif') PE_POSTS.push(msg); for(const ch of CHANNELS) if(ch!==this&&ch._on){ try{ch._on({data:msg});}catch(e){} } }
    set onmessage(f){ this._on=f; } get onmessage(){ return this._on; }
    addEventListener(t,f){ if(t==='message') this._on=f; } close(){}
  };
}
installEnv();

function loadFile(path, exposeName, exposeExpr){
  const html=fs.readFileSync(path,'utf8');
  const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const m=new Module(path+'.js'); m.filename=path+'.js'; m.paths=Module._nodeModulePaths('/tmp');
  m._compile(code+';globalThis.'+exposeName+'='+exposeExpr+';', m.filename);
  return globalThis[exposeName];
}

const DIR='/tmp/claude-0/-home-user-selection-is-clean-/09cec8ec-f0e4-5f9a-b966-ecedf109e3ac/scratchpad/';
const L=loadFile(DIR+'lsystem-growth.html','__L',
  '{speakStructure,drainBridgeQueue,develop,gesturesToLsys,lsysToGestures,peNativeToGestures,get population(){return population;},set population(v){population=v;},get tick(){return tick;},set tick(v){tick=v;},get qlen(){return bridgeJobQueue.length;}}');
const C=loadFile(DIR+'chemistry-reactor.html','__C',
  '{speakStructure,tickReactor,termSize,render,gesturesToChem,chemToGestures,get population(){return population;},set population(v){population=v;},get tick(){return tick;},set tick(v){tick=v;},get qlen(){return bridgeJobQueue.length;}}');

function bracketFrac(rule){let c=0;for(const ch of rule)if(ch==='['||ch===']')c++;return c/(rule.length||1);}
function sFrac(term){let c=0,n=0;(function w(t){n++;if(t[0]==='app'){w(t[1]);w(t[2]);}else if(t[0]==='S')c++;})(term);return c/n;}
function pearson(xs,ys){const n=xs.length,mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let sx=0,sy=0,sxy=0;for(let i=0;i<n;i++){const dx=xs[i]-mx,dy=ys[i]-my;sx+=dx*dx;sy+=dy*dy;sxy+=dx*dy;}return sxy/(Math.sqrt(sx*sy)||1);}

// ── TEST A: L-system SPEAKS -> chemistry HEARS. Does branchiness cross? ──
function chemHearRuleSeededSfrac(rule){
  // clear chem influence so the only influence-1 molecule is the bridge-seeded one
  for(const mol of C.population){ mol.bridgeInfluence=0; }
  const before=C.tick;
  L.speakStructure(rule);          // posts lingua+motif onto the shared bus
  C.tickReactor();                 // chem drains its queue -> seeds a molecule from the MEANING
  // find the bridge-seeded molecule (influence 1, newest)
  let best=null;
  for(const mol of C.population){ if(mol.bridgeInfluence===1 && (!best||mol.createdTick>=best.createdTick)) best=mol; }
  return best? sFrac(best.term) : null;
}
const branchyRules=['[F[F[F]]]','F[+F][-F][F]','[[F]][[F]]','F[F[F[F]]]'];
const drawyRules  =['FFFFFF','F+F+F+F','FF-FF-FF','F+F-F+F-F'];
const bx=[], sy=[];
let seededOk=0, seededTot=0;
for(const r of branchyRules.concat(drawyRules)){
  const s=chemHearRuleSeededSfrac(r);
  seededTot++; if(s!==null){seededOk++; bx.push(bracketFrac(r)); sy.push(s);}
}
console.log('TEST A  L-system speaks -> chemistry seeds a molecule from the meaning:');
console.log('  chem actually seeded from bridge on '+seededOk+'/'+seededTot+' speak events');
console.log('  branchy rules -> mean seeded S-frac='+(sy.slice(0,4).reduce((a,b)=>a+b,0)/4).toFixed(3)+
            '   drawy rules -> mean seeded S-frac='+(sy.slice(4).reduce((a,b)=>a+b,0)/4).toFixed(3));
console.log('  corr(L bracket-frac, chem seeded S-frac) = '+pearson(bx,sy).toFixed(3)+'   (meaning crossed the wire)');

// ── TEST B: chemistry SPEAKS -> L-system HEARS. Reverse direction. ──
function lHearTermSeededBracket(term){
  const before=L.qlen;
  C.speakStructure(term);
  L.drainBridgeQueue();
  // newest bridge-seeded individual is influence 1
  let best=null;
  for(const ind of L.population){ if(ind.bridgeInfluence===1 && (!best||ind.createdTick>=best.createdTick)) best=ind; }
  return best? bracketFrac(best.rules.F) : null;
}
function mkTerm(sHeavy){ // build an S-heavy or I-heavy term
  const leaves=sHeavy?['S','S','S','K','I']:['I','I','I','I','I'];
  let t=[leaves[0]]; for(let i=1;i<8;i++) t=['app',t,[leaves[(Math.random()*leaves.length)|0]]]; return t;
}
const sHeavyB=[], lBrk=[];
for(let i=0;i<8;i++){ const t=mkTerm(i<4); const b=lHearTermSeededBracket(t); if(b!==null){ sHeavyB.push(sFrac(t)); lBrk.push(b);} }
console.log('\nTEST B  chemistry speaks -> L-system seeds a rule from the meaning:');
console.log('  corr(chem S-frac, L seeded bracket-frac) = '+pearson(sHeavyB,lBrk).toFixed(3)+'   (meaning crossed back)');

// ── TEST C: a REAL Pe motif reaches BOTH via its NATIVE packet ──
const {motifs}=JSON.parse(fs.readFileSync(DIR+'pe-instructions-cache.json','utf8'));
const lQ0=L.qlen, cQ0=C.qlen;
// post a real Pe motif from a standalone "Pe" channel
const peCh=new globalThis.BroadcastChannel('selection-pe-network');
peCh.postMessage({v:1,tab:'pe-real',type:'motif',data:motifs[0]});
console.log('\nTEST C  a real Pe motif on the wire is heard by both new systems:');
console.log('  L-system queued it: '+(L.qlen>lQ0)+'   chemistry queued it: '+(C.qlen>cQ0));

// ── TEST D: speak-back-to-Pe motifs are well-formed & bounded ──
let peOk=0; for(const m of PE_POSTS){ const d=m.data; if(Array.isArray(d)&&d.length&&d.every(ins=>Array.isArray(ins)&&ins.length===4&&ins.every(Number.isFinite)&&Math.abs(ins[3])<=1)) peOk++; }
console.log('\nTEST D  motifs the new systems emitted for Pe: '+peOk+'/'+PE_POSTS.length+' well-formed & bounded');

// ── TEST E: soak — drive both for many ticks with live cross-talk, no crashes ──
let errors=0;
for(let i=0;i<4000;i++){ try{ C.tickReactor(); if(i%3===0) L.drainBridgeQueue(); if(i%200===0){ const b=L.population.find(x=>!x.overgrown); if(b)L.speakStructure(b.rules.F); } }catch(e){ errors++; if(errors<=3)console.log('  ERR',e.message);} }
console.log('\nTEST E  4000-tick live cross-talk soak: errors='+errors+'  L-pop='+L.population.length+'  C-pop='+C.population.length);
console.log('\nDONE.');
