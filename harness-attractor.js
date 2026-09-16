// THE FAILURE ATTRACTOR (#205) — CAN A LINEAGE LEAVE A WORLD IT HAS MADE UNINHABITABLE?
//
// BACKGROUND. An 18-universe field export showed one universe (surface/6) at "generation 607" with a
// population that reseeded on a fixed 73-tick rhythm and never grew. The forensics established the
// proximate chain: genome.cadenceExtinct had evolved to 73, genome.extinctionThresh had evolved to 28,
// and that universe's population never exceeded 24. Every extinction check therefore fired, forever.
// "Generation 607" counts deaths, not descent.
//
// WHAT THAT FORENSIC DID NOT SETTLE, and what this rig is for. Two readings fit the same evidence:
//
//   (a) UNBOUNDED MUTATION. maybe(val,min,max,magnitude) never reads min or max -- 66 call sites pass
//       bounds that do nothing. extinctionThresh is written maybe(v,2,20,2) and reached 28. On this
//       reading the fix is to honour the declared bounds and the regime becomes unreachable.
//
//   (b) NO SELECTION AGAINST IT. extinctionThresh is a genome gene that sets the lineage's own death
//       line, and extinction does not kill the germline -- it reseeds from it. A gene that makes its
//       world uninhabitable costs its carrier nothing, because the carrier is the genome and the
//       genome survives every extinction it causes. On this reading clamping changes the ENTRY RATE
//       and nothing else: the state is still absorbing once entered, just harder to reach.
//
// These predict different things, so they can be separated. Reading (a) says a trapped lineage escapes
// on its own once the walk is bounded -- and, more sharply, that an UNBOUNDED trapped lineage should
// also escape, because the walk that carried extinctionThresh up is unbiased and can carry it back
// down. Reading (b) says escape probability is near zero whatever the bounds, because nothing in the
// loop is pushing the gene anywhere in particular and the world never gets long enough to select.
//
// NOTE ON "BUG". maybe()'s own comment (Pe22b, GLOVES OFF) declares the unbounded behaviour on
// purpose, and pre-registers exactly this outcome: "If that value produces crashes elsewhere, that's a
// finding, not a failure to guard." So (a) is not a bug report. It is a prediction the engine made
// about itself, and surface/6 is the prediction coming true. What is worth measuring is whether the
// declared bounds were doing any WORK -- whether honouring them would have prevented this -- not
// whether someone forgot them.
//
// METHOD. Force the trap ONCE at a chosen tick and then never touch it again, so any escape is the
// lineage's own. Log every extinction. Also run the spontaneous arm (TRAP=0), where nothing is forced,
// to get the entry rate at a field-tile canvas size.
//
// THE CANVAS MATTERS AND IS NOT INCIDENTAL. checkExtinction reseeds n=min(300,(W*H/3000)|0) particles,
// and W,H are window.innerWidth/innerHeight. A universe in an 18-up field is a small tile: at 300x200
// the reseed floor is 20, so extinctionThresh=28 is above the population the world can ever hold at
// birth. At fullscreen the floor is 300 and the same gene value is harmless. The trap is a property of
// the gene AND the viewport, which is why it showed up in the field and never in a full-window run.
//
// Env: SEED  TICKS (default 6000)  TILE=1 (300x200 field-tile canvas; default 1280x720)
//      TRAP=<n> (force extinctionThresh to n at tick TRAPAT; 0 = spontaneous arm, the control)
//      TRAPAT (default 700 -- past the tick>600 gate, so the normal mutation path is live)
//      CLAMP=1 (make maybe() honour its declared min/max -- the reading-(a) arm)
const fs=require('fs');
// #216x: KNOBS ARE HONOURED HERE NOW. CLAUDE.md records the #216b/#216d trap - an env var with no
// applyKnobs call is not a control, it is a no-op that reads like one - and this rig was still
// standing in it. Only substrate-test and harness-variance called applyKnobs; four rigs did not,
// so every KNOBS entry they did not hand-wire was silently ignored. Found by adding LAW_PERSIST
// to KNOBS, testing the off arm here, and getting a result identical to the on arm.
// A no-op when no env var is set, so the default path is unchanged.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
const TICKS=parseInt(process.env.TICKS||'6000',10);
const TRAP=parseInt(process.env.TRAP||'0',10);
const TRAPAT=parseInt(process.env.TRAPAT||'700',10);
const CLAMP=(process.env.CLAMP|0)===1;
const TILE=(process.env.TILE|0)===1;
// TRAPREL is the honest version of TRAP and the one the data asked for. A FIXED threshold of 28
// is not a trap at every canvas: a 300x200 tile reseeds 20 particles and then climbs to ~120, so
// 28 is merely a low death line there. surface/6's condition was RELATIVE -- its death line sat a
// few particles ABOVE the most its world ever held. TRAPREL=<d> reproduces that by reading the
// peak population the run has actually achieved and setting the threshold to peak+d.
const TRAPREL=(process.env.TRAPREL!==undefined)?parseInt(process.env.TRAPREL,10):null;
// CAD forces cadenceExtinct. surface/6 had evolved 73 against a default of 90, and the cadence is
// half the mechanism: what matters is not whether the population CAN exceed the death line but
// whether it can climb back past it from a 20-particle reseed before the next check arrives.
const CAD=(process.env.CAD!==undefined)?parseInt(process.env.CAD,10):null;

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
// WIDTH/HEIGHT override the canvas directly. The reseed floor is min(300,(W*H/3000)|0) and the
// achievable population scales with area too, so canvas size is the knob that decides whether a
// given threshold is INSIDE or OUTSIDE the declared bound of 20 when the world becomes trapped.
// That is the whole (a)-vs-(b) question, so it has to be settable rather than assumed.
globalThis.innerWidth=parseInt(process.env.WIDTH||(TILE?'300':'1280'),10);
globalThis.innerHeight=parseInt(process.env.HEIGHT||(TILE?'200':'720'),10);
globalThis.__detMs=0;globalThis.performance={now:()=>globalThis.__detMs};
if(process.env.SEED){let a=(parseInt(process.env.SEED,10)|0)>>>0;Math.random=function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296;};}
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
globalThis.__MAYBE_CLAMP=CLAMP?1:0;
let loopErrors=0,lastErr='';
console.error=(...a)=>{const s=a.join(' ');if(/Loop error|Boot error|Watchdog/.test(s)){loopErrors++;lastErr=s.slice(0,160);}};
console.warn=()=>{};

