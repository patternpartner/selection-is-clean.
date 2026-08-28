// #143 acceptance test — the rare paths, driven rather than waited for.
//
// #142 was a ReferenceError on a line that ran only when an atom was authored: about five times in
// 6,000 ticks. Thirty rigs missed it, and noerror-test.js proved why — a 3,000-tick run of the BUGGY
// build still came back green, because no birth happened to land in the window. Rarity is not safety;
// it is only a longer wait for the same failure, and meanwhile the code sits there unexecuted.
//
// The liveness census already names which paths are rare or never seen. This rig takes that list and
// DRIVES them: it constructs the preconditions each one needs and invokes it directly, asserting that
// nothing throws and that the invariants that matter still hold. Every mechanism here has been read
// far more often than it has been run.
// Exits non-zero on any failure.   node rarepath-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/rare.js'); m.filename='/tmp/rare.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  for(let s=0;s<400;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={errors:[]};
  const mk=(x,uses,age)=>({expression:x,compiled:null,failed:false,uses,age,state:0,
                           alienHits:0,alienAttempts:0,creditTrace:0});
  const run=(name,fn)=>{ try{ return fn(); }
    catch(e){ out.errors.push(name+': '+((e&&e.message)||String(e)).slice(0,100)); return null; } };

  // ── ATOM CULL. Never fires in any measured run, which means #137's boundOpcodes remap inside it
  //    had never once executed. Bound slots are deliberately out of order, so an index shift cannot
  //    look correct by accident: slot0->A2, slot1->A1 (doomed), slot2->A0.
  // Bound slots deliberately out of order, so an index shift cannot look correct by accident.
  // The invariant is stated WITHOUT presuming which atom dies: the drift pass runs before the cull
  // and a redraw resets 'uses' to 0, so any atom in the bank can become the cullable one. An earlier
  // version of this check hard-coded "A1 is the doomed one" and failed for that reason alone — the
  // engine was right and the test was wrong, which is the whole failure mode this file exists to
  // catch, turned on itself.
  let culled=0, remapOK=null;
  run('atom.cull',()=>{
    const before=(__liveness['atom.cull']|0);
    for(let i=0;i<4000 && (__liveness['atom.cull']|0)===before;i++){
      genome.userAtoms=[mk('A0',9,999),mk('A1',0,999),mk('A2',7,999)];
      genome.boundOpcodes=[2,1,0];
      // snapshot what each slot NAMES, by object identity
      const wasNamed=genome.boundOpcodes.map(bi=>bi>=0?genome.userAtoms[bi]:null);
      genome.mutationRate=0.9;
      mutateGenome();
      if((__liveness['atom.cull']|0)>before){
        culled=1;
        const bos=genome.boundOpcodes, uas=genome.userAtoms;
        remapOK=true;
        for(let k=0;k<wasNamed.length;k++){
          const want=wasNamed[k]; if(!want)continue;
          const bi=(bos[k]===undefined)?-1:(bos[k]|0);
          const now=bi<0?null:uas[bi];
          // either that atom survived and this slot still names IT, or it died and the slot is inert
          const survived=uas.indexOf(want)>=0;
          if(survived ? now!==want : bi!==-1) remapOK=false;
        }
      }
    }
  });
  out.cullRuns=culled===1; out.cullRemapHolds=remapOK===true;

  // ── EXPRESSION RECOMBINATION. Fires twice in 25,000 ticks. Needs two atoms with real credit.
  run('expr.recombine',()=>{
    const before=(__liveness['expr.recombine']|0);
    for(let i=0;i<3000 && (__liveness['expr.recombine']|0)===before;i++){
      genome.userAtoms=[mk('c+1',80,50),mk('d*2',70,50)];
      genome.userAtoms[0].creditTrace=0.9; genome.userAtoms[1].creditTrace=0.8;
      genome.boundOpcodes=[0,1]; genome.atomRecombRate=0.9; genome.mutationRate=0.9;
      mutateGenome();
    }
    out.recombRuns=(__liveness['expr.recombine']|0)>before;
    // whatever it produced must still be compilable, not a broken string
    out.recombProducesValidAtoms=(genome.userAtoms||[]).every(a=>{
      const p={expression:a.expression,compiled:null,failed:false,uses:0,state:0};
      const v=uaCall(p,1,1); return isFinite(v); });
  });

  // ── PROGRAM CROSSOVER with degenerate inputs (empty, single-instruction, over-cap).
  run('prog.crossover',()=>{
    const A=[[0,0,0,0],[1,1,1,0.5],[2,2,2,-0.5]], B=[[3,3,3,0.1],[4,4,4,0.2]];
    const r1=crossoverProg(A,B,16), r2=crossoverProg([],B,16),
          r3=crossoverProg(A,[],16), r4=crossoverProg(A,B,1);
    // A degenerate parent returns progA UNCHANGED by design ("no crossover to do"), so an empty in
    // means an empty out and that is correct — the assertion is that nothing throws, every returned
    // instruction is well formed, and a real crossover respects the cap.
    const wellFormed=r=>Array.isArray(r)&&r.every(i=>Array.isArray(i)&&i.length>=4&&i.every(v=>isFinite(v)));
    out.crossoverSafe=[r1,r2,r3,r4].every(wellFormed) && r1.length>=1
                   && r4.length<=1 && r2.length===0 && r3.length===A.length;
  });

  // ── HORIZONTAL TRANSFER into a recipient that carries nothing at all.
  // Real genomes, not fabricated literals. attemptMemeTransfer reads fields well beyond the three
  // an obvious stub would carry, so a hand-rolled recipient throws for reasons that say nothing about
  // the engine — the first version of this check did exactly that and blamed the wrong party.
  run('meme.transfer',()=>{
    const donor=cloneGenome(genome), recv=cloneGenome(genome);
    donor.userAtoms=[mk('c+1',50,10)]; donor.boundOpcodes=[0];
    recv.userAtoms=[]; recv.boundOpcodes=[];          // a recipient carrying nothing at all
    attemptMemeTransfer(recv,donor);
    out.memeTransferSafe=Array.isArray(recv.userAtoms)&&Array.isArray(recv.boundOpcodes)
      && recv.boundOpcodes.every(i=>i===-1||(i>=0&&i<recv.userAtoms.length));
  });

  // ── DIMENSION GROWTH — rare (2 in 25,000 ticks) and it resizes typed arrays under a live world.
  run('dims.grow',()=>{
    const d0=DIMS;
    if(typeof setDims==='function' && DIMS<DIMS_MAX) setDims(DIMS+1);
    out.dimsGrowSafe = DIMS>=d0 && tend.length>=N*DIMS
      && (()=>{ for(let s=0;s<40;s++){ globalThis.__detMs+=5; loop(); } return true; })();
  });

  // ── SEEDING into a population, with a germline verb that is both composed and sense-gated.
  run('seed',()=>{
    genome.userAtoms=[mk('c+1',5,10)]; genome.boundOpcodes=[0];
    genome.userEffects=[{t:1,m:0,s:0.5,nx:1,ax:0,uses:0,creditTrace:0},
                        {t:2,m:1,s:0.4,nx:-1,ax:-1,uses:0,creditTrace:0}];
    seedEffectIntoParticle(0); seedAtomIntoParticle(0);
    let ok=true;
    for(let i=0;i<N;i++){ const g=pGenome[i]; if(!g)continue;
      const bos=g.boundOpcodes||[], uas=g.userAtoms||[];
      if(!bos.every(x=>x===-1||(x>=0&&x<uas.length)))ok=false;
      for(const e of (g.userEffects||[])){
        const ax=(e.ax===undefined||e.ax===null)?-1:(e.ax|0);
        if(ax>=0&&ax>=bos.length)ok=false;                    // a gate must never dangle
        const nx=(e.nx===undefined)?-1:(e.nx|0);
        if(nx>=0&&nx>=(g.userEffects||[]).length)ok=false;    // nor a successor
      } }
    out.seedingLeavesValidIndices=ok;
  });

  out.noThrows=out.errors.length===0;
  return out;
};`, m.filename);

const r=globalThis.__t();
const checks=[
  ['noThrows','no rare path throws when driven'],
  ['cullRuns','the atom cull can be made to fire at all'],
  ['cullRemapHolds','after a cull, every bound opcode still names its own atom'],
  ['recombRuns','expression recombination can be made to fire'],
  ['recombProducesValidAtoms','a recombined expression still compiles and evaluates'],
  ['crossoverSafe','program crossover survives empty and over-cap inputs'],
  ['memeTransferSafe','transfer into an empty recipient leaves valid indices'],
  ['dimsGrowSafe','growing a dimension keeps the world runnable'],
  ['seedingLeavesValidIndices','seeding never leaves a dangling successor or gate'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(28)+d); }
for(const e of r.errors) console.log('    threw: '+e);
console.log(bad? '\n'+bad+' FAILED' : '\nthe rare paths run, and hold their invariants when they do');
process.exit(bad?1:0);
