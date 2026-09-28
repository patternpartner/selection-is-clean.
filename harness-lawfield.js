// #255 — UNIVERSES SELECTED ON NOVELTY BEYOND DRIFT. Start from what only this system has: each universe carries its
// own physics (the law table, #183/#197/#222) and its own mechanism switches (#253). #254 selected switchboards on
// effective lineages and made worlds LESS novel; its write-up named the two fixes, and this rig is both:
//   1. a universe does not change its own laws during a run (LAWMUT=0, switchboard proposals off). Physics changes
//      only between epochs, by inheritance from another universe, so there is something for selection to hold.
//   2. the judge is novelty itself, measured AGAINST DRIFT so that turning mutation up cannot buy a win.
//
// THE HERITABLE THING is a universe's law vector (every LAW_DECLARED row except the four that only steer in-world
// proposals, which are off here) plus its seven switches. Worlds start from the declared defaults, each moved by
// three applications of the mutation operator from a PRNG seeded by its own seed alone, so every arm and replicate
// starts from the same six vectors.
//
// THE JUDGE, per world per epoch: #256's sweep, run inside the epoch (novelty-shadows.js - one measurement, shared).
// Five layers: trait cells (#247's grid, axes 0-2), lineages, the programs particles run, their authored atoms, their
// channel chemistries. A PERSISTENT ARRIVAL is a key this world has never held at M carriers, reaching M and holding
// it P ticks later, inside the epoch. Against it, K neutral shadows copied from the living population at the epoch's
// start, given the real world's births, deaths and introductions of new tokens (#256's MIXED null; #247's kernel at the
// live INHERIT_SD for traits).
//   layer ratio = real persistent arrivals / max(1, mean shadow persistent arrivals)
//   score       = the mean over the five layers of log2(1 + layer ratio)
// A layer that holds nothing new scores 0 whatever its drift would have done - a difference (real minus shadow)
// would reward worlds whose drift is small, i.e. stagnant ones. The log keeps one layer from deciding every pair: in
// the pilot the program layer ran ratios of 4-10 while the others ran 0-2. Why five layers and not traits alone: the
// pilot and #256's sweep read trait space as holding ZERO new cells (SLOWER THAN CHANCE, 3 of 3 seeds, both nulls); a
// judge on traits alone scores every world 0, while the code layers keep new variants arriving by the hundred. Because
// the shadows are handed the real world's introductions, raising the SUPPLY of new things (a law that multiplies
// births, say) raises real and shadow alike. The MIXED band is too narrow to rule on (#256b: a neutral marker leaves it
// 3 times in 6) - so the judge takes its MEAN as a normaliser, and the verdict comes from the neutral ARM, not the band.
// WHAT "BEYOND DRIFT" MEANS HERE, said before any result: faster than a well-mixed population drifting on the same
// supply. #256 measured that sideways transfer (atoms, channels), recurrence and reproductive skew all beat that null
// without selection. So a world wins by making novelty spread and hold - by any route - which is the artwork's claim;
// it is NOT a claim that novelty is selected. The family-tree replay null (#256b) is computed alongside and reported
// (otherNull), never judged on. JUDGE_NULL=tree swaps them, for a later experiment.
// Guard: a world whose population fell below MINALIVE at any sample in the epoch scores 0.
// THE CHECK the judge never sees: the universe's own germline authorship - new germline programs and new germline atom
// expressions per epoch - and, descriptively, the trait ratio on held-out axes 3-4 (grid B, 2-D, BINS_B^2 cells).
//
// ARMS. Worlds are paired at random each epoch but the last. ARM=tournament: the lower score adopts the higher's
// whole vector, mutated. ARM=neutral: the same, with the winner picked by a coin - drift among universes, the null
// for selection among universes as the shadows are the null for novelty within one. A tied pair (0 against 0 - two
// guarded worlds, say) is handled the same in both arms: the coin's loser copies nobody and mutates its own physics.
// So both arms make the same number of mutation events, and differ ONLY in who wins a decided pair.
// REP picks the rig's own PRNG stream; epoch 0 is identical across every arm and replicate (a determinism check).
//
// Mutation: each law moves with probability MUT_LAW by (U-0.5)*span*0.35 - the engine's own proposal step - clamped
// to the row's bounds, and refused as the engine refuses it if it would lift REGEN/METABOLIC_ENERGY_DRAW past
// LAW_K_MAX (#232). Each switch flips with probability MUT_SW.
// Nothing here draws from the engine: shadows and the rig use their own mulberry32 streams.
//
//   ARM=tournament|neutral REP=1 K=6 SEED0=111 WARM=1000 EPOCH=6000 EPOCHS=8 node harness-lawfield.js
//   env also: SH (8 shadows)  BINS (10) BINS_B (20) RANGE (1.5) M (3) P (1000) EVERY (25) SAMPLE (100)
//             MINALIVE (50) MUT_LAW (0.1) MUT_SW (0.05) INIT_MUT (3)
// Output: one JSON object - per epoch, per world: seed, score, check, raw counts, alive, effN, the vector it ran.
// No backticks in the appended driver's comments: the engine source is compiled as one string.
const path=require('path'), fs=require('fs'), cp=require('child_process');
const E=process.env;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const NS=require(path.join(__dirname,'novelty-shadows.js'));
if(process.argv[2]==='--world'){
  // ── one world, driven over IPC ──────────────────────────────────────────────────────────────────────────
  process.env.LAWMUT='0'; delete process.env.SWITCHBOARD;
  require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis);
  require(path.join(__dirname,'harness-env.js'))(globalThis);
  const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  const Module=require('module');const m=new Module('/tmp/lawfield-world.js');m.filename='/tmp/lawfield-world.js';m.paths=Module._nodeModulePaths('/tmp');
  m._compile(code+`
;globalThis.__LF={
  step:function(){ globalThis.__detMs+=5; try{loop();return true;}catch(e){return false;} },
  lawmut:function(){ return __LAWMUT; }, swb:function(){ return switchboardOn(); },
  read:`+NS.READER(5)+`,
  germ:`+NS.GERM+`,
  effN:function(){ const cnt=new Map(); let n=0; for(let i=0;i<N;i++){ if(!palive[i])continue; n++; cnt.set(pLin[i],(cnt.get(pLin[i])||0)+1); }
    let s2=0; cnt.forEach(c=>{const p=c/(n||1);s2+=p*p;}); return s2>0?1/s2:0; },
  sd:function(){ return (typeof inheritOn==='function'&&!inheritOn())?0:INHERIT_SD; }, hard:function(){ return TEND_HARD; },
  wrapBirths:`+NS.BIRTHS+`,
  onCompact:`+NS.COMPACT+`,
  schema:function(){ return {laws:LAW_DECLARED.map(r=>({name:r.name,lo:r.lo,hi:r.hi})),mechs:MECH_DECLARED.slice(),kmax:LAW_K_MAX}; },
  laws:function(){ const o={}; for(const r of LAW_DECLARED){ try{ o[r.name]=+r.get(); }catch(_){} } return o; },
  board:function(){ const o={}; for(const n of MECH_DECLARED)o[n]=mechGet(n); return o; },
  setVector:function(v){ let refused=0, set=0;
    for(const r of LAW_DECLARED){ const x=v.laws[r.name]; if(typeof x!=='number'||!isFinite(x))continue;
      const to=__cl(x,r.lo,r.hi); if(lawRaisesCapacityPast(r,to)){ refused++; continue; } try{ r.set(to); set++; }catch(_){} }
    for(const n of MECH_DECLARED){ const b=v.board[n]; if(b===0||b===1)mechSet(n,b); }
    return {refused,set}; }
};`,'/tmp/lawfield-world.js');
  const LF=globalThis.__LF;
  const SH=+(E.SH||8), BINS=+(E.BINS||10), BINS_B=+(E.BINS_B||20), RANGE=+(E.RANGE||1.5), M=+(E.M||3);
  const P=+(E.P||1000), EVERY=+(E.EVERY||25), SAMPLE=+(E.SAMPLE||100), SEED=+(E.SEED||1);
  const {LAYERS,mulberry,countOf,tracker,record,persistentIn,traitStep,labelLayer,newHistory,familyTree}=NS;
  const bin=(v,nb)=>{let b=Math.floor((v+RANGE)/(2*RANGE)*nb);return b<0?0:b>=nb?nb-1:b;};
  const cellA=t=>(bin(t[0],BINS)*BINS+bin(t[1],BINS))*BINS+bin(t[2],BINS), cellB=t=>bin(t[3],BINS_B)*BINS_B+bin(t[4],BINS_B);
  // this world's history, kept across epochs: label layers, the two trait grids' held cells, the germline's authorship
  const hist={}; for(const n of LAYERS)hist[n]=newHistory();
  const atA=new Set(), atB=new Set(), germ={prog:new Set(),raw:new Set(),proven:new Set()};
  let tree=null;   // the TREE null (#256b), rebuilt from the real world at every epoch's start
  const takeBirths=LF.wrapBirths((i,pa,pb)=>{ if(tree)tree.onBirth(i,pa,pb); }); let errs=0, epochNo=0;
  LF.onCompact(ni=>{ if(tree)tree.onCompact(ni); });   // the tree's per-slot state moves with its particle
  const germNew=()=>{ const g=LF.germ(); let np=0,nr=0,nv=0; if(!germ.prog.has(g.prog)){ germ.prog.add(g.prog); np++; }
    for(const x of g.raw) if(!germ.raw.has(x)){ germ.raw.add(x); nr++; } for(const x of g.proven) if(!germ.proven.has(x)){ germ.proven.add(x); nv++; } return [np,nr,nv]; };
  process.on('message',msg=>{
    if(msg.cmd==='warm'){ for(let s=0;s<msg.ticks;s++) if(!LF.step())errs++; takeBirths(); germNew();
      process.send({alive:LF.read().tr.length,lawmut:LF.lawmut(),swb:LF.swb()}); }
    else if(msg.cmd==='epoch'){ const T=msg.ticks, from=1, to=T-P+1;   // arrivals after the epoch's first sample, with room to persist inside it
      const w0=LF.read(); let prevN=w0.tr.length, minAlive=prevN, effSum=0, effK=0, births=0;
      const mix=SEED*104729+epochNo*15485863;
      tree=familyTree(SH,mix,w0.cap,5); tree.sd=LF.sd(); tree.H=LF.hard(); tree.syncTraits(w0.idx,w0.tr,true);
      const L={}; for(const n of LAYERS)L[n]=labelLayer(n,w0.layers[n],SH,mix,M,hist[n],tree,w0.idx);
      // the trait shadows carry all five axes, so one set serves grid A (judged) and grid B (held out)
      const hA=new Set(atA), hB=new Set(atB);
      const TR={realA:tracker(),realB:tracker(),sh:Array.from({length:SH},(_,k)=>({rng:mulberry(0x9E3779B9^(k*7919+mix)),pop:w0.tr.map(t=>t.slice()),A:tracker(),B:tracker()}))};
      const cc=(pop,f)=>countOf(pop.map(f));
      record(TR.realA,0,cc(w0.tr,cellA),M,hA); record(TR.realB,0,cc(w0.tr,cellB),M,hB);
      for(const s of TR.sh){ record(s.A,0,cc(s.pop,cellA),M,hA); record(s.B,0,cc(s.pop,cellB),M,hB); }
      const TT=Array.from({length:SH},()=>({A:tracker(),B:tracker()})); for(const s of TT){ record(s.A,0,cc(w0.tr,cellA),M,hA); record(s.B,0,cc(w0.tr,cellB),M,hB); }
      const g0=[0,0,0];
      for(let t=1;t<=T;t++){
        if(!LF.step())errs++;
        if(t%EVERY!==0)continue;
        const w=LF.read(), nowN=w.tr.length, B=takeBirths(), D=Math.max(0,prevN+B-nowN); prevN=nowN; births+=B;
        const sd=LF.sd(), H=LF.hard(), smp=t%SAMPLE===0;
        for(const s of TR.sh) traitStep(s.pop,D,B,sd,H,s.rng,5);
        for(const n of LAYERS) L[n].step(w.layers[n],D,B,smp,t,w.idx,tree.born);
        tree.syncTraits(w.idx,w.tr,false); tree.born.length=0; tree.sd=sd; tree.H=H;
        if(smp){ if(nowN<minAlive)minAlive=nowN; effSum+=LF.effN(); effK++;
          record(TR.realA,t,cc(w.tr,cellA),M,hA); record(TR.realB,t,cc(w.tr,cellB),M,hB);
          for(const s of TR.sh){ record(s.A,t,cc(s.pop,cellA),M,hA); record(s.B,t,cc(s.pop,cellB),M,hB); }
          for(let k=0;k<SH;k++){ const tk=tree.traitsOf(k,w.idx); record(TT[k].A,t,cc(tk,cellA),M,hA); record(TT[k].B,t,cc(tk,cellB),M,hB); }
          const gn=germNew(); g0[0]+=gn[0]; g0[1]+=gn[1]; g0[2]+=gn[2]; } }
      for(const n of LAYERS)L[n].close(); for(const k of TR.realA.first.keys())atA.add(k); for(const k of TR.realB.first.keys())atB.add(k);
      tree=null; epochNo++;
      const per={}; const pi=tr=>persistentIn(tr,from,to,P);
      per.traits={real:pi(TR.realA),sh:TR.sh.map(s=>pi(s.A)),tsh:TT.map(s=>pi(s.A))};
      for(const n of LAYERS) per[n]={real:pi(L[n].real),sh:L[n].sh.map(s=>pi(s.tr)),tsh:L[n].tsh.map(s=>pi(s.tr)),intro:L[n].intro};
      process.send({alive:prevN,minAlive,effN:effK?effSum/effK:0,births,errs,per,heldOut:{real:pi(TR.realB),sh:TR.sh.map(s=>pi(s.B)),tsh:TT.map(s=>pi(s.B))},
        germ:{programs:g0[0],atoms:g0[1],proven:g0[2]},laws:LF.laws(),board:LF.board()}); }
    else if(msg.cmd==='schema') process.send(LF.schema());
    else if(msg.cmd==='set') process.send(LF.setVector(msg.v));
    else if(msg.cmd==='exit') process.exit(0);
  });
  process.send({ready:true});
  return;
}
// ── the coordinator ──────────────────────────────────────────────────────────────────────────────────────────
const ARM=E.ARM||'tournament', REP=+(E.REP||1), K=+(E.K||6), SEED0=+(E.SEED0||111), WARM=+(E.WARM||1000);
const EPOCH=+(E.EPOCH||6000), NE=+(E.EPOCHS||8), MUT_LAW=+(E.MUT_LAW||0.1), MUT_SW=+(E.MUT_SW||0.05), INIT_MUT=+(E.INIT_MUT||3);
const MINALIVE=+(E.MINALIVE||50), JNULL=E.JUDGE_NULL||'mixed';   // which null the judge reads - both are reported
if(JNULL!=='tree'&&JNULL!=='mixed'){ console.log(JSON.stringify({error:'JUDGE_NULL must be tree or mixed'})); process.exit(2); }
if(ARM!=='tournament'&&ARM!=='neutral'){ console.log(JSON.stringify({error:'ARM must be tournament or neutral'})); process.exit(2); }
// the four rows that only steer in-world proposals - inert with LAWMUT=0, so not part of the heritable vector
const INERT=new Set(['LAW_VIABLE','LAW_PROBATION','LAW_COST','LAW_RATE']);
const R=mulberry(0xC0FFEE^(SEED0*2654435761)^(REP*40503)^(ARM==='tournament'?0x1234:0x5678));
const worlds=[];
for(let i=0;i<K;i++){ const seed=SEED0+i;
  const ch=cp.fork(__filename,['--world'],{env:Object.assign({},process.env,{SEED:String(seed)}),stdio:['ignore','ignore','inherit','ipc']});
  worlds.push({seed,ch}); }