const html=fs.readFileSync(__dirname+'/engine.html','utf8');
let code=html.match(/<script>([\s\S]*)<\/script>/)[1];

// ── CLAMP ARM ───────────────────────────────────────────────────────────────────────────────────
// The ONLY edit: maybe() honours the min/max it is already handed. Gated on a global so the two arms
// run the same rewritten source and differ by one boolean, not by which file was parsed. A rewrite
// that only exists in one arm is an arm difference of its own, and this project has paid for that.
{ const A='    const next=val+tailDraw()*magnitude*scale;\n    if(!isFinite(next))return val;\n    return next;';
  if(code.split(A).length-1!==1){ console.log(JSON.stringify({error:'maybe() anchor not found'})); process.exit(1); }
  code=code.replace(A,'    const next=val+tailDraw()*magnitude*scale;\n'+
    '    if(!isFinite(next))return val;\n'+
    '    if(globalThis.__MAYBE_CLAMP&&isFinite(min)&&isFinite(max)&&max>min){globalThis.__mcN=(globalThis.__mcN||0)+1;if(next<min){globalThis.__mcLo=(globalThis.__mcLo||0)+1;return min;}if(next>max){globalThis.__mcHi=(globalThis.__mcHi||0)+1;return max;}}\n'+
    '    return next;');
}

// ── EXTINCTION LOG ──────────────────────────────────────────────────────────────────────────────
// Logged at the TOP of checkExtinction, before the branch, so every CHECK is recorded and not only
// every death. The ratio of the two is the whole question: a world that checks 80 times and dies 80
// times is in the attractor; one that checks 80 times and dies twice is simply mortal.
{ const A='function checkExtinction(){\n  let alive=0;\n  for(let i=0;i<N;i++)if(palive[i])alive++;';
  if(code.split(A).length-1!==1){ console.log(JSON.stringify({error:'checkExtinction anchor not found'})); process.exit(1); }
  code=code.replace(A,A+'\n  {const L=globalThis.__xlog=globalThis.__xlog||[];const willDie=(alive<genome.extinctionThresh||genome.mutationRate<=0)&&tick>500;'+
    'L.push([tick,alive,genome.extinctionThresh,+genome.mutationRate.toFixed(4),willDie?1:0,genome.generation|0,globalThis.__winPeak|0,genome.cadenceExtinct|0]);'+
    'globalThis.__winPeak=0;}');
}

