// #180 acceptance test — THE GRAMMAR BECOMES A GENE.
//
// #174 opened the alphabet's MEANING and left its SHAPE alone: five production rules with hand-set
// weights, a leaf pool sampled uniformly, and an operator set of four arithmetic ops plus four HANDS
// functions — constants since the grammar was written, with no evolutionary route into any of them.
// #180 makes all three heritable, and adds up to eight operators a lineage assembles for itself out
// of a bounded meta-language (blend / gate over UA_PRIM), named qa..qh and resolved LATE, through the
// carrier's own bank at call time.
//
// What this checks, in order of how badly it would hurt to get wrong:
//   1. BACKWARD COMPATIBILITY. Every expression in every saved creature predates qa..qh. They must
//      compile and evaluate identically under the wider signature, or every genome in the field is
//      bricked. Same check #174 needed, same reason.
//   2. TOTALITY. `qa` must mean something with an EMPTY bank, a RELEASED slot, and a foreign bank.
//      This is the property that makes the fifth crossing (tab -> tab) safe: it fails on the RECEIVE
//      side in silence, and an undefined symbol arriving on the wire is exactly how it would fail.
//   3. REACHABILITY. #179 is the cost of getting this wrong: verbs crossed perfectly — full banks,
//      three census rows, inherited, cloned, HGT-carried — and opcode 236 appeared in ZERO of 1,424
//      live instructions, so the system could not choose against verbs because it could never run
//      one. A capability open in principle and closed in practice is not an opened capability. The
//      hard case is uaMaxDepth=1, which is where every universe starts.
//   4. THE INVARIANT. uaJitterConst's regex is exhaustive over this grammar only while `.toFixed(2)`
//      constants are the sole digit-bearing tokens and no leaf name is a whole-word substring of any
//      function name. `q0` would have broken it as silently as `y0` would have.
//   5. THE FOUR CROSSINGS. germline->population, parent->child, save->load, tab->tab. Every one of
//      them has had its own silent failure in this file, and a new kind of authored structure is not
//      finished until it survives all four.
//   6. LATE BINDING. Redefining a slot must change what already-compiled atoms compute, without
//      recompiling them — otherwise the operator bank is eight constants, not eight genes.
//   7. BOUNDEDNESS. Every reachable descriptor, against every nasty input, must be finite.
//   8. THE COST. A layer with no price is a layer that bloats.
//   9. EXACT REVERT. Gates off must draw the identical RNG stream, or every A/B in this repo that
//      uses one of them is measuring two things at once.
// Exits non-zero on any failure.   node grammar-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/grammar.js'); m.filename='/tmp/grammar.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  for(let s=0;s<300;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={errors:[]};
  const run=(n,fn)=>{ try{ return fn(); }catch(e){ out.errors.push(n+': '+((e&&e.message)||String(e)).slice(0,140)); return null; } };
  const mk=x=>({expression:x,compiled:null,failed:false,uses:0,age:0,state:0,alienHits:0,alienAttempts:0,creditTrace:0});
  const op=(p,a,b,k,c)=>({p:p,a:a,b:b,k:k,c:c,age:0});
  // A deterministic reseed, so two draws of the same length can be compared as sequences.
  const reseed=(n)=>{ let a=(n|0)>>>0;
    Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}; };

  // ── 1. BACKWARD COMPATIBILITY ────────────────────────────────────────────────────────────────
  // Expressions from before qa..qh existed, including ones that name every OTHER extension this
  // grammar has ever grown. If the wider signature shifts a parameter, these are what break.
  out.old=run('old',()=>{
    const cases=[['(a)+(b)',5],['(Math.tanh(a))*(b)',null],['((ya)+(0.00))*(1.00)',null],
                 ['Math.hypot(nx,ny)',null],['(f(0,a,b))+(0.00)',null]];
    const res=[]; let failed=0;
    for(const [e,expect] of cases){ const at=mk(e); uaCompile(at);
      if(at.failed){ failed++; res.push([e,'FAILED']); continue; }
      const v=uaCall(at,2,3); res.push([e,v]);
      if(expect!==null&&v!==expect)failed++; }
    return {failed,res};
  });

  // ── 2. TOTALITY: qa always means something ───────────────────────────────────────────────────
  out.total=run('total',()=>{
    const saved=genome.uaOps;
    const at=mk('qa(a,b)'); uaCompile(at);
    const compiledOnce=at.compiled;
    const r={};
    genome.uaOps=undefined;              r.noBankField=uaCall(at,3,4);   // never authored
    genome.uaOps=[];                     r.emptyBank=uaCall(at,3,4);     // authored then emptied
    genome.uaOps=[null,null,null,null,null,null,null,null]; r.released=uaCall(at,3,4);
    // NOTE these read uaOpEval, not uaCall: uaCall ends Math.max(-8,Math.min(8,r)) and has since
    // long before #180, so 3*4 comes back as 8 through an atom. That bound is checked on its own
    // below; here the question is whether the OPERATOR computes what its descriptor says.
    genome.uaOps=[op(0,2,2,1,0)];        r.product=uaOpEval(0,3,4);      // k=1 -> pure x*y
    genome.uaOps=[op(0,0,0,1,0)];        r.sum=uaOpEval(0,3,4);          // k=1 -> pure x+y
    genome.uaOps=[op(0,2,2,1,0)];        r.clampedThroughAtom=uaCall(at,3,4);
    // a hostile / drifted descriptor: out-of-range indices must not index off the end
    genome.uaOps=[op(1,-99,999,NaN,-5)]; r.hostile=uaOpEval(0,3,4);
    // an expression naming EVERY slot, with a bank that has none of them
    genome.uaOps=[];
    const all=mk('qa(qb(a,b),qc(qd(qe(a,b),qf(a,b)),qg(qh(a,b),b)))'); uaCompile(all);
    r.allSlotsEmptyBank=uaCall(all,1,2); r.allFailed=!!all.failed;
    genome.uaOps=saved;
    r.sameFn=(at.compiled===compiledOnce);   // late binding: never recompiled
    r.failed=!!at.failed;
    return r;
  });

  // ── 3. REACHABILITY: does the generator actually EMIT them, at the depth universes start at? ──
  out.reach=run('reach',()=>{
    const savedOps=genome.uaOps, savedDepth=genome.uaMaxDepth, savedW=genome.uaProdW;
    genome.uaOps=[op(0,0,1,0.5,0),op(1,2,3,0.5,1),op(0,4,5,0.5,2),op(1,6,7,0.5,3),
                  op(0,1,2,0.5,0),op(1,3,4,0.5,1),op(0,5,6,0.5,2),op(1,7,0,0.5,3)];
    genome.uaProdW=[1,1,1,1,1];
    const sample=(depth,n)=>{ genome.uaMaxDepth=depth;
      let withQ=0; const seen={};
      for(let i=0;i<n;i++){ const e=uaGenExpression();
        const hits=e.match(/\\b(qa|qb|qc|qd|qe|qf|qg|qh)\\b/g);
        if(hits){ withQ++; hits.forEach(h=>seen[h]=(seen[h]||0)+1); } }
      return {withQ,total:n,distinct:Object.keys(seen).length}; };
    const flat=sample(1,900);           // THE #179 CASE: every universe starts here
    const deep=sample(4,600);
    // and an emitted expression must actually compile and run
    genome.uaMaxDepth=3;
    let drew=null; for(let i=0;i<400&&!drew;i++){ const e=uaGenExpression(); if(/\\bq[a-h]\\b/.test(e))drew=e; }
    let ranOk=null;
    if(drew){ const at=mk(drew); uaCompile(at); ranOk={failed:!!at.failed,v:uaCall(at,0.5,-0.5),expr:drew.slice(0,70)}; }
    // and the branch must be SHUT when the bank is empty — open in principle is not the claim here
    genome.uaOps=[]; const shut=sample(3,400);
    genome.uaOps=savedOps; genome.uaMaxDepth=savedDepth; genome.uaProdW=savedW;
    return {flat,deep,ranOk,shutWhenEmpty:shut.withQ};
  });

  // ── 4. THE INVARIANT: the small-step operators must not see qa..qh as variables ──────────────
  out.invariant=run('invariant',()=>{
    const e='qa((a)+(1.25),qb(b,0.50))';
    let brokeOp=0, movedConst=0, swapBrokeOp=0, swapMoved=0;
    for(let i=0;i<300;i++){ const j=uaJitterConst(e);
      if(!/\\bqa\\b/.test(j)||!/\\bqb\\b/.test(j))brokeOp++;
      if(j!==e)movedConst++; }
    for(let i=0;i<300;i++){ const sw=uaSwapVar(e);
      if(!/\\bqa\\b/.test(sw)||!/\\bqb\\b/.test(sw))swapBrokeOp++;
      if(sw!==e)swapMoved++; }
    // no operator name may be a var (uaSwapVar must never write one into a leaf position)
    let swappedInQ=0;
    for(let i=0;i<400;i++){ if(/\\bq[a-h]\\b/.test(uaSwapVar('(a)+(b)')))swappedInQ++; }
    // and every emitted name must be digit-free, or uaJitterConst's regex stops being exhaustive
    const digity=USER_OP_NAMES.filter(n=>/\\d/.test(n));
    return {brokeOp,movedConst,swapBrokeOp,swapMoved,swappedInQ,digity,names:USER_OP_NAMES.join(',')};
  });

  // ── 5a. CROSSING: germline -> population ─────────────────────────────────────────────────────
  out.xClone=run('xClone',()=>{
    genome.uaOps=[op(0,1,2,0.4,0),null,op(1,3,4,0.7,2)];
    genome.uaProdW=[1,2,0.5,1,1]; genome.uaVarW=UA_ALL_VARS.map((_,i)=>i===0?3:1);
    const c=cloneGenome(genome);
    const shared={ops:c.uaOps===genome.uaOps, prod:c.uaProdW===genome.uaProdW, varw:c.uaVarW===genome.uaVarW,
                  desc:c.uaOps[0]===genome.uaOps[0]};
    c.uaOps[0].k=0.99; c.uaProdW[0]=2.5; c.uaVarW[0]=0.1; c.uaOps[2]=null;
    const diverged={k:genome.uaOps[0].k===0.4, prod:genome.uaProdW[0]===1,
                    varw:genome.uaVarW[0]===3, hole:!!genome.uaOps[2]};
    const holesKept=c.uaOps.length===3&&c.uaOps[1]===null;
    // and the census must see both sides
    const cen=crossingCensus();
    const rowOps=cen.rows.filter(r=>r.name==='atom.ops')[0];
    const rowRef=cen.rows.filter(r=>r.name==='atom.opRef')[0];
    return {shared,diverged,holesKept,rowOps:!!rowOps,rowRef:!!rowRef,
            declared:CROSSING_DECLARED.map(r=>r.name)};
  });

  // ── 5b. CROSSING: parent -> child ────────────────────────────────────────────────────────────
  out.xChild=run('xChild',()=>{
    const seen={ops:0,prod:0,varw:0};
    for(let i=0;i<200;i++){
      const g=cloneGenome(genome);
      g.uaOps=[op(0,1,2,0.4,0)]; g.uaProdW=[1,1,1,1,1]; g.uaVarW=UA_ALL_VARS.map(()=>1);
      const before=JSON.stringify([g.uaOps,g.uaProdW,g.uaVarW]);
      mutateChildGenome(g);
      const after=JSON.parse(JSON.stringify([g.uaOps,g.uaProdW,g.uaVarW]));
      const b=JSON.parse(before);
      if(JSON.stringify(after[0])!==JSON.stringify(b[0]))seen.ops++;
      if(JSON.stringify(after[1])!==JSON.stringify(b[1]))seen.prod++;
      if(JSON.stringify(after[2])!==JSON.stringify(b[2]))seen.varw++;
    }
    return seen;
  });

  // ── 5c. CROSSING: save -> load ───────────────────────────────────────────────────────────────
  out.xSave=run('xSave',()=>{
    genome.uaOps=[op(0,1,2,0.4,0),null,op(1,3,4,0.75,2),null,null,null,null,op(0,7,6,0.125,3)];
    genome.uaOps[0].age=9;
    genome.uaProdW=[0.5,1.25,2,0.125,3];
    genome.uaVarW=UA_ALL_VARS.map((_,i)=>+(i*0.1).toFixed(3));
    const before={ops:JSON.parse(JSON.stringify(genome.uaOps)),prod:genome.uaProdW.slice(),varw:genome.uaVarW.slice()};
    const blob=encodeGenome();
    genome.uaOps=undefined; genome.uaProdW=undefined; genome.uaVarW=undefined;
    decodeGenome(blob); sanitizeGenome();
    const after={ops:genome.uaOps,prod:genome.uaProdW,varw:genome.uaVarW};
    const slotsHeld=Array.isArray(after.ops)&&after.ops.length===UA_OPBANK&&
                    !!after.ops[0]&&!after.ops[1]&&!!after.ops[2]&&!!after.ops[7];
    const same=(x,y)=>Math.abs(x-y)<1e-3;
    const descOk=slotsHeld&&after.ops[0].p===0&&after.ops[0].a===1&&after.ops[0].b===2&&
                 same(after.ops[0].k,0.4)&&after.ops[0].c===0&&after.ops[0].age===9&&
                 after.ops[7].p===0&&after.ops[7].a===7&&after.ops[7].b===6&&same(after.ops[7].k,0.125);
    const prodOk=Array.isArray(after.prod)&&after.prod.length===5&&after.prod.every((v,i)=>same(v,before.prod[i]));
    const varOk=Array.isArray(after.varw)&&after.varw.length===UA_ALL_VARS.length&&
                after.varw.every((v,i)=>same(v,Math.min(4,before.varw[i])));
    // AND A PRE-#180 SAVE MUST LOAD AS THE PRE-#180 ENGINE. Built by stripping the three keys out of
    // this save and loading THAT — the actual thing every genome in the field is, rather than a
    // check that the keys were written (which the round trip above already implies).
    const j=JSON.parse(Buffer.from(blob,'base64').toString('utf8'));
    const wrote=('uop' in j)&&('upw' in j)&&('uvw' in j);
    delete j.uop; delete j.upw; delete j.uvw;
    genome.uaOps=undefined; genome.uaProdW=undefined; genome.uaVarW=undefined;
    decodeGenome(Buffer.from(JSON.stringify(j),'utf8').toString('base64'));
    sanitizeGenome();
    const legacy={ops:genome.uaOps===undefined, prod:genome.uaProdW===undefined, varw:genome.uaVarW===undefined,
                  // and the readers' defaults must be the pre-#180 grammar exactly
                  prodDefault:JSON.stringify(uaProdW())==='[1,1,1,1,1]',
                  opsEmpty:uaOpCount(genome)===0,
                  qaFallsBack:uaOpEval(0,3,4)===7};
    return {slotsHeld,descOk,prodOk,varOk,wrote,legacy};
  });

  // ── 5d. CROSSING: tab -> tab ─────────────────────────────────────────────────────────────────
  out.xWire=run('xWire',()=>{
    genome.uaOps=[op(0,1,2,0.4,0),null,op(1,3,4,0.75,2)];
    for(let i=0;i<N;i++) if(palive[i]&&pGenome[i]) pGenome[i].uaOps=genome.uaOps.map(d=>d?{...d}:null);
    let pkt=null; for(let t=0;t<60&&!pkt;t++)pkt=buildMigrantPacket();
    if(!pkt)return {noPacket:true};
    const carried=Array.isArray(pkt.uo);
    const accepted=validNetworkPayload('migrant',pkt);
    // slot order must be preserved, holes included
    const orderOk=carried&&pkt.uo.length===UA_OPBANK&&Array.isArray(pkt.uo[0])&&pkt.uo[1]===0&&Array.isArray(pkt.uo[2]);
    // and the wire must REJECT what the engine cannot hold
    const bad=(mut)=>{ const p=JSON.parse(JSON.stringify(pkt)); mut(p); return validNetworkPayload('migrant',p); };
    const rejects={
      opIndex: bad(p=>{p.uo[0][1]=99;}),
      cmpIndex:bad(p=>{p.uo[0][4]=17;}),
      blend:   bad(p=>{p.uo[0][3]=5;}),
      form:    bad(p=>{p.uo[0][0]=7;}),
      tooMany: bad(p=>{p.uo=new Array(UA_OPBANK+3).fill(0);}),
      shape:   bad(p=>{p.uo[0]='qa';}),
    };
    return {carried,accepted,orderOk,rejects,row:JSON.stringify(pkt.uo&&pkt.uo[0])};
  });

  // ── 6. LATE BINDING: redefining a slot changes what compiled atoms compute ───────────────────
  out.late=run('late',()=>{
    const at=mk('qa(a,b)'); uaCompile(at);
    const fn=at.compiled, readings=[], viaAtom=[];
    const step=(d)=>{ genome.uaOps=[d]; readings.push(uaOpEval(0,3,4)); viaAtom.push(uaCall(at,3,4)); };
    step(op(0,0,0,1,0));   // blend k=1 over x+y   -> 7
    step(op(0,2,2,1,0));   // blend k=1 over x*y   -> 12
    step(op(0,5,5,1,0));   // blend k=1 over max   -> 4
    step(op(1,0,1,0.5,0)); // gate 3<4  true  -> x+y -> 7
    step(op(1,0,1,0.5,1)); // gate 3>4  false -> x-y -> -1
    step(op(0,0,2,0.5,0)); // blend 0.5*(x+y) + 0.5*(x*y) = 9.5
    return {readings,viaAtom,neverRecompiled:at.compiled===fn};
  });

  // ── 7. BOUNDEDNESS: sweep every reachable descriptor against nasty inputs ────────────────────
  out.bounded=run('bounded',()=>{
    const inputs=[[0,0],[1,0],[0,1],[-1,0],[1e300,1e300],[-1e300,1e-300],[8,-8],[0.5,-0.5]];
    let nonFinite=0, outOfBand=0, n=0;
    const at=mk('qa(a,b)'); uaCompile(at);
    for(let p=0;p<2;p++)for(let a=0;a<UA_PRIM.length;a++)for(let b=0;b<UA_PRIM.length;b++)for(let c=0;c<UA_CMPF.length;c++){
      genome.uaOps=[op(p,a,b,0.5,c)];
      for(const [x,y] of inputs){
        const raw=uaOpEval(0,x,y); n++;
        if(!isFinite(raw))nonFinite++;
        const v=uaCall(at,x,y);
        if(!(v>=-8&&v<=8))outOfBand++;
      }
    }
    // and the NaN/Infinity path into uaOpEval itself
    genome.uaOps=[op(0,3,3,0.5,0)];
    const nasty=[uaOpEval(0,NaN,1),uaOpEval(0,Infinity,Infinity),uaOpEval(0,1,0),uaOpEval(0,undefined,null)];
    return {n,nonFinite,outOfBand,nasty,nastyFinite:nasty.every(v=>isFinite(v))};
  });

  // ── 8. THE COST is wired into the bill ──────────────────────────────────────────────────────
  out.cost=run('cost',()=>{
    genome.uaOps=[op(0,1,2,0.4,0),null,op(1,3,4,0.75,2)];
    return {rent:UA_OP_RENT, count:uaOpCount(genome), cap:UA_OPBANK,
            countIgnoresHoles:uaOpCount(genome)===2};
  });

  // ── 9. THE WEIGHTS BITE ─────────────────────────────────────────────────────────────────────
  out.weights=run('weights',()=>{
    const savedV=genome.uaVarW, savedP=genome.uaProdW, savedD=genome.uaMaxDepth, savedO=genome.uaOps;
    genome.uaOps=[]; genome.uaMaxDepth=1;
    // all weight on 'nb' — the generator should stop saying anything else
    genome.uaVarW=UA_ALL_VARS.map(n=>n==='nb'?1:0);
    let only=0,tot=0;
    for(let i=0;i<400;i++){ const e=uaGenExpression();
      const vs=e.match(UA_VAR_RE); if(!vs)continue; tot++;
      if(vs.every(v=>v==='nb'))only++; }
    // production weights: crank the ternary branch, starve the binary one
    genome.uaMaxDepth=3;
    const shape=(w)=>{ genome.uaProdW=w; let tern=0,bin=0;
      for(let i=0;i<400;i++){ const e=uaGenTerm(2);
        if(e.indexOf('?')>=0)tern++;
        if(/^\\(.*\\)[-+*\\/]\\(.*\\)$/.test(e))bin++; }
      return {tern,bin}; };
    const ternHeavy=shape([0.05,3,0.05,0.05,1]);
    const binHeavy =shape([3,0.05,0.05,0.05,1]);
    genome.uaVarW=savedV; genome.uaProdW=savedP; genome.uaMaxDepth=savedD; genome.uaOps=savedO;
    return {only,tot,ternHeavy,binHeavy};
  });

  // ── 10. EXACT REVERT: all-ones == unset, symbol for symbol ──────────────────────────────────
  // The claim the flag comments make is that a gate-off run draws the identical RNG stream. The
  // testable core of it: the neutral weight vectors must produce the same expressions, in the same
  // order, from the same seed, as no weight vectors at all.
  out.revert=run('revert',()=>{
    const savedV=genome.uaVarW, savedP=genome.uaProdW, savedD=genome.uaMaxDepth, savedO=genome.uaOps;
    const savedR=Math.random;
    genome.uaOps=[]; genome.uaMaxDepth=4;
    const draw=()=>{ const a=[]; for(let i=0;i<250;i++)a.push(uaGenExpression()); return a; };
    genome.uaProdW=undefined; genome.uaVarW=undefined; reseed(4242);
    const bare=draw();
    genome.uaProdW=[1,1,1,1,1]; genome.uaVarW=UA_ALL_VARS.map(()=>1); reseed(4242);
    const ones=draw();
    let diff=0; for(let i=0;i<bare.length;i++) if(bare[i]!==ones[i])diff++;
    Math.random=savedR;
    genome.uaVarW=savedV; genome.uaProdW=savedP; genome.uaMaxDepth=savedD; genome.uaOps=savedO;
    return {diff,n:bare.length,sample:bare[0]};
  });

  // ── 11. ADOPTION. The gap this rig found, and the reason uaSwapBinHead exists. ───────────────
  // Every route into qa..qh used to run through FRESH authoring, so an operator could only be
  // adopted by an atom that did not exist yet. Measured: four operators authored in 3,000 ticks and
  // ZERO atoms naming one. That is #179 arriving a swing early, and it is checked here by DRIVING
  // the path rather than waiting for it — #143's rule, and the reason atom.cull was ever executed.
  out.adopt=run('adopt',()=>{
    genome.uaOps=[op(0,1,2,0.4,0),op(1,3,4,0.75,2),null,null,null,null,null,op(0,7,6,0.2,1)];
    const seed='Math.hypot((a)+(b),Math.min(nb,rl))';
    let adopted=0, dropped=0, compiled=0, broke=0;
    for(let i=0;i<600;i++){
      const v=uaSwapBinHead(seed);
      if(/\\bq[a-h]\\b/.test(v))adopted++;   // NOTE \\b, not \b: this whole block lives inside a template literal, where \b is a BACKSPACE character. The first version of this line counted zero adoptions from a mechanism that was working perfectly, and the drop check next to it read 600/600 for the same reason
      const at=mk(v); uaCompile(at);
      if(at.failed)broke++; else { compiled++; uaCall(at,1,2); }
    }
    // and the step must be REVERSIBLE, or it is a ratchet rather than a move
    const seeded='qa((a)+(b),Math.min(nb,rl))';
    for(let i=0;i<600;i++){ const v=uaSwapBinHead(seeded); if(!/\\bqa\\b/.test(v))dropped++; }
    // an expression with no binary head must come back untouched
    let touched=0;
    for(let i=0;i<200;i++) if(uaSwapBinHead('(a)+(Math.tanh(b))')!=='(a)+(Math.tanh(b))')touched++;
    return {adopted,dropped,broke,compiled,touched};
  });

  // ── 11b. THE VOCABULARY TRAVELS WITH THE WORD ────────────────────────────────────────────────
  // The route that did not exist until the crossing row said germline 5 / population 0. An atom's
  // TEXT crossing into a genome that did not write it must bring the operators it names, or the
  // carrier reads a plainer dictionary and nothing anywhere says so.
  out.carry=run('carry',()=>{
    const src={uaOps:[op(0,1,2,0.4,0),op(1,3,4,0.75,2),null,null,null,null,null,op(0,7,6,0.2,1)]};
    const dst={uaOps:undefined};
    const n=carryOpsForExpr(src,dst,'qa(a,qh(b,nb))');
    const carried=Array.isArray(dst.uaOps)&&!!dst.uaOps[0]&&!!dst.uaOps[7];
    const onlyNamed=Array.isArray(dst.uaOps)&&!dst.uaOps[1];     // qb was not named, must not travel
    const slotAligned=carried&&dst.uaOps[0].a===1&&dst.uaOps[7].a===7;
    // NON-DESTRUCTIVE: a resident slot is never overwritten, or every atom the resident already had
    // naming that slot silently changes meaning — #137's harm, one bank over.
    const res={uaOps:[op(0,5,5,0.9,3),null,null,null,null,null,null,null]};
    carryOpsForExpr(src,res,'qa(a,b)');
    const kept=res.uaOps[0].a===5&&Math.abs(res.uaOps[0].k-0.9)<1e-9;
    // and an expression naming nothing carries nothing
    const none={uaOps:undefined};
    const zero=carryOpsForExpr(src,none,'(a)+(Math.hypot(b,nb))');
    return {n,carried,onlyNamed,slotAligned,kept,zero,noneTouched:!Array.isArray(none.uaOps)||uaOpCount(none)===0};
  });

  // ── 11c. AN OPERATOR IS REACHABLE AT BIRTH ───────────────────────────────────────────────────
  // Counting the draws said ~0.4 operator-naming atoms per 6,000 ticks and the run measured zero.
  // #55's and #179's answer, both already written down in this file: wire it once at birth.
  out.wire=run('wire',()=>{
    // (a) a bank whose atoms are all FLAT — the young-universe case, where nothing has a binary head
    const flatBank=['(a)+(b)','(Math.tanh(m))*(0.50)'];
    genome.userAtoms=flatBank.map(mk);
    genome.boundOpcodes=[0,1]; genome.opStacks=null;
    genome.uaOps=[op(0,1,2,0.4,0)];
    const beforeFlat=genome.userAtoms.length;
    const okFlat=uaWireOpIntoBank(0);
    const namedFlat=uaOpRefs(genome);
    const grewFlat=genome.userAtoms.length-beforeFlat;
    const compiledFlat=genome.userAtoms.every(a=>{ uaCompile(a); return !a.failed; });
    // (b) a bank that HAS a binary head — the edit route, which must not grow the bank
    genome.userAtoms=[mk('Math.hypot((a)+(b),nb)')];
    genome.boundOpcodes=[0];
    const okHead=uaWireOpIntoBank(0);
    const namedHead=uaOpRefs(genome);
    const grewHead=genome.userAtoms.length-1;
    const compiledHead=genome.userAtoms.every(a=>{ a.compiled=null; a.failed=false; uaCompile(a); return !a.failed; });
    return {okFlat,namedFlat,grewFlat,compiledFlat,okHead,namedHead,grewHead,compiledHead,
            headExpr:genome.userAtoms[0]&&genome.userAtoms[0].expression};
  });

  // ── 12. IT RUNS. The whole loop, with the layer live and nothing pre-seeded. ─────────────────
  out.live=run('live',()=>{
    genome.uaOps=undefined; genome.uaProdW=undefined; genome.uaVarW=undefined;
    // AND WIPE WHAT THE EARLIER SECTIONS PLANTED. out.xWire installs a bank into every living
    // pGenome by hand to build a migrant, so a population-side check after it would be testing this
    // rig's own setup rather than the engine. The first version of this section did exactly that and
    // reported "the bank crosses into the population: population 390" while a real 6,000-tick run
    // measured population ZERO and the crossing census called it STRANDED.
    for(let i=0;i<N;i++) if(pGenome[i]){ pGenome[i].uaOps=undefined; pGenome[i].uaProdW=undefined; pGenome[i].uaVarW=undefined; }
    const t0=tick;
    for(let s=0;s<6000;s++){ globalThis.__detMs+=5; loop(); }
    // EPOCH_TICKS is 5,000 and the tick counter resets on reload, so waiting for a flush is a coin flip in a
    // rig this length. #143: drive the rare path, do not wait for it. flushEpoch is what writes the
    // instrument row, and an instrument nobody has executed is not an instrument.
    const rowsBefore=(__uaOpLog||[]).length;
    flushEpoch({idx:0,n:1,popSum:N,popPeak:N,extStart:genome.extinctions|0,fitSum:0,clPeak:0,
                mut:0,popMin:N,divSum:0});
    const cen=crossingCensus();
    const rowOps=cen.rows.filter(r=>r.name==='atom.ops')[0]||{};
    const rowRef=cen.rows.filter(r=>r.name==='atom.opRef')[0]||{};
    return {ran:tick-t0, N:N, defined:uaOpCount(genome), refs:uaOpRefs(genome),
            prod:Array.isArray(genome.uaProdW), varw:Array.isArray(genome.uaVarW),
            germline:rowOps.germline, population:rowOps.population, stranded:!!rowOps.stranded,
            refPop:rowRef.population,
            live:__liveness['atom.opAuthor']|0, drift:__liveness['atom.opDrift']|0,
            fires:__liveness['atom.opFire']|0, fallbacks:__liveness['atom.opFallback']|0,
            rowsBefore, logRows:(__uaOpLog||[]).length,
            lastRow:JSON.stringify((__uaOpLog||[]).slice(-1)[0]||null),
            declared:LIVENESS_DECLARED.filter(n=>n.indexOf('atom.op')===0)};
  });
  return out;
};`,'/tmp/grammar.js');
const r=globalThis.__t();
let pass=0, fail=0;
const ck=(n,ok,d)=>{ (ok?pass++:fail++); console.log('  '+(ok?'ok  ':'FAIL')+'  '+n+(d!==undefined?('   '+d):'')); };

// 1
ck('expressions written before qa..qh still compile and evaluate', r.old && r.old.failed===0,
   r.old && JSON.stringify(r.old.res));

// 2
const T=r.total||{};
ck('qa means something with no bank field at all', isFinite(T.noBankField), 'x+y on 3,4 = '+T.noBankField);
ck('qa means something with an empty bank', T.emptyBank===7, T.emptyBank+'  (UA_PRIM[0] = x+y)');
ck('qa means something after every slot is released', T.released===7, ''+T.released);
ck('a defined slot overrides the fallback', T.product===12 && T.sum===7, T.product+' (x*y) / '+T.sum+' (x+y)');
ck('and uaCall still bounds what reaches the VM', T.clampedThroughAtom===8,
   'operator returned '+T.product+', the atom yielded '+T.clampedThroughAtom+' (uaCall bounds every atom to ±8)');
ck('a drifted or hostile descriptor cannot index off the end', isFinite(T.hostile), ''+T.hostile);
ck('an expression naming all eight slots survives an empty bank',
   T.allFailed===false && isFinite(T.allSlotsEmptyBank), 'value '+T.allSlotsEmptyBank);

// 3
const R=r.reach||{};
ck('#179 CASE: the generator emits operators at uaMaxDepth=1', R.flat && R.flat.withQ>0,
   R.flat && (R.flat.withQ+'/'+R.flat.total+' expressions, '+R.flat.distinct+'/8 distinct'));
ck('and reaches all eight slots at depth 1', R.flat && R.flat.distinct===8);
ck('and emits them from the nested branch too', R.deep && R.deep.withQ>0,
   R.deep && (R.deep.withQ+'/'+R.deep.total));
ck('what it emits compiles and runs', R.ranOk && R.ranOk.failed===false && isFinite(R.ranOk.v),
   R.ranOk && R.ranOk.expr);
ck('the branch is SHUT while the bank is empty', R.shutWhenEmpty===0,
   'emitted '+R.shutWhenEmpty+' operator expressions with nothing authored');

// 4
const I=r.invariant||{};
ck('uaJitterConst never breaks an operator name', I.brokeOp===0, I.brokeOp+' broken / '+I.movedConst+' constants jittered');
ck('and still jitters the constants it is for', I.movedConst>0);
ck('uaSwapVar never breaks an operator name', I.swapBrokeOp===0, I.swapBrokeOp+' broken / '+I.swapMoved+' vars swapped');
ck('and never writes an operator into a leaf position', I.swappedInQ===0, I.swappedInQ+'/400');
ck('every operator name is digit-free', I.digity && I.digity.length===0, I.names);

// 5a
const C=r.xClone||{};
ck('cloneGenome does not SHARE the operator bank', C.shared && !C.shared.ops && !C.shared.desc,
   C.shared && JSON.stringify(C.shared));
ck('cloneGenome does not share the weight vectors', C.shared && !C.shared.prod && !C.shared.varw);
ck('a clone can diverge all three without touching the germline',
   C.diverged && C.diverged.k && C.diverged.prod && C.diverged.varw && C.diverged.hole,
   C.diverged && JSON.stringify(C.diverged));
ck('a released slot keeps its POSITION through a clone', C.holesKept===true);
ck('the crossing census carries both new rows', C.rowOps===true && C.rowRef===true,
   C.declared && C.declared.join(' '));

// 5b
const CH=r.xChild||{};
ck('parent -> child: the operator bank diverges', CH.ops>0, CH.ops+'/200 births moved a descriptor');
ck('parent -> child: the production weights diverge', CH.prod>0, CH.prod+'/200');
ck('parent -> child: the vocabulary weights diverge', CH.varw>0, CH.varw+'/200');

// 5c
const S=r.xSave||{};
ck('save -> load: the bank round-trips, holes and all', S.slotsHeld===true);
ck('save -> load: every descriptor field survives', S.descOk===true);
ck('save -> load: the production weights survive', S.prodOk===true);
ck('save -> load: the vocabulary weights survive', S.varOk===true);
ck('the three keys are actually written to the save', S.wrote===true);
ck('a pre-#180 save loads with none of them created', S.legacy && S.legacy.ops && S.legacy.prod && S.legacy.varw,
   S.legacy && JSON.stringify(S.legacy));
ck('and reads as the pre-#180 grammar exactly',
   S.legacy && S.legacy.prodDefault && S.legacy.opsEmpty && S.legacy.qaFallsBack);

// 5d
const W=r.xWire||{};
ck('tab -> tab: the migrant carries its operator bank', W.carried===true, W.noPacket?'no eligible particle':W.row);
ck('tab -> tab: and the protocol accepts it', W.accepted===true);
ck('tab -> tab: slot order (and holes) preserved on the wire', W.orderOk===true);
const RJ=W.rejects||{};
for(const k of ['opIndex','cmpIndex','blend','form','tooMany','shape'])
  ck('the wire rejects a bad operator row: '+k, RJ[k]===false);

// 6
const L=r.late||{};
ck('redefining a slot changes what a COMPILED atom computes',
   L.viaAtom && new Set(L.viaAtom).size>=4, L.viaAtom && JSON.stringify(L.viaAtom));
ck('blend and gate both compute what they say they do',
   L.readings && L.readings[0]===7 && L.readings[1]===12 && L.readings[2]===4 &&
   L.readings[3]===7 && L.readings[4]===-1 && Math.abs(L.readings[5]-9.5)<1e-9,
   L.readings && JSON.stringify(L.readings));
ck('and nothing was ever recompiled to do it', L.neverRecompiled===true);

// 7
const B=r.bounded||{};
ck('every reachable descriptor is finite on every nasty input', B.nonFinite===0,
   B.n+' (form x opA x opB x cmp x inputs) evaluations, '+B.nonFinite+' non-finite');
ck('and the atom output stays inside uaCall’s ±8', B.outOfBand===0, B.outOfBand+' out of band');
ck('NaN / Infinity / undefined into uaOpEval come back finite', B.nastyFinite===true, JSON.stringify(B.nasty));

// 8
const K=r.cost||{};
ck('a defined slot carries standing rent', K.rent>0, 'UA_OP_RENT = '+K.rent+' instruction-equivalents per slot');
ck('the rent counts defined slots, not holes', K.countIgnoresHoles===true, K.count+' of '+K.cap+' slots');
const billed=/const totalCost=\(nInst\+_stack\+_opRent\+/.test(code);
ck('and the rent is actually in the bill', billed, 'totalCost includes _opRent');
const rentRead=/const _opRent=__UA_OPS\?uaOpCount\(\)\*UA_OP_RENT:0;/.test(code);
ck('read from the carrier’s own bank, under the gate', rentRead);

// 9
const V=r.weights||{};
ck('a lineage that zeroes its vocabulary speaks only what is left',
   V.only>0 && V.tot>0 && V.only/V.tot>0.95, V.only+'/'+V.tot+' expressions used only `nb`');
ck('production weights reorder which branch is favoured',
   V.ternHeavy && V.binHeavy && V.ternHeavy.tern>V.binHeavy.tern && V.binHeavy.bin>V.ternHeavy.bin,
   'ternary-heavy '+JSON.stringify(V.ternHeavy)+'  binary-heavy '+JSON.stringify(V.binHeavy));

// 10
const RV=r.revert||{};
ck('all-ones weights draw the identical stream to no weights at all', RV.diff===0,
   RV.diff+' of '+RV.n+' expressions differed');

// 11
// 11
const AD=r.adopt||{};
ck('an EXISTING atom can adopt an invented operator', AD.adopted>0,
   AD.adopted+'/600 head swaps landed on qa..qh — the route that did not exist before this rig ran');
ck('and can drop one again — a move, not a ratchet', AD.dropped>0, AD.dropped+'/600');
ck('every adopted expression still compiles', AD.broke===0, AD.compiled+' compiled, '+AD.broke+' broken');
ck('an expression with no binary head is left alone', AD.touched===0, AD.touched+'/200 touched');

// 11b
const CA=r.carry||{};
ck('an atom crossing genomes brings the operators it names', CA.carried===true, CA.n+' slots carried');
ck('and only the ones it names', CA.onlyNamed===true);
ck('slot order survives the carry', CA.slotAligned===true);
ck('a resident slot is never overwritten', CA.kept===true);
ck('an expression naming none carries none', CA.zero===0 && CA.noneTouched===true);

// 11c
const WI=r.wire||{};
ck('a new operator is wired into a FLAT bank at birth', WI.okFlat===true && WI.namedFlat>0,
   'authored '+WI.grewFlat+' atom(s); '+WI.namedFlat+' now name it');
ck('and everything in that bank still compiles', WI.compiledFlat===true);
ck('a bank with a binary head is EDITED, not grown', WI.okHead===true && WI.grewHead===0 && WI.namedHead>0,
   WI.headExpr);
ck('and that edit still compiles', WI.compiledHead===true);

// 12
const LV=r.live||{};
ck('the loop runs with the layer live', LV.ran>=6000, LV.ran+' ticks, N '+LV.N);
ck('a universe authors operators on its own', LV.live>0,
   LV.live+' authored, '+LV.drift+' drifted, '+LV.defined+' standing');
ck('and its expressions come to NAME them', LV.refs>0 || LV.refPop>0,
   'germline '+LV.refs+' atoms, population '+LV.refPop);
ck('and they actually RUN', LV.fires>0, LV.fires+' evaluations, '+LV.fallbacks+' fallbacks');
// The wipe at the top of this section leaves population atoms naming operators their genome no
// longer has — which is precisely the state atom.opFallback exists to report, and a clean run of the
// same length measures ZERO of them. A nonzero count here is the instrument working, not a defect.
ck('the fallback counter notices expressions that outlived their operators', LV.fallbacks>0,
   LV.fallbacks+' degraded evaluations after this rig wiped the population banks');
ck('the bank crosses into the population', LV.population>0 && !LV.stranded,
   'germline '+LV.germline+', population '+LV.population);
ck('the two weight vectors are created too', LV.prod===true && LV.varw===true);
ck('the epoch instrument records the layer', LV.logRows>LV.rowsBefore,
   LV.logRows+' rows, last '+LV.lastRow);
ck('every liveness name this layer needs is declared', LV.declared && LV.declared.length===7,
   LV.declared && LV.declared.join(' '));
ck('nothing this layer authored is STRANDED', LV.stranded===false,
   'atom.ops germline '+LV.germline+' / population '+LV.population);

ck('no errors thrown anywhere', r.errors.length===0, r.errors.join(' | '));
console.log('\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