const ask=(w,msg)=>new Promise(res=>{ w.ch.once('message',res); w.ch.send(msg); });
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
(async()=>{
  await Promise.all(worlds.map(w=>new Promise(r=>w.ch.once('message',r))));
  const schema=await ask(worlds[0],{cmd:'schema'});
  const rows=schema.laws.filter(r=>!INERT.has(r.name));
  const kOf=l=>l.METABOLIC_ENERGY_DRAW>0?l.WORLD_ENERGY_REGEN/l.METABOLIC_ENERGY_DRAW:Infinity;
  function mutate(v,rng){ const o={laws:Object.assign({},v.laws),board:Object.assign({},v.board)};
    for(const r of rows){ if(rng()>=MUT_LAW)continue; const from=o.laws[r.name]; if(typeof from!=='number')continue;
      const to=Math.min(r.hi,Math.max(r.lo,from+(rng()-0.5)*(r.hi-r.lo)*0.35));
      const k0=kOf(o.laws); const prev=o.laws[r.name]; o.laws[r.name]=to; const k1=kOf(o.laws);
      if(k1>schema.kmax&&k1>k0)o.laws[r.name]=prev; }   // #232's ceiling, as the engine applies it to a proposal
    for(const n of schema.mechs) if(rng()<MUT_SW)o.board[n]=o.board[n]?0:1;
    return o; }
  const warm=await Promise.all(worlds.map(w=>ask(w,{cmd:'warm',ticks:WARM})));
  if(warm.some(x=>x.lawmut!==false||x.swb!==false)){ console.log(JSON.stringify({error:'a world is still legislating for itself',warm})); process.exit(1); }
  // the starting vectors: defaults, moved INIT_MUT times by a PRNG seeded by the world's seed alone
  const vec=[]; const ep=await Promise.all(worlds.map(w=>ask(w,{cmd:'epoch',ticks:0})));   // a zero-tick epoch reads the defaults
  for(let i=0;i<K;i++){ let v={laws:{},board:ep[i].board}; for(const r of rows)v.laws[r.name]=ep[i].laws[r.name];
    const rng=mulberry(0xABCDEF^(worlds[i].seed*2246822519)); for(let j=0;j<INIT_MUT;j++)v=mutate(v,rng); vec.push(v); }
  const sets=await Promise.all(worlds.map((w,i)=>ask(w,{cmd:'set',v:vec[i]})));
  const epochs=[];
  for(let e=0;e<NE;e++){
    const res=await Promise.all(worlds.map(w=>ask(w,{cmd:'epoch',ticks:EPOCH})));
    const JUDGED=['traits','lineage','program','atoms','channels'];
    const ratio=(o,f)=>o.real/Math.max(1,mean(o[f]));
    const JF=JNULL==='tree'?'tsh':'sh', OF=JNULL==='tree'?'sh':'tsh';
    const out=worlds.map((w,i)=>{ const x=res[i], dead=x.minAlive<MINALIVE, r={}, ro={};
      for(const n of JUDGED){ r[n]=+ratio(x.per[n],JF).toFixed(4); ro[n]=+ratio(x.per[n],OF).toFixed(4); }
      const sc=q=>+mean(JUDGED.map(n=>Math.log2(1+q[n]))).toFixed(4);
      return {seed:w.seed,score:dead?0:sc(r),layers:r,
        otherNull:{score:dead?0:sc(ro),layers:ro},
        check:{heldOut:dead?0:+ratio(x.heldOut,JF).toFixed(4),germPrograms:x.germ.programs,germAtoms:x.germ.atoms,germProven:x.germ.proven},
        counts:Object.fromEntries(JUDGED.map(n=>[n,{real:x.per[n].real,mixed:+mean(x.per[n].sh).toFixed(2),tree:+mean(x.per[n].tsh).toFixed(2)}])),
        heldOutCounts:{real:x.heldOut.real,mixed:+mean(x.heldOut.sh).toFixed(2),tree:+mean(x.heldOut.tsh).toFixed(2)},
        alive:x.alive,minAlive:x.minAlive,effN:+x.effN.toFixed(2),births:x.births,errs:x.errs,guarded:dead,
        vector:vec[i],adoptedFrom:null,mutated:false}; });
    // the physics a universe passes on is what it holds NOW - FIELD_DECAY/FIELD_DIFFUSE also move with the genome
    const cur=res.map(x=>{ const c={laws:{},board:x.board}; for(const r of rows)c.laws[r.name]=x.laws[r.name]; return c; });
    for(let i=0;i<K;i++)vec[i]=cur[i];
    if(e<NE-1){
      const idx=worlds.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){ const j=(R()*(i+1))|0; [idx[i],idx[j]]=[idx[j],idx[i]]; }
      for(let p=0;p+1<idx.length;p+=2){ const a=idx[p], b=idx[p+1];
        const coin=R()<0.5?a:b;   // drawn in both arms so the streams stay aligned
        const tie=out[a].score===out[b].score;
        // THE ONLY DIFFERENCE BETWEEN THE ARMS: who wins a decided pair - the score in one, the coin in the other.
        // A tied pair is handled the same in both: the coin's loser copies nobody and mutates its own physics.
        const win=(ARM==='tournament'&&!tie)?(out[a].score>out[b].score?a:b):coin, lose=win===a?b:a;
        vec[lose]=mutate(tie?cur[lose]:cur[win],R);
        await ask(worlds[lose],{cmd:'set',v:vec[lose]});
        out[lose].adoptedFrom=tie?null:worlds[win].seed; out[lose].mutated=true; } }
    epochs.push({epoch:e,tick:WARM+(e+1)*EPOCH,worlds:out});
    process.stderr.write('epoch '+e+' '+out.map(r=>r.seed+':'+r.score+' ['+JUDGED.map(n=>r.layers[n]).join(',')+'] g'+(r.check.germPrograms+r.check.germAtoms)+' n'+r.alive+(r.adoptedFrom?' <'+r.adoptedFrom:'')).join('  ')+'\n');
  }
  for(const w of worlds) w.ch.send({cmd:'exit'});
  console.log(JSON.stringify({arm:ARM,rep:REP,judgeNull:JNULL,K,seed0:SEED0,warm:WARM,epoch:EPOCH,nEpochs:NE,mutLaw:MUT_LAW,mutSw:MUT_SW,initMut:INIT_MUT,
    minAlive:MINALIVE,heritable:{laws:rows.map(r=>r.name),mechs:schema.mechs},
    defaults:Object.fromEntries(rows.map(r=>[r.name,ep[0].laws[r.name]])),initialSets:sets,epochs}));   // defaults: the declared values, read before any vector was set
})();
