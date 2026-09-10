// #179 acceptance test — THE VERBS WERE NEVER REACHABLE.
//
// Measured in the 17-of-18 harvest: across every germline program, every cluster program and every
// fitness-sensor program in all seventeen universes — 1,424 instructions — the count carrying opcode
// 236 (EFFECT_EMIT) is ZERO. It is the only writer of vmActions[EFFECT_SLOT0+k], and
// applyUserEffects skips any verb whose drive is 0. Every universe carries eight verbs, permanently
// unfired. This is LEAP 7 (#52) and #57 one replicator over, and it takes their fix.
//
// What this checks, hardest-to-get-wrong first:
//   1. IT ACTUALLY MAKES VERBS FIRE. Wiring an instruction that never produces a drive would be the
//      same dead end with more code. This is the only check that matters end to end.
//   2. dst INDEXES THE BANK THAT EXISTS. #133b already paid for this once: %MAX_USER_EFFECTS sent
//      half of all emits to empty slots. A wired instruction must never name a verb that isn't there.
//   3. IT DOES NOT DOUBLE-WIRE. A program that already reaches a verb must be left alone, or every
//      program converges on nothing but EFFECT_EMIT.
//   4. IT RESPECTS THE EVOLVED PROGRAM CAP. vmMaxInstructions is a gene; wiring must not smuggle
//      length past it.
//   5. IT TOUCHES NOTHING WHEN THERE IS NOTHING TO REACH — an empty verb bank wires no call sites.
//   6. DEAD PARTICLES ARE NOT PROGRAMS.
// Exits non-zero on any failure.   node wire-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/wire.js'); m.filename='/tmp/wire.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={errors:[]};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,160)); return null; } };
  const count236=()=>{ let n=0,progs=0; for(let i=0;i<N;i++){ if(!palive[i]||!pProg[i])continue; progs++;
      for(const ins of pProg[i]) if(ins[0]===236)n++; } return {n,progs}; };
  const has236=i=>pProg[i]&&pProg[i].some(x=>x[0]===236);

  for(let s=0;s<400;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  // A FRESH BOOT HAS NO VERBS. The field's banks are full (eight everywhere) because they have run
  // for 100k+ ticks; a 400-tick rig has authored none, and the first version of this test measured
  // wiring against an empty bank and duly reported that nothing was wired. Seed the bank to the shape
  // the live save actually carries: {t:targetIndex, m:conserved?, s:scale, nx:successor, ax:senseSlot}.
  genome.userEffects=[];
  for(let k=0;k<MAX_USER_EFFECTS;k++)
    genome.userEffects.push({t:k%EFFECT_TARGET_COUNT,m:(k%2),s:0.5,nx:-1,ax:-1,uses:0,creditTrace:0});
  out.bank=(genome.userEffects||[]).length;

  // THE FIELD'S STARTING CONDITION: how many living programs reach a verb before any wiring?
  out.before=run('before',()=>{
    for(let i=0;i<N;i++) if(pProg[i]) pProg[i]=pProg[i].filter(x=>x[0]!==236);
    return count236();
  });

  // 3/4/6 — wire hard and inspect the invariants
  out.wire=run('wire',()=>{
    for(let c=0;c<400;c++) wireEffectCallSites();
    const c=count236();
    let multi=0, overCap=0, badDst=0, deadTouched=0;
    const cap=Math.min((genome.vmMaxInstructions||16),48);
    const n=Math.min((genome.userEffects||[]).length,MAX_USER_EFFECTS);
    for(let i=0;i<N;i++){
      if(!pProg[i])continue;
      const k=pProg[i].filter(x=>x[0]===236).length;
      if(!palive[i]&&k>0)deadTouched++;
      if(k>1)multi++;
      if(pProg[i].length>cap)overCap++;
      for(const ins of pProg[i]) if(ins[0]===236&&(Math.abs(ins[2])%n)>=n)badDst++;
      for(const ins of pProg[i]) if(ins[0]===236&&(ins[2]<0||ins[2]>=n))badDst++;
    }
    return {total:c.n,progs:c.progs,multi,overCap,badDst,deadTouched,cap,bank:n};
  });

  // 1 — END TO END. Do verbs now actually fire?
  out.fires=run('fires',()=>{
    const b=__liveness['verb.fire']|0, bw=__liveness['verb.wire']|0;
    for(let s=0;s<1500;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    return {fired:(__liveness['verb.fire']|0)-b, wired:(__liveness['verb.wire']|0)-bw,
            conserved:(__liveness['verb.conserved']|0)};
  });

  // 5 — empty bank
  out.empty=run('empty',()=>{
    const keep=genome.userEffects;
    for(let i=0;i<N;i++) if(pProg[i]) pProg[i]=pProg[i].filter(x=>x[0]!==236);
    genome.userEffects=[];
    for(let c=0;c<200;c++) wireEffectCallSites();
    const c=count236();
    genome.userEffects=keep;
    return c;
  });
  out.declared=('verb.wire' in __liveness);
  return out;
};`,'/tmp/wire.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };
const B=r.before||{}, W=r.wire||{}, F=r.fires||{}, E=r.empty||{};

ck('the universe carries authored verbs at all', r.bank>0, r.bank+' verbs in the bank');
ck('with EFFECT_EMIT stripped, no living program reaches a verb', B.n===0,
   B.n+' EFFECT_EMIT across '+B.progs+' living programs (the field\'s measured starting state)');
ck('#179 wires EFFECT_EMIT into living programs', W.total>0,
   W.total+' call sites across '+W.progs+' living programs');
ck('and never more than one per program', W.multi===0, W.multi+' programs with 2+');
ck('the evolved program cap is respected', W.overCap===0,
   W.overCap+' programs longer than vmMaxInstructions ('+W.cap+')');
ck('dst always names a verb that EXISTS (#133b)', W.badDst===0,
   W.badDst+' instructions indexing outside a bank of '+W.bank);
ck('dead particles are not wired', W.deadTouched===0, W.deadTouched+' dead particles touched');
ck('an empty verb bank wires nothing', E.n===0, E.n+' call sites with no verbs to reach');
ck('the mechanism is declared to the liveness census', r.declared===true);
ck('END TO END: verbs actually FIRE now', F.fired>0,
   F.fired+' verb fires in 1500 ticks ('+F.wired+' new call sites wired in the same window)');
ck('and conserved transfers happen among them', F.conserved>0, F.conserved+' conserved fires');
ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
