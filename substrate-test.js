// #181-#186 acceptance test — THE SUBSTRATE ITSELF.
//
// #180 made the atom grammar a gene. This batch takes the same move to the four remaining places the
// rules of the game were still constants:
//   #181  the COMPILER's output stage - what every authored expression gets wrapped in
//   #182  MAJOR TRANSITIONS - cluster reproduction mode, resource allocation, and a porous boundary
//   #183  the PHYSICS - per-lineage interaction radius and chemistry, plus law mutation on probation
//   #184  the MEASUREMENT LOOP - self-authored probes promoted into the grammar, and evolvable
//         weights on the open-endedness proxies
//   #185  the META-POPULATION - demes inside a universe, and plasmids carrying laws between them
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
    // and the generator must not offer an unallocated channel
    let offeredEarly=0; for(let q=0;q<300;q++) if(CHANNEL_TEST.test(uaGenExpression()))offeredEarly++;
    genome.channels=saveCh;
    let offeredNow=0; for(let q=0;q<400;q++) if(CHANNEL_TEST.test(uaGenExpression()))offeredNow++;
    // the four targets exist and name the bank
    const tgts=EFFECT_TARGETS.map(x=>x.n).filter(n=>/^chan[0-3]$/.test(n));
    return {moved:+moved.toFixed(4),landed:+landed.toFixed(4),noop,read:+read.toFixed(4),safe,
            offeredEarly,offeredNow,tgts:tgts.length,rent:CHANNEL_RENT};
  });

  // ── THE CROSSINGS: every new gene must survive a save and diverge in a child ────────────────
  out.cross=run('cross',()=>{
    genome.uaFoldMode=2; genome.uaFoldK=3.25; genome.autonomyCede=0.8;
    genome.cellScale=0.55; genome.rxSelf=0.3; genome.rxCross=0.45;
    genome.demeCount=3; genome.demeFlow=0.25;
    genome.netLawRate=0.007; genome.netLawReceptivity=0.6;
    genome.oeeW=[0.2,0.4,0.6,0.8];
    genome.channels=[{expr:'(a)+(((b)-(a))*(0.25))',compiled:null,failed:false,age:7,uses:3},null,
                     {expr:'(ka)-(kb)',compiled:null,failed:false,age:2,uses:1},null];
    genome.probes=[{expression:'(a)+(b)',compiled:null,failed:false,n:11,hit:9,pending:0,pendTick:5,pendFit:1,age:3},null,null,null];
    const blob=encodeGenome();
    const wipe=['uaFoldMode','uaFoldK','autonomyCede','cellScale','rxSelf','rxCross','demeCount',
                'demeFlow','netLawRate','netLawReceptivity','oeeW','probes','channels'];
    for(const k of wipe)genome[k]=undefined;
    decodeGenome(blob); sanitizeGenome();
    const eq=(x,y)=>Math.abs(x-y)<1e-3;
    const saved={
      fold:genome.uaFoldMode===2&&eq(genome.uaFoldK,3.25),
      cede:eq(genome.autonomyCede,0.8),
      phys:eq(genome.cellScale,0.55)&&eq(genome.rxSelf,0.3)&&eq(genome.rxCross,0.45),
      deme:genome.demeCount===3&&eq(genome.demeFlow,0.25),
      net:eq(genome.netLawRate,0.007)&&eq(genome.netLawReceptivity,0.6),
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
    };
    // clone: no shared references
    const c=cloneGenome(genome);
    const shared={oeeW:c.oeeW===genome.oeeW, probes:c.probes===genome.probes,
                  probe0:c.probes&&c.probes[0]===genome.probes[0],
                  chan:c.channels===genome.channels,
                  chan0:c.channels&&c.channels[0]===genome.channels[0]};
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
                  'oee.weighted','deme.split','channel.bank','channel.sensed'].filter(n=>names.indexOf(n)<0),
            promotedNotACrossingRow:names.indexOf('probe.promoted')<0};
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
ck('#188 an UNALLOCATED channel is never offered to the generator', CI.offeredEarly===0,
   CI.offeredEarly+'/300 — a dead letter is #179 wearing a new name');
ck('#188 an allocated one is', CI.offeredNow>0, CI.offeredNow+'/400');
ck('#188 four effect targets index the bank', CI.tgts===4);
ck('#188 an allocated channel pays the dearest rent in the file', CI.rent>0,
   'CHANNEL_RENT = '+CI.rent+' instruction-equivalents per allocated channel');

// the crossings
const CR=r.cross||{};
const SV=CR.saved||{};
for(const k of ['fold','cede','phys','deme','net','oeeW','probe','claimCleared','chan'])
  ck('save -> load: '+k, SV[k]===true);
ck('cloneGenome shares none of it', CR.shared && !CR.shared.oeeW && !CR.shared.probes && !CR.shared.probe0 && !CR.shared.chan && !CR.shared.chan0,
   CR.shared && JSON.stringify(CR.shared));
ck('parent -> child: the proxy weights diverge', CR.childMoved>0, CR.childMoved+'/200');
ck('germline -> population: the substrate actually crosses', CR.seeded===true && CR.carriers>0,
   CR.carriers+' carrier(s) after one seeding - the bug the crossing rows caught seven times');
ck('every new gene has a census row', CR.rows && CR.rows.length===0,
   CR.rows && CR.rows.length?('missing: '+CR.rows.join(' ')):'all nine present');
// #187: and the one that must NOT be a crossing row. A promotion is an earned outcome, not authored
// structure, so "germline 1 / population 0" is the normal state of a young world - it was reported as
// STRANDED and made crossing-test red for something that is not a defect. It is logged per epoch now.
ck('#187 probe.promoted is NOT a crossing row', CR.promotedNotACrossingRow===true,
   'an earned outcome cannot be stranded — probe.bank already answers the crossing question');

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
