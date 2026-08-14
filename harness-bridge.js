// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PE ↔ PE — the first run of this system against itself.
//
// WHY. Authored atoms have TWO fitness channels, and only one has ever been measured.
//   1. METABOLIC — does the carrier gain amplitude and offspring? Measured across #80–#90.
//      Null to ~10% of the amplitude scale, and still null when handed a direct actuator channel (#88).
//   2. PREDICTIVE (`alienGrip`) — an atom is used as a FORECASTER of a peer substrate's packet-emission
//      rate on the bridge, scored on hit-rate. That score feeds atom selection weighting (12427) AND
//      cull protection (12494: an unused atom past grace survives iff alienGrip > 0).
//      The declaration comment calls it "a real second test of whether primitives selected for one role
//      (driving actuators) generalize to a totally different one (forecasting a foreign substrate)".
//
// `harness-clamp.js` line 53 stubs BroadcastChannel to a no-op. No peers -> peerObservable stays empty
// -> no predictions form -> alienAttempts is 0 -> alienGrip is 0 for EVERY atom in EVERY headless run
// this project has ever produced. The arc has been measuring atoms on a fitness function they were not
// designed for, while the one they WERE designed for has never been switched on.
//
// HOW. Two child processes, each booting the real index.html, with a BroadcastChannel shim that relays
// over node IPC through this parent. Separate processes rather than one — the script writes flags and
// DOM shims onto globalThis, so two instances in one process would collide. Separate processes are also
// the faithful analogue of two browser tabs, which is what the network layer was written for.
//
// Env: TICKS (default 12000)  SEED_A / SEED_B (default 3 / 7)  SOLO=1 (relay disabled: the control)
//      SAMPLE (default 2000)  CHILD_SIGN_FLOOR (default 1)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
const path=require('path');
const TICKS=parseInt(process.env.TICKS||'12000',10);
const SAMPLE=parseInt(process.env.SAMPLE||'2000',10);

