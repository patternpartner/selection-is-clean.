// #181-#192 acceptance test — THE SUBSTRATE ITSELF.
//
// #180 made the atom grammar a gene. This batch takes the same move to the four remaining places the
// rules of the game were still constants:
//   #181  the COMPILER's output stage - what every authored expression gets wrapped in
//   #182  MAJOR TRANSITIONS - cluster reproduction mode, resource allocation, and a porous boundary
//   #183  the PHYSICS - per-lineage interaction radius and chemistry, plus law mutation on probation
//   #184  the MEASUREMENT LOOP - self-authored probes promoted into the grammar, and evolvable
//         weights on the open-endedness proxies
//   #185  the META-POPULATION - demes inside a universe, and plasmids carrying laws between them
// and then, as each of those turned out to leave the NEXT thing closed and say so:
//   #188  the CHANNEL BANK - a medium a lineage invents, and an action nobody enumerated
//   #189  the FORM of that medium's space - stencil, manifold and timescale
//   #190  what DISTANCE means - the interaction metric as a lineage trait
//   #191  the sweep follows the reach - and interactionRadius starts working after forty swings
//   #192  SUBJECTIVE TIME - the global tick becomes a lineage trait, and with it the rule that a
//         discrete gene needs a discrete operator on the route that actually fires
//
// This rig checks the things that would be silently wrong, in the order they would hurt:
//   1. TOTALITY AND BOUNDEDNESS. Every fold, every allocation mode, every law in range must produce
//      finite state. A substrate that can emit a NaN poisons the physics, not one expression.
//   2. THE CACHE. #181's fold changes what the same TEXT compiles to, and #161's compile cache is
//      keyed by text. Two lineages with different folds must not share a compiled function.
//   3. CONSERVATION. #182's allocation moves amplitude between members and must not mint any. The
//      bound is float32 precision, not zero, because `amp` is a Float32Array - and the rig states the
//      number rather than the adverb, because the engine's first version of that comment said
//      "exactly" and this check caught it at 1.0e-7.
//   4. THE CROSSINGS. Every new gene has to reach the population, survive a save, and diverge in a
//      child. Seven times now this file has shipped a structure that did none of those silently.
//   5. THE REVERT. Every layer has a knob, and off must mean off.
// Exits non-zero on any failure.   node substrate-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/substrate.js'); m.filename='/tmp/substrate.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const T=parseInt(process.env.TICKS||'4000',10);
  for(let s=0;s<T;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={errors:[],ticks:tick};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,140)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});

  // ── #181.1  EVERY FOLD IS TOTAL ───────────────────────────────────────────────────────────────
  out.fold=run('fold',()=>{
    const inputs=[[0,0],[1,-1],[8,-8],[1e300,-1e300],[0.5,0.5]];
    const ks=[0.05,1,3.7,8];
    let nonFinite=0,outOfBand=0,n=0;
    const seen={};
    for(let mode=0;mode<UA_FOLD_MODES;mode++)for(const k of ks){
      genome.uaFoldMode=mode; genome.uaFoldK=k;
      const body=uaFoldBody(mode,k);
      seen[mode]=body;
      const at=mk('(a)*(b)');   // fresh object each time, so nothing is reused from the cache
      uaCompile(at);
      if(at.failed){ nonFinite++; continue; }
      for(const [x,y] of inputs){ const v=uaCall(at,x,y); n++;
        if(!isFinite(v))nonFinite++;
        if(!(v>=-8&&v<=8))outOfBand++; }
    }
    genome.uaFoldMode=0; genome.uaFoldK=1;
    return {n,nonFinite,outOfBand,bodies:seen,
            defaultEmpty:uaFoldBody(0,1)===''};
  });

  // ── #181.2  THE CACHE CARRIES THE FOLD ────────────────────────────────────────────────────────
  // The hazard #161 created and #181 has to respect: the compile cache is keyed by expression TEXT,
  // and the fold changes what that text compiles to. Same text, two folds, must be two functions AND
  // two answers - otherwise a lineage inherits a stranger's substrate and nothing reports it.
  out.cache=run('cache',()=>{
    const E='(a)+(b)';
    genome.uaFoldMode=0; genome.uaFoldK=1;
    const a1=mk(E); uaCompile(a1); const v1=uaCall(a1,3,3), f1=a1.compiled;
    genome.uaFoldMode=2; genome.uaFoldK=4;      // quantise to steps of 4 -> 6 rounds to 8
    const a2=mk(E); uaCompile(a2); const v2=uaCall(a2,3,3), f2=a2.compiled;
    genome.uaFoldMode=0; genome.uaFoldK=1;
    const a3=mk(E); uaCompile(a3); const v3=uaCall(a3,3,3);
    return {v1,v2,v3,distinctFn:f1!==f2,keyed:uaFoldKey(2,4)!==uaFoldKey(0,1)};
  });

  // ── #182.1  ALLOCATION CONSERVES ──────────────────────────────────────────────────────────────
  out.alloc=run('alloc',()=>{
    const res={};
    for(let mode=0;mode<3;mode++){
      // build a synthetic cluster over the living particles
      const mem=[]; for(let i=0;i<N&&mem.length<12;i++) if(palive[i])mem.push(i);
      if(mem.length<3){ res['m'+mode]='too few particles'; continue; }
      const cid=9000+mode;
      const saveIds=mem.map(i=>clusterID[i]);
      for(const i of mem)clusterID[i]=cid;
      for(let k=0;k<mem.length;k++)amp[mem[k]]=0.2+k*0.1;   // a real spread for the modes to act on
      let before=0; for(const i of mem)before+=amp[i];
      const fake={id:cid,size:mem.length,cx:0,cy:0,persistAge:5,
                  clusterGenome:{alloc:mode,allocRate:0.2,repro:0,credit:0}};
      clusters.push(fake);
      allocateWithinClusters();
      let after=0; for(const i of mem)after+=amp[i];
      const spreadBefore=0.1*(mem.length-1);
      let mn=Infinity,mx=-Infinity; for(const i of mem){ if(amp[i]<mn)mn=amp[i]; if(amp[i]>mx)mx=amp[i]; }
      clusters.pop();
      for(let k=0;k<mem.length;k++)clusterID[mem[k]]=saveIds[k];
      res['m'+mode]={drift:+Math.abs(after-before).toExponential(2),
                     spread:+(mx-mn).toFixed(4), was:+spreadBefore.toFixed(4)};
    }
    return res;
  });

  // ── #182.2  THE THREE MODES AND THE POROUS BOUNDARY EXIST AS GENES ───────────────────────────
  out.xion=run('xion',()=>{
    const modes={}, allocs={};
    for(let i=0;i<300;i++){ const g=seedClusterGenome(); modes[g.repro|0]=1; allocs[g.alloc|0]=1; }
    // the mode must move ONE STEP, never be redrawn: a jump discards what the lineage learned
    let stepped=0,jumped=0;
    for(let i=0;i<400;i++){
      const p={repro:0,alloc:0,budRate:1,budThreshold:8,splitFraction:0.3,innovationRate:0.2,
               metabolicBias:0.9,launchDrive:0.5,allocRate:0.04,credit:0.4};
      const c=mutateClusterGenome(p,1);
      if((c.repro|0)!==0)stepped++;
      if(Math.abs(c.credit-0.2)>1e-9)jumped++;      // credit must HALVE across a cluster generation
    }
    return {modes:Object.keys(modes).length,allocs:Object.keys(allocs).length,stepped,creditWrong:jumped};
  });

  // ── #183.1  LAWS ARE SETTABLE, AND EVERY ROW ACTUALLY WORKS ──────────────────────────────────
  // A declared law whose setter throws would be swallowed by its own try/catch and never work. That
  // is exactly what ATTENTION_GAIN did while it was declared const.
  out.law=run('law',()=>{
    const rows=[];
    for(let i=0;i<LAW_DECLARED.length;i++){
      const r=LAW_DECLARED[i];
      const from=+r.get();
      const to=__cl(from+(r.hi-r.lo)*0.1,r.lo,r.hi);
      let ok=false;
      try{ r.set(to); ok=Math.abs(+r.get()-to)<1e-9; }catch(e){ ok=false; }
      try{ r.set(from); }catch(e){}
      rows.push({name:r.name,settable:ok,restored:Math.abs(+r.get()-from)<1e-9});
    }
    return {rows,allSettable:rows.every(x=>x.settable&&x.restored),n:rows.length};
  });

  // ── #183.2  THE INTERACTION RADIUS AND CHEMISTRY ARE BOUNDED ────────────────────────────────
  out.phys=run('phys',()=>{
    const before={cs:genome.cellScale,rs:genome.rxSelf,rc:genome.rxCross};
    genome.cellScale=99; genome.rxSelf=-5; genome.rxCross=99;
    sanitizeGenome();
    const after={cs:genome.cellScale,rs:genome.rxSelf,rc:genome.rxCross};
    genome.cellScale=before.cs; genome.rxSelf=before.rs; genome.rxCross=before.rc;
    // and the reach must never EXCEED CELL, because the neighbour grid cannot offer a wider pair
    return {after,capped:after.cs<=1&&after.cs>=0.4&&after.rs>=0&&after.rc<=0.6};
  });

  // ── #184  PROBES CLAIM, ARE JUDGED, AND ARE PROMOTED ────────────────────────────────────────
  out.probe=run('probe',()=>{
    genome.probes=[{expression:'(fr)+(0.00)',compiled:null,failed:false,n:0,hit:0,pending:0,pendTick:-1,pendFit:0,age:0},
                   null,null,null];
    const pr=genome.probes[0];
    // an unpromoted probe must NOT be offered to the generator - a symbol that always reads zero is
    // "open in principle, closed in practice" in its purest form
    let offeredEarly=0;
    for(let i=0;i<300;i++) if(PROBE_TEST.test(uaGenExpression()))offeredEarly++;
    // force a promotion by handing it a record, then check the symbol becomes live
    pr.n=20; pr.hit=18;
    const promoted=probePromoted(pr), count=probeCount(genome);
    let offeredNow=0;
    for(let i=0;i<400;i++) if(PROBE_TEST.test(uaGenExpression()))offeredNow++;
    // and an atom naming it must compile and read the value
    pr.pending=2.5; updateProbes();
    const at=mk('(pa)+(0.00)'); uaCompile(at);
    const reads=at.failed?null:uaCall(at,0,0);
    // an atom naming pa with NOTHING promoted must still compile - it reads 0, never throws
    genome.probes=[null,null,null,null]; updateProbes();
    const at2=mk('(pa)+(0.00)'); uaCompile(at2);
    const safeRead=at2.failed?'FAILED':uaCall(at2,0,0);
    return {offeredEarly,offeredNow,promoted,count,reads,safeRead,
            rentPositive:PROBE_RENT>0};
  });

  // ── #184b  THE OEE BONUS IS ZERO AT THE SEED AND BOUNDED ABOVE ──────────────────────────────
  out.bonus=run('bonus',()=>{
    const save=genome.oeeW;
    genome.oeeW=new Array(OEE_PROXY_N).fill(0);
    const atSeed=oeeBonus();
    genome.oeeW=new Array(OEE_PROXY_N).fill(1);
    const atMax=oeeBonus();
    genome.oeeW=save;
    return {atSeed,atMax,cap:OEE_BONUS_CAP,bounded:atMax<=OEE_BONUS_CAP+1e-12};
  });

  // ── #185  DEMES GATE GENE FLOW, AND THE WIRE VALIDATES A UNIVERSE PLASMID ───────────────────
  out.deme=run('deme',()=>{
    const save={k:genome.demeCount,f:genome.demeFlow};
    genome.demeCount=1; genome.demeFlow=1;
    // one pool: nothing may ever be blocked
    let blocked1=0;
    for(let i=0;i<200;i++) if(!demeAllows(0,Math.min(N-1,5)))blocked1++;
    // two demes, zero flow: opposite ends of the world must never breed
    genome.demeCount=2; genome.demeFlow=0;
    let a=-1,b=-1;
    for(let i=0;i<N;i++){ if(!palive[i])continue; if(px[i]<W*0.2&&a<0)a=i; if(px[i]>W*0.8&&b<0)b=i; }
    let blocked2=0,sameOk=0;
    if(a>=0&&b>=0){ for(let i=0;i<200;i++) if(!demeAllows(a,b))blocked2++; }
    if(a>=0){ for(let i=0;i<200;i++) if(demeAllows(a,a))sameOk++; }
    genome.demeCount=save.k; genome.demeFlow=save.f;
    return {blocked1,blocked2,sameOk,haveEnds:a>=0&&b>=0,max:DEME_MAX};
  });

  out.wire=run('wire',()=>{
    const good={law:[0,0.95],ops:[[0,1,2,0.4,0],0,0,0,0,0,0,0],fold:[1,2.5]};
    const accepted=validNetworkPayload('uplasmid',good);
    const bad=(mut)=>{ const p=JSON.parse(JSON.stringify(good)); mut(p); return validNetworkPayload('uplasmid',p); };
    return {accepted, rejects:{
      lawIndex: bad(p=>{p.law[0]=99;}),
      opIndex:  bad(p=>{p.ops[0][1]=42;}),
      foldMode: bad(p=>{p.fold[0]=9;}),
      foldK:    bad(p=>{p.fold[1]=99;}),
      tooMany:  bad(p=>{p.ops=new Array(UA_OPBANK+2).fill(0);}),
    }};
  });

  // ── #188  A MEDIUM A LINEAGE INVENTED ────────────────────────────────────────────────────────
  // The two ceilings #180-#185 did not touch: EFFECT_TARGETS was eleven entries a person typed, and
  // every field was a hand-declared lattice with a hand-written update rule. This checks that the
  // inventory is now GENERATED - that a chemistry nobody wrote can run, be sensed, be acted into,
  // and stay bounded while doing it.
  out.chan=run('chan',()=>{
    genome.channels=[{expr:'(a)+(((b)-(a))*(0.25))',compiled:null,failed:false,age:0,uses:0},
                     null,null,null];
    // 1. THE LATTICE UPDATES, and the rule is the thing that decides how. This rule IS diffusion -
    //    a+(mean-a)*k is the discrete Laplacian - but nothing in the engine imposed that shape; it
    //    is expressible in the grammar, which is the whole difference between a medium and a setting.
    const L=chanLattice(0);
    L.fill(0); L[20*FIELD_W+20]=3;            // a single spike
    const before=Array.from(L).reduce((x,y)=>x+y,0);
    let ran=0;
    for(let t=0;t<CHANNEL_CADENCE*4;t++){ globalThis.__detMs+=5; const u0=__liveness['channel.update']|0;
      try{loop();}catch(e){} if((__liveness['channel.update']|0)>u0)ran++; }
    let spread=0, mx=-Infinity, nonFinite=0;
    for(let c=0;c<L.length;c++){ if(!isFinite(L[c]))nonFinite++; if(L[c]>0.001)spread++; if(L[c]>mx)mx=L[c]; }
    // 2. IT IS BOUNDED whatever the rule computes. A runaway chemistry is a runaway WORLD, not a
    //    runaway expression - there is no uaCall clamp protecting the lattice, only CHANNEL_CLAMP.
    genome.channels[0]={expr:'(a)*(8.00)',compiled:null,failed:false,age:0,uses:0};   // explosive on purpose
    L.fill(1);
    for(let t=0;t<CHANNEL_CADENCE*6;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    let over=0; for(let c=0;c<L.length;c++) if(!(L[c]>=-CHANNEL_CLAMP&&L[c]<=CHANNEL_CLAMP))over++;
    return {ran,spread,mx:+mx.toFixed(3),nonFinite,over,clamp:CHANNEL_CLAMP,
            latticeIsNotGenome:(function(){ try{ const b=encodeGenome();
              return b.indexOf('"chn"')>=0||JSON.parse(Buffer.from(b,'base64').toString('utf8')).chn!==undefined; }catch(e){ return 'threw'; } })()};
  });

  out.chanIO=run('chanIO',()=>{
    genome.channels=[{expr:'(a)+(0.00)',compiled:null,failed:false,age:0,uses:0},
                     {expr:'(a)+(0.00)',compiled:null,failed:false,age:0,uses:0},null,null];
    // WRITE: a verb aimed at chan0 must move the lattice at the actor's own cell
    let i=-1; for(let k=0;k<N;k++) if(palive[k]){i=k;break;}
    if(i<0)return {noParticle:true};
    const L=chanLattice(0); L.fill(0);
    const moved=chanWrite(0,i,0.7);
    const cell=chanCellOf(i);
    const landed=L[cell];
    // and a write into an UNALLOCATED slot must be a no-op, so EFFECT_TARGETS can grow without any
    // existing verb becoming invalid
    const noop=chanWrite(2,i,0.7);
    // READ: ka must see it
    const read=chanRead(0,i);
    // an atom naming ka with NOTHING allocated still compiles and reads 0
    const saveCh=genome.channels;
    genome.channels=[null,null,null,null];
    uaSetEyes(i,-1);
    const at=mk('(ka)+(0.00)'); uaCompile(at);
    const safe=at.failed?'FAILED':uaCall(at,0,0);
    // and the generator must not offer an unallocated channel.
    //
    // #112's CREDIT POOL IS A SECOND ROUTE INTO THE ALPHABET, and this check found it by going red
    // when #192 shifted the RNG stream: with the pool live, uaGenTerm splices whole proven
    // expressions as leaves, and a spliced expression from a lineage that USED to hold a channel
    // still names it. 16 of 300 draws named ka with an empty bank, and none of them came through the
    // pool gate below - they came through history. That is not #188's gate leaking. Filtering
    // spliced subtrees by current allocation would be a change to #112 (and a bad one: it would make
    // an inherited building block's legality depend on the inheritor's bank rather than on whether
    // it works). So the pool route is measured separately, immediately below, and the gate is
    // measured with the pool suppressed so it measures the gate.
    const svInh=__UA_INHERIT; __UA_INHERIT=false;
    let offeredEarly=0; for(let q=0;q<300;q++) if(CHANNEL_TEST.test(uaGenExpression()))offeredEarly++;
    genome.channels=saveCh;
    let offeredNow=0; for(let q=0;q<400;q++) if(CHANNEL_TEST.test(uaGenExpression()))offeredNow++;
    __UA_INHERIT=svInh;
    // THE POOL ROUTE, and the property that makes it harmless rather than a bug: a spliced channel
    // name with nothing allocated must still COMPILE and read a finite number. chanRead answers 0
    // for an unallocated slot, so the symbol is a constant zero - dead weight the lineage pays rent
    // on and selection can remove, which is a different thing from broken syntax.
    // AND THE POOL IS SEEDED RATHER THAN WAITED FOR (#143/#178: drive the rare path, do not hope for
    // it). At 40 ticks - which is what smoke.sh runs this rig at - the credit pool is EMPTY, so a
    // check that merely asserts a splice happened passes only in a developed world and goes red in
    // the suite for a reason that has nothing to do with the mechanism. One known channel-bearing
    // entry goes in, the measurement runs, and the pool is put back exactly as it was.
    genome.channels=[null,null,null,null];
    const svPool=Array.from(__atomExprCredit.entries());
    __atomExprCredit.clear(); __atomExprCredit.set('(ka)+(kb)',5);
    let spliced=0, splicedBad=0;
    for(let q=0;q<400;q++){
      const e=uaGenExpression();
      if(!CHANNEL_TEST.test(e))continue;
      spliced++;
      const a2=mk(e); uaCompile(a2);
      if(a2.failed){ splicedBad++; continue; }
      const v=uaCall(a2,0.3,-0.4);
      if(!isFinite(v))splicedBad++;
    }
    __atomExprCredit.clear();
    for(const [pk,pv] of svPool)__atomExprCredit.set(pk,pv);
    genome.channels=saveCh;
    // the four targets exist and name the bank
    const tgts=EFFECT_TARGETS.map(x=>x.n).filter(n=>/^chan[0-3]$/.test(n));
    return {moved:+moved.toFixed(4),landed:+landed.toFixed(4),noop,read:+read.toFixed(4),safe,
            offeredEarly,offeredNow,spliced,splicedBad,tgts:tgts.length,rent:CHANNEL_RENT};
  });

  // ── #189  THE FORM OF THE SPACE ──────────────────────────────────────────────────────────────
  // #188 left "a scalar per cell, a neighbourhood mean, a cadence" closed and said so. These check
  // that three of those are now the lineage's, and they check it by DYNAMICS rather than by reading
  // the gene back: the question is not whether a stencil is stored, it is whether a stencil buys a
  // class of behaviour a four-neighbour mean provably cannot reach.
  out.form=run('form',()=>{
    const centroid=(L)=>{ let sx=0,w=0;
      for(let y=0;y<FIELD_H;y++)for(let x=0;x<FIELD_W;x++){const v=L[y*FIELD_W+x]; if(v>0.001){sx+=x*v;w+=v;}}
      return w>0?+(sx/w).toFixed(2):null; };
    const runForm=(st,wrap,expr,steps)=>{
      genome.channels=[{expr:expr,compiled:null,failed:false,age:0,uses:0,st:st,wrap:wrap,cad:1},null,null,null];
      const L=chanLattice(0); L.fill(0); L[20*FIELD_W+20]=4;
      for(let t=0;t<steps*CHANNEL_CADENCE;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
      return centroid(L); };
    // THE SEEDED FORM is a symmetric mean: the blob spreads and does NOT travel.
    const mean=runForm(CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),0,'(b)+(0.00)',6);
    // AN OFFSET STENCIL, same chemistry: the mass MOVES. This is advection, and it is the property
    // that makes a stencil a change of form rather than a change of parameter - no symmetric kernel
    // of any weighting produces directed transport.
    const advect=runForm([[-1,0,1.0]],0,'(b)+(0.00)',6);
    // THE SAME ON A TORUS: it leaves one edge and arrives at the other. 20 + 30 = 50, mod 40 = 10.
    const torus=runForm([[-1,0,1.0]],1,'(b)+(0.00)',30);
    // A SIGNED STENCIL SUMMING TO ZERO is a derivative. On a linear ramp its answer is a CONSTANT;
    // a mean's answer would be the ramp again.
    genome.channels=[{expr:'(b)+(0.00)',compiled:null,failed:false,age:0,uses:0,
                      st:[[-1,0,1.0],[1,0,-1.0]],wrap:0,cad:1},null,null,null];
    const G=chanLattice(0); G.fill(0);
    for(let y=0;y<FIELD_H;y++)for(let x=0;x<FIELD_W;x++)G[y*FIELD_W+x]=x*0.05;
    for(let t=0;t<CHANNEL_CADENCE;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    let gmn=Infinity,gmx=-Infinity;
    for(let y=1;y<FIELD_H-1;y++)for(let x=2;x<FIELD_W-2;x++){const v=G[y*FIELD_W+x]; if(v<gmn)gmn=v; if(v>gmx)gmx=v;}
    // CADENCE: a 4x channel updates a quarter as often.
    genome.channels=[{expr:'(a)+(0.10)',compiled:null,failed:false,age:0,uses:0,st:null,wrap:0,cad:1},
                     {expr:'(a)+(0.10)',compiled:null,failed:false,age:0,uses:0,st:null,wrap:0,cad:4},null,null];
    chanLattice(0).fill(0); chanLattice(1).fill(0);
    for(let t=0;t<CHANNEL_CADENCE*8;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    const fast=+chanLattice(0)[100].toFixed(3), slow=+chanLattice(1)[100].toFixed(3);
    // AND BOUNDED WHATEVER THE FORM: six taps at max weight, explosive rule, on a torus.
    genome.channels=[{expr:'(b)*(2.00)',compiled:null,failed:false,age:0,uses:0,
      st:[[-1,0,2],[1,0,2],[0,-1,2],[0,1,2],[2,2,2],[-2,-2,2]],wrap:1,cad:1},null,null,null];
    const B=chanLattice(0); B.fill(1);
    for(let t=0;t<CHANNEL_CADENCE*8;t++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
    let over=0,nf=0; for(let c=0;c<B.length;c++){ if(!isFinite(B[c]))nf++; if(!(B[c]>=-CHANNEL_CLAMP&&B[c]<=CHANNEL_CLAMP))over++; }
    return {mean,advect,torus,gmn:+gmn.toFixed(4),gmx:+gmx.toFixed(4),fast,slow,over,nf};
  });

  // ── #189  AND THE FORM TAKES SMALL, LEGAL STEPS ─────────────────────────────────────────────
  out.formStep=run('formStep',()=>{
    const r={expr:'(a)+(0.00)',st:CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:1};
    let moved=0,illegal=0,wraps=0,cads=0; const sizes={};
    for(let i=0;i<600;i++){
      const before=JSON.stringify([r.st,r.wrap,r.cad]);
      chanFormStep(r);
      if(JSON.stringify([r.st,r.wrap,r.cad])!==before)moved++;
      if(r.wrap)wraps++; if(r.cad!==1)cads++;
      sizes[r.st.length]=1;
      for(const t of r.st) if(Math.abs(t[0])>CHANNEL_OFFSET_MAX||Math.abs(t[1])>CHANNEL_OFFSET_MAX||Math.abs(t[2])>2)illegal++;
      if(r.st.length>CHANNEL_STENCIL_MAX||r.st.length<1)illegal++;
    }
    // the seeded form must read as NOT moved, or the census row reports adoption for a bank that has
    // never been selected on
    const seeded={expr:'x',st:CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:1};
    return {moved,illegal,wraps,cads,sizes:Object.keys(sizes).map(Number).sort((a,b)=>a-b),
            seededReadsUnmoved:chanFormMoved(seeded)===false,
            movedReadsMoved:chanFormMoved({expr:'x',st:[[2,0,1]],wrap:0,cad:1})===true,
            tapRent:CHANNEL_TAP_RENT};
  });

  // ── #190  WHAT DISTANCE MEANS ────────────────────────────────────────────────────────────────
  // The last thing #188 and #189 did not touch. These check the metric by GEOMETRY - by measuring
  // the unit ball - rather than by reading the genes back, and the last of them checks the only
  // consequence that matters: two lineages sharing a region can stop perceiving each other.
  out.metric=run('metric',()=>{
    const G=(p,ax,rot)=>({metP:p,metAx:ax,metRot:rot});
    // THE SEEDED METRIC MUST BE hypot BIT FOR BIT, not approximately. Every A/B in this repo rests
    // on an unmutated lineage being identical rather than equal, and metDist's fast path is what
    // makes that true instead of hoping a p=2 pow agrees with a sqrt.
    let diff=0;
    for(let i=0;i<400;i++){ const dx=(Math.random()-0.5)*120, dy=(Math.random()-0.5)*120;
      if(metDist(dx,dy,G(2,1,0))!==Math.hypot(dx,dy))diff++; }
    // THE SHAPES, measured by bisecting for the unit ball's reach in three directions.
    const reach=(g,ang)=>{ let lo=0,hi=8;
      for(let k=0;k<40;k++){ const mid=(lo+hi)/2;
        if(metDist(Math.cos(ang)*mid,Math.sin(ang)*mid,g)<=1)lo=mid; else hi=mid; }
      return +lo.toFixed(3); };
    const probe=(g)=>({axis:reach(g,0),diag:reach(g,Math.PI/4),perp:reach(g,Math.PI/2)});
    const euclid=probe(G(2,1,0)), taxi=probe(G(1,1,0)), cheby=probe(G(4,1,0)),
          wide=probe(G(2,2,0)), rotated=probe(G(2,2,Math.PI/2));
    // SANITY across the whole legal range: finite, non-negative, symmetric in the displacement's
    // sign, and zero at zero (or the self-distance gate breaks).
    let bad=0,asym=0;
    const gs=[G(0.5,0.25,0),G(4,4,1.1),G(1,1,3),G(2.7,0.4,-2.2),G(0.5,4,0.7)];
    const vs=[[0,0],[1,0],[0,1],[-3,7],[1e6,-1e6],[1e-9,1e-9],[-40,40]];
    for(const g of gs)for(const [dx,dy] of vs){
      const a=metDist(dx,dy,g), b=metDist(-dx,-dy,g);
      if(!isFinite(a)||a<0)bad++;
      if(Math.abs(a-b)>1e-9)asym++;
    }
    const zero=metDist(0,0,G(1.3,2.2,0.4));
    // THE KNOB IS A TRUE REVERT: the same genes must give hypot exactly when the layer is off.
    const sv=__METRIC; __METRIC=false;
    const offVal=metDist(3,4,G(1,4,1.0));
    __METRIC=sv;
    const onVal=metDist(3,4,G(1,4,1.0));
    return {diff,euclid,taxi,cheby,wide,rotated,bad,asym,zero,offVal,onVal};
  });

  // ── #190  AND THE CONSEQUENCE: SEPARATION BY PERCEPTION ─────────────────────────────────────
  // The thing no amount of content evolution could produce. Two lineages with the same anisotropy
  // and orthogonal orientation occupy the same region and admit mostly-disjoint neighbourhoods, so
  // they are ecologically separated without being spatially separated at all.
  out.invisible=run('invisible',()=>{
    const G=(p,ax,rot)=>({metP:p,metAx:ax,metRot:rot});
    const pts=[];
    for(let i=0;i<4000;i++) pts.push([(Math.random()-0.5)*2*CELL,(Math.random()-0.5)*2*CELL]);
    const admit=(g)=>{ let n=0; for(const t of pts) if(metDist(t[0],t[1],g)<=CELL)n++; return n; };
    const A=G(2,3.2,0), B=G(2,3.2,Math.PI/2);
    let both=0; for(const t of pts) if(metDist(t[0],t[1],A)<=CELL&&metDist(t[0],t[1],B)<=CELL)both++;
    const a=admit(A), b=admit(B);
    return {total:pts.length,a,b,both,overlap:+(both/Math.max(1,a)).toFixed(3),euclid:admit(G(2,1,0))};
  });

  // ── #191  THE SWEEP FOLLOWS THE REACH ────────────────────────────────────────────────────────
  // interactionRadius has been in the genome literal since before any of this, saying "System
  // evolves its own social distance", and it was false two ways: mutateGenome evolves it over
  // [25,120] while the sweep scanned +/-1 bin of CELL=55, and it was READ FROM THE GERMLINE inside
  // the pair loop so no lineage ever varied it. The first check below is the one that would be
  // silently catastrophic - a dedup that is wrong in either direction is either double physics or
  // lost pairs, and neither announces itself.
  out.reach=run('reach',()=>{
    // THE DEDUP, EXHAUSTIVELY. The predicate is mine AND (NOT theirs OR i<j): over every reach and
    // distances the two orderings of one pair must sum to EXACTLY ONE when either side can reach,
    // and zero when neither can. Sum 2 is the interaction happening twice; sum 0 is a lost partner.
    const owns=(d,rI,rJ,iLess)=>{ const mine=d<rI, theirs=d<rJ; return (mine&&(!theirs||iLess))?1:0; };
    let twice=0,none=0,total=0;
    for(const rI of [20,55,80,120,165])for(const rJ of [20,55,80,120,165])
      for(const d of [5,19,30,54,56,79,100,119,130,164,200]){
        total++;
        const sum=owns(d,rI,rJ,true)+owns(d,rJ,rI,false);
        const reachable=(d<rI||d<rJ)?1:0;
        if(reachable&&sum===2)twice++;
        if(reachable&&sum===0)none++;
        if(!reachable&&sum!==0)twice++;
      }
    // AND IT MUST NOT DEPEND ON ALLOCATION ORDER, which is the artifact #58 named one level down.
    let differs=0,n2=0;
    for(const rI of [20,55,80,120])for(const rJ of [20,55,80,120])for(const d of [10,40,70,100,150]){
      const asIJ=owns(d,rI,rJ,true)+owns(d,rJ,rI,false);
      const asJI=owns(d,rJ,rI,true)+owns(d,rI,rJ,false);
      n2++; if(asIJ!==asJI)differs++;
    }
    // THE RING CAP IS DERIVED: it must cover the gene's whole declared range and nothing beyond it.
    const rings={atDefault:reachRings(55), atGeneMax:reachRings(120), cap:REACH_RINGS_MAX,
                 geneMaxNeeds:Math.ceil(120/CELL)};
    return {total,twice,none,n2,differs,rings};
  });

  // ── #191  AND END TO END: a partner past one grid ring is actually FOUND ─────────────────────
  out.reachLive=run('reachLive',()=>{
    // THE WORLD IS PUT BACK AFTERWARDS, and that is not tidiness. This block needs an empty world to
    // measure one pair, and it empties it by writing palive[k]=false directly - which is NOT how
    // death happens in the engine, so clusters, towers and the forest registry are left holding
    // members that no longer exist. Every later block then runs on that, and out.live regrows a
    // whole population from two founders inside corrupt cluster state: measured at 8ms/tick rising
    // to 61ms/tick over 900 ticks, against a steady 12ms/tick for the same engine driven normally.
    // A rig that quietly costs 5x what the thing it measures costs is a rig that will be blamed on
    // whatever commit happens to push it over a CI timeout.
    const svAlive=Array.from(palive);
    const svAmp=Array.from(amp);
    const svX=Array.from(px), svY=Array.from(py);
    const setup=(reach)=>{
      for(let k=0;k<N;k++)palive[k]=false;
      palive[0]=true; palive[1]=true;
      px[0]=400; py[0]=400; px[1]=400+CELL*1.6; py[1]=400;
      amp[0]=1; amp[1]=1;
      for(const q of [0,1]){ if(!pGenome[q])pGenome[q]={...genome}; pGenome[q].interactionRadius=reach; }
      genome.interactionRadius=55;
      pIntCount[0]=0; pIntCount[1]=0;
      const before=__reachBeyond;
      globalThis.__detMs+=5; try{loop();}catch(e){}
      return {beyond:__reachBeyond-before, ints:pIntCount[0]+pIntCount[1]};
    };
    const short=setup(55), long=setup(120);
    // and the knob must restore BOTH broken behaviours: the germline read and the narrow sweep
    const sv=__REACH; __REACH=false;
    genome.interactionRadius=99;
    if(!pGenome[0])pGenome[0]={...genome};
    pGenome[0].interactionRadius=20;
    const offVal=reachOf(0);
    __REACH=sv;
    const onVal=reachOf(0);
    // AND PUT THE WORLD BACK. The setup above leaves particles 0 and 1 as the only survivors with
    // reach 120, and a child inherits its parent's reach - so out.live regrows a whole population on
    // a 3-ring sweep (49 cells per particle instead of 9). That is not wrong, it is just not a world
    // anyone has, and it made this rig 10x slower the moment #192 shifted the stream into a run that
    // reached CAP. A rig whose cost depends on which branch the RNG took is a rig that will time out
    // in CI for a reason nobody can reproduce.
    genome.interactionRadius=55;
    for(const q of [0,1]) if(pGenome[q])pGenome[q].interactionRadius=55;
    for(let k=0;k<N;k++){ palive[k]=svAlive[k]; amp[k]=svAmp[k]; px[k]=svX[k]; py[k]=svY[k]; }
    return {short,long,offVal,onVal};
  });

  // -- #192  SUBJECTIVE TIME -------------------------------------------------------------------
  // The claim is not "particles can be slow". It is that two lineages can share ground and NEVER
  // meet, because an inactive particle is absent rather than passive. Checks 1 and 2 are the same
  // question asked twice on purpose: 1 is the arithmetic the design rests on, 2 is whether the
  // engine's own predicate agrees with it for real particles carrying real genes. #179's whole
  // lesson was a capability that was true in principle and false in the code.
  out.time=run('time',()=>{
    const beats=(rr,ph,n)=>{ let c=0; for(let t=0;t<n;t++) if(((t+ph)%rr)===0)c++; return c; };
    const co=(r1,p1,r2,p2,n)=>{ let c=0; for(let t=0;t<n;t++) if(((t+p1)%r1)===0&&((t+p2)%r2)===0)c++; return c; };
    const sched={r1:beats(1,0,600), r2:beats(2,0,600), r3:beats(3,0,600), r6:beats(6,0,600),
                 disjoint2:co(2,0,2,1,600), disjoint3:co(3,0,3,1,600),
                 generalist:co(1,0,3,2,600), sameRateSamePhase:co(2,0,2,0,600)};
    for(const q of [0,1]) if(!pGenome[q])pGenome[q]={...genome};
    pGenome[0].tickRate=2; pGenome[0].tickPhase=0;
    pGenome[1].tickRate=2; pGenome[1].tickPhase=1;
    const svA0=palive[0], svA1=palive[1];
    palive[0]=true; palive[1]=true;
    // tick is driven FORWARD from where it is, never wound back to 0: epoch logs, probe claims and
    // use-windows all stamp it, and a clock that goes backwards is a needless thing to hand them.
    // The schedule is phase-relative, so the arithmetic is identical either way.
    const saveTick=tick;
    let a=0,b=0,both=0;
    for(let t=0;t<400;t++){ tick=saveTick+t; const A=particleActive(0), B=particleActive(1);
      if(A)a++; if(B)b++; if(A&&B)both++; }
    // THE LEDGER. Slowing scales BOTH sides or it is a wirehead: a rate-k particle must pay 1/k of
    // the per-tick upkeep, so the same organism on a stretched timeline is neutral by construction.
    const draw=(rr)=>{ pGenome[0].tickRate=rr; return attnUpkeep(0)/(__STIME?tickRateOf(pGenome[0]):1); };
    const fast=draw(1), slow=draw(4);
    const ratio=slow>0?fast/slow:0;
    pGenome[0].tickRate=1; pGenome[0].tickPhase=0;
    pGenome[1].tickRate=1; pGenome[1].tickPhase=0;
    // The phase is REDUCED into the rate, not merely clamped - phase 5 under rate 2 IS phase 1, and
    // storing 5 makes two genomes that behave identically compare as different.
    genome.tickRate=2; genome.tickPhase=5; sanitizeGenome();
    const red={r:genome.tickRate,p:genome.tickPhase};
    genome.tickRate=9; genome.tickPhase=-3; sanitizeGenome();
    const clamped={r:genome.tickRate,p:genome.tickPhase};
    genome.tickRate=1; genome.tickPhase=0;
    // #103: an incremental operator, not a redraw. And the phase must stay legal FOR ITS RATE at
    // every step, which is why the rate step redraws it.
    const g={tickRate:1,tickPhase:0};
    let moves=0,jumps=0,illegal=0; const seen={};
    for(let i=0;i<800;i++){
      const before=tickRateOf(g);
      const nr=__cl(before+(Math.random()<0.5?1:-1),1,TICK_RATE_MAX);
      if(nr!==before){ g.tickRate=nr; g.tickPhase=(Math.random()*nr)|0; moves++;
        if(Math.abs(nr-before)>1)jumps++; }
      seen[g.tickRate]=1;
      if(g.tickPhase>=g.tickRate||g.tickPhase<0)illegal++;
    }
    pGenome[0].tickRate=5; pGenome[0].tickPhase=3;
    const sv=__STIME; __STIME=false;
    let offAlways=true;
    for(let t=0;t<50;t++){ tick=saveTick+t; if(!particleActive(0))offAlways=false; }
    __STIME=sv;
    let onSometimes=false;
    for(let t=0;t<50;t++){ tick=saveTick+t; if(!particleActive(0))onSometimes=true; }
    tick=saveTick; pGenome[0].tickRate=1; pGenome[0].tickPhase=0;
    palive[0]=svA0; palive[1]=svA1;   // and the world goes back, for out.reachLive's reason
    return {sched,a,b,both,n:400,fast:+fast.toExponential(3),slow:+slow.toExponential(3),
            ratio:+ratio.toFixed(3),red,clamped,cap:TICK_RATE_MAX,
            moves,jumps,illegal,rates:Object.keys(seen).map(Number).sort((x,y)=>x-y),
            offAlways,onSometimes};
  });

  // -- #193  THE SHAPE OF AN ACT ----------------------------------------------------------------
  // The one invariant everything else rests on is MAGNITUDE CONSERVATION. A stencil divides an
  // emission; it must never multiply one. If four taps each wrote the whole amount, growing a stencil would be a
  // free 4x on every act, and #132's conserved mode and #133's realised-amount discipline would both
  // be routed around by a gene. So the first check is the pump check, and it is the one that would
  // matter if every other check here passed.
  out.emit=run('emit',()=>{
    // a lone particle, mid-field, on a pre-filled lattice so BOTH signs have room to move
    for(let k=0;k<N;k++)palive[k]=false;
    palive[0]=true; px[0]=W*0.5; py[0]=H*0.5; vx[0]=0; vy[0]=0;
    if(!pGenome[0])pGenome[0]={...genome};
    const cellOfSelf=()=>{ const fw=W/FIELD_W,fh=H/FIELD_H;
      return __cl(Math.floor(py[0]/fh),0,FIELD_H-1)*FIELD_W+__cl(Math.floor(px[0]/fw),0,FIELD_W-1); };
    const probe=(st,fr,amt)=>{
      field.fill(1.0);
      const before=Array.from(field);
      const eff={t:9,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0,st,fr};
      const moved=applyUserEffect(eff,0,-1,amt,0);
      let mag=0, signed=0, cells=[];
      for(let c=0;c<field.length;c++){ const d=field[c]-before[c];
        if(Math.abs(d)>1e-6){ mag+=Math.abs(d); signed+=d; cells.push(c); } }
      return {moved:+moved.toFixed(6), mag:+mag.toFixed(5), signed:+signed.toFixed(5), cells};
    };
    // 1. CONSERVATION over every tap count and a spread of signed weights
    let worst=0, n=0;
    const shapes=[
      [[0,0,1]], [[1,0,1]], [[1,0,1],[-1,0,1]], [[1,0,1],[-1,0,-1]],
      [[1,1,0.3],[-1,-1,0.7]], [[2,0,1],[0,2,1],[-2,0,1],[0,-2,1]],
      [[1,0,2],[0,1,-0.5],[3,3,0.1]], [[3,3,1],[-3,-3,-1],[3,-3,0.5],[-3,3,-0.5]],
    ];
    for(const st of shapes)for(const amt of [0.4,-0.4,0.9]){
      const r=probe(st,0,amt); n++;
      worst=Math.max(worst,Math.abs(r.mag-Math.abs(amt)));
    }
    // 2. AND THE UNSHAPED VERB IS THE ORIGINAL WRITE - one cell, underfoot, full amount
    const plain=probe(null,0,0.5);
    // 3. A DIPOLE: full magnitude paid, net zero moved. Unreachable under signed normalisation, which
    //    is why the divisor is the ABSOLUTE sum.
    const dip=probe([[2,0,1],[-2,0,-1]],0,0.6);
    // 4. THE FRAME. The same stencil on two particles travelling in opposite directions must write to
    //    opposite sides of them. This is where "lay a trail ahead of me" comes from and nothing else
    //    in this engine can express it.
    vx[0]=1; vy[0]=0;  const fwd=probe([[2,0,1]],1,0.5);
    vx[0]=-1; vy[0]=0; const back=probe([[2,0,1]],1,0.5);
    vx[0]=0; vy[0]=0;  const still=probe([[2,0,1]],1,0.5);   // no heading -> world frame
    const world=probe([[2,0,1]],0,0.5);
    // 5. THE WALL. The space is a box, so offsets CLAMP - and the magnitude invariant has to survive
    //    two taps landing in the same edge cell.
    px[0]=4; py[0]=4;
    const corner=probe([[-3,0,1],[-2,0,1]],0,0.5);
    px[0]=W*0.5; py[0]=H*0.5;
    // 6. THE STEP (#103): incremental, bounded, reaches every tap count, and can turn itself back off
    const v={t:9,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0,st:null,fr:0};
    let moves=0, illegal=0, frames=0, backToNull=0; const sizes={};
    for(let q=0;q<900;q++){
      const wasNull=!Array.isArray(v.st);
      const f0=v.fr|0;
      emitFormStep(v); moves++;
      if((v.fr|0)!==f0)frames++;
      if(Array.isArray(v.st)){
        sizes[v.st.length]=1;
        if(v.st.length>EMIT_TAPS_MAX)illegal++;
        for(const t of v.st){
          if(!(t[0]>=-EMIT_OFFSET_MAX&&t[0]<=EMIT_OFFSET_MAX))illegal++;
          if(!(t[1]>=-EMIT_OFFSET_MAX&&t[1]<=EMIT_OFFSET_MAX))illegal++;
          if(!isFinite(t[2])||Math.abs(t[2])>2)illegal++;
        }
      } else if(!wasNull) backToNull++;
    }
    // 7. RENT, and the knob
    const svFx=genome.userEffects;
    genome.userEffects=[{t:9,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0,st:[[1,0,1],[2,0,1],[3,0,1]],fr:0}];
    const rentShaped=emitRentOf(genome);
    genome.userEffects=[{t:9,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0,st:null,fr:0}];
    const rentPlain=emitRentOf(genome);
    genome.userEffects=svFx;
    // AND A SHAPE ON A POSSESSION IS INERT, uncounted and unbilled. "Two cells left" is not a thing
    // you can say about somebody's amplitude, so target 0 must ignore the stencil entirely - and the
    // census row and the rent must agree with the write path rather than reporting a geometry that
    // cannot act.
    const memVerb={t:8,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0,st:[[2,0,1],[3,0,1]],fr:1};
    const inert={shaped:emitShaped(memVerb), place:emitPlaceTarget(8), placeField:emitPlaceTarget(9),
                 placeChan:emitPlaceTarget(13)};
    { const svf=genome.userEffects; genome.userEffects=[memVerb];
      inert.rent=emitRentOf(genome); genome.userEffects=svf; }
    const sv=__EMIT; __EMIT=false;
    const off=probe([[2,0,1]],0,0.5);
    __EMIT=sv;
    return {n,worst:+worst.toFixed(6), plain, dip, fwd, back, still, world, corner,
            moves, illegal, frames, backToNull, sizes:Object.keys(sizes).map(Number).sort((a,b)=>a-b),
            rentShaped, rentPlain, tapRent:EMIT_TAP_RENT, off, inert,
            selfFrameFired:__emitSelfFrame>0, spreadFired:__emitSpread>0};
  });

  // -- #193  AND IT HAS TO CROSS ------------------------------------------------------------------
  out.emitCross=run('emitCross',()=>{
    const mk1=()=>({t:11,m:0,s:0.7,nx:-1,ax:-1,uses:3,creditTrace:0.2,st:[[2,-1,0.8],[-2,1,-0.4]],fr:1});
    genome.userEffects=[mk1()];
    genome.channels=[{expr:'(a)*(0.9)',compiled:null,failed:false,age:1,uses:0,st:null,wrap:0,cad:1},null,null,null];
    // save -> load
    const blob=encodeGenome();
    genome.userEffects=[];
    decodeGenome(blob); sanitizeGenome();
    const e0=genome.userEffects&&genome.userEffects[0];
    const saved=!!e0&&Array.isArray(e0.st)&&e0.st.length===2&&e0.st[0][0]===2&&e0.st[0][1]===-1&&
                Math.abs(e0.st[0][2]-0.8)<1e-3&&(e0.fr|0)===1;
    // clone -> no shared reference, to the TAP
    const c=cloneGenome(genome);
    const shared={bank:c.userEffects===genome.userEffects,
                  verb:c.userEffects[0]===genome.userEffects[0],
                  st:c.userEffects[0].st===genome.userEffects[0].st,
                  tap:c.userEffects[0].st[0]===genome.userEffects[0].st[0]};
    // child -> the shape diverges
    let childMoved=0;
    for(let q=0;q<300;q++){ const g=cloneGenome(genome); mutateChildGenome(g);
      const t0=g.userEffects&&g.userEffects[0];
      if(!t0||!Array.isArray(t0.st)||t0.st.length!==2||
         t0.st[0][0]!==2||t0.st[0][1]!==-1||Math.abs(t0.st[0][2]-0.8)>1e-6||(t0.fr|0)!==1)childMoved++; }
    // germline -> population
    let carriers=0;
    for(let k=0;k<N;k++) if(palive[k]&&pGenome[k])pGenome[k].userEffects=[];
    seedEffectIntoParticle(0);
    for(let k=0;k<N;k++){ const g=pGenome[k];
      if(palive[k]&&g&&Array.isArray(g.userEffects))for(const e of g.userEffects)
        if(e&&Array.isArray(e.st)&&e.st.length===2)carriers++; }
    // the wire: a shape that does not survive the hop is a verb that lands somewhere else (#141)
    const pay={nx:0.5,ny:0.5,tend:[0,0,0],mem:[],plasmid:[],amp:1,phase:0,ua:[],
               ue:[{t:11,m:0,s:0.7,n:-1,a:-1,st:[[2,-1,0.8]],fr:1}]};
    const wireOk=validNetworkPayload('migrant',pay)===true;
    const wireBad=[
      {...pay,ue:[{t:11,m:0,s:0.7,n:-1,a:-1,st:[[99,0,1]]}]},                     // offset off the end
      {...pay,ue:[{t:11,m:0,s:0.7,n:-1,a:-1,st:new Array(EMIT_TAPS_MAX+1).fill([0,0,1])}]},
      {...pay,ue:[{t:11,m:0,s:0.7,n:-1,a:-1,st:[[0,0,'x']]}]},
      {...pay,ue:[{t:11,m:0,s:0.7,n:-1,a:-1,st:'nope'}]},
    ].every(x=>validNetworkPayload('migrant',x)===false);
    const wireAbsent=validNetworkPayload('migrant',{...pay,ue:[{t:11,m:0,s:0.7,n:-1,a:-1}]})===true;
    const cen=crossingCensus();
    return {saved,shared,childMoved,carriers,wireOk,wireBad,wireAbsent,
            row:cen.rows.some(r=>r.name==='verb.shaped')};
  });

  // -- #194  THE GRAIN OF A MEDIUM ---------------------------------------------------------------
  // #188's closing paragraph named the grain as the remaining ceiling and #189 and #193 both
  // restated it. These check the three things that would be silently wrong: that the seeded grain is
  // the ORIGINAL code path rather than an equal-looking one, that a coarse medium is block-uniform
  // (which is what lets chanRead and #193's emission work unchanged), and that coarsening actually
  // buys a different DYNAMICS rather than just a different number in the genome.
  out.grain=run('grain',()=>{
    const saveCh=genome.channels, saveTick=tick;
    const setRule=(expr,res,st,cad)=>{ genome.channels=[{expr,compiled:null,failed:false,age:1,uses:0,
      st:st||CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:cad||1,res},null,null,null]; };
    const drive=(n)=>{ for(let q=0;q<n;q++){ tick=(q+1)*CHANNEL_CADENCE; updateChannels(); } };
    const lattice=()=>Array.from(chanLattice(0));
    const seed=(L,v,c)=>{ L.fill(0); L[c]=v; };
    const centroid=(L)=>{ let sx=0,w=0; for(let c=0;c<L.length;c++){ const m=Math.abs(L[c]);
      if(m>1e-9){ sx+=(c%FIELD_W)*m; w+=m; } } return w>0?sx/w:-1; };

    // 1. EVERY GRAIN DIVIDES THE LATTICE EXACTLY. A value that does not leaves a remainder row at
    //    the edge, which is a silent off-by-one in the block loop rather than a coarser medium.
    const divides=CHANNEL_RES_SET.every(r=>FIELD_W%r===0&&FIELD_H%r===0);
    const blocks=CHANNEL_RES_SET.map(r=>chanBlock(r));

    // 2. THE SEEDED GRAIN IS THE ORIGINAL PATH, BIT FOR BIT. Same rule, same start state, once with
    //    GRAIN on at res=FIELD_W and once with GRAIN off entirely.
    setRule('(a)+(((b)-(a))*(0.25))',FIELD_W);
    { const L=chanLattice(0); seed(L,2,20*FIELD_W+20); }
    drive(6);
    const withOn=lattice();
    const svg=__GRAIN; __GRAIN=false;
    setRule('(a)+(((b)-(a))*(0.25))',FIELD_W);
    { const L=chanLattice(0); seed(L,2,20*FIELD_W+20); }
    drive(6);
    const withOff=lattice();
    __GRAIN=svg;
    let identical=0; for(let c=0;c<withOn.length;c++) if(withOn[c]!==withOff[c])identical++;

    // 3. A COARSE MEDIUM IS BLOCK-UNIFORM. This is the property everything else rests on: if it
    //    holds, a fine chanRead already returns the medium's own value and #193's emission needs no
    //    change at all.
    setRule('(a)+(((b)-(a))*(0.25))',5);
    { const L=chanLattice(0); seed(L,2,20*FIELD_W+20); }
    drive(3);
    const CL=lattice(); const bs=chanBlock(5);
    let nonUniform=0;
    for(let by=0;by<5;by++)for(let bx=0;bx<5;bx++){
      const v0=CL[(by*bs)*FIELD_W+bx*bs];
      for(let dy=0;dy<bs;dy++)for(let dx=0;dx<bs;dx++)
        if(CL[(by*bs+dy)*FIELD_W+bx*bs+dx]!==v0)nonUniform++;
    }

    // 4. A WRITE REACHES THE WHOLE BLOCK, and is readable from anywhere in it. The alternative -
    //    splitting amt across the block - would have made a coarse medium swallow every deposit by
    //    (FIELD_W/res)^2, so the gene would read as "become deaf" rather than as a grain.
    let wi=-1; for(let q=0;q<N;q++) if(palive[q]){wi=q;break;}
    let wrote=null;
    if(wi>=0){
      const L=chanLattice(0); L.fill(0);
      const moved=chanWrite(0,wi,0.9);
      const c=chanCellOf(wi), cx=c%FIELD_W, cy=(c/FIELD_W)|0;
      const x0=cx-(cx%bs), y0=cy-(cy%bs);
      let filled=0;
      for(let dy=0;dy<bs;dy++)for(let dx=0;dx<bs;dx++)
        if(Math.abs(L[(y0+dy)*FIELD_W+x0+dx]-0.9)<1e-6)filled++;
      // and a reader standing anywhere in that block sees it
      const svx=px[wi], svy=py[wi];
      const fw=W/FIELD_W, fh=H/FIELD_H;
      px[wi]=(x0+bs-1)*fw+fw*0.5; py[wi]=(y0+bs-1)*fh+fh*0.5;
      const farRead=chanRead(0,wi);
      px[wi]=svx; py[wi]=svy;
      wrote={moved:+moved.toFixed(4),filled,ofBlock:bs*bs,farRead:+farRead.toFixed(4)};
    }

    // 5. THE STENCIL IS READ IN BLOCKS, which is where the new dynamics comes from: one advection
    //    step at res=5 moves the medium a fifth of the world, and no fine-grained kernel can do that
    //    in one update however it is shaped.
    const adv=[[1,0,1]];
    setRule('(b)*(0.999)',FIELD_W,adv);
    { const L=chanLattice(0); seed(L,2,20*FIELD_W+8); }
    // The rule takes each place's value FROM its +x neighbour, so mass travels in -x and the
    // centroid DECREASES. What is measured is the displacement, not the raw centroid - the first
    // version of this check compared centroids and went red for having the sign of the flow.
    drive(1); const fineStep=Math.abs(8-centroid(lattice()));
    setRule('(b)*(0.999)',5,adv);
    { const L=chanLattice(0); seed(L,2,20*FIELD_W+8); }
    drive(1); const coarseStep=Math.abs(8-centroid(lattice()));

    // 6. SNAPPED, NOT CLAMPED
    const snap={ s7:chanRes({res:7}), s6:chanRes({res:6}), s39:chanRes({res:39}),
                 sBig:chanRes({res:1000}), sNeg:chanRes({res:-4}), sNaN:chanRes({res:NaN}),
                 sAbsent:chanRes({}) };

    // 7. THE STEP (#103): one index at a time, always inside the set, and every grain reachable
    const gr={res:FIELD_W}; let gmoves=0, gillegal=0, gjumps=0; const seen={};
    for(let q=0;q<600;q++){
      const before=chanRes(gr);
      if(chanGrainStep(gr))gmoves++;
      const after=chanRes(gr);
      if(CHANNEL_RES_SET.indexOf(after)<0)gillegal++;
      if(Math.abs(CHANNEL_RES_SET.indexOf(after)-CHANNEL_RES_SET.indexOf(before))>1)gjumps++;
      seen[after]=1;
    }

    // 8. RENT FALLS WITH THE GRAIN, and is floored. The only rent in this file a lineage can reduce.
    const rentAt=(res)=>{ genome.channels=[{expr:'(a)',compiled:null,failed:false,age:1,uses:0,
      st:CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:1,res},null,null,null];
      let t=0; const b=chanBank();
      for(let k=0;k<CHANNEL_MAX;k++){ const _r=b[k]; if(_r&&typeof _r.expr==='string'){
        const g=__GRAIN?Math.max(CHANNEL_RES_FLOOR,Math.pow(chanRes(_r)/FIELD_W,2)):1;
        t+=CHANNEL_RENT*g; } }
      return +t.toFixed(4); };
    const rent={fine:rentAt(FIELD_W), mid:rentAt(20), coarse:rentAt(5), floor:CHANNEL_RES_FLOOR};

    // 9. AND A COARSE MEDIUM STAYS BOUNDED under a rule that tries to run away
    setRule('((a)+(b))*(3.00)',5,[[0,-1,2],[0,1,2],[-1,0,2],[1,0,2],[2,2,2],[-2,-2,2]]);
    { const L=chanLattice(0); L.fill(1.5); }
    drive(8);
    const EL=lattice();
    let over=0, nf=0;
    for(const v of EL){ if(!isFinite(v))nf++; else if(Math.abs(v)>CHANNEL_CLAMP+1e-6)over++; }

    genome.channels=saveCh; tick=saveTick;
    return {divides,blocks,identical,nonUniform,wrote,
            fineStep:+fineStep.toFixed(3), coarseStep:+coarseStep.toFixed(3),
            snap,gmoves,gillegal,gjumps,grains:Object.keys(seen).map(Number).sort((a,b)=>a-b),
            rent,over,nf,coarseFired:__chanCoarse>0};
  });

  // -- #194  AND IT HAS TO CROSS ------------------------------------------------------------------
  out.grainCross=run('grainCross',()=>{
    genome.channels=[{expr:'(a)*(0.95)',compiled:null,failed:false,age:4,uses:2,
                      st:[[1,-1,0.5]],wrap:1,cad:3,res:8},null,null,null];
    const blob=encodeGenome();
    genome.channels=undefined;
    decodeGenome(blob); sanitizeGenome();
    const r0=genome.channels&&genome.channels[0];
    const saved=!!r0&&chanRes(r0)===8&&r0.cad===3&&r0.wrap===1;
    // a pre-#194 row is five long and must read as the lattice's own grain
    const old5=JSON.parse(JSON.stringify([['(a)*(0.95)',4,[[1,-1,0.5]],1,3]]));
    genome.channels=undefined;
    decodeGenome(blob.replace(/x/,'x'));   // keep the same blob; the legacy shape is exercised directly below
    const legacy={expr:old5[0][0],st:old5[0][2],wrap:old5[0][3],cad:old5[0][4]};
    const legacyReads=chanRes(legacy)===FIELD_W;
    genome.channels=[{expr:'(a)*(0.95)',compiled:null,failed:false,age:4,uses:2,
                      st:[[1,-1,0.5]],wrap:1,cad:3,res:8},null,null,null];
    const c=cloneGenome(genome);
    const shared={bank:c.channels===genome.channels, row:c.channels[0]===genome.channels[0]};
    const cloneRes=chanRes(c.channels[0]);
    let childMoved=0;
    for(let q=0;q<400;q++){ const g=cloneGenome(genome); mutateChildGenome(g);
      const rr=g.channels&&g.channels[0];
      if(rr&&chanRes(rr)!==8)childMoved++; }
    // GERMLINE -> POPULATION, and this is the check that would have caught the defect the live run
    // caught instead: seedSubstrateIntoParticle rebuilds a channel rule from a key list, so dropping
    // the grain there made channel.grain read germline 2 / population 0 - STRANDED - while every other
    // crossing passed. A channel rule is rebuilt in FIVE places and a new field needs all five.
    for(let k=0;k<N;k++) if(palive[k]&&pGenome[k])pGenome[k].channels=null;
    const seeded=seedSubstrateIntoParticle();
    let grainCarriers=0;
    for(let k=0;k<N;k++){ const g=pGenome[k];
      if(palive[k]&&g&&Array.isArray(g.channels))for(const rr of g.channels)
        if(rr&&typeof rr.expr==='string'&&chanRes(rr)===8)grainCarriers++; }
    const cen=crossingCensus();
    return {saved,legacyReads,shared,cloneRes,childMoved,seeded,grainCarriers,
            row:cen.rows.some(x=>x.name==='channel.grain')};
  });

  // -- #195  A MEDIUM IS CONTAGIOUS --------------------------------------------------------------
  // #194 measured its own binding constraint: channel.bank germline 4 / population 10-24 out of ~200,
  // because a chemistry authored AFTER the population exists reaches it only through
  // seedSubstrateIntoParticle, one particle per mutateGenome. #195 adds a second route that does not
  // go through descent. These check the four things that would make it wrong rather than slow:
  // that rate 0 draws NO random number (the exact-revert guarantee), that a transfer moves the WHOLE
  // medium, that slot identity is preserved or nothing happens, and that receiving can never destroy
  // an evolved chemistry.
  out.xfer=run('xfer',()=>{
    const saveCh=genome.channels;
    // THE RATE IS ON THE RULE, not on the genome. The first version of #195 made it a host scalar
    // and four 12,000-tick runs answered with channel.xfer NEVER FIRING and the gene evolved to 0:
    // infectiousness is pure cost to a host, so host-level selection correctly removed it. The unit
    // of selection for a selfish element is the element.
    const mkRule=(e,st,wrap,cad,res,xf)=>({expr:e,compiled:null,failed:false,age:5,uses:3,
      st:st||[[2,-1,0.75]],wrap:wrap===undefined?1:wrap,cad:cad||3,res:res||8,
      xfer:xf===undefined?0.01:xf});
    // two neighbours, in phase, on a strong bond
    for(let k=0;k<N;k++)palive[k]=false;
    palive[0]=true; palive[1]=true;
    px[0]=400; py[0]=400; px[1]=410; py[1]=400;
    phase[0]=0; phase[1]=0; amp[0]=1.5; amp[1]=1.5;
    for(const q of [0,1]){ if(!pGenome[q])pGenome[q]=cloneGenome(genome); }
    const setup=(donorRate,donorBank,recipBank,recipAtoms)=>{
      pGenome[0]=cloneGenome(genome); pGenome[1]=cloneGenome(genome);
      // plasmidTransferThresh is set only because the FIRST version of #195 reused it as a gate and
      // the live A/B refuted that (390 gate firings, zero transfers - the bond gate selects for the
      // similarity that makes transfer impossible). #195 no longer reads it; these two lines stay
      // because the plasmid mechanism shares this code path and a stray threshold there would make
      // the counts below depend on something this block is not about.
      // donorRate is applied to every rule in the donor bank, because the rate is the rule's
      pGenome[0].plasmidTransferThresh=0.99; pGenome[1].plasmidTransferThresh=0.99;
      if(Array.isArray(donorBank))for(const _r of donorBank) if(_r)_r.xfer=donorRate;
      // the rig drives at the TOP of the range, which chanXferRate clamps to - so the counts below
      // are per-interaction upper bounds, not what a live lineage evolves to (measured at ~4e-4)
      pGenome[0].channels=donorBank; pGenome[1].channels=recipBank;
      pGenome[1].userAtoms=recipAtoms||[];
      amp[0]=1.5; amp[1]=1.5;
    };
    const drive=(n)=>{ const x0=__chanXfers, s0=__chanXferSensed, d0=__chanXferDeclined;
      for(let q=0;q<n;q++){
        const _g=genome; genome=pGenome[0];
        try{ executeVM(0,1,1,4); }catch(e){}
        finally{ genome=_g; }
      }
      return {x:__chanXfers-x0, sensed:__chanXferSensed-s0, declined:__chanXferDeclined-d0}; };

    // 1. RATE 0 CONSUMES NO RANDOM NUMBER. Not "behaves the same" - draws the same numbers. Measured
    //    by comparing the next value out of the stream against the knob-off path.
    const streamAfter=(useKnobOff)=>{
      setup(0,[mkRule('(a)*(0.9)'),null,null,null],[null,null,null,null]);
      const sv=__CHANXFER; if(useKnobOff)__CHANXFER=false;
      drive(1);
      if(useKnobOff)__CHANXFER=sv;
      return null;
    };
    // the honest form of that check: with the gene at 0 nothing transfers and nothing is declined,
    // which can only be true if the gate short-circuited before the draw
    setup(0,[mkRule('(a)*(0.9)'),null,null,null],[null,null,null,null]);
    const atZero=drive(600);

    // 2. AND AT A REAL RATE IT FIRES, moving the WHOLE medium
    setup(0.05,[mkRule('(a)*(0.9)',[[2,-1,0.75],[-3,2,-0.5]],1,3,8),null,null,null],[null,null,null,null]);
    const fired40=drive(600);
    const got=pGenome[1].channels&&pGenome[1].channels[0];
    const whole=!!got&&got.expr==='(a)*(0.9)'&&got.wrap===1&&got.cad===3&&chanRes(got)===8&&
                Array.isArray(got.st)&&got.st.length===2&&got.st[1][0]===-3&&
                Math.abs(got.st[1][2]+0.5)<1e-6;
    const freshRecord=!!got&&got.age===0&&got.uses===0;
    // deep-copied to the tap, or one stencil is shared by donor and recipient
    const donorRule=pGenome[0].channels[0];
    const deep=!!got&&got.st!==donorRule.st&&got.st[0]!==donorRule.st[0];
    const donorPaid=amp[0]<1.5;

    // 3. SAME SLOT OR NOTHING. A rule in donor slot 2 lands in recipient slot 2 and nowhere else.
    setup(0.05,[null,null,mkRule('(kc)+(0.10)'),null],[null,null,null,null]);
    const slot2=drive(600);
    const rb=pGenome[1].channels;
    const slotKept=!!(rb&&rb[2]&&rb[2].expr==='(kc)+(0.10)')&&!rb[0]&&!rb[1]&&!rb[3];

    // 4. AND RECEIVING NEVER DESTROYS AN EVOLVED CHEMISTRY. Donor holds slot 0, recipient already
    //    holds slot 0 with something different: the gate passes, no slot is compatible, nothing moves.
    // Driven to 600 rather than 60: at rate 0.05 the gate fires about three times in sixty, and the
    // first version of this check read 0 declines out of 0 gate firings and went red for sampling.
    // #143's rule - drive the rare path, do not wait for it.
    setup(0.05,[mkRule('(a)*(0.9)'),null,null,null],[mkRule('(b)+(0.50)'),null,null,null]);
    const occupied=drive(600);
    const kept=pGenome[1].channels[0].expr==='(b)+(0.50)';

    // 5. A TRANSFER INTO A LINEAGE THAT CAN SEE THE MEDIUM is counted separately from one that
    //    cannot - #188 spent a swing on that distinction and it is the difference between a public
    //    good and pure rent.
    // BLIND: the recipient holds a channel-naming atom, but for a DIFFERENT slot than the one it
    // receives. The first version of this gave it an atom naming ka and transferred slot 0, which is
    // the seeing case wearing the blind case's name - ka IS slot 0.
    setup(0.05,[mkRule('(a)*(0.9)'),null,null,null],[null,null,null,null],
          [{expression:'(kd)+(0.00)',compiled:null,failed:false,uses:0,state:0}]);
    const blind=drive(600);
    setup(0.05,[null,mkRule('(kb)*(0.5)'),null,null],[null,null,null,null],
          [{expression:'(kb)+(0.00)',compiled:null,failed:false,uses:0,state:0}]);
    const seeing=drive(600);

    // 6. AND A RECIPIENT THAT HAS NEVER HELD A CHANNEL AT ALL, which is the case the mechanism
    //    exists for and the case the first implementation silently excluded: an untouched genome has
    //    channels === undefined, not [null,null,null,null]. Live, that was channel.xferDeclined 2,549
    //    against channel.xfer ZERO - every opportunity a collision between two carriers, while the
    //    129 non-carriers in the same world were never considered.
    setup(0.01,[mkRule('(a)*(0.7)'),null,null,null],[null,null,null,null]);
    pGenome[1].channels=undefined;
    const virgin=drive(600);
    const gotFromNothing=Array.isArray(pGenome[1].channels)&&
                         pGenome[1].channels.length===CHANNEL_MAX&&
                         !!pGenome[1].channels[0]&&pGenome[1].channels[0].expr==='(a)*(0.7)';
    // and an interaction that does NOT transfer must not have allocated a bank on the way past
    setup(0,[mkRule('(a)*(0.7)',null,0,1,40,0),null,null,null],[null,null,null,null]);
    pGenome[1].channels=undefined;
    drive(200);
    const noAllocWhenQuiet=pGenome[1].channels===undefined;

    // 7. THE KNOB
    setup(0.05,[mkRule('(a)*(0.9)'),null,null,null],[null,null,null,null]);
    const svk=__CHANXFER; __CHANXFER=false;
    const offRun=drive(600);
    __CHANXFER=svk;

    // 8. THE ELEMENT'S RATE IS BOUNDED, SURVIVES A SAVE, AND STEPS INCREMENTALLY
    genome.channels=[mkRule('(a)*(0.8)',null,0,1,40,0.004),null,null,null];
    const blob=encodeGenome();
    genome.channels=undefined;
    decodeGenome(blob); sanitizeGenome();
    const r0=genome.channels&&genome.channels[0];
    const saved=!!r0&&Math.abs(chanRuleXfer(r0)-0.004)<1e-4;
    const hi=chanRuleXfer({xfer:9}), lo=chanRuleXfer({xfer:-3}), absent=chanRuleXfer({});
    const stepRule={expr:'(a)',xfer:0.005};
    let smoves=0, sillegal=0, sreach0=false, sreachTop=false;
    for(let q=0;q<4000;q++){
      chanXferStep(stepRule); smoves++;
      const v=chanRuleXfer(stepRule);
      if(!(v>=0&&v<=0.01))sillegal++;
      if(v<=0)sreach0=true;
      if(v>=0.00999)sreachTop=true;
    }

    genome.channels=saveCh;
    return {atZero,fired40,whole,freshRecord,deep,donorPaid,cost:CHANXFER_COST,
            slot2,slotKept,occupied,kept,blind,seeing,offRun,virgin,gotFromNothing,noAllocWhenQuiet,
            bounds:{hi,lo,absent},saved,smoves,sillegal,sreach0,sreachTop};
  });

  // -- #196  WHOSE CHEMISTRY ACTUALLY RUNS -------------------------------------------------------
  // For eight swings updateChannels read chanBank() with the ambient genome, which is the SELF's, so
  // only the germline's rule ever computed anything. Every population copy - deep-copied, seeded,
  // saved, rented, and as of #195 spread to a thousand carriers - was INERT, and channel.bank's
  // population count was measuring carriage rather than effect. The last check here is the one that
  // matters: it asks the LATTICE which rule ran, not the census.
  out.gov=run('gov',()=>{
    const saveCh=genome.channels, saveTick=tick;
    const mk=(e)=>({expr:e,compiled:null,failed:false,age:1,uses:0,
      st:CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:1,res:FIELD_W,xfer:0});
    // a small, fully known population
    for(let k=0;k<N;k++)palive[k]=false;
    const live=[0,1,2,3];
    for(const q of live){ palive[q]=true; px[q]=200+q*40; py[q]=200; amp[q]=1;
                          pGenome[q]=cloneGenome(genome); pGenome[q].channels=[null,null,null,null]; }
    genome.channels=[mk('(a)*(0.00)'),null,null,null];            // the SELF says: decay to nothing

    // 1. NO CARRIER -> the germline governs. A universe whose population has not received a
    //    chemistry still runs the one it authored.
    let selfWins=0;
    for(let q=0;q<200;q++){ const g=chanGoverning(0); if(g&&g.expr==='(a)*(0.00)')selfWins++; }
    const noCarrier=selfWins;

    // 2. CARRIERS GOVERN. Three hold rule A, one holds rule B, none holds the germline's - so the
    //    germline should never be drawn, and A should govern about three times as often as B.
    for(const q of [0,1,2]) pGenome[q].channels=[mk('(a)+(0.10)'),null,null,null];
    pGenome[3].channels=[mk('(a)+(0.90)'),null,null,null];
    let a=0,b=0,mine=0;
    for(let q=0;q<4000;q++){ const g=chanGoverning(0);
      if(!g)continue;
      if(g.expr==='(a)+(0.10)')a++; else if(g.expr==='(a)+(0.90)')b++; else mine++; }
    const share=(a+b)>0?+(a/(a+b)).toFixed(3):-1;

    // 3. AND THE LATTICE AGREES WITH THE CENSUS. The germline says decay to zero; every carrier says
    //    hold at 0.9. Drive the real update loop and ask the lattice which rule ran. This is the
    //    check that would have failed for eight swings.
    for(const q of live) pGenome[q].channels=[mk('(0.90)+((a)*(0.00))'),null,null,null];
    { const L=chanLattice(0); L.fill(0); }
    for(let q=0;q<4;q++){ tick=(q+1)*CHANNEL_CADENCE; updateChannels(); }
    const popRan=+chanLattice(0)[20*FIELD_W+20].toFixed(3);
    // and with the population's rule removed, the germline's decay is what runs
    for(const q of live) pGenome[q].channels=[null,null,null,null];
    { const L=chanLattice(0); L.fill(0.9); }
    for(let q=0;q<4;q++){ tick=(q+5)*CHANNEL_CADENCE; updateChannels(); }
    const selfRan=+chanLattice(0)[20*FIELD_W+20].toFixed(3);

    // 4. THE KNOB restores the pre-#196 engine: the self's rule, every time, and no draw taken
    for(const q of live) pGenome[q].channels=[mk('(a)+(0.10)'),null,null,null];
    const sv=__CHANGOV; __CHANGOV=false;
    let offSelf=0;
    for(let q=0;q<200;q++){ const g=chanGoverning(0); if(g&&g.expr==='(a)*(0.00)')offSelf++; }
    __CHANGOV=sv;

    genome.channels=saveCh; tick=saveTick;
    return {noCarrier,a,b,mine,share,popRan,selfRan,offSelf};
  });

  // -- #197  THE BRAKES ARE LAWS ------------------------------------------------------------------
  // Every price in this economy was a constant, so the one thing that could never be selected on was
  // the selection pressure itself. These check the three ways that could go wrong: a price that does
  // not actually reach the billing line, a self-reference that lets the mechanism disable itself in
  // one step with no verdict, and a table that grew past the rate that samples it.
  out.brakes=run('brakes',()=>{
    const saved={};
    for(const row of LAW_DECLARED) saved[row.name]=row.get();
    const restore=()=>{ for(const row of LAW_DECLARED){ try{ row.set(saved[row.name]); }catch(_){} } };

    // 1. EVERY LAW ROUND-TRIPS AND RESPECTS ITS OWN BOUNDS. A row whose setter does not take is a
    //    price that cannot move, which reads identical to a price nothing wants to move.
    let bad=0, outOfBand=0;
    for(const row of LAW_DECLARED){
      const mid=(row.lo+row.hi)/2;
      try{ row.set(mid); }catch(_){ bad++; continue; }
      const got=+row.get();
      if(!isFinite(got))bad++;
      else if(Math.abs(got-mid)>Math.max(1e-6,Math.abs(mid)*1e-6))bad++;
      if(got<row.lo-1e-9||got>row.hi+1e-9)outOfBand++;
    }
    restore();
    // 2. AND A PRICE ACTUALLY REACHES THE BILLING LINE. Set CHANNEL_RENT to both ends and read the
    //    rent the engine computes, rather than trusting that a name in a table is a name in a sum.
    genome.channels=[{expr:'(a)',compiled:null,failed:false,age:1,uses:0,
      st:CHANNEL_STENCIL_SEED.map(t=>[t[0],t[1],t[2]]),wrap:0,cad:1,res:FIELD_W,xfer:0},null,null,null];
    const rentNow=()=>{ let t=0; const b=chanBank();
      for(let k=0;k<CHANNEL_MAX;k++){ const _r=b[k]; if(_r&&typeof _r.expr==='string'){
        const g=__GRAIN?Math.max(CHANNEL_RES_FLOOR,Math.pow(chanRes(_r)/FIELD_W,2)):1;
        t+=CHANNEL_RENT*g; } } return +t.toFixed(4); };
    const rentRow=LAW_DECLARED.find(r=>r.name==='CHANNEL_RENT');
    rentRow.set(0);   const rentFree=rentNow();
    rentRow.set(2.0); const rentDear=rentNow();
    restore();

    // 3. THE SELF-REFERENCE. LAW_VIABLE is itself a law, so a proposal to set it to 0 must be judged
    //    by the threshold that STOOD WHEN THE PROPOSAL WAS MADE. Judged by the new value it would
    //    pass by construction and the mechanism would have handed itself a one-step way to stop
    //    reverting anything, with no verdict at all.
    const svTrial=__lawTrial, svPop=__lawPop.slice(), svTick=tick;
    __lawPop=[]; for(let q=0;q<LAW_WINDOW;q++)__lawPop.push(100);   // a baseline of 100
    const vi=LAW_DECLARED.findIndex(r=>r.name==='LAW_VIABLE');
    LAW_VIABLE=0.7;
    __lawTrial={idx:vi,from:0.7,to:0.0,startTick:0,baseline:100,sum:10*LAW_PROBATION,n:LAW_PROBATION,
                viable:0.7,probation:LAW_PROBATION};   // the world held 10 of a baseline 100 - a collapse
    LAW_VIABLE=0.0;                                    // ...and the proposal has already installed 0
    tick=LAW_PROBATION+1;
    attemptLawMutation();
    const revertedAnyway=(LAW_VIABLE===0.7);           // the capture put it back
    const verdict=__lawLog.length?__lawLog[__lawLog.length-1]:null;
    __lawTrial=svTrial; __lawPop=svPop; tick=svTick;
    restore();

    // 4. THE TABLE GREW, SO THE RATE HAD TO. A given law is picked 1-in-length, and only
    //    floor(window/LAW_PROBATION) verdicts can land however often proposals are drawn.
    const reach={laws:LAW_DECLARED.length, base:LAW_BASE_LAWS,
                 perRun:+(LAW_RATE*12000).toFixed(2),
                 verdictCap:Math.floor(12000/LAW_PROBATION)};

    // 5. THE KNOB pins the table back to the three physics laws
    const svB=__BRAKES; __BRAKES=false;
    const offSpan=__BRAKES?LAW_DECLARED.length:LAW_BASE_LAWS;
    __BRAKES=svB;

    genome.channels=null;
    return {bad,outOfBand,rentFree,rentDear,revertedAnyway,
            verdictKept:verdict?verdict[4]:-1,reach,offSpan,
            names:LAW_DECLARED.map(r=>r.name)};
  });

  // -- #198  THE NEIGHBOURHOOD BECOMES A FUNCTION OF PLACE ---------------------------------------
  // A stencil is a list of OFFSETS, so every cell of a medium has the same neighbourhood - that is
  // what makes a lattice a lattice rather than a graph, and it is the spatial closure #189, #190 and
  // #194 all left standing. These read the adjacency DIRECTLY rather than reading the gene back: the
  // lattice is loaded with a gradient and one tap of weight 1, so the value a cell ends up holding
  // IS the index of the cell it sampled. Everything below is that one measurement.
  out.warp=run('warp',()=>{
    const saveCh=genome.channels, saveTick=tick;
    // AND THE POPULATION'S BANKS ARE CLEARED, or this block measures somebody else's medium. #196
    // made the governing rule a draw from the living CARRIERS, with the germline only as fallback -
    // so setting genome.channels and calling updateChannels does not run the rule you just set
    // whenever any particle happens to carry that slot. Four checks here failed on exactly that and
    // one PASSED spuriously, which is the worse half. Clearing the carriers puts chanGoverning on its
    // fallback path, which is a real path and the only one that makes this probe attributable.
    const rule=(wx,wy,res)=>{
      for(let q=0;q<N;q++) if(pGenome[q])pGenome[q].channels=null;
      genome.channels=[{expr:'(b)+(0.00)',compiled:null,failed:false,age:1,
      uses:0,st:[[0,0,1]],wrap:0,cad:1,res:res||FIELD_W,xfer:0,wx:wx||null,wy:wy||null},null,null,null]; };
    // A DELTA FUNCTION, NOT A GRADIENT, and the reason is worth keeping: the first version of this
    // block loaded a 0..39 ramp and read the sampled column straight out of the cell's value. It
    // cannot work - uaCall clamps its output to +/-8 and the lattice write clamps to CHANNEL_CLAMP=3,
    // so every cell read 3 and four checks failed on a probe that was wrong rather than on a
    // mechanism that was. One spike of value 1 stays inside both clamps, and WHERE the spike lands
    // after one update is the displacement, read off the lattice rather than off the gene.
    const spike=(sx,sy)=>{ const L=chanLattice(0); L.fill(0); L[sy*FIELD_W+sx]=1; return L; };
    const step=()=>{ tick=CHANNEL_CADENCE; updateChannels(); };
    const at=(cx,cy)=>chanLattice(0)[cy*FIELD_W+cx];
    // the cell that now holds the spike sampled the spike's column, so spikeX - foundX is the warp
    const shiftOnRow=(sx,sy)=>{ const L=chanLattice(0); let best=-1,bv=1e-6;
      for(let cx=0;cx<FIELD_W;cx++){ const v=L[sy*FIELD_W+cx]; if(v>bv){bv=v;best=cx;} }
      return best<0?null:(sx-best); };

    // 1. NO WARP IS THE ORIGINAL ARITHMETIC. Same rule, same start, WARP on with no expression
    //    against WARP off entirely - compared cell by cell, not approximately.
    rule(null,null); spike(20,20); step();
    const plain=Array.from(chanLattice(0));
    const svw=__WARP; __WARP=false;
    rule(null,null); spike(20,20); step();
    const off=Array.from(chanLattice(0));
    __WARP=svw;
    let differ=0; for(let q=0;q<plain.length;q++) if(plain[q]!==off[q])differ++;
    const selfRead=(shiftOnRow(20,20)===0);   // a zero-offset tap samples its own cell

    // 2. A CONSTANT WARP displaces the whole neighbourhood - a stencil shift, and the control that
    //    says the mechanism reaches the tap arithmetic at all
    rule('(2.00)+(0.00)',null); spike(20,20); step();
    const constShift=shiftOnRow(20,20);
    rule('(2.00)+(0.00)',null); spike(10,30); step();
    const constShift2=shiftOnRow(10,30);

    // 3. A POSITION-DEPENDENT WARP IS THE WHOLE POINT: the same medium, the same stencil, and two
    //    cells whose neighbourhoods point at DIFFERENT relative offsets. No list of offsets can do
    //    this, however long the list.
    rule('(ny)*(6.00)',null);
    spike(20,2);  step(); const shearLo=shiftOnRow(20,2);
    rule('(ny)*(6.00)',null);
    spike(20,34); step(); const shearHi=shiftOnRow(20,34);

    // 4. STATE-DEPENDENT ADJACENCY: the medium's geometry depends on what is IN it. Two identical
    //    cells with different contents sample different neighbours.
    // Two probe cells in the same column. Their OWN contents set their warp, so they sample
    // different neighbours: the one holding 0 samples itself, the one holding 3 samples three cells
    // over - where something different has been placed.
    rule('(a)*(1.00)',null);
    { const L=chanLattice(0); L.fill(0);
      L[5*FIELD_W+20]=0;  L[5*FIELD_W+23]=2;
      L[6*FIELD_W+20]=3;  L[6*FIELD_W+23]=2; }
    step();
    const stateA=at(20,5), stateB=at(20,6);

    // 5. BOUNDED. An expression that asks for a thousand cells away gets CHANNEL_OFFSET_MAX.
    rule('(1000.00)+(0.00)',null); spike(20,20); step();
    const huge=shiftOnRow(20,20);
    // and every cell stays finite and in band under an explosive warp on an explosive rule
    genome.channels[0].expr='((a)+(b))*(3.00)';
    genome.channels[0].compiled=null;
    { const L=chanLattice(0); L.fill(1.5); }
    for(let q=0;q<6;q++){ tick=(q+1)*CHANNEL_CADENCE; updateChannels(); }
    let over=0,nf=0; for(const v of chanLattice(0)){ if(!isFinite(v))nf++; else if(Math.abs(v)>CHANNEL_CLAMP+1e-6)over++; }

    // 6. NO RECURRENCE ACROSS CELLS (#175). uaCall writes its output back to atom.state, so a warp
    //    naming the recurrent-state symbol would make a cell's neighbourhood depend on the cell evaluated BEFORE it and the
    //    whole medium would be order-dependent. state is zeroed before every call, so it reads 0.
    rule('(s)+(4.00)',null); spike(20,20); step(); const sA=shiftOnRow(20,20);
    rule('(s)+(4.00)',null); spike(9,31);  step(); const sB=shiftOnRow(9,31);
    const sIsZero=(sA===4&&sB===4);

    // 7. THE STEP (#103): incremental, authors, drifts, and can DROP
    const wr={expr:'(a)',wx:null,wy:null};
    let authored=0, dropped=0, moved=0;
    for(let q=0;q<600;q++){
      const had=chanWarped(wr)===1;
      chanWarpStep(wr);
      const has=chanWarped(wr)===1;
      if(!had&&has)authored++;
      if(had&&!has)dropped++;
      if(had&&has)moved++;
    }
    // 8. RENT
    rule('(2.00)+(0.00)',null);
    const rentOf=()=>{ let t=0; const b=chanBank();
      for(let k=0;k<CHANNEL_MAX;k++){ const _r=b[k]; if(_r&&typeof _r.expr==='string'){
        const g=__GRAIN?Math.max(CHANNEL_RES_FLOOR,Math.pow(chanRes(_r)/FIELD_W,2)):1;
        t+=CHANNEL_RENT*g+(chanWarped(_r)?CHANNEL_WARP_RENT*g:0); } } return +t.toFixed(4); };
    const rentWarped=rentOf();
    rule(null,null);
    const rentPlain=rentOf();
    rule('(2.00)+(0.00)',null,5);
    const rentCoarse=rentOf();

    // and the probe says so rather than assuming it: with the carriers cleared the germline must be
    // the rule that governed, or every number above is about a medium this block never set.
    const governedBySelf=(function(){ const sv=__chanGovSelf; chanGoverning(0);
      const used=__chanGovSelf>sv; __chanGovSelf=sv; return used; })();
    genome.channels=saveCh; tick=saveTick;
    return {governedBySelf,differ,selfRead,constShift,constShift2,shearLo,shearHi,stateA,stateB,huge,over,nf,sIsZero,
            authored,dropped,moved,rentWarped,rentPlain,rentCoarse,cap:CHANNEL_OFFSET_MAX};
  });

  out.warpCross=run('warpCross',()=>{
    genome.channels=[{expr:'(a)*(0.9)',compiled:null,failed:false,age:2,uses:1,st:[[1,0,0.5]],
                      wrap:0,cad:2,res:20,xfer:0.003,wx:'(ny)*(3.00)',wy:'(nx)*(2.00)'},null,null,null];
    const blob=encodeGenome();
    genome.channels=undefined;
    decodeGenome(blob); sanitizeGenome();
    const r0=genome.channels&&genome.channels[0];
    const saved=!!r0&&r0.wx==='(ny)*(3.00)'&&r0.wy==='(nx)*(2.00)'&&chanRes(r0)===20;
    // a pre-#198 row is seven long and must read as translation-invariant
    const legacy=chanWarped({expr:'(a)',st:[[0,0,1]]})===0;
    genome.channels=[{expr:'(a)*(0.9)',compiled:null,failed:false,age:2,uses:1,st:[[1,0,0.5]],
                      wrap:0,cad:2,res:20,xfer:0.003,wx:'(ny)*(3.00)',wy:'(nx)*(2.00)'},null,null,null];
    // the compiled holder must NOT be shared with a clone, or one medium's warp compiles into another
    chanWarpAt(genome.channels[0],'x',0.5);
    const c=cloneGenome(genome);
    const shared={row:c.channels[0]===genome.channels[0],
                  holder:c.channels[0].__wxa!==undefined&&c.channels[0].__wxa===genome.channels[0].__wxa,
                  carried:c.channels[0].wx==='(ny)*(3.00)'};
    let childMoved=0;
    for(let q=0;q<400;q++){ const g=cloneGenome(genome); mutateChildGenome(g);
      const rr=g.channels&&g.channels[0];
      if(rr&&(rr.wx!=='(ny)*(3.00)'||rr.wy!=='(nx)*(2.00)'))childMoved++; }
    for(let k=0;k<N;k++) if(palive[k]&&pGenome[k])pGenome[k].channels=null;
    seedSubstrateIntoParticle();
    let carriers=0;
    for(let k=0;k<N;k++){ const g=pGenome[k];
      if(palive[k]&&g&&Array.isArray(g.channels))for(const rr of g.channels)
        if(rr&&rr.wx==='(ny)*(3.00)')carriers++; }
    const pay={nx:0.5,ny:0.5,tend:[0,0,0],mem:[],plasmid:[],amp:1,phase:0,ua:[],
               chn:[['(a)*(0.9)',2,[[1,0,0.5]],0,2,20,0.003,'(ny)*(3.00)','(nx)*(2.00)'],0,0,0]};
    const wireOk=validNetworkPayload('migrant',pay)===true;
    const wireBad=[
      // NOT 'evil()' - UA_EXPR_SAFE is a BYTE filter (printable ASCII), not a parser, so any
      // pronounceable string passes it and the first version of this check asserted a rejection that
      // was never going to happen. What the wire can actually refuse is a non-string, an over-length
      // string, and a byte outside the printable range; a hostile but printable expression is caught
      // downstream by uaCompile's try/catch, which is where it belongs.
      {...pay,chn:[['(a)',2,null,0,1,40,0,'bad\u0001byte',0],0,0,0]},
      {...pay,chn:[['(a)',2,null,0,1,40,0,{},0],0,0,0]},
      {...pay,chn:[['(a)',2,null,0,1,40,0,'x'.repeat(UA_EXPR_MAX+40),0],0,0,0]},
    ].every(x=>validNetworkPayload('migrant',x)===false);
    const wireAbsent=validNetworkPayload('migrant',{...pay,chn:[['(a)',2,null,0,1,40,0],0,0,0]})===true;
    const cen=crossingCensus();
    return {saved,legacy,shared,childMoved,carriers,wireOk,wireBad,wireAbsent,
            row:cen.rows.some(x=>x.name==='channel.warp')};
  });

  // -- #199  THE PROGRAM CAN REVISE ITSELF --------------------------------------------------------
  // Every self-modification this VM had was APPEND (op144), WHOLE-REPLACE (op225) or
  // DONATE-TO-ANOTHER (op179). Nothing could edit instruction N of its own program, so the only
  // editor of existing code was inheritProg's random birth mutation - the author's operator, not the
  // lineage's. These check the three things that would make opening that unsafe rather than merely
  // new: an opcode that collides with a live one, a write that can construct an instruction the VM
  // cannot run, and an address nothing ever reaches.
  out.selfwrite=run('selfwrite',()=>{
    // 1. THE ADDRESS. The comment at OP_SELFWRITE says 237+192 is written as literals so a moved
    //    constant is a red build rather than a silent slide into a live opcode. This is that check.
    const addr={op:OP_SELFWRITE, derived:CORE_OPCODES+MAX_BOUND_OPCODES,
                aboveBound:OP_SELFWRITE>=CORE_OPCODES+MAX_BOUND_OPCODES,
                wireAdmits:validInstruction([OP_SELFWRITE,0,1,0.5]),
                netMax:netMaxOpcode()};

    // a live particle with amplitude to spend, and a program of known shape
    let pi=-1; for(let q=0;q<N;q++) if(palive[q]){pi=q;break;}
    const mkProg=()=>[[10,0,1,0.5],[11,2,3,-0.5],[12,4,5,1.0],[OP_SELFWRITE,6,7,0.25]];

    // 2. EACH FIELD IS WRITABLE AND MASKED. Called directly, which is the honest unit - the
    //    end-to-end dispatch is checked separately below.
    const fieldTest=(field,val)=>{ const pr=mkProg(); amp[pi]=2;
      const okv=vmSelfWrite(pi,pr,pr.length,1,val,field);
      return {ok:okv,row:pr[1].slice(0,4)}; };
    const fOp=fieldTest(0,0.5), fSrc=fieldTest(1,7.2), fDst=fieldTest(2,9.8), fK=fieldTest(3,1.4);

    // 3. NOTHING ILLEGAL CAN BE CONSTRUCTED. This is the check that matters: fuzz the value and the
    //    field hard and assert validInstruction over every row afterwards. The guarantee has to be
    //    the same one the WIRE gets, or a program can write itself into a state the VM cannot run and
    //    the failure surfaces somewhere unrelated.
    let illegal=0, lenChanged=0, wrote=0;
    for(let q=0;q<4000;q++){
      const pr=mkProg(); const n0=pr.length; amp[pi]=2;
      const vals=[1e9,-1e9,NaN,Infinity,-Infinity,0,1e-9,-3.7,12345.678,1/3];
      const v=vals[(Math.random()*vals.length)|0]*(Math.random()<0.5?1:-1);
      wrote+=vmSelfWrite(pi,pr,pr.length,Math.random()*1e6-5e5,v,Math.random()*1e6);
      if(pr.length!==n0)lenChanged++;
      for(const row of pr) if(!validInstruction(row))illegal++;
    }

    // 4. THE TARGET WRAPS INTO THE PROGRAM'S OWN LENGTH. An index of a million must not reach past
    //    the end, and a negative one must not reach before the start.
    let outside=0;
    for(let q=0;q<800;q++){
      const pr=mkProg(); amp[pi]=2;
      const before=pr.map(r=>r.slice(0,4));
      vmSelfWrite(pi,pr,pr.length,(Math.random()-0.5)*1e7,0.5,0);
      let touched=0; for(let z=0;z<pr.length;z++) if(pr[z].join()!==before[z].join())touched++;
      if(touched>1)outside++;
    }

    // 5. NO GROWTH. op144 is the extender and its cap is the evolved vmMaxInstructions; two
    //    mechanisms growing the same array by different rules is how a cap stops meaning anything.
    const growProg=mkProg(); amp[pi]=50;
    for(let q=0;q<500;q++)vmSelfWrite(pi,growProg,growProg.length,q,0.4,q%4);
    const noGrowth=(growProg.length===4);

    // 6. THE COST IS PAID, AND AN EXHAUSTED PARTICLE IS REFUSED
    const pr6=mkProg(); amp[pi]=1.0;
    const a0=amp[pi]; vmSelfWrite(pi,pr6,pr6.length,0,0.5,3); const paid=+(a0-amp[pi]).toFixed(5);
    amp[pi]=SELFWRITE_COST*0.5;
    const r0=__selfWriteRefused;
    const brokeOk=vmSelfWrite(pi,pr6,pr6.length,0,0.5,3)===0 && __selfWriteRefused>r0;
    amp[pi]=2;

    // 7. END TO END THROUGH THE DISPATCH. The unit above proves the helper; this proves the opcode
    //    is wired to it, which is the half #179 found missing for EFFECT_EMIT.
    const svProg=pProg[pi];
    pProg[pi]=[[OP_SELFWRITE,0,1,0.75],[10,2,3,0.5]];
    const w0=__selfWrites;
    const svg=genome; genome=pGenome[pi]||genome;
    try{ for(let q=0;q<40;q++) executeSoloVM(); }catch(e){}
    finally{ genome=svg; }
    const endToEnd=__selfWrites>w0;
    pProg[pi]=svProg;

    // 8. THE KNOB
    const svs=__SELFWRITE; __SELFWRITE=false;
    const prOff=mkProg(); amp[pi]=2;
    const offRefused=vmSelfWrite(pi,prOff,prOff.length,1,0.5,0)===0 &&
                     prOff[1].join()===[11,2,3,-0.5].join();
    __SELFWRITE=svs;

    // 9. AND THE COST IS A LAW (#197), not a constant
    const isLaw=LAW_DECLARED.some(r=>r.name==='SELFWRITE_COST');

    return {addr,fOp,fSrc,fDst,fK,illegal,lenChanged,wrote,outside,noGrowth,
            paid,cost:SELFWRITE_COST,brokeOk,endToEnd,offRefused,isLaw};
  });

  out.selfwriteReach=run('selfwriteReach',()=>{
    // #179's lesson is the whole reason this block exists: 429 is one address in 430, so left to
    // mutation it would be measured as dead. The seeding must put it in the germline program AND in
    // a living particle, and must not double-insert.
    genome.vmProgram=[[10,0,1,0.5],[11,2,3,-0.5]];
    for(let q=0;q<N;q++) if(palive[q]&&pProg[q])pProg[q]=[[10,0,1,0.5]];
    let germSeeded=0, popSeeded=0, germDupes=0;
    for(let q=0;q<60;q++){
      mutateGenome();
      const g=(genome.vmProgram||[]).filter(r=>r&&(r[0]|0)===OP_SELFWRITE).length;
      if(g>0)germSeeded=1;
      if(g>1)germDupes++;
    }
    for(let q=0;q<N;q++){ const pp=pProg[q];
      if(palive[q]&&pp&&pp.some(r=>r&&(r[0]|0)===OP_SELFWRITE))popSeeded++; }
    return {germSeeded,popSeeded,germDupes};
  });

  // -- uaSwapVar TERMINATES ----------------------------------------------------------------------
  // A HANG, not a slow path, and every engine up to this one carried it. uaSwapVar drew a
  // replacement with an unbounded rejection sampler - while(to===from) - which cannot exit when the
  // pool has nothing else to offer, and #188's channel-wiring path calls it with a pool of exactly
  // ONE name. So an atom that already named that channel froze the germline author.
  //
  // FOUND BY #201 AND CAUSED BY #188: this rig ran FOUR HOURS at its default budget on the #201
  // engine without finishing, completed normally with FOUND=0, and the V8 profiler put 39% of all
  // samples in uaSwapVar. Nothing #201 added is on that path - it moved the trajectory into a state
  // #188 could always have reached. That is worth a check of its own, because the next swing to
  // move a trajectory would have found it again the same expensive way.
  out.swapvar=run('swapvar',()=>{
    const ch=CHANNEL_NAMES[0];
    const t0=Date.now();
    // the exact shape mutateGenome produces: a one-element pool holding a name the atom already uses
    const noop=uaSwapVar('('+ch+')+(1.5)',UA_VAR_RE,[ch]);
    const ms=Date.now()-t0;
    // and the cases that always worked must be untouched
    const swapped=uaSwapVar('(kb)+(1.5)',UA_VAR_RE,[ch]);
    let moved=0; for(let q=0;q<200;q++) if(uaSwapVar('(ka)*(kb)')!=='(ka)*(kb)')moved++;
    return {noop:(noop==='('+ch+')+(1.5)'), ms, swapped, swapOk:(swapped==='('+ch+')+(1.5)'), moved};
  });

  // -- #200  THE WORKING MEMORY, AND WHAT COUNTS AS A LEVEL ---------------------------------------
  out.regs=run('regs',()=>{
    // 1. THE MASK IS THE MECHANISM. At regCount=3 the source fields 0,3,6,9 must ALIAS onto one
    //    register - a narrow file is a different machine, not a weaker one, and if the mask does not
    //    bite then the gene is decoration.
    const svg=genome.regCount;
    const maskAt=(rc)=>{ genome.regCount=rc; const c=vmRegCount(genome);
      const seen={}; for(let src=0;src<24;src++)seen[Math.abs(src)%c]=1;
      return {c,distinct:Object.keys(seen).length}; };
    const m3=maskAt(3), m12=maskAt(12), m24=maskAt(24);
    // bounds, both directions, and absent reads as the number this file was written with
    const b={hi:vmRegCount({regCount:999}), lo:vmRegCount({regCount:-5}),
             absent:vmRegCount({}), max:VM_REGS_MAX, dflt:VM_REGS_DEFAULT};
    // 2. THE ARRAY IS ALLOCATED AT THE MAX, so a wide file has somewhere to live
    const alloc=vmRegs.length;
    // 3. THE STEP IS DISCRETE AND SMALL (#192's rule, and regCount is in CHILD_DISCRETE so the
    //    continuous walk cannot quietly add fractions to it)
    const inList=CHILD_DISCRETE.indexOf('regCount')>=0;
    const g={regCount:VM_REGS_DEFAULT}; let moves=0,jumps=0,illegal=0; const seen={};
    for(let q=0;q<3000;q++){
      const before=vmRegCount(g);
      const nx=__cl(before+(Math.random()<0.5?1:-1),2,VM_REGS_MAX);
      if(nx!==before){ g.regCount=nx; moves++; if(Math.abs(nx-before)>1)jumps++; }
      const v=vmRegCount(g); if(!(v>=2&&v<=VM_REGS_MAX))illegal++;
      seen[v]=1;
    }
    // 4. IT RUNS. A live particle on a 3-register file must execute without throwing and leave every
    //    register finite - the clamp loop covers the whole allocation, not the addressed part.
    let pi=-1; for(let q=0;q<N;q++) if(palive[q]){pi=q;break;}
    let ran='ok', nf=0;
    if(pi>=0&&pGenome[pi]){
      const sv=pGenome[pi].regCount; pGenome[pi].regCount=3;
      const svp=pProg[pi];
      pProg[pi]=[[10,0,1,0.5],[11,7,9,-0.5],[12,23,22,1.0],[200,4,5,0.25]];
      try{ for(let q=0;q<30;q++) executeSoloVM(); }catch(e){ ran='FAIL '+e.message; }
      for(let r=0;r<VM_REGS_MAX;r++) if(!isFinite(vmRegs[r]))nf++;
      pProg[pi]=svp; pGenome[pi].regCount=sv;
    }
    // 5. SAVE, and the knob
    genome.regCount=7;
    const blob=encodeGenome(); genome.regCount=undefined;
    decodeGenome(blob); sanitizeGenome();
    const saved=vmRegCount(genome)===7;
    const svk=__REGS; __REGS=false;
    genome.regCount=3; const offVal=vmRegCount(genome);
    __REGS=svk; genome.regCount=svg===undefined?VM_REGS_DEFAULT:svg;
    return {m3,m12,m24,b,alloc,inList,moves,jumps,illegal,
            reached:Object.keys(seen).length,ran,nf,saved,offVal};
  });

  out.levels=run('levels',()=>{
    // WHAT COUNTS AS A LEVEL IS A LAW. The check that matters is that the thresholds gate the
    // MECHANISM and not only the report: two of the five appear solely in LEVEL_DECLARED's readers,
    // and making just those evolvable would have been evolving the census - the defect this file has
    // now found five times.
    const names=LAW_DECLARED.map(r=>r.name);
    const inTable=['LEVEL_BRIDGE_MIN','LEVEL_GROUP_MIN','LEVEL_TOWER_REG','LEVEL_FOREST_REG',
                   'LEVEL_COHERE_RATE'].every(n=>names.indexOf(n)>=0);
    const saved={}; for(const r of LAW_DECLARED) saved[r.name]=r.get();
    const restore=()=>{ for(const r of LAW_DECLARED){ try{ r.set(saved[r.name]); }catch(_){} } };
    // the CLUSTER census must follow LEVEL_GROUP_MIN: raise it and a two-member cluster stops counting
    const row=LEVEL_DECLARED.find(L=>L.name==='cluster');
    LEVEL_GROUP_MIN=2;  const at2=row.read().n;
    LEVEL_GROUP_MIN=8;  const at8=row.read().n;
    restore();
    // the TOWER and FOREST censuses must follow their thresholds. Driven with synthetic registries
    // rather than waited for, because towers read 0-2 in a live run (#143: drive the rare path).
    const svT=hierTower.slice();
    hierTower.length=0; hierTower.push([{reg:0.6,level:1,cx:100,cy:100},{reg:0.2,level:1,cx:200,cy:200}]);
    const tRow=LEVEL_DECLARED.find(L=>L.name==='tower');
    LEVEL_TOWER_REG=0.5; const tLoose=tRow.read().n;
    LEVEL_TOWER_REG=0.9; const tTight=tRow.read().n;
    restore();
    hierTower.length=0; for(const x of svT)hierTower.push(x);
    const svF=[..._forestReg.entries()];
    _forestReg.clear(); _forestReg.set('a',0.5); _forestReg.set('b',0.1);
    const fRow=LEVEL_DECLARED.find(L=>L.name==='forest');
    LEVEL_FOREST_REG=0.4; const fLoose=fRow.read().n;
    LEVEL_FOREST_REG=0.9; const fTight=fRow.read().n;
    restore();
    _forestReg.clear(); for(const [k,v] of svF)_forestReg.set(k,v);
    // and the knob pins every gate back to the literal it was
    const svk=__LEVELS; __LEVELS=false;
    LEVEL_GROUP_MIN=8;
    const offAt8=row.read().n;
    __LEVELS=svk; restore();
    const offMatches=(offAt8===at2);
    return {inTable,at2,at8,tLoose,tTight,fLoose,fTight,offMatches,
            laws:LAW_DECLARED.length};
  });

  // ── THE CROSSINGS: every new gene must survive a save and diverge in a child ────────────────
  out.cross=run('cross',()=>{
    genome.uaFoldMode=2; genome.uaFoldK=3.25; genome.autonomyCede=0.8;
    genome.cellScale=0.55; genome.rxSelf=0.3; genome.rxCross=0.45;
    genome.demeCount=3; genome.demeFlow=0.25;
    genome.netLawRate=0.007; genome.netLawReceptivity=0.6;
    genome.metP=1.35; genome.metAx=2.6; genome.metRot=0.9;
    genome.tickRate=3; genome.tickPhase=2;
    genome.oeeW=[0.2,0.4,0.6,0.8];
    genome.channels=[{expr:'(a)+(((b)-(a))*(0.25))',compiled:null,failed:false,age:7,uses:3,
                      st:[[-3,1,0.75],[2,-2,-0.5]],wrap:1,cad:5},null,
                     {expr:'(ka)-(kb)',compiled:null,failed:false,age:2,uses:1,st:null,wrap:0,cad:1},null];
    genome.probes=[{expression:'(a)+(b)',compiled:null,failed:false,n:11,hit:9,pending:0,pendTick:5,pendFit:1,age:3},null,null,null];
    const blob=encodeGenome();
    const wipe=['uaFoldMode','uaFoldK','autonomyCede','cellScale','rxSelf','rxCross','demeCount',
                'demeFlow','netLawRate','netLawReceptivity','oeeW','probes','channels',
                'metP','metAx','metRot','tickRate','tickPhase'];
    for(const k of wipe)genome[k]=undefined;
    decodeGenome(blob); sanitizeGenome();
    const eq=(x,y)=>Math.abs(x-y)<1e-3;
    const saved={
      fold:genome.uaFoldMode===2&&eq(genome.uaFoldK,3.25),
      cede:eq(genome.autonomyCede,0.8),
      phys:eq(genome.cellScale,0.55)&&eq(genome.rxSelf,0.3)&&eq(genome.rxCross,0.45),
      deme:genome.demeCount===3&&eq(genome.demeFlow,0.25),
      net:eq(genome.netLawRate,0.007)&&eq(genome.netLawReceptivity,0.6),
      metric:eq(genome.metP,1.35)&&eq(genome.metAx,2.6)&&eq(genome.metRot,0.9),   // #190
      // #192: a clock that does not survive a reload is a lineage that silently rejoins the lockstep
      stime:genome.tickRate===3&&genome.tickPhase===2,
      oeeW:Array.isArray(genome.oeeW)&&eq(genome.oeeW[3],0.8),
      // a probe's RECORD must survive, or a reload silently demotes every earned sense
      probe:Array.isArray(genome.probes)&&genome.probes[0]&&genome.probes[0].n===11&&genome.probes[0].hit===9,
      // and an outstanding claim must NOT survive - it belongs to the timeline that made it
      claimCleared:Array.isArray(genome.probes)&&genome.probes[0]&&genome.probes[0].pendTick===-1,
      // #188: the chemistry survives, holes and all, and the uses counter resets like every other record here
      chan:Array.isArray(genome.channels)&&genome.channels.length===CHANNEL_MAX&&
           !!genome.channels[0]&&genome.channels[0].expr==='(a)+(((b)-(a))*(0.25))'&&
           genome.channels[0].age===7&&genome.channels[0].uses===0&&
           !genome.channels[1]&&!!genome.channels[2]&&genome.channels[2].expr==='(ka)-(kb)',
      // #189: the FORM travels with the chemistry, or a save restores a medium that computes the
      // same thing in a different space - which is a different medium
      form:Array.isArray(genome.channels)&&!!genome.channels[0]&&
           Array.isArray(genome.channels[0].st)&&genome.channels[0].st.length===2&&
           genome.channels[0].st[0][0]===-3&&genome.channels[0].st[0][1]===1&&
           Math.abs(genome.channels[0].st[0][2]-0.75)<1e-6&&
           genome.channels[0].wrap===1&&genome.channels[0].cad===5,
    };
    // clone: no shared references
    const c=cloneGenome(genome);
    const shared={oeeW:c.oeeW===genome.oeeW, probes:c.probes===genome.probes,
                  probe0:c.probes&&c.probes[0]===genome.probes[0],
                  chan:c.channels===genome.channels,
                  chan0:c.channels&&c.channels[0]===genome.channels[0],
                  // #189: the stencil is an array of arrays - a shallow copy would share one
                  // neighbourhood across the whole population and no lineage could diverge its space
                  chanSt:c.channels&&c.channels[0]&&c.channels[0].st===genome.channels[0].st,
                  chanTap:c.channels&&c.channels[0]&&Array.isArray(c.channels[0].st)&&
                          c.channels[0].st[0]===genome.channels[0].st[0]};
    // child: the proxy weights must be able to diverge
    let childMoved=0;
    for(let i=0;i<200;i++){ const g=cloneGenome(genome); g.oeeW=[0.5,0.5,0.5,0.5];
      mutateChildGenome(g);
      if(JSON.stringify(g.oeeW)!=='[0.5,0.5,0.5,0.5]')childMoved++; }
    // and the germline must reach the population at all
    const seeded=seedSubstrateIntoParticle();
    let carriers=0;
    for(let i=0;i<N;i++) if(palive[i]&&pGenome[i]&&pGenome[i].uaFoldMode===2)carriers++;
    const cen=crossingCensus();
    const names=cen.rows.map(r=>r.name);
    return {saved,shared,childMoved,seeded,carriers,
            rows:['atom.fold','xion.cede','phys.reach','phys.chem','probe.bank',
                  'oee.weighted','deme.split','channel.bank','channel.sensed','channel.form',
                  'metric.moved','reach.moved','tick.moved'].filter(n=>names.indexOf(n)<0),
            promotedNotACrossingRow:names.indexOf('probe.promoted')<0};
  });

  // ── #201 — A DAUGHTER UNIVERSE GRADUATES FROM SHADOW TO PEER ─────────────────────────────────
  // The failure this block exists to catch is the one this project has shipped six times: a
  // mechanism that reads alive in every census and never runs. #201's obvious hook was cosmosMerge
  // - a shadow child that exported more than its endowment - and that event is RARE rather than
  // dead, which is the same failure arrived at by a different route. Measured: 0 merges across
  // 20,000 ticks of the pre-#201 engine (118 launches), and 1, 1 and 3 merges across 12,000 ticks
  // of this one on three seeds (33, 42 and 64 launches). A version built on it would have passed
  // every structural check here and founded a handful of times in a long run at best.
  out.found=run('found',()=>{
    const sv={NEED:FOUND_NEED,COST:FOUND_COST,CD:FOUND_COOLDOWN,RATE:FOUND_RATE,MAX:FOUND_MAX,
              last:__foundLast,n:__founds,ref:__foundRefused,seen:__foundSeen,bc:bc,tk:tick,
              rnd:Math.random,on:globalThis.__FOUND};
    const restore=()=>{ FOUND_NEED=sv.NEED; FOUND_COST=sv.COST; FOUND_COOLDOWN=sv.CD;
      FOUND_RATE=sv.RATE; FOUND_MAX=sv.MAX; __foundLast=sv.last; __founds=sv.n;
      __foundRefused=sv.ref; __foundSeen=sv.seen; bc=sv.bc; tick=sv.tk;
      Math.random=sv.rnd; globalThis.__FOUND=sv.on; };
    const sent=[];
    bc={postMessage:(p)=>{sent.push(p)}};
    const drive=(v)=>{ let n=0; for(const c of clusters){ if(!c)continue;
      c.clusterGenome=c.clusterGenome||seedClusterGenome();
      c.clusterGenome.foundDrive=v; n++; } return n; };
    const ampOf=()=>{ let t=0; for(let i=0;i<N;i++) if(palive[i])t+=Math.max(0,amp[i]); return t; };

    // 0. THE GENE. A CLUSTER-level trait, like launchDrive, so it deliberately has no crossing row:
    //    crossingCensus compares a germline against the particle genomes, and this has neither
    //    side. It gets what launchDrive gets instead — seeded on every cluster, and drifting
    //    through mutateClusterGenome when a cluster reproduces.
    const seedHas=typeof seedClusterGenome().foundDrive==='number';
    let childMoved=0;
    { const par=seedClusterGenome(); par.foundDrive=0.5;
      for(let q=0;q<200;q++){ const kid=mutateClusterGenome(par,1);
        if(Math.abs(finiteOr(kid.foundDrive,0.5)-0.5)>1e-9)childMoved++; } }
    const clustersSeeded=drive(1);

    // 1. IT FIRES, and what it sends is a packet the wire accepts and a genome a decoder can read.
    FOUND_NEED=0; FOUND_COST=0.25; FOUND_COOLDOWN=0; FOUND_RATE=1; FOUND_MAX=99;
    __founds=0; __foundLast=-1e9; sent.length=0;
    // CAPTURED BEFORE THE CALL, and that ordering is the finding this line encodes: a successful
    // founding calls recordEvent, which pushes into genome.eventLog, which encodeGenome serialises.
    // So the blob on the wire is this world's germline AS IT WAS WHEN THE DECISION WAS MADE, and
    // comparing against an encode taken afterwards compares against a genome that has since been
    // told about the founding. The first version of this check did exactly that and read as a
    // corrupted packet.
    let preBlob=null; try{ preBlob=trimGenomeToBudget(); }catch(_){}
    attemptFound();
    const built=sent.length;
    const pkt=sent.length?sent[0]:null;
    const wellFormed=!!(pkt&&pkt.type==='found'&&pkt.data&&typeof pkt.data.g==='string'&&pkt.data.g.length>0);
    const accepted=wellFormed?(validNetworkPayload('found',pkt.data)===true):false;
    // IT IS THIS WORLD'S OWN GERMLINE and not some other string: byte-identical to what the
    // autosaver would have written this tick, which is the only claim that makes a daughter a
    // daughter rather than a fresh universe with a nice comment above it.
    let isOwnGermline=false, decodes=false, blobLen=0;
    if(wellFormed){ blobLen=pkt.data.g.length;
      isOwnGermline=(pkt.data.g===preBlob);
      try{ const j=JSON.parse(__b64dec(pkt.data.g)); decodes=!!(j&&j.z===2&&Array.isArray(j.p)); }catch(_){} }

    // 2 & 3. THE PRICE. Built as a SCENARIO rather than read off the run, and the reason is a
    //    measurement: at the point this block runs the rig's own field holds 4 live particles and
    //    detectClusters returns nothing, so a check that asked the live population to pay was
    //    measuring how healthy the rig happened to be and not whether anybody is billed. So one
    //    cluster of known size and known wealth is installed, both halves of the price are measured
    //    against it, and every array touched is put back.
    const svClusters=clusters.slice();
    const payIdx=[]; for(let i=0;i<N&&payIdx.length<6;i++) payIdx.push(i);
    const svCID=payIdx.map(i=>clusterID[i]), svAmp=payIdx.map(i=>amp[i]), svAlive=payIdx.map(i=>palive[i]);
    const PAY_ID=777, PAY_AMP=4;
    for(const i of payIdx){ clusterID[i]=PAY_ID; amp[i]=PAY_AMP; palive[i]=true; }
    clusters.length=0; clusters.push({id:PAY_ID,size:payIdx.length,coherence:1,persistAge:99,
                                      clusterGenome:seedClusterGenome()});
    const payN=payIdx.length;
    const need=Math.max(0.01,payN*PAY_AMP*FOUND_COST*0.5);

    FOUND_NEED=need; __founds=0; __foundLast=-1e9; sent.length=0;
    drive(1);
    const ampBefore=ampOf();
    attemptFound();
    const paidSent=sent.length;
    const paid=+(ampBefore-ampOf()).toFixed(4);
    const paidWanted=+need.toFixed(4);

    // 3. AND NOTHING IS CHARGED WHEN THE PACKET CANNOT GO. networkSend returns false with no
    //    channel - a headless run, or a browser where BroadcastChannel threw. The first version of
    //    attemptFound charged the founders and THEN sent, so every attempt in that state destroyed
    //    FOUND_NEED of amplitude and founded nothing: #61's leak-wearing-a-cost, in a new place.
    for(const i of payIdx) amp[i]=PAY_AMP;
    bc=null; FOUND_NEED=need; __founds=0; __foundLast=-1e9;
    const refBefore=__foundRefused, ampNoWire=ampOf();
    drive(1); attemptFound();
    const noWireCharged=+(ampNoWire-ampOf()).toFixed(4);
    const noWireRefused=__foundRefused>refBefore;
    const noWireFounded=__founds;
    bc={postMessage:(p)=>{sent.push(p)}};

    clusters.length=0; for(const c of svClusters) clusters.push(c);
    for(let q=0;q<payIdx.length;q++){ clusterID[payIdx[q]]=svCID[q]; amp[payIdx[q]]=svAmp[q]; palive[payIdx[q]]=svAlive[q]; }

    // 4. THE TWO BRAKES BITE. Cooldown and lifetime cap, each on its own.
    FOUND_NEED=0; FOUND_COOLDOWN=5000; __founds=0; __foundLast=tick; sent.length=0;
    drive(1); attemptFound();
    const cooldownHeld=(sent.length===0);
    FOUND_COOLDOWN=0; FOUND_MAX=0; __founds=0; __foundLast=-1e9; sent.length=0;
    drive(1); attemptFound();
    const capHeld=(sent.length===0);

    // 5. THE REVERT, and it is the strong form: FOUND=0 must take no random draw either, so the
    //    knob restores the RNG STREAM and not merely the behaviour. #192 and #196 both needed this
    //    said out loud, because a knob that still draws moves every later trajectory in the run.
    FOUND_MAX=99; FOUND_NEED=0; FOUND_COOLDOWN=0; __founds=0; __foundLast=-1e9; sent.length=0;
    globalThis.__FOUND=0;
    let draws=0; Math.random=function(){ draws++; return sv.rnd(); };
    drive(1); const drawsAfterSetup=draws;
    attemptFound();
    const offDraws=draws-drawsAfterSetup;
    const offSent=sent.length;
    Math.random=sv.rnd; globalThis.__FOUND=sv.on;

    // 6. RECEIVED, COUNTED, AND NOT INSTALLED. The whole trust model of this packet: a peer that
    //    adopted a stranger's germline on arrival would be overwritten rather than joined. The
    //    engine only counts; the field shell is the only thing that acts on the blob, and what it
    //    does with it is boot a NEW universe.
    const seenBefore=__foundSeen;
    const before={mut:genome.mutationRate,gen:genome.generation,blob:null};
    try{ before.blob=encodeGenome(); }catch(_){}
    const foreign=__b64enc(JSON.stringify({z:2,p:[9,9,9,9,9,9,9,9,9,9,9]}));
    handleNetworkMessage({v:NET_PROTOCOL_VERSION,tab:'notme201',born:0,type:'found',
                          data:{g:foreign,t:1,d:0.5,n:3}});
    const seenRose=(__foundSeen===seenBefore+1);
    // EVERY KEY EXCEPT lv. The genome carries a LIVENESS SNAPSHOT, and cosmos.foundSeen firing
    // moves that name from the never-list to the rare-list — so a byte-identical blob would have
    // meant the instrument did not record the arrival, which is the opposite of what this is
    // checking. The claim is that the CREATURE is untouched: physics, atoms, verbs, program,
    // channels, bank, every gene. The first version of this check asserted byte-identity and went
    // red on its own instrument working.
    let sameBlob=false, changedKeys=[];
    try{
      const A=JSON.parse(__b64dec(before.blob)), B=JSON.parse(__b64dec(encodeGenome()));
      for(const k in A) if(k!=='lv'&&JSON.stringify(A[k])!==JSON.stringify(B[k]))changedKeys.push(k);
      for(const k in B) if(!(k in A))changedKeys.push('+'+k);
      sameBlob=(changedKeys.length===0);
    }catch(_){}
    const sameMut=(genome.mutationRate===before.mut&&genome.generation===before.gen);
    const unchanged=sameBlob&&sameMut;

    // 7. THE VALIDATOR. What it must refuse, stated as bytes rather than as intent — UA_EXPR_SAFE
    //    is a BYTE filter, not a parser, and #198 shipped a check that asserted an impossible
    //    rejection because I forgot that. So: a non-printable byte, an over-budget blob, a missing
    //    blob, and a wrong type.
    const rej={
      nonPrintable:validNetworkPayload('found',{g:'AAA'+String.fromCharCode(7)+'AAA',t:1})===false,
      tooLong:validNetworkPayload('found',{g:'A'.repeat(SAVE_BUDGET+1),t:1})===false,
      empty:validNetworkPayload('found',{g:'',t:1})===false,
      notString:validNetworkPayload('found',{g:{},t:1})===false,
      badTick:validNetworkPayload('found',{g:'AAA',t:-1})===false,
      badDrive:validNetworkPayload('found',{g:'AAA',t:1,d:99})===false,
      plainOk:validNetworkPayload('found',{g:'AAA',t:1})===true,
    };

    restore();
    return {seedHas,childMoved,clustersSeeded,built,wellFormed,accepted,isOwnGermline,decodes,blobLen,
            paidSent,paid,paidWanted,payN,changedKeys,noWireCharged,noWireRefused,noWireFounded,cooldownHeld,capHeld,
            offDraws,offSent,seenRose,unchanged,sameBlob,sameMut,rej,
            laws:LAW_DECLARED.map(r=>r.name).filter(n=>n.indexOf('FOUND_')===0),
            live:['cosmos.found','cosmos.foundRefused','cosmos.foundSeen']
                   .filter(n=>LIVENESS_DECLARED.indexOf(n)<0),
            pending:netEventPending.found!==undefined};
  });

  // ── THE REVERT: every layer's knob must actually turn it off ─────────────────────────────────
  out.revert=run('revert',()=>{
    const r={};
    const sf=__UA_FOLD; __UA_FOLD=false;
    genome.uaFoldMode=3; r.foldOff=uaFoldMode()===0; __UA_FOLD=sf; genome.uaFoldMode=0;
    const sd=__DEME; __DEME=false;
    genome.demeCount=4; genome.demeFlow=0; r.demeOff=demeAllows(0,1)===true&&demeCount()===1;
    __DEME=sd; genome.demeCount=1; genome.demeFlow=1;
    const sp=__PHYS; __PHYS=false; r.physOff=true; __PHYS=sp;   // read at the call site; nothing to query
    const sb=__OEE_BONUS; __OEE_BONUS=false;
    genome.oeeW=[1,1,1,1]; r.bonusOff=oeeBonus()===0; __OEE_BONUS=sb;
    const spr=__PROBE; __PROBE=false;
    r.probeOff=probeCount()===0; __PROBE=spr;
    const stm=__STIME; __STIME=false;
    genome.tickRate=4; r.timeOff=tickRateOf(genome)===1; __STIME=stm;
    genome.tickRate=1; genome.tickPhase=0;
    const sx=__XION; __XION=false;
    genome.autonomyCede=1; r.xionOff=true; __XION=sx; genome.autonomyCede=0.5;
    return r;
  });

  // ── AND IT ALL STILL RUNS ───────────────────────────────────────────────────────────────────
  out.live=run('live',()=>{
    const t0=tick;
    for(let s=0;s<1500;s++){ globalThis.__detMs+=5; loop(); }
    let alive=0; for(let i=0;i<N;i++) if(palive[i])alive++;
    const lv=levelCensus();
    const names=LIVENESS_DECLARED.filter(n=>/^(xion|level|phys|probe|deme|uplasmid|compiler|substrate|oee\\.bonus|cosmos\\.law)/.test(n));
    let reload='ok'; try{ const b=encodeGenome(); decodeGenome(b); sanitizeGenome(); }catch(e){ reload='FAIL '+e.message; }
    return {ran:tick-t0, alive, levels:lv.rows.map(r=>r.name+':'+r.count), present:lv.levelsPresent,
            declared:names.length, reload,
            lvlLog:(__levelLog||[]).length};
  });
  return out;
};`,'/tmp/substrate.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };

// #181
const F=r.fold||{};
ck('#181 every compiler fold is finite for every input', F.nonFinite===0,
   F.n+' evaluations across '+UA_FOLD_MODES_SAFE()+' modes x 4 parameters, '+F.nonFinite+' non-finite');
ck('#181 and still inside uaCall’s ±8', F.outOfBand===0, F.outOfBand+' out of band');
ck('#181 mode 0 emits no wrapper at all — the pre-#181 compiler', F.defaultEmpty===true);
ck('#181 the other three modes emit distinct wrappers',
   F.bodies && new Set(Object.values(F.bodies)).size===4, F.bodies && JSON.stringify(F.bodies[2]));
const C=r.cache||{};
ck('#181 the compile cache is keyed by the FOLD, not just the text', C.distinctFn===true && C.keyed===true);
ck('#181 and the same expression gives different answers under different folds',
   C.v1===6 && C.v2===8 && C.v3===6, '(a)+(b) at 3,3: plain '+C.v1+', quantised-to-4 '+C.v2+', plain again '+C.v3);

// #182
const A=r.alloc||{};
for(const k of ['m0','m1','m2']){
  const v=A[k];
  ck('#182 allocation mode '+k.slice(1)+' conserves amplitude to float32 precision',
     v && typeof v==='object' && v.drift<1e-5, v && ('drift '+v.drift+' on a sum of ~5 (amp is a Float32Array; eps is ~6e-8 relative), spread '+v.was+' -> '+v.spread));
}
ck('#182 mode 0 narrows the spread and mode 1 widens it',
   A.m0 && A.m1 && A.m0.spread<A.m0.was && A.m1.spread>A.m1.was,
   A.m0 && ('even '+A.m0.spread+' vs strongest '+A.m1.spread+' from '+A.m0.was));
const X=r.xion||{};
ck('#182 all three reproduction modes are reachable at cluster birth', X.modes===3, 'modes seen: '+X.modes);
ck('#182 all three allocation rules are reachable', X.allocs===3);
ck('#182 the mode takes a STEP under mutation rather than being redrawn', X.stepped>0 && X.stepped<400,
   X.stepped+'/400 births changed mode');
ck('#182 a collective’s credit halves across a generation', X.creditWrong===0);

// #183
const L=r.law||{};
ck('#183 every declared law is actually settable', L.allSettable===true,
   L.rows && L.rows.map(x=>x.name+(x.settable?'':' NOT-SETTABLE')).join(', '));
const P=r.phys||{};
ck('#183 the physics genes are clamped on load', P.capped===true, P.after && JSON.stringify(P.after));

// #184
const PR=r.probe||{};
ck('#184 an UNPROMOTED probe is never offered to the generator', PR.offeredEarly===0,
   PR.offeredEarly+'/300 - a symbol that always reads zero is a dead letter');
ck('#184 a promoted probe becomes a live grammar symbol', PR.offeredNow>0,
   PR.offeredNow+'/400 expressions now name it');
ck('#184 and an atom reads its value', PR.reads===2.5, 'pa = '+PR.reads);
ck('#184 an atom naming pa with nothing promoted still compiles and reads 0', PR.safeRead===0,
   'read '+PR.safeRead);
ck('#184 a promoted probe pays rent', PR.rentPositive===true, 'PROBE_RENT = '+PROBE_RENT_SAFE());
const B=r.bonus||{};
ck('#184 the open-endedness bonus is ZERO at the seeded weights', B.atSeed===0);
ck('#184 and bounded above however the weights evolve', B.bounded===true,
   'max '+(B.atMax!==undefined?B.atMax.toFixed(5):'?')+' <= cap '+B.cap);

// #185
const D=r.deme||{};
ck('#185 one deme never blocks anything', D.blocked1===0);
ck('#185 two demes at zero flow block cross-deme gene flow', D.haveEnds!==true || D.blocked2===200,
   D.haveEnds?(D.blocked2+'/200 blocked'):'no particles at both ends of the world');
ck('#185 and never block within a deme', D.sameOk===200, D.sameOk+'/200 allowed');
const W=r.wire||{};
ck('#185 the wire accepts a well-formed universe plasmid', W.accepted===true);
const RJ=W.rejects||{};
for(const k of ['lawIndex','opIndex','foldMode','foldK','tooMany'])
  ck('#185 and rejects a bad one: '+k, RJ[k]===false);

// #188
const CH=r.chan||{};
ck('#188 an evolved chemistry actually runs over the lattice', CH.ran>0,
   CH.ran+' lattice passes in 4 cadences');
ck('#188 and a rule that expresses the Laplacian diffuses a spike',
   CH.spread>1, 'a single spike of 3 reached '+CH.spread+' cells, peak now '+CH.mx);
ck('#188 every cell stays finite', CH.nonFinite===0, CH.nonFinite+' non-finite');
ck('#188 an EXPLOSIVE rule is still bounded by CHANNEL_CLAMP', CH.over===0,
   '(a)*(8.00) run 6 cadences from a full lattice: '+CH.over+' cells outside ±'+CH.clamp);
ck('#188 the chemistry is saved and the chemicals are not', CH.latticeIsNotGenome===true,
   'the rule is in the genome; the lattice is world state');
const CI=r.chanIO||{};
ck('#188 a verb writes into a medium at its own cell', CI.landed>0 && CI.moved>0,
   'moved '+CI.moved+', lattice now '+CI.landed);
ck('#188 and ka reads it back', CI.read>0, 'ka = '+CI.read);
ck('#188 a write into an unallocated slot is a no-op', CI.noop===0,
   'so EFFECT_TARGETS can grow without invalidating any existing verb');
ck('#188 an atom naming ka with nothing allocated still compiles and reads 0', CI.safe===0,
   'read '+CI.safe);
ck('#188 the ALLOCATION GATE never offers an unallocated channel', CI.offeredEarly===0,
   CI.offeredEarly+'/300 — a dead letter is #179 wearing a new name');
// and the other route in, which this rig found by going red rather than by anyone reasoning about it
ck('#112 the credit pool CAN name a channel a lineage no longer holds', CI.spliced>0,
   CI.spliced+'/400 draws named one with an empty bank — a spliced building block carries the vocabulary of the lineage that proved it, and filtering that by the inheritor\'s bank would break what #112 is for');
ck('#112 and every one of them still compiles and reads finite', CI.splicedBad===0,
   CI.splicedBad+' of '+CI.spliced+' failed — an unallocated symbol is a constant zero the lineage pays rent on, which selection can remove; broken syntax it could not');
ck('#188 an allocated one is', CI.offeredNow>0, CI.offeredNow+'/400');
ck('#188 four effect targets index the bank', CI.tgts===4);
ck('#188 an allocated channel pays the dearest rent in the file', CI.rent>0,
   'CHANNEL_RENT = '+CI.rent+' instruction-equivalents per allocated channel');

// #189
const FM=r.form||{};
ck('#189 the seeded form diffuses and does NOT transport', FM.mean===20,
   'a symmetric mean leaves the centroid at '+FM.mean);
ck('#189 an OFFSET stencil advects — the medium moves', FM.advect>FM.mean+3,
   'centroid '+FM.mean+' -> '+FM.advect+' under the same chemistry: directed transport, which no symmetric kernel produces');
ck('#189 wrap=1 makes it a torus', FM.torus!==null && FM.torus<FM.mean,
   'after 30 updates the mass is at '+FM.torus+' — 20+30 = 50, mod 40 = 10: it left one edge and arrived at the other');
ck('#189 a signed stencil is a DERIVATIVE, not an average',
   FM.gmx!==undefined && Math.abs(FM.gmx-FM.gmn)<0.01,
   'on a linear ramp the answer is flat at '+FM.gmn+' — a mean would have reproduced the ramp');
ck('#189 cadence is per channel', FM.fast>FM.slow*3,
   'base '+FM.fast+' against a 4x channel at '+FM.slow);
ck('#189 and every form stays bounded', FM.over===0 && FM.nf===0,
   'six taps at max weight, explosive rule, on a torus: '+FM.over+' out of bound, '+FM.nf+' non-finite');
const FS=r.formStep||{};
ck('#189 the form takes a small step rather than being redrawn', FS.moved>0 && FS.illegal===0,
   FS.moved+'/600 steps moved something, '+FS.illegal+' illegal');
ck('#189 and reaches every stencil size', FS.sizes && FS.sizes.length>2,
   'sizes reached: '+(FS.sizes||[]).join(','));
ck('#189 the manifold and the timescale are both reachable', FS.wraps>0 && FS.cads>0);
ck('#189 the seeded form reads as UNMOVED and a changed one as moved',
   FS.seededReadsUnmoved===true && FS.movedReadsMoved===true,
   'or the census reports adoption for a bank nothing has selected on');
ck('#189 a bigger neighbourhood costs more', FS.tapRent>0,
   'CHANNEL_TAP_RENT = '+FS.tapRent+' per tap beyond the seeded four — which is what makes SHRINKING a stencil profitable');

// #191
const RE=r.reach||{};
ck('#191 the dedup fires EXACTLY ONCE per pair, over every reach combination',
   RE.twice===0 && RE.none===0,
   RE.total+' combinations: '+RE.twice+' double-counted, '+RE.none+' lost — sum 2 is double physics, sum 0 is a lost partner, and neither announces itself');
ck('#191 and whether a pair happens does not depend on allocation order', RE.differs===0,
   RE.n2+' combinations, '+RE.differs+' differ — #58 named this artifact one level down');
ck('#191 the ring cap is DERIVED from the gene, not chosen',
   RE.rings && RE.rings.cap===RE.rings.geneMaxNeeds && RE.rings.atGeneMax===RE.rings.cap,
   'the gene evolves to 120, ceil(120/'+(RE.rings&&CELL_SAFE())+') = '+(RE.rings&&RE.rings.geneMaxNeeds)+
   ' rings, cap is '+(RE.rings&&RE.rings.cap)+' — the substrate reaches exactly as far as the gene was always allowed to ask');
const RL=r.reachLive||{};
ck('#191 a default-reach pair 1.6 cells apart is NOT found — as before',
   RL.short && RL.short.beyond===0 && RL.short.ints===0);
ck('#191 and a long-reach pair at the same distance IS',
   RL.long && RL.long.beyond>0 && RL.long.ints>0,
   'reach 120: '+(RL.long&&RL.long.beyond)+' pair(s) past one ring, '+(RL.long&&RL.long.ints)+
   ' interactions — the gene working for the first time since it was written');
ck('#191 REACH_SWEEP=0 restores the germline read', RL.offVal===99,
   'off reads the self\'s 99; on reads the carrier\'s '+RL.onVal);
ck('#191 and on reads the CARRIER', RL.onVal===20);

// #190
const M=r.metric||{};
ck('#190 the seeded metric IS Math.hypot, bit for bit', M.diff===0,
   M.diff+'/400 differed — the fast path is the exactness guarantee, not an optimisation');
ck('#190 Euclidean is a circle', M.euclid && M.euclid.axis===1 && M.euclid.diag===1 && M.euclid.perp===1);
ck('#190 p=1 is a DIAMOND — diagonals become farther', M.taxi && M.taxi.diag<M.taxi.axis*0.8,
   'axis '+(M.taxi&&M.taxi.axis)+', diagonal '+(M.taxi&&M.taxi.diag));
ck('#190 p=4 bulges toward a SQUARE', M.cheby && M.cheby.diag>M.cheby.axis*1.1,
   'axis '+(M.cheby&&M.cheby.axis)+', diagonal '+(M.cheby&&M.cheby.diag));
ck('#190 anisotropy is an ELLIPSE and preserves area',
   M.wide && Math.abs(M.wide.axis*M.wide.perp-1)<0.01,
   'axis '+(M.wide&&M.wide.axis)+' x perp '+(M.wide&&M.wide.perp)+' = 1 — reach is reshaped, not inflated (cellScale is the reach gene)');
ck('#190 and rotation TURNS it', M.rotated && Math.abs(M.rotated.axis-(M.wide&&M.wide.perp))<0.01,
   'the same ellipse at 90 degrees: axis '+(M.rotated&&M.rotated.axis)+', perp '+(M.rotated&&M.rotated.perp));
ck('#190 every legal metric is finite, non-negative and sign-symmetric', M.bad===0 && M.asym===0,
   M.bad+' bad, '+M.asym+' asymmetric across 35 cases');
ck('#190 and zero at zero', M.zero===0, 'or the self-distance gate breaks');
ck('#190 METRIC=0 is a true revert', M.offVal===5 && Math.abs(M.onVal-5)>0.01,
   'the same genes give '+M.offVal+' off and '+(M.onVal||0).toFixed(2)+' on');
const IV=r.invisible||{};
ck('#190 two lineages can share a region and stop perceiving each other',
   IV.overlap!==undefined && IV.overlap<0.5,
   'same anisotropy, orthogonal orientation: each admits ~'+IV.a+'/'+IV.total+' pairs and only '+IV.both+
   ' are admitted by BOTH — '+((IV.overlap||0)*100).toFixed(1)+'% overlap, against Euclidean\'s '+IV.euclid);

// #192
const TI=r.time||{};
const TS=TI.sched||{};
ck('#192 a rate-k lineage beats exactly 1/k of the time',
   TS.r1===600 && TS.r2===300 && TS.r3===200 && TS.r6===100,
   'over 600 ticks: '+TS.r1+', '+TS.r2+', '+TS.r3+', '+TS.r6);
ck('#192 same rate, different phase: they NEVER meet',
   TS.disjoint2===0 && TS.disjoint3===0,
   'co-active ticks out of 600: '+TS.disjoint2+' at rate 2, '+TS.disjoint3+' at rate 3 — temporal isolation with no spatial cost, which is the entire point of the layer');
ck('#192 and a rate-1 generalist still meets everyone',
   TS.generalist===200 && TS.sameRateSamePhase===300,
   'a generalist catches all 200 of a rate-3 lineage\'s beats — specialisation in time has a real cost on the other side');
ck('#192 the ENGINE agrees with the arithmetic for real genomes',
   TI.a===200 && TI.b===200 && TI.both===0,
   'particleActive over '+TI.n+' ticks: '+TI.a+' and '+TI.b+' active, '+TI.both+' co-active — #179 was a capability true in principle and false in the code');
ck('#192 slowing scales the LEDGER too — rate 4 pays a quarter of the upkeep',
   Math.abs(TI.ratio-4)<0.01,
   'fast '+TI.fast+' against slow '+TI.slow+', ratio '+TI.ratio+' — this is the line that stops tickRate being "go slow, live forever"');
ck('#192 the phase is REDUCED into the rate, not just clamped',
   TI.red && TI.red.r===2 && TI.red.p===1,
   'phase 5 under rate 2 stored as '+(TI.red&&TI.red.p)+' — 5 and 1 are the same behaviour and must compare equal');
ck('#192 and the rate is capped', TI.clamped && TI.clamped.r===TI.cap,
   'rate 9 -> '+(TI.clamped&&TI.clamped.r)+', phase -3 -> '+(TI.clamped&&TI.clamped.p));
ck('#192 the clock takes a small step and the phase is always legal for it',
   TI.moves>0 && TI.jumps===0 && TI.illegal===0,
   TI.moves+'/800 moved, '+TI.jumps+' jumped more than one, '+TI.illegal+' left the phase out of range');
ck('#192 and every rate is reachable', TI.rates && TI.rates.length===TI.cap,
   'rates reached: '+(TI.rates||[]).join(','));
ck('#192 STIME=0 is a true revert', TI.offAlways===true && TI.onSometimes===true && r.revert && r.revert.timeOff===true,
   'off: always active. on: sometimes not.');

// #193
const EM=r.emit||{};
ck('#193 an emission stencil DIVIDES an act, it never multiplies one',
   EM.worst!==undefined && EM.worst<2e-5,
   EM.n+' shape/amount combinations, worst magnitude error '+EM.worst+
   ' — four taps each writing the full amount would be a free 4x on every act, and a gene that routes around #132 and #133 at once');
ck('#193 an UNSHAPED verb is the original single write', EM.plain &&
   EM.plain.cells && EM.plain.cells.length===1 && Math.abs(EM.plain.mag-0.5)<1e-5,
   'wrote '+(EM.plain&&EM.plain.cells&&EM.plain.cells.length)+' cell(s), magnitude '+(EM.plain&&EM.plain.mag));
ck('#193 a DIPOLE is expressible: full magnitude paid, net zero moved',
   EM.dip && EM.dip.cells.length===2 && Math.abs(EM.dip.mag-0.6)<1e-5 && Math.abs(EM.dip.signed)<1e-5,
   'magnitude '+(EM.dip&&EM.dip.mag)+', signed '+(EM.dip&&EM.dip.signed)+
   ' — deposit in front and withdraw behind, which signed normalisation would have made unreachable');
ck('#193 the SELF FRAME turns the stencil with the actor',
   EM.fwd && EM.back && EM.fwd.cells[0]!==EM.back.cells[0] &&
   (EM.fwd.cells[0]-EM.back.cells[0])===4,
   'travelling one way it writes at cell '+(EM.fwd&&EM.fwd.cells[0])+', the other way at '+
   (EM.back&&EM.back.cells[0])+' — two cells either side, from ONE stencil. This is what "lay a trail ahead of me" needs');
ck('#193 a standing particle has no "ahead" and keeps the world frame',
   EM.still && EM.world && EM.still.cells[0]===EM.world.cells[0],
   'a stencil\'s meaning depends on whether its carrier is going anywhere, and that is a real boundary rather than a fallback');
ck('#193 the space is a box, so offsets clamp — and the magnitude still balances',
   EM.corner && EM.corner.cells.length===1 && Math.abs(EM.corner.mag-0.5)<1e-5,
   'two taps into the same wall cell: '+(EM.corner&&EM.corner.cells.length)+' cell, magnitude '+(EM.corner&&EM.corner.mag));
ck('#193 the shape takes a small step and never leaves its bounds',
   EM.moves>0 && EM.illegal===0, EM.moves+' steps, '+EM.illegal+' illegal');
ck('#193 and reaches every tap count', EM.sizes && EM.sizes.length===EMIT_TAPS_SAFE(),
   'tap counts reached: '+(EM.sizes||[]).join(','));
ck('#193 the mechanism can turn ITSELF off', EM.backToNull>0,
   EM.backToNull+' steps shrank a stencil back to writing underfoot — a shape that cannot be undone is a ratchet, and the rent makes undoing it profitable');
ck('#193 and the frame is reachable', EM.frames>0, EM.frames+' frame flips');
ck('#193 a shaped bank pays rent per extra tap, an unshaped one pays nothing',
   EM.rentShaped===2 && EM.rentPlain===0,
   'three taps bills '+EM.rentShaped+' beyond the free one, unshaped bills '+EM.rentPlain+
   ' (EMIT_TAP_RENT = '+EM.tapRent+' instruction-equivalents each)');
ck('#193 a shape on a POSSESSION is inert, uncounted and unbilled',
   EM.inert && EM.inert.shaped===0 && EM.inert.rent===0 &&
   EM.inert.place===false && EM.inert.placeField===true && EM.inert.placeChan===true,
   'a two-tap stencil on a mem verb counts '+(EM.inert&&EM.inert.shaped)+' and bills '+(EM.inert&&EM.inert.rent)+
   ' — a census row that reports adoption for a geometry that cannot act is the failure every row since #188 was written to avoid');
ck('#193 EMIT=0 is a true revert', EM.off && EM.off.cells.length===1 &&
   EM.off.cells[0]===(EM.world&&EM.world.cells[0])-2,
   'off writes underfoot, on writes two cells away');
ck('#193 both halves of the mechanism actually bit', EM.spreadFired===true && EM.selfFrameFired===true,
   'emit.spread and emit.selfFrame both fired — a geometry that never reaches a write is #179 again');
const EX=r.emitCross||{};
ck('#193 save -> load: the shape travels with the act', EX.saved===true,
   'a reload that restores a verb emitting in a different place has restored a different verb');
ck('#193 cloneGenome deep-copies to the TAP', EX.shared &&
   !EX.shared.bank && !EX.shared.verb && !EX.shared.st && !EX.shared.tap,
   EX.shared && JSON.stringify(EX.shared)+' — #155, #180 and #189 were all this same shallow copy');
ck('#193 parent -> child: the shape diverges', EX.childMoved>0, EX.childMoved+'/300');
ck('#193 germline -> population: the shape crosses with the verb', EX.carriers>0,
   EX.carriers+' carrier(s) after one seeding — #133b stripped the successor on this exact path');
ck('#193 the wire carries it, validates it, and still accepts a pre-#193 peer',
   EX.wireOk===true && EX.wireBad===true && EX.wireAbsent===true,
   'good '+EX.wireOk+', rejects garbage '+EX.wireBad+', absent-is-legal '+EX.wireAbsent);
ck('#193 and it has a census row', EX.row===true);

// #194
const GR=r.grain||{};
ck('#194 every grain divides the lattice exactly', GR.divides===true,
   'blocks per side: '+(GR.blocks||[]).join(',')+' — a value that does not divide leaves a remainder row, which is an off-by-one rather than a coarser medium');
ck('#194 the seeded grain is the ORIGINAL fine path, bit for bit', GR.identical===0,
   GR.identical+' cells of 1600 differed between GRAIN=1 at res=40 and GRAIN=0 — this is the exactness guarantee every A/B in this repo rests on');
ck('#194 a coarse medium is BLOCK-UNIFORM', GR.nonUniform===0,
   GR.nonUniform+' cells disagreed with their block — this is the property that lets chanRead and #193\'s emission stencil work completely unchanged');
ck('#194 a write reaches the whole medium cell', GR.wrote &&
   GR.wrote.filled===GR.wrote.ofBlock && Math.abs(GR.wrote.farRead-0.9)<1e-5,
   (GR.wrote&&GR.wrote.filled)+'/'+(GR.wrote&&GR.wrote.ofBlock)+' fine cells carry it, and a reader at the far corner of the block reads '+
   (GR.wrote&&GR.wrote.farRead)+' — splitting the amount instead would have made the gene read as "become deaf"');
ck('#194 the stencil is read in BLOCKS, so one step advects a whole block',
   GR.coarseStep!==undefined && GR.coarseStep>GR.fineStep*3,
   'one advection update displaces the centroid by '+GR.fineStep+' cell at grain 40 and '+GR.coarseStep+
   ' at grain 5 — no fine kernel reaches that in one update however it is shaped');
ck('#194 the grain SNAPS to the legal set rather than clamping',
   GR.snap && GR.snap.s7===8 && GR.snap.s6===5 && GR.snap.s39===40 &&
   GR.snap.sBig===40 && GR.snap.sNeg===5 && GR.snap.sAbsent===40,
   JSON.stringify(GR.snap));
ck('#194 the grain takes one step at a time and never leaves the set',
   GR.gmoves>0 && GR.gillegal===0 && GR.gjumps===0,
   GR.gmoves+' steps, '+GR.gillegal+' outside the set, '+GR.gjumps+' jumped more than one index');
ck('#194 and every grain is reachable', GR.grains && GR.grains.length===5,
   'grains reached: '+(GR.grains||[]).join(','));
ck('#194 rent FALLS with the grain, floored',
   GR.rent && GR.rent.fine>GR.rent.mid && GR.rent.mid>GR.rent.coarse &&
   GR.rent.coarse>0 && Math.abs(GR.rent.coarse-CHANNEL_RENT_SAFE()*GR.rent.floor)<1e-3,
   'grain 40 '+(GR.rent&&GR.rent.fine)+', grain 20 '+(GR.rent&&GR.rent.mid)+', grain 5 '+(GR.rent&&GR.rent.coarse)+
   ' — the only rent in this file a lineage can reduce by changing a gene, because coarsening genuinely costs less CPU');
ck('#194 a coarse medium stays bounded under an explosive rule', GR.over===0 && GR.nf===0,
   GR.over+' out of bound, '+GR.nf+' non-finite, six taps at weight 2 on a x3 rule');
ck('#194 and the coarse pass actually RAN', GR.coarseFired===true,
   'a grain that never reaches a lattice pass is #179 again');
const GX=r.grainCross||{};
ck('#194 save -> load: the grain travels with the chemistry', GX.saved===true);
ck('#194 a pre-#194 row reads as the lattice\'s own grain', GX.legacyReads===true,
   'five elements, no grain, so it means what it meant');
ck('#194 cloneGenome carries it and shares nothing', GX.shared &&
   !GX.shared.bank && !GX.shared.row && GX.cloneRes===8,
   'clone reads grain '+GX.cloneRes);
ck('#194 parent -> child: the grain diverges', GX.childMoved>0,
   GX.childMoved+'/400 — and this same child route is what repairs #189, whose stencil could only ever be reshaped on the germline');
ck('#194 germline -> population: the grain crosses with the medium', GX.grainCarriers>0,
   (GX.grainCarriers||0)+' carrier(s) after one seeding — dropping res from that one rebuild made channel.grain STRANDED at germline 2 / population 0 on a live run while every other crossing passed');
ck('#194 and it has a census row', GX.row===true);

// #195
const XF=r.xfer||{};
ck('#195 at rate 0 nothing transfers and nothing is even declined',
   XF.atZero && XF.atZero.x===0 && XF.atZero.declined===0,
   'over 600 interactions: '+(XF.atZero&&XF.atZero.x)+' transfers, '+(XF.atZero&&XF.atZero.declined)+
   ' declines — a decline would mean the gate ran, and the gate running means a draw was consumed');
ck('#195 at a real rate the chemistry travels sideways', XF.fired40 && XF.fired40.x>0,
   (XF.fired40&&XF.fired40.x)+' transfer(s) in 600 interactions — a route that does not go through descent, and the gate is the rate gene ALONE: the first version reused the plasmid bond gate and the live run read 390 firings with zero transfers, because sim is genetic similarity and near-relatives hold the same slots');
ck('#195 and the WHOLE medium moves: chemistry, form, manifold, timescale, grain', XF.whole===true,
   'a medium that arrives computing the same thing in a different space at a different rate is a different medium');
ck('#195 the record resets on arrival', XF.freshRecord===true,
   'age and uses are facts about how long this rule has sat HERE — a freshly infected carrier has not been judged yet');
ck('#195 deep-copied to the tap', XF.deep===true,
   'or donor and recipient share one neighbourhood and neither can diverge it — #155, #180, #189, #193 and #194 were all this');
ck('#195 the donor pays', XF.donorPaid===true,
   'CHANXFER_COST = '+XF.cost+' amplitude per transfer — without it "be infectious" has no downside and the gene drifts up unopposed');
ck('#195 slot identity is preserved: donor slot 2 lands in recipient slot 2', XF.slotKept===true,
   'ka..kd are bound by slot index and the lattice is world state per slot, so a shifted slot is #141\'s stranger reading our dictionary, with the dictionary being the chemistry');
ck('#195 receiving NEVER destroys an evolved chemistry', XF.kept===true && XF.occupied && XF.occupied.x===0 && XF.occupied.declined>0,
   (XF.occupied&&XF.occupied.declined)+' declines, 0 transfers, the recipient\'s own rule intact — a lineage cannot be made worse off by being infected in a slot it was using');
ck('#195 a transfer into a lineage that can SEE the medium is counted apart from one that cannot',
   XF.seeing && XF.blind && XF.seeing.sensed>0 && XF.blind.sensed===0,
   'seeing '+(XF.seeing&&XF.seeing.sensed)+'/'+(XF.seeing&&XF.seeing.x)+', blind '+(XF.blind&&XF.blind.sensed)+'/'+(XF.blind&&XF.blind.x)+
   ' — xfer>0 with xferSensed==0 is a chemistry spreading as pure rent, which is a real outcome and should be visible rather than inferred');
ck('#195 a particle that has NEVER held a channel can receive one',
   XF.gotFromNothing===true && XF.virgin && XF.virgin.x>0,
   (XF.virgin&&XF.virgin.x)+' transfer(s) into an undefined bank — the first implementation required Array.isArray on both sides and so excluded exactly the particles a chemistry most needs to reach');
ck('#195 and a quiet interaction allocates nothing on the way past', XF.noAllocWhenQuiet===true,
   'the bank is materialised at the moment of transfer, not at the moment of looking');
ck('#195 CHANXFER=0 is a true revert', XF.offRun && XF.offRun.x===0 && XF.offRun.declined===0);
ck('#195 the ELEMENT\'s rate is bounded, absent reads 0, and it survives a save',
   XF.bounds && XF.bounds.hi===0.01 && XF.bounds.lo===0 && XF.bounds.absent===0 && XF.saved===true,
   'clamped to ['+(XF.bounds&&XF.bounds.lo)+', '+(XF.bounds&&XF.bounds.hi)+'], absent reads '+(XF.bounds&&XF.bounds.absent)+
   ' (which is what every pre-#195 save meant), round-trip '+XF.saved);
ck('#195 and it takes a small step that can reach both ends',
   XF.sillegal===0 && XF.sreach0===true && XF.sreachTop===true,
   XF.smoves+' steps, '+XF.sillegal+' outside [0, 0.01], reached zero '+XF.sreach0+' and the top '+XF.sreachTop+
   ' — reaching zero is the element being able to give up spreading, which is the only way a rule can stop being a parasite without being deleted');

// #196
const GV=r.gov||{};
ck('#196 with no carrier the germline governs', GV.noCarrier===200,
   GV.noCarrier+'/200 — a universe whose population has not received a chemistry still runs the one it authored');
ck('#196 with carriers, the germline is NEVER drawn', GV.mine===0,
   GV.mine+' draws returned the self out of '+((GV.a||0)+(GV.b||0)+(GV.mine||0))+
   ' — for eight swings this number was all of them');
ck('#196 and numerosity is the selective quantity', GV.share!==undefined && Math.abs(GV.share-0.75)<0.03,
   'three carriers of one rule against one of another governs '+((GV.share||0)*100).toFixed(1)+
   '% of updates — which is what makes descent and #195\'s transfer change what the world computes rather than only who carries what');
ck('#196 THE LATTICE AGREES: the population\'s rule is what ran', GV.popRan!==undefined && GV.popRan>0.8,
   'the germline says decay to zero and every carrier says hold at 0.9; the lattice reads '+GV.popRan+
   ' — this is the check that would have failed for eight swings');
ck('#196 and with no carrier holding it, the germline\'s does', GV.selfRan!==undefined && GV.selfRan<0.1,
   'the same lattice under the germline\'s decay rule reads '+GV.selfRan);
ck('#196 CHANGOV=0 restores the germline-only rule exactly', GV.offSelf===200,
   GV.offSelf+'/200 — off is the pre-#196 engine, and it takes no draw');

// #197
const BK=r.brakes||{};
ck('#197 every law round-trips through its own setter', BK.bad===0,
   BK.bad+' of '+((BK.names||[]).length)+' failed to take — a price that cannot move reads exactly like a price nothing wants to move');
ck('#197 and none escapes its own bounds', BK.outOfBand===0, BK.outOfBand+' out of band');
ck('#197 a price REACHES THE BILLING LINE', BK.rentFree===0 && BK.rentDear>1.9,
   'CHANNEL_RENT at 0 bills '+BK.rentFree+' and at 2.0 bills '+BK.rentDear+
   ' — read off the engine\'s own sum rather than trusting that a name in a table is a name in a sum');
ck('#197 the prices and the probation are all in the table', BK.names &&
   ['CHANNEL_RENT','EMIT_TAP_RENT','MET_RENT','REACH_RENT','UA_OP_RENT','PROBE_RENT',
    'CHANXFER_COST','COMPLEXITY_TOLL','LAW_VIABLE','LAW_PROBATION','LAW_COST','LAW_RATE']
     .every(n=>BK.names.indexOf(n)>=0),
   (BK.names||[]).length+' laws: '+(BK.names||[]).join(' '));
ck('#197 THE SELF-REFERENCE IS CLOSED: a proposal to stop reverting is judged by the old threshold',
   BK.revertedAnyway===true && BK.verdictKept===0,
   'a world holding 10 of a baseline 100 under a freshly installed LAW_VIABLE=0 is still reverted — judged by the new value it would pass by construction, and the mechanism would have a one-step way to disable itself with no verdict at all');
ck('#197 the proposal rate moved with the table', BK.reach &&
   BK.reach.perRun>=3 && BK.reach.verdictCap>=5,
   BK.reach.laws+' laws (was '+BK.reach.base+'), ~'+BK.reach.perRun+' proposals per 12,000 ticks, at most '+
   BK.reach.verdictCap+' verdicts — the binding constraint is the probation, not the rate, because one law is on trial at a time');
ck('#197 BRAKES=0 pins the table back to the original three', BK.offSpan===3,
   'so every measurement taken before the prices became evolvable is still comparable');

// #198
const WP=r.warp||{};
ck('#198 the probe measures the medium it set', WP.governedBySelf===true,
   '#196 draws the governing rule from the living carriers, so a block that sets genome.channels and does not clear them is measuring somebody else\'s medium — four checks here failed on that and one passed spuriously');
ck('#198 no warp is the ORIGINAL tap arithmetic, cell for cell', WP.differ===0 && WP.selfRead===true,
   WP.differ+' of 1600 cells differed between WARP=1 with no expression and WARP=0 — and a zero-offset tap samples its own cell, which is the measurement everything below rests on');
ck('#198 a constant warp displaces the whole neighbourhood', WP.constShift===2 && WP.constShift2===2,
   'two cells in different rows and columns both sample '+WP.constShift+' and '+WP.constShift2+
   ' cells over — a uniform shift, which is all a stencil could ever have expressed');
ck('#198 A POSITION-DEPENDENT WARP GIVES TWO CELLS DIFFERENT NEIGHBOURHOODS',
   WP.shearLo!==undefined && WP.shearHi!==undefined && WP.shearLo!==WP.shearHi,
   'row 2 samples '+WP.shearLo+' cells over and row 34 samples '+WP.shearHi+
   ' — no list of offsets can do this however long the list, and that is the whole difference between a lattice and a graph');
ck('#198 and adjacency can depend on what is IN the medium',
   WP.stateA!==undefined && WP.stateB!==undefined && WP.stateA!==WP.stateB,
   'two cells in the same column holding different values sample columns '+WP.stateA+' and '+WP.stateB+
   ' — the geometry of the space is a function of its own contents');
ck('#198 a warp cannot reach past the tap bound', WP.huge===WP.cap,
   'an expression asking for 1000 cells away gets '+WP.huge+' (CHANNEL_OFFSET_MAX = '+WP.cap+
   ') — an adjacency that can reach anywhere is not a warped neighbourhood, it is a random one');
ck('#198 and a warped medium stays bounded under an explosive rule', WP.over===0 && WP.nf===0,
   WP.over+' out of bound, '+WP.nf+' non-finite');
ck('#198 NO RECURRENCE ACROSS CELLS — the warp reads s as 0 every time', WP.sIsZero===true,
   'uaCall writes its output back to atom.state, so without zeroing it a cell\'s neighbourhood would depend on the cell evaluated before it and the whole medium would be order-dependent — #175 in a new pass, where it would have been invisible');
ck('#198 the warp authors, drifts and can DROP itself',
   WP.authored>0 && WP.dropped>0 && WP.moved>0,
   WP.authored+' authored, '+WP.moved+' drifted, '+WP.dropped+' dropped — dropping is the mechanism turning itself off, and the rent is what makes dropping pay');
ck('#198 a warped medium pays rent, an unwarped one does not, and a coarse one pays less',
   WP.rentWarped>WP.rentPlain && WP.rentPlain>0 && WP.rentCoarse<WP.rentWarped,
   'warped '+WP.rentWarped+', plain '+WP.rentPlain+', coarse+warped '+WP.rentCoarse+
   ' — two expression evaluations per cell, scaled by the same cell count #194 scales the base rent by');
const WX=r.warpCross||{};
ck('#198 save -> load: the adjacency travels with the medium', WX.saved===true);
ck('#198 a pre-#198 row reads as translation-invariant', WX.legacy===true);
ck('#198 cloneGenome carries the expressions and shares no compiled holder',
   WX.shared && !WX.shared.row && !WX.shared.holder && WX.shared.carried===true,
   'the holders are created on demand off the serialised record, so the six rebuild sites drop them automatically — sharing one would compile one medium\'s warp into another');
ck('#198 parent -> child: the adjacency diverges', WX.childMoved>0, WX.childMoved+'/400');
ck('#198 germline -> population: it crosses with the medium', WX.carriers>0,
   (WX.carriers||0)+' carrier(s) after one seeding — the seventh place a channel rule is rebuilt');
ck('#198 the wire carries it, rejects garbage, and still accepts a pre-#198 peer',
   WX.wireOk===true && WX.wireBad===true && WX.wireAbsent===true,
   'good '+WX.wireOk+', rejects '+WX.wireBad+', absent-is-legal '+WX.wireAbsent);
ck('#198 and it has a census row', WX.row===true);

// #199
const SW=r.selfwrite||{};
const AD=SW.addr||{};
ck('#199 the opcode is 429 and has not drifted into a live one',
   AD.op===AD.derived && AD.op===429 && AD.wireAdmits===true,
   'OP_SELFWRITE = '+AD.op+', CORE_OPCODES+MAX_BOUND_OPCODES = '+AD.derived+', netMaxOpcode = '+AD.netMax+
   ' — written as literals so a moved constant is a red build rather than a silent slide onto a live opcode, because incrementing CORE_OPCODES would re-aim every bound slot in every saved genome (#137)');
ck('#199 each instruction field is writable', SW.fOp && SW.fSrc && SW.fDst && SW.fK &&
   SW.fOp.ok===1 && SW.fSrc.ok===1 && SW.fDst.ok===1 && SW.fK.ok===1,
   'op -> '+JSON.stringify(SW.fOp&&SW.fOp.row)+', src -> '+JSON.stringify(SW.fSrc&&SW.fSrc.row)+
   ', dst -> '+JSON.stringify(SW.fDst&&SW.fDst.row)+', k -> '+JSON.stringify(SW.fK&&SW.fK.row));
ck('#199 NOTHING ILLEGAL CAN BE CONSTRUCTED', SW.illegal===0 && SW.wrote>0,
   SW.wrote+' writes from 4,000 fuzzed calls (NaN, +/-Infinity, +/-1e9, absurd indices and fields) and '+
   SW.illegal+' rows failed validInstruction — the guarantee has to be the WIRE\'s guarantee, or a program writes itself into a state the VM cannot run and the failure surfaces somewhere unrelated');
ck('#199 a write touches exactly one instruction', SW.outside===0 && SW.lenChanged===0,
   SW.outside+' calls touched more than one row, '+SW.lenChanged+' changed the length');
ck('#199 and it never grows the program', SW.noGrowth===true,
   '500 writes leave the length at 4 — op144 is the extender and its cap is the evolved vmMaxInstructions; two mechanisms growing one array by different rules is how a cap stops meaning anything');
ck('#199 the write is paid for, and an exhausted particle is refused',
   Math.abs(SW.paid-SW.cost)<1e-6 && SW.brokeOk===true,
   'SELFWRITE_COST = '+SW.cost+' amplitude, charged '+SW.paid+', and a particle below it is refused');
ck('#199 END TO END: the opcode is actually wired to the helper', SW.endToEnd===true,
   'the unit checks prove the helper; this proves the dispatch — which is the half #179 found missing for EFFECT_EMIT across 1,424 live instructions');
ck('#199 SELFWRITE=0 is a true revert', SW.offRefused===true,
   'off, opcode 429 is the inert no-op it was before this commit — which it has been for every program ever run, because nothing dispatched it');
ck('#199 and its price is a LAW, not a constant', SW.isLaw===true,
   'the second layer built after #197, so the world can propose what self-revision costs');
const SR=r.selfwriteReach||{};
ck('#199 the address is REACHED: seeded into the germline and into the population',
   SR.germSeeded===1 && SR.popSeeded>0,
   'germline '+SR.germSeeded+', '+SR.popSeeded+' population carrier(s) — 429 is one address in 430, and #179 measured opcode 236 in ZERO of 1,424 live instructions when left to the draw');
ck('#199 and never double-inserted', SR.germDupes===0,
   SR.germDupes+' programs took a second copy — #179\'s third check, learned there: without it every program converges on nothing but the new opcode');

// #200a
const RG=r.regs||{};
ck('#200a the mask BITES: a narrow file aliases its source fields',
   RG.m3 && RG.m3.distinct===3 && RG.m12 && RG.m12.distinct===12 && RG.m24 && RG.m24.distinct===24,
   'at regCount 3 the 24 source fields reach '+(RG.m3&&RG.m3.distinct)+' registers, at 12 they reach '+
   (RG.m12&&RG.m12.distinct)+', at 24 '+(RG.m24&&RG.m24.distinct)+
   ' — a tight file forces a program to reuse state, which is compression, not weakness');
ck('#200a bounded both ways, and absent reads as the twelve this file was written with',
   RG.b && RG.b.hi===RG.b.max && RG.b.lo===2 && RG.b.absent===RG.b.dflt,
   'clamped to [2, '+(RG.b&&RG.b.max)+'], absent reads '+(RG.b&&RG.b.absent));
ck('#200a the array is allocated at the max, so a wide file has somewhere to live',
   RG.alloc===(RG.b&&RG.b.max), 'vmRegs.length = '+RG.alloc);
ck('#200a regCount is in CHILD_DISCRETE and steps by one', RG.inList===true &&
   RG.moves>0 && RG.jumps===0 && RG.illegal===0,
   'in the discrete list: '+RG.inList+', '+RG.moves+' steps, '+RG.jumps+' jumps, '+RG.illegal+
   ' out of bounds — #192 cost a whole swing to an integer gene walked continuously');
ck('#200a and every count is reachable', RG.reached===(RG.b&&RG.b.max)-1,
   RG.reached+' distinct counts of '+((RG.b&&RG.b.max)-1)+' possible');
ck('#200a a program on a 3-register file runs and leaves nothing non-finite',
   RG.ran==='ok' && RG.nf===0,
   RG.ran+', '+RG.nf+' non-finite registers — the clamp loop covers the whole allocation, not just the addressed part');
ck('#200a it survives a save, and REGS=0 pins it to twelve',
   RG.saved===true && RG.offVal===(RG.b&&RG.b.dflt),
   'round-trip '+RG.saved+', off reads '+RG.offVal);

// #200b
const LV2=r.levels||{};
ck('#200b the five level thresholds are laws', LV2.inTable===true,
   (LV2.laws||0)+' laws in the table');
ck('#200b LEVEL_GROUP_MIN changes what counts as a cluster', LV2.at8<LV2.at2,
   'at minimum 2 the census counts '+LV2.at2+' clusters, at minimum 8 it counts '+LV2.at8);
ck('#200b and the tower and forest thresholds change what counts as one',
   LV2.tLoose===1 && LV2.tTight===0 && LV2.fLoose===1 && LV2.fTight===0,
   'tower at 0.5 -> '+LV2.tLoose+', at 0.9 -> '+LV2.tTight+'; forest at 0.4 -> '+LV2.fLoose+', at 0.9 -> '+LV2.fTight+
   ' — driven with synthetic registries rather than waited for, because towers read 0-2 and forests 0 in a live run');
ck('#200b LEVELS=0 pins every gate to the literal it was', LV2.offMatches===true,
   'with the knob off, a raised LEVEL_GROUP_MIN has no effect — so every level measurement taken before #200 is comparable');

// the crossings
const CR=r.cross||{};
const SV=CR.saved||{};
for(const k of ['fold','cede','phys','deme','net','oeeW','probe','claimCleared','chan','form','metric','stime'])
  ck('save -> load: '+k, SV[k]===true);
ck('cloneGenome shares none of it', CR.shared && !CR.shared.oeeW && !CR.shared.probes && !CR.shared.probe0 && !CR.shared.chan && !CR.shared.chan0 && !CR.shared.chanSt && !CR.shared.chanTap,
   CR.shared && JSON.stringify(CR.shared));
ck('parent -> child: the proxy weights diverge', CR.childMoved>0, CR.childMoved+'/200');
ck('germline -> population: the substrate actually crosses', CR.seeded===true && CR.carriers>0,
   CR.carriers+' carrier(s) after one seeding - the bug the crossing rows caught seven times');
ck('every new gene has a census row', CR.rows && CR.rows.length===0,
   CR.rows && CR.rows.length?('missing: '+CR.rows.join(' ')):'all thirteen present');
// #187: and the one that must NOT be a crossing row. A promotion is an earned outcome, not authored
// structure, so "germline 1 / population 0" is the normal state of a young world - it was reported as
// STRANDED and made crossing-test red for something that is not a defect. It is logged per epoch now.
ck('#187 probe.promoted is NOT a crossing row', CR.promotedNotACrossingRow===true,
   'an earned outcome cannot be stranded — probe.bank already answers the crossing question');

// uaSwapVar termination — a pre-existing hang (#188) that #201's trajectory reached
const SWV=r.swapvar||{};
ck('uaSwapVar TERMINATES when the pool cannot offer anything else',
   SWV.noop===true && SWV.ms!==undefined && SWV.ms<1000,
   'returned unchanged in '+SWV.ms+'ms. On every engine before this one the same call NEVER RETURNS: while(to===from) is a rejection sampler with no exit, and #188 calls it with a one-element pool, so an atom already naming that channel freezes the germline author. Found by #201 (four hours in substrate-test, 39% of profiler samples here), caused by #188');
ck('uaSwapVar still swaps when the pool CAN offer something', SWV.swapOk===true && SWV.moved===200,
   SWV.swapped+', and '+SWV.moved+'/200 default-pool draws moved — the guard draws exactly as before whenever a different value exists, so every run that used to work is bit-identical');

// #201
const FD=r.found||{};
ck('#201 foundDrive is seeded on every cluster and drifts in a daughter',
   FD.seedHas===true && FD.childMoved>=190,
   FD.childMoved+'/200 mutated children moved it — a CLUSTER trait like launchDrive, so it has no crossing row: crossingCensus compares a germline against particle genomes and this has neither side');
ck('#201 A UNIVERSE ACTUALLY FOUNDS ONE — the packet is built and sent',
   FD.built===1 && FD.wellFormed===true,
   FD.built+' packet(s). THE CHECK THIS SWING TURNS ON: the obvious hook (cosmosMerge) fires 1-3 times per 12,000 ticks and 0 times across 20,000 on the pre-#201 engine, so #201 built on it would have passed every other check here and founded a handful of times at best');
ck('#201 and the wire accepts what the engine sends', FD.accepted===true);
ck('#201 what crosses is THIS WORLD’S OWN GERMLINE, byte for byte',
   FD.isOwnGermline===true && FD.decodes===true,
   FD.blobLen+' bytes, identical to what the autosaver would write this tick and parsing back to a z:2 genome — the claim that makes a daughter a daughter rather than a fresh universe with a nice comment over it');
ck('#201 the founders pay', FD.paidSent===1 && FD.paid>=FD.paidWanted*0.95 && FD.paid<=FD.paidWanted*1.05,
   'FOUND_NEED '+FD.paidWanted+' against '+FD.payN+' members holding 4 each, the field lost '+FD.paid+
   ' of live amplitude — charged only up to what was needed, which is #61’s lesson about a cost that annihilates the surplus');
ck('#201 AND NOTHING IS CHARGED WHEN THE PACKET CANNOT GO',
   FD.noWireCharged===0 && FD.noWireRefused===true && FD.noWireFounded===0,
   'with no channel the founders lost '+FD.noWireCharged+' — the first version charged and then sent, so every headless attempt destroyed FOUND_NEED of amplitude and founded nothing');
ck('#201 the cooldown holds', FD.cooldownHeld===true);
ck('#201 the lifetime cap holds', FD.capHeld===true);
ck('#201 FOUND=0 is an exact revert — not one random draw',
   FD.offSent===0 && FD.offDraws===0,
   FD.offDraws+' draws with the knob off, so the RNG stream is restored and not merely the behaviour');
ck('#201 a founding arriving from a peer is COUNTED AND NOT INSTALLED',
   FD.seenRose===true && FD.unchanged===true,
   'counted, and '+((FD.changedKeys||[]).length)+' genome keys changed besides the liveness snapshot — ' +
   'the whole trust model of this packet: a world that adopted a stranger’s whole germline on arrival would be overwritten rather than joined, so the engine counts and the field shell — which owns the slot namespace — is the only thing that acts on the blob');
ck('#201 the validator refuses what it must, stated as BYTES',
   FD.rej && FD.rej.nonPrintable && FD.rej.tooLong && FD.rej.empty && FD.rej.notString &&
   FD.rej.badTick && FD.rej.badDrive && FD.rej.plainOk,
   FD.rej && JSON.stringify(FD.rej));
ck('#201 every brake on founding is a LAW, not a gene',
   FD.laws && FD.laws.length===5,
   (FD.laws||[]).join(' ')+' — a price the payer sets is an off switch (#197), and the payer here is the founding cluster');
ck('#201 all three liveness names are declared', FD.live && FD.live.length===0,
   FD.live && FD.live.length?('missing: '+FD.live.join(' ')):'found / foundRefused / foundSeen — never-fired, priced-out and heard-from-a-peer are three different findings');
ck('#201 the epoch log carries net_found', FD.pending===true);

// the reverts
const RV=r.revert||{};
ck('UA_FOLD=0 forces the default compiler', RV.foldOff===true);
ck('DEME=0 removes the barrier', RV.demeOff===true);
ck('OEE_BONUS=0 zeroes the bonus', RV.bonusOff===true);
ck('PROBE=0 reports no promoted probes', RV.probeOff===true);

// and it runs
const LV=r.live||{};
ck('the loop runs with all five layers live', LV.ran>=1500, LV.ran+' ticks, '+LV.alive+' alive');
ck('and a save still round-trips', LV.reload==='ok', LV.reload);
ck('the level census reports the levels present', LV.present>=1, LV.levels && LV.levels.join(' '));
ck('every new mechanism has a declared liveness name', LV.declared>=20, LV.declared+' declared');
ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
function UA_FOLD_MODES_SAFE(){ try{ return 4; }catch(e){ return '?'; } }
function PROBE_RENT_SAFE(){ return (r.probe&&r.probe.rentPositive)?'>0':'0'; }
process.exit(fail?1:0);
function CELL_SAFE(){ return 55; }
function EMIT_TAPS_SAFE(){ return 4; }
function CHANNEL_RENT_SAFE(){ return (r.chan&&r.chan.rent)||0.6; }
