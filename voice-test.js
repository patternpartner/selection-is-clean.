// #174 acceptance test — THE ALPHABET STOPS BEING FIXED.
//
// Every atom this system had ever written was a composition over eighteen symbols. A universe with 97
// atoms still had exactly eighteen things it could refer to. That is the most likely explanation for
// the one number this project cannot move: the fraction of novelty that PERSISTS comes out at 0.283
// and 0.267 across configurations with almost nothing in common, and a fixed grammar sampled at a
// steady rate is exactly what produces a stable ratio.
//
// ya..yh carry the previous outputs of the atoms bound to opcode slots 0-7. The alphabet is eight
// symbols wider, but the point is not the width — it is that what `ya` MEANS is an evolved function
// the lineage wrote for itself, and changes when selection puts a different atom in slot 0.
//
// What this checks, in order of how badly it would hurt to get wrong:
//   1. THE INVARIANT. uaJitterConst's regex is exhaustive over this grammar only because vars are
//      digit-free and `.toFixed(2)` constants are the sole source of digits. `y0` would have silently
//      broken the one small-step operator atoms have, and nothing would have reported it.
//   2. BACKWARD COMPATIBILITY. Every saved creature's expressions predate ya..yh. They must compile
//      and evaluate identically under the wider signature or every genome in the field is bricked.
//   3. IT ACTUALLY COMPUTES. An atom mentioning ya must change its answer when slot 0's atom changes
//      its output — otherwise this is eight parameters that do nothing.
//   4. IT IS AUTHORED. The generator must actually emit the new symbols, or the vocabulary is open in
//      principle and closed in practice.
//   5. IT CANNOT RUN AWAY. An atom's output reaching another atom's input is a feedback path.
// Exits non-zero on any failure.   node voice-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/voice.js'); m.filename='/tmp/voice.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  for(let s=0;s<300;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={errors:[]};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,140)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});

  // 4. IS IT AUTHORED? draw a lot of expressions and see whether the new symbols appear
  out.authored=run('authored',()=>{
    let withY=0, total=600, seen={};
    for(let i=0;i<total;i++){
      const e=uaGenExpression();
      const hits=e.match(/\\b(ya|yb|yc|yd|ye|yf|yg|yh)\\b/g);
      if(hits){ withY++; hits.forEach(h=>seen[h]=(seen[h]||0)+1); }
    }
    return {withY,total,distinct:Object.keys(seen).length,seen};
  });

  // 1. THE INVARIANT — uaJitterConst must still touch ONLY numeric constants, never a variable
  out.jitter=run('jitter',()=>{
    const e='((ya)+(1.25))*((yh)-(0.50))';
    let movedVar=0, movedConst=0;
    for(let i=0;i<200;i++){
      const j=uaJitterConst(e);
      if(!/\\bya\\b/.test(j)||!/\\byh\\b/.test(j)) movedVar++;
      if(j!==e) movedConst++;
    }
    return {movedVar,movedConst,sample:uaJitterConst(e)};
  });
  // and uaSwapVar must be able to reach the new vars in both directions
  out.swap=run('swap',()=>{
    let toY=0, fromY=0;
    for(let i=0;i<300;i++){ if(/\\b(ya|yb|yc|yd|ye|yf|yg|yh)\\b/.test(uaSwapVar('(a)+(b)'))) toY++; }
    for(let i=0;i<300;i++){ const r=uaSwapVar('(ya)+(yb)'); if(!/\\bya\\b/.test(r)||!/\\byb\\b/.test(r)) fromY++; }
    return {toY,fromY};
  });

  // 2. BACKWARD COMPATIBILITY — an expression written before ya..yh existed
  out.old=run('old',()=>{
    const a=mk('(a)+(b)'); uaCompile(a);
    const b=mk('(Math.sin(m))/(Math.abs(m))'); uaCompile(b);
    return {failed:!!a.failed||!!b.failed, v1:uaCall(a,2,3), v2:typeof uaCall(b,1,1)};
  });

  // 3. DOES IT COMPUTE? drive the voice directly and watch an atom's answer move
  out.computes=run('computes',()=>{
    const at=mk('(ya)+(0.00)'); uaCompile(at);
    if(at.failed) return {failed:true};
    const readings=[];
    for(const v of [0,1,-1,3.5]){ __uaVoice[0]=v; readings.push(uaCall(at,0,0)); }
    __uaVoice[0]=0;
    return {failed:false, readings};
  });

  // does uaChain FILL a voice, and is it clamped?
  out.fills=run('fills',()=>{
    // Clear the stacks on the slots under test. After 300 ticks a slot may carry a CHAIN, and the
    // voice is what the slot YIELDS — f2(f1(a,b),b) — so a chained slot legitimately does not return
    // a*b. The first version of this rig did not clear them, read 8 instead of 12, and was right to
    // complain: it had caught the store happening before the chain rather than after.
    if(genome.opStacks){ for(const k of [0,1,2,40]) delete genome.opStacks[k]; }
    // In range: 3*2 = 6, which uaCall's own ±8 bound leaves alone.
    __uaVoice[0]=0; uaChain(mk('(a)*(b)'),0,3,2);
    const normal=__uaVoice[0];
    // 5. RUNAWAY. The bound is uaCall's, not this feature's — every atom output has been clamped to
    // ±8 since long before #174, which is why #174 adds no clamp of its own.
    __uaVoice[1]=0; uaChain(mk('(a)*(b)'),1,1e6,1e6);
    const clamped=__uaVoice[1];
    __uaVoice[2]=0; uaChain(mk('(a)*(b)'),2,-1e6,1e6);
    const clampedNeg=__uaVoice[2];
    // a slot beyond the voices must not write anything
    const before=Array.from(__uaVoice); uaChain(mk('(a)+(b)'),40,7,7);
    const after=Array.from(__uaVoice);
    __uaVoice.fill(0);
    // AND the chained case, which is the semantics #174 chose: with a stack on slot 3 the voice must
    // be the CHAIN's answer, not the head's.
    const idx=genome.userAtoms.length;
    genome.userAtoms.push(mk('(a)+(100.00)'));
    genome.opStacks=genome.opStacks||{}; genome.opStacks[3]=[idx];
    __uaVoice[3]=0; uaChain(mk('(a)*(b)'),3,3,2);        // head 6, then +100 -> 106, bounded to 8
    const chained=__uaVoice[3];
    delete genome.opStacks[3]; genome.userAtoms.length=idx;
    return {normal,clamped,clampedNeg,chained,cap:8,voices:UA_VOICE,
            outOfRangeTouched:before.some((v,i)=>v!==after[i])};
  });

  // #175 — SCOPE. The voices must be silent at the top of every program entry. Poison the array with
  // a sentinel, call an entry point, and the sentinel must be gone from every slot: an entry that
  // forgot to clear would leave the untouched slots still holding it. This is the property that makes
  // ya..yh selectable at all — without it ya reads whatever the last atom in any other organism
  // left there, which no lineage can reproduce and selection can only discard.
  out.scope=run('scope',()=>{
    const S=7.77, res={};
    const probe=(name,fn)=>{
      __uaVoice.fill(S);
      try{ fn(); }catch(e){ res[name]='threw: '+((e&&e.message)||String(e)).slice(0,80); return; }
      res[name]=Array.from(__uaVoice).filter(v=>Math.abs(v-S)<1e-6).length;   // slots still poisoned
    };
    probe('profileVM',   ()=>profileVM());
    probe('executeSoloVM',()=>executeSoloVM());
    probe('executeVM',   ()=>executeVM(0,1,0.5,10));
    probe('executeClusterVM',()=>executeClusterVM(0,1,0.5,10));
    __uaVoice.fill(0);
    return res;
  });

  // the whole loop must still run with the wider signature in the hot path
  out.loopOk=run('loopOk',()=>{
    const t0=tick; for(let s=0;s<200;s++){ globalThis.__detMs+=5; loop(); }
    return {ran:tick-t0, N:N, atoms:(genome.userAtoms||[]).length};
  });
  return out;
};`,'/tmp/voice.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };

ck('the generator actually emits the new senses', r.authored && r.authored.withY>0,
   r.authored && (r.authored.withY+'/'+r.authored.total+' expressions, '+r.authored.distinct+'/8 distinct symbols'));
ck('and reaches all eight of them', r.authored && r.authored.distinct===8, r.authored && JSON.stringify(r.authored.seen));
ck('uaJitterConst still never touches a variable', r.jitter && r.jitter.movedVar===0,
   r.jitter && (r.jitter.movedVar+' variables moved; '+r.jitter.movedConst+'/200 constants jittered'));
ck('and still jitters the constants it is for', r.jitter && r.jitter.movedConst>0, r.jitter && r.jitter.sample);
ck('uaSwapVar can swap INTO the new senses', r.swap && r.swap.toY>0, r.swap && (r.swap.toY+'/300'));
ck('and back OUT of them', r.swap && r.swap.fromY>0, r.swap && (r.swap.fromY+'/300'));
ck('expressions written before ya..yh still compile', r.old && r.old.failed===false);
ck('and still evaluate correctly', r.old && r.old.v1===5, r.old && ('(a)+(b) with 2,3 = '+r.old.v1));
ck('an atom that reads a voice actually sees it', r.computes && !r.computes.failed &&
   new Set(r.computes.readings).size===r.computes.readings.length, r.computes && JSON.stringify(r.computes.readings));
ck('uaChain fills the voice for slots 0-7', r.fills && r.fills.normal===6, r.fills && ('slot0 = '+r.fills.normal));
ck('a runaway output is bounded — by uaCall, not by #174',
   r.fills && r.fills.clamped===8 && r.fills.clampedNeg===-8,
   r.fills && (r.fills.clamped+' / '+r.fills.clampedNeg+', uaCall bounds every atom to ±8'));
ck('a chained slot voices what the CHAIN yields, not the head',
   r.fills && r.fills.chained===8 && r.fills.normal===6,
   r.fills && ('unchained slot stored '+r.fills.normal+', chained slot stored '+r.fills.chained));
ck('a slot past the voices writes nothing', r.fills && r.fills.outOfRangeTouched===false);
const sc=r.scope||{};
for(const entry of ['profileVM','executeSoloVM','executeVM','executeClusterVM'])
  ck('#175: '+entry+' starts a program with silent voices', sc[entry]===0,
     sc[entry]===0?'all 8 slots cleared':('left '+sc[entry]+' slot(s) poisoned'));
const nResets=(code.match(/__uaVoice\.fill\(0\)/g)||[]).length;
ck('#175: every program entry carries the reset', nResets===6,
   nResets+' resets in engine.html (profileVM, executeVM, executeClusterVM, executeSoloVM, #95 prediction, #188 updateChannels)');
// WHY SIX AND NOT FIVE. #188's lattice pass calls uaCall outside any particle interaction, which
// makes it a program entry in every sense that matters here - and its first version did NOT clear the
// voices, so the chemistries it evolved (which named yd and yc) were reading residue from an
// arbitrary organism in an arbitrary order. That is precisely the defect #175 exists to prevent, and
// this count is what flagged the new site for review rather than letting it through. The number is
// deliberately a constant and not a pattern: it should fail, and be read, every time a sixth, seventh
// or eighth context starts running atoms.
const nChanScope=(code.match(/uaCtxRl=0; uaCtxRd=0; __uaVoice\.fill\(0\); __probeOut\.fill\(0\);/g)||[]).length;
ck('#188: the lattice pass zeroes the particle-relative senses too', nChanScope===1,
   'a cell has no partner, no forage gradient and no voices — those read a defined zero, not a stranger');

ck('the loop still runs with the wider signature', r.loopOk && r.loopOk.ran>=200,
   r.loopOk && (r.loopOk.ran+' ticks, N '+r.loopOk.N+', atoms '+r.loopOk.atoms));
ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