// ── CHILD ───────────────────────────────────────────────────────────────────────────────────────
if(process.env.BRIDGE_CHILD){
  const fs=require('fs');
  const SEED=parseInt(process.env.BRIDGE_SEED||'3',10);
  const TAG=process.env.BRIDGE_CHILD;

  function selfProxy(){const f=function(){return p;};const p=new Proxy(f,{get(_t,prop){if(prop===Symbol.toPrimitive)return()=>0;if(prop==='width'||prop==='height')return 0;if(prop==='data')return new Uint8ClampedArray(4);return p;},apply(){return p;}});return p;}
  const CTX=selfProxy();
  function makeEl(){return {getContext:()=>CTX,addEventListener(){},removeEventListener(){},set onclick(_){},set onchange(_){},click(){},appendChild(){},removeChild(){},remove(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},style:{},width:1280,height:720,_text:'',get textContent(){return this._text;},set textContent(v){this._text=v;}};}
  const ELS={};
  globalThis.document={getElementById:(id)=>(ELS[id]||(ELS[id]=makeEl())),createElement:()=>makeEl(),addEventListener(){},removeEventListener(){},head:makeEl(),body:makeEl(),get hidden(){return false;}};
  globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
  globalThis.location={hash:'',pathname:'/',search:'',href:'http://x/'};globalThis.history={replaceState(){},pushState(){}};
  globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
  globalThis.navigator={userAgent:'node',hardwareConcurrency:4,wakeLock:null};
  globalThis.fetch=()=>new Promise(()=>{});globalThis.devicePixelRatio=1;globalThis.innerWidth=1280;globalThis.innerHeight=720;
  globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
  globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
  globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};

  // THE ONE LINE THAT MATTERS: a real BroadcastChannel, relayed over IPC to the sibling instance.
  // Everything else in this file is the same scaffolding harness-clamp.js uses.
  let __bcSent=0,__bcRecv=0;
  globalThis.BroadcastChannel=class{
    constructor(name){ this.name=name; this._h=[];
      process.on('message',(m)=>{ if(!m||m.__bc!==name)return; __bcRecv++;
        for(const f of this._h){ try{ f({data:m.data}); }catch(e){} } }); }
    postMessage(d){ __bcSent++; try{ process.send({__bc:this.name,data:d}); }catch(e){} }
    addEventListener(t,f){ if(t==='message')this._h.push(f); }
    removeEventListener(){}
    set onmessage(f){ this._h.push(f); }
    close(){}
  };

  { let a=(SEED|0)>>>0; Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;}; }
  for(const kn of ['CHILD_SIGN_FLOOR','REACH_MAIN','REACH_NOK','ALIEN_SELECT','MEME_TRANSFER','SELF_PREDICT'])
    if(process.env[kn]!==undefined) globalThis['__'+kn]=parseInt(process.env[kn],10);
  if(globalThis.__CHILD_SIGN_FLOOR===undefined) globalThis.__CHILD_SIGN_FLOOR=1;

  let loopErrors=0;
  console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s))loopErrors++;};
  console.warn=()=>{};

  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const driver=`
;(function(){
  globalThis.__series=[];
  globalThis.__sample=function(t){ try{
    // per-ATOM predictive grip, which is the quantity this whole file exists to make non-zero
    let atoms=0,withAttempts=0,withHits=0,gripSum=0,bestGrip=0,att=0,hit=0;
    const scan=(list)=>{ if(!Array.isArray(list))return;
      for(const a of list){ if(!a)continue; atoms++;
        const A=a.alienAttempts|0, H=a.alienHits|0;
        att+=A; hit+=H;
        if(A>0){ withAttempts++; const g=H/A; gripSum+=g; if(g>bestGrip)bestGrip=g; if(H>0)withHits++; } } };
    scan(genome.userAtoms);
    let pAtoms=0,pAtt=0,pHit=0;
    for(let i=0;i<N;i++){ if(!palive[i]||!pGenome[i])continue;
      const L=pGenome[i].userAtoms; if(!Array.isArray(L))continue;
      for(const a of L){ if(!a)continue; pAtoms++; pAtt+=a.alienAttempts|0; pHit+=a.alienHits|0; } }
    let alive=0,carriers=0;
    for(let i=0;i<N;i++){ if(!palive[i])continue; alive++;
      const g=pGenome[i]; if(g&&Array.isArray(g.boundOpcodes)&&g.boundOpcodes.length)carriers++; }
    globalThis.__series.push({t, alive, carriers,
      germAtoms:atoms, germAtomsWithAttempts:withAttempts, germAtomsWithHits:withHits,
      germGripMean:withAttempts?+(gripSum/withAttempts).toFixed(4):0, germGripBest:+bestGrip.toFixed(4),
      germAlienAttempts:att, germAlienHits:hit,
      partAtoms:pAtoms, partAlienAttempts:pAtt, partAlienHits:pHit,
      predictAttempts:(genome.alienPredict?genome.alienPredict.attempts:0),
      predictHits:(genome.alienPredict?genome.alienPredict.hits:0),
      peers:(typeof networkPeers!=='undefined'?networkPeers:0),
      peerObs:(typeof peerObservable!=='undefined'?peerObservable.size:0),
      pending:(typeof pendingAlienPredictions!=='undefined'?pendingAlienPredictions.size:0),
      netSent:(typeof netStats!=='undefined'?netStats.sent:0),
      netRecv:(typeof netStats!=='undefined'?netStats.received:0),
      memeXfer:(typeof __memeTransfers!=='undefined'?__memeTransfers:0),
      atomSeeded:(typeof __atomSeeded!=='undefined'?__atomSeeded:0)});
  }catch(e){ globalThis.__series.push({t,error:String(e&&e.message||e)}); } };
  // GLOBAL tick counter. The first version sampled on a slice-local index, so every sample reported
  // t<=SLICE and the series timestamps were meaningless — caught in the 8000-tick smoke run.
  globalThis.__gt=0;
  globalThis.__run=function(n,win){
    for(let s=0;s<n;s++){ globalThis.__detMs+=5; try{loop();}catch(e){ globalThis.__err=(globalThis.__err||0)+1; }
      globalThis.__gt++;
      if(globalThis.__gt%win===0) globalThis.__sample(globalThis.__gt); } };
  globalThis.__aliveN=function(){let a=0;for(let i=0;i<N;i++)if(palive[i])a++;return a;};
  globalThis.__kinds=function(){const b={};for(let i=0;i<N;i++){if(!palive[i])continue;const q=i*DIMS;let r=0;
    for(let d=0;d<3&&d<DIMS;d++){let v=((tend[q+d]+1.2)/2.4*4)|0;v=v<0?0:v>3?3:v;r=r*4+v;}b[r]=1;}
    return Object.keys(b).length;};
})();`;
  const Module=require('module');
  const m=new Module(path.join(__dirname,'bridge-sim-'+TAG+'.js'));
  m.filename=m.id; m.paths=Module._nodeModulePaths(__dirname);
  try{ m._compile(code+driver,m.filename); }
  catch(e){ process.send({__done:TAG,error:'BOOT: '+e.message}); process.exit(1); }

  // Run in slices so IPC messages from the sibling can be delivered between them. A single blocking
  // __run(TICKS) would starve the event loop and no packet would ever arrive — which would silently
  // reproduce the very no-peer condition this harness exists to escape.
  const SLICE=200; let done=0;
  (function step(){
    const n=Math.min(SLICE,TICKS-done);
    globalThis.__run(n,SAMPLE);   // SAMPLE is a GLOBAL cadence now, not per-slice
    done+=n;
    if(done<TICKS) setImmediate(step);
    else {
      process.send({__done:TAG, seed:SEED, ticks:TICKS, loopErrors,
        bcSent:__bcSent, bcRecv:__bcRecv,
        alive:globalThis.__aliveN(), kinds:globalThis.__kinds(),
        series:globalThis.__series});
      setTimeout(()=>process.exit(0),50);
    }
  })();
  return;
}

// ── PARENT: fork two instances and relay between them ───────────────────────────────────────────
const {fork}=require('child_process');
const SOLO=(process.env.SOLO|0)===1;
const A=parseInt(process.env.SEED_A||'3',10), B=parseInt(process.env.SEED_B||'7',10);
const env=k=>Object.assign({},process.env,k);
const kids={}, out={};
for(const [tag,seed] of [['A',A],['B',B]]){
  kids[tag]=fork(__filename,[],{env:env({BRIDGE_CHILD:tag,BRIDGE_SEED:String(seed)}),silent:false});
}
let finished=0;
for(const tag of ['A','B']){
  kids[tag].on('message',(m)=>{
    if(m&&m.__done){ out[tag]=m; if(++finished===2) report(); return; }
    if(m&&m.__bc && !SOLO){ const other=tag==='A'?'B':'A';
      try{ kids[other].send(m); }catch(e){} }
  });
  kids[tag].on('exit',(c)=>{ if(!out[tag]){ out[tag]={error:'exited '+c}; if(++finished===2) report(); } });
}
function report(){
  console.log(JSON.stringify({mode:SOLO?'SOLO (relay off — control)':'BRIDGED',
    ticks:TICKS, seedA:A, seedB:B, A:out.A, B:out.B},null,1));
  for(const t of ['A','B']) try{kids[t].kill();}catch(e){}
  process.exit(0);
}