const driver=`
(function(){
  // Peak live population between extinction checks. The trap claim is "the threshold sits above what
  // the world can ever hold", so the number it has to be compared against is the PEAK, not the value
  // sampled at the check -- a population that touches 40 mid-window and is read at 18 is not trapped.
  globalThis.__peak=0; globalThis.__peakSeries=[];
  globalThis.__reseedFloor=function(){ try{ return Math.min(300,(W*H/3000)|0); }catch(e){ return -1; } };
  globalThis.__thresh=function(){ try{ return genome.extinctionThresh; }catch(e){ return -1; } };
  globalThis.__setThresh=function(v){ try{ genome.extinctionThresh=v; return genome.extinctionThresh; }catch(e){ return -1; } };
  globalThis.__aliveN=function(){ try{ let a=0; for(let i=0;i<N;i++)if(palive[i])a++; return a; }catch(e){ return -1; } };
  globalThis.__gsnap=function(){ try{ return {gen:genome.generation|0, extinctions:genome.extinctions|0,
      thresh:genome.extinctionThresh, cadence:genome.cadenceExtinct, mutRate:+genome.mutationRate.toFixed(5),
      mutScale:+(genome.mutationScale||0).toFixed(5), mutTail:+(genome.mutationTail||0).toFixed(5),
      mutInterval:Math.round(genome.mutationInterval), atoms:(genome.userAtoms||[]).length,
      motifs:(genome.stableMotifs||[]).length, totalTicks:genome.totalTicks|0, W, H}; }catch(e){ return {error:String(e&&e.message||e)}; } };
  globalThis.__runPeak=0; globalThis.__winPeak=0;
  globalThis.__setCad=function(v){ try{ genome.cadenceExtinct=v; return genome.cadenceExtinct; }catch(e){ return -1; } };
  globalThis.__run=function(n,trap,trapAt,trapRel,cad){
    let forced=null,forcedCad=null;
    for(let s=0;s<n;s++){
      globalThis.__detMs+=5;
      if(s===trapAt){
        // Forced ONCE, then never touched again. Any later movement of either gene is the lineage's
        // own -- which is the entire question, so an arm that kept re-forcing would answer nothing.
        if(cad!==null&&cad>0)forcedCad=globalThis.__setCad(cad);
        if(trapRel!==null)forced=globalThis.__setThresh(globalThis.__runPeak+trapRel);
        else if(trap>0)forced=globalThis.__setThresh(trap);
        globalThis.__forcedAt=s; globalThis.__peakAtForce=globalThis.__runPeak;
      }
      try{loop();}catch(e){ globalThis.__driverErr=(globalThis.__driverErr||0)+1; }
      const a=globalThis.__aliveN();
      if(a>globalThis.__peak)globalThis.__peak=a;
      if(a>globalThis.__winPeak)globalThis.__winPeak=a;
      if(a>globalThis.__runPeak)globalThis.__runPeak=a;
      if((s+1)%500===0){ globalThis.__peakSeries.push([s+1,globalThis.__peak,globalThis.__thresh()]); globalThis.__peak=0; }
    }
    return {thresh:forced,cadence:forcedCad};
  };
})();
`;
const Module=require('module');
const m=new Module(__dirname+'/attractor-sim.js');m.filename=__dirname+'/attractor-sim.js';m.paths=Module._nodeModulePaths(__dirname);
try{ m._compile(code+driver,m.filename); }catch(e){ console.log(JSON.stringify({error:'BOOT: '+e.message}));process.exit(1); }

const before=globalThis.__gsnap();
const forced=globalThis.__run(TICKS,TRAP,TRAPAT,TRAPREL,CAD);
const after=globalThis.__gsnap();
const log=globalThis.__xlog||[];
const floor=globalThis.__reseedFloor();

// Escape is defined ON THE LOG, not on the end state: a lineage that spent 5000 ticks trapped and drifted
// out on the last check is a different animal from one that never entered. escapeAt is the first check
// AFTER the forcing at which the world did NOT die.
let firstDeathAfter=-1,escapeAt=-1,checksAfter=0,deathsAfter=0;
const at=((TRAP>0||TRAPREL!==null)?TRAPAT:0);
for(const r of log){
  if(r[0]<at)continue;
  checksAfter++;
  if(r[4]){ deathsAfter++; if(firstDeathAfter<0)firstDeathAfter=r[0]; }
  else if(escapeAt<0&&checksAfter>1)escapeAt=r[0];
}
// Consecutive deaths ending at the last check: the run finished INSIDE the attractor.
let tailDeaths=0;
for(let i=log.length-1;i>=0;i--){ if(log[i][4])tailDeaths++; else break; }

console.log(JSON.stringify({
  arm:{seed:process.env.SEED||null,ticks:TICKS,trap:TRAP,trapRel:TRAPREL,cad:CAD,trapAt:TRAPAT,clamp:CLAMP,tile:TILE},
  canvas:{W:after.W,H:after.H,reseedFloor:floor},
  forcedThreshTo:forced, peakAtForce:(globalThis.__peakAtForce!==undefined?globalThis.__peakAtForce:null), runPeak:globalThis.__runPeak,
  // THE DECISIVE SERIES. Each check row is
  //   [tick, aliveAtCheck, thresholdNow, mutRate, died, generation, peakSinceLastCheck, cadenceNow]
  // peakSinceLastCheck settles trapped-vs-unlucky: if it never exceeds thresholdNow, the population
  // cannot climb past its own death line inside one cadence window, whatever it could reach given longer.
  before,after,
  clampBinds:CLAMP?{evals:globalThis.__mcN||0,lo:globalThis.__mcLo||0,hi:globalThis.__mcHi||0}:null,
  checks:log.length, deaths:log.filter(r=>r[4]).length,
  checksAfterTrap:checksAfter, deathsAfterTrap:deathsAfter,
  deathFracAfterTrap:checksAfter?+(deathsAfter/checksAfter).toFixed(4):0,
  firstDeathAfterTrap:firstDeathAfter, escapeAt, tailDeaths,
  threshEnd:after.thresh, peakSeries:globalThis.__peakSeries,
  // First and last twelve checks. The middle is the same row repeated when the world is trapped, and
  // saying so costs less than printing it.
  logHead:log.slice(0,12), logTail:log.slice(-12),
  loopErrors,lastErr,driverErr:globalThis.__driverErr||0
},null,1));
