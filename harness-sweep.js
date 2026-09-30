// #256 — THE NOVELTY SWEEPER: is anything new still arriving, in ANY layer of a universe, faster than chance?
// (#256b added the TREE null, the markers and the compaction hook; the first version's MIXED verdicts are unchanged.)
//
// #247's clock asks it of one layer - trait space - and answered SLOWER THAN CHANCE on three seeds. A universe here
// has other places novelty could be arriving: new lineages, new programs, new authored atoms, new chemistries on
// its channels. The artwork's claim is about all of them. This sweeps every layer a living particle CARRIES, each
// against a neutral shadow of its own, in one run, so a verdict about one layer is never mistaken for the world's.
//
// A LAYER maps each living particle to a discrete TOKEN:
//   lineage   pLin - the lineage id (new ones minted by speciation, #LEAP 6, as a whole cohort at once)
//   program   the op sequence of the program the particle RUNS (pProg, not the germline copy - #210's lesson)
//   atoms     the authored expressions bound to its opcode slots (pGenome.userAtoms at boundOpcodes), as a set
//   channels  the rule expressions in its channel bank (pGenome.channels, #196)
// A token ARRIVES when it first has M carriers at a sample; the arrival PERSISTS if it still has M carriers P ticks
// later. Same definitions as #247's cells, with a token in place of a cell.
//
// TWO NULLS per layer (novelty-shadows.js has the details), because they answer different questions:
//   MIXED (verdict)          Kimura's infinite alleles, fed the real world: K shadows seeded at WARM as a copy of the
//                            real layer, given the real D deaths, B births (a child copies a RANDOM shadow parent) and
//                            the real introductions (every token seen for the first time enters as a fresh label).
//                            Beating it = spreading faster than a well-mixed population drifting on the same supply -
//                            selection, sideways copying, recurrence and a skewed family tree all do that.
//   TREE (familyTree.verdict) the real family tree with the real events replayed at random places on it: the same
//                            particles are born, live and die, each child copying its REAL parent's shadow label, and
//                            every real change (a child unlike its parent, a particle whose token changed in life) is
//                            replayed with its real result on a random newborn / random older particle. Beating it =
//                            the particles that really got the new variants held them better than random recipients -
//                            what selection on novelty looks like. Known bias: in-life changes cluster on a few busy
//                            particles, and replaying them onto quiet ones lets the shadows hold MORE, so for layers that
//                            change mostly in life (programs, atoms, channels) it leans toward SLOWER.
// MARKERS (marker05, marker50) are the calibration: labels handed down the real family tree and replaced at 5% / 50% of
// births, read by nothing - neutral by construction. A null whose band a marker leaves more than about 2 times in 9 is
// narrower than the real world's own chance variation. Slots are followed through compact() (every 45 ticks), which
// moves living particles down the arrays; without that, anything kept per slot follows a different particle.
// The trait layer is #247's own clock (continuous shadow, same kernel), and its TREE twin inherits from the two real
// parents' shadow traits.
//
// UNIVERSE-LEVEL layers have no population and no null, so they are reported as cumulative distinct counts and the
// late-half rate: the germline program, germline atom expressions (raw, and proven - uses>0 - as harness-oee reads
// them), stable motifs, and kept law verdicts. A rising count there is necessary, never sufficient.
//
// Draw-free: tokens are read from state; shadows use their own mulberry32 streams; births are counted by wrapping
// addParticle/addCompound, which draws nothing.
//   SEED=1 TICKS=20000 node harness-sweep.js
//   env: K (8) M (3) P (2000) WARM (1000) EVERY (25) SAMPLE (100) INDEX (engine.html); trait grid BINS (10) RANGE (1.5)
//   NULLSHIFT=k  (#257) burn k draws after boot, before the first tick - the same world on another draw order (#249b)
//   FORCE=a,b    (#257, #258) knock out trait forces, RE-INSTALLED EVERY TICK - the list and what each does is in
//                trait-force.js (bleed0 shrink1 blend0 toll0 motif0 nfd0 vmbleed0 gt0)
// Prints one JSON object. No backticks in the appended driver's comments: the engine source is compiled as one string.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||20000), K=+(E.K||8), M=+(E.M||3), SAMPLE=+(E.SAMPLE||100), EVERY=+(E.EVERY||25);
const BINS=+(E.BINS||10), RANGE=+(E.RANGE||1.5), SEED=+(E.SEED||1);
// short budgets (smoke.sh's TICKS=40) boot without a warm-up; P stays a multiple of SAMPLE
const WARM=+(E.WARM||Math.min(1000,Math.floor(T/4))), P=+(E.P||Math.max(SAMPLE,Math.min(2000,Math.floor(T/4/SAMPLE)*SAMPLE)));
let code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const TF=require(path.join(__dirname,'trait-force.js'));   // #258: the knockouts live in one module, shared with harness-oee
let FORCE; try{ FORCE=TF.parse(E.FORCE); code=TF.patch(code,FORCE); }catch(e){ console.log(JSON.stringify({error:e.message})); process.exit(2); }
globalThis.__FORCE=FORCE;
const Module=require('module');const m=new Module('/tmp/sweep.js');m.filename='/tmp/sweep.js';m.paths=Module._nodeModulePaths('/tmp');
const NS=require(path.join(__dirname,'novelty-shadows.js'));
m._compile(code+`
;globalThis.__SW={
  step:function(){ globalThis.__detMs+=5; globalThis.__applyForce(globalThis.__FORCE); try{loop();return true;}catch(e){return false;} },
  sd:function(){ return (typeof inheritOn==='function'&&!inheritOn())?0:INHERIT_SD; }, hard:function(){ return TEND_HARD; },
  wrapBirths:`+NS.BIRTHS+`,
  onCompact:`+NS.COMPACT+`,
  read:`+NS.READER(3)+`,   // one pass over the living: traits (axes 0-2) and a token per layer - novelty-shadows.js
  germ:`+NS.GERM+`
};`+TF.DRIVER,'/tmp/sweep.js');
const SW=globalThis.__SW;
const NULLSHIFT=+(E.NULLSHIFT||0)|0; for(let q=0;q<NULLSHIFT;q++)Math.random();   // after boot, before the first tick
const {LAYERS,mulberry,countOf,tracker,record,persistentIn,arrivalsIn,traitStep,labelLayer,familyTree}=NS;
const persistentRate=(tr,from,to)=>+(persistentIn(tr,from,to,P)*1000/Math.max(1,to-from)).toFixed(3);
const binOf=v=>{let b=Math.floor((v+RANGE)/(2*RANGE)*BINS);return b<0?0:b>=BINS?BINS-1:b;};
const cellOf=t=>(binOf(t[0])*BINS+binOf(t[1]))*BINS+binOf(t[2]);

let tree=null;   // the TREE null (#256b) - created after the warm-up; births before it are not its business
// THE MARKERS - control layers that are neutral by construction: a label handed from parentA to child down the REAL
// family tree, replaced by a fresh one at a random fraction u of births, and read by nothing in the world. Against the
// TREE null a marker should read CHANCE (each tail about 1 in 9); against the MIXED null it reads whatever
// reproductive skew alone produces - the MIXED null's bias, measured on the same run. Two rates, because the layers
// differ: atoms and channels change at a few percent of births, programs at most of them. MARKER=0 leaves them out.
const MARKER_U=(E.MARKER_U||'0.05,0.5').split(',').map(Number); let mks=[];
let SEL=null, curTick=0, inLate=false;   // #267, set up after the layers (see SELECTION below)
const takeBirths=SW.wrapBirths((i,pa,pb)=>{ for(const mk of mks)mk.lab[i]=(pa>=0&&mk.rng()>=mk.u)?mk.lab[pa]:mk.next++; if(SEL&&inLate&&pa>=0)SEL.birth(pa); if(tree)tree.onBirth(i,pa,pb); }); let errs=0;
SW.onCompact(ni=>{ for(const mk of mks)NS.compactArray(mk.lab,ni,1); if(tree)tree.onCompact(ni); });   // per-slot state moves with its particle
for(let s=0;s<WARM;s++) if(!SW.step())errs++;
takeBirths();
let cur=SW.read(); let prevN=cur.tr.length;
tree=familyTree(K,SEED*104729,cur.cap,3); tree.sd=SW.sd(); tree.H=SW.hard(); tree.syncTraits(cur.idx,cur.tr,true);
// token layers: real ids, the tokens ever seen (at any count), K MIXED shadows and K TREE shadows each
const MNAME=u=>'marker'+String(Math.round(u*100)).padStart(2,'0');   // marker05, marker50
const LAY=E.MARKER==='0'?LAYERS:[...LAYERS,...MARKER_U.map(MNAME)];
if(E.MARKER!=='0') MARKER_U.forEach((u,j)=>{ const mk={name:MNAME(u),u,lab:new Int32Array(cur.cap).fill(-1),rng:mulberry(0xBADC0DE^(SEED*104729+j*7)),next:1};
  for(const i of cur.idx)mk.lab[i]=0; mks.push(mk); tree.addLayer(mk.name); });
const toksOf=(c,name)=>{ const mk=mks.find(x=>x.name===name); return mk?c.idx.map(i=>'m'+mk.lab[i]):c.layers[name]; };
const L={}; for(const name of LAY){ L[name]=labelLayer(name,toksOf(cur,name),K,SEED*104729,M,undefined,tree,cur.idx); L[name].introLate=0; }
// #267 — SELECTION ON NOVELTY, read at the only place selection acts: who has offspring. For each token layer, track
// 0 is the real world and tracks 1..K the TREE shadows (same genealogy, same events, recipients left to chance). A
// label is NEW while fewer than NOVW ticks have passed since it first appeared anywhere in that track. Over the late
// window: exposure = particle-ticks spent carrying a new label (sampled every EVERY ticks); births = parented births
// whose first parent carried a new label at the moment of birth. INDEX = (new births / new exposure) / (all births /
// all exposure) - above 1, carriers of new variants out-breed the average. Real above every shadow = the particles that
// really got the new variants out-bred the random ones that got them in the null: novelty favoured by selection. The
// neutral markers are the calibration and should read CHANCE. Reads labels only; draws nothing.
const NOVW=+(E.NOVW||1000);
SEL={L:{}, birth:function(pa){ for(const name of LAY){ const S=SEL.L[name], r=tree.real[name][pa]; if(r<0)continue;
      S.birthsAll++; for(let t=0;t<=K;t++){ const lab=t===0?r:tree.lab[name][t-1][pa]; if(lab<0)continue; const f=S.first[t].get(lab);
        if(f!==undefined&&curTick-f<NOVW)S.birthsNew[t]++; } } }};
for(const name of LAY){ const S={first:Array.from({length:K+1},()=>new Map()),expNew:new Float64Array(K+1),birthsNew:new Float64Array(K+1),expAll:0,birthsAll:0};
  for(const i of cur.idx){ const r=tree.real[name][i]; if(r>=0)for(const f of S.first)f.set(r,-1e9); }   // the starting labels are old
  SEL.L[name]=S; }
SEL.step=function(s,idx){ for(const name of LAY){ const S=SEL.L[name];
    for(const i of idx){ const r=tree.real[name][i]; if(r<0)continue;
      for(let t=0;t<=K;t++){ const lab=t===0?r:tree.lab[name][t-1][i]; if(lab<0)continue; let f=S.first[t].get(lab); if(f===undefined){ f=s; S.first[t].set(lab,s); }
        if(inLate&&s-f<NOVW)S.expNew[t]+=EVERY; }
      if(inLate)S.expAll+=EVERY; } } };
// trait layer: #247's continuous shadow
const TR={real:tracker(),sh:Array.from({length:K},(_,k)=>({rng:mulberry(0x9E3779B9^(k*7919+SEED*104729)),pop:cur.tr.map(t=>t.slice()),tr:tracker()}))};
const cellCounts=tr=>countOf(tr.map(cellOf));
record(TR.real,0,cellCounts(cur.tr),M); for(const s of TR.sh) record(s.tr,0,cellCounts(s.pop),M);
const TT=Array.from({length:K},()=>tracker()); for(const tr of TT) record(tr,0,cellCounts(cur.tr),M);
// universe level
const germSeen={prog:new Set(),raw:new Set(),proven:new Set(),motifs:new Set()}, germRows=[];
function germSample(t){ const g=SW.germ(); germSeen.prog.add(g.prog); for(const x of g.raw)germSeen.raw.add(x); for(const x of g.proven)germSeen.proven.add(x); for(const x of g.motifs)germSeen.motifs.add(x);
  germRows.push([t,germSeen.prog.size,germSeen.raw.size,germSeen.proven.size,germSeen.motifs.size,g.lawKept]); }
germSample(0);
const lateFrom=Math.floor(T/2), lateTo=T-P;
let spreadSum=0, spreadN=0, aliveMin=Infinity, extinctions=0, wasDead=false;
for(let s=1;s<=T;s++){
  curTick=s; inLate=s>=lateFrom&&s<lateTo;   // #267
  if(!SW.step())errs++;
  if(s%EVERY!==0)continue;
  cur=SW.read(); const nowN=cur.tr.length, B=takeBirths(), D=Math.max(0,prevN+B-nowN); prevN=nowN;
  if(nowN<aliveMin)aliveMin=nowN; if(nowN===0&&!wasDead){ extinctions++; wasDead=true; } else if(nowN>0)wasDead=false;   // #258c
  const sd=SW.sd(), H=SW.hard();
  for(const sh of TR.sh) traitStep(sh.pop,D,B,sd,H,sh.rng,3);
  const smp=s%SAMPLE===0;
  for(const name of LAY){ const n=L[name].step(toksOf(cur,name),D,B,smp,s,cur.idx,tree.born); if(s>=lateFrom&&s<lateTo)L[name].introLate+=n; }
  SEL.step(s,cur.idx);   // #267: after the layers have written this step's real and shadow labels
  tree.syncTraits(cur.idx,cur.tr,false); tree.born.length=0; tree.sd=sd; tree.H=H;
  if(smp&&s>=lateFrom&&s<lateTo){ const t=cur.tr; let sum=0,k=0; for(let a=0;a<t.length;a+=3) for(let b=a+1;b<t.length;b+=7){ sum+=Math.hypot(t[a][0]-t[b][0],t[a][1]-t[b][1],t[a][2]-t[b][2]); k++; } if(k){ spreadSum+=sum/k; spreadN++; } }   // #258: grid-free, draw-free
  if(smp){ record(TR.real,s,cellCounts(cur.tr),M); for(const sh of TR.sh) record(sh.tr,s,cellCounts(sh.pop),M); germSample(s);
    for(let k=0;k<K;k++) record(TT[k],s,cellCounts(tree.traitsOf(k,cur.idx)),M); }
}
function verdictOf(real,shs){ const lo=Math.min(...shs), hi=Math.max(...shs);
  return {verdict:real>hi?'FASTER THAN CHANCE':real<lo?'SLOWER THAN CHANCE':'CHANCE',realPersistentPer1k:real,
    shadowPersistentPer1k:{min:lo,mean:+(shs.reduce((a,b)=>a+b,0)/shs.length).toFixed(3),max:hi}}; }
const q=[0,1,2,3].map(i=>[Math.floor(i*T/4),Math.floor((i+1)*T/4)]);
const out={seed:String(SEED),ticks:T,warm:WARM,loopErrors:errs,window:[lateFrom,lateTo],params:{K,M,P,EVERY,SAMPLE,BINS,RANGE},layers:{}};
if(FORCE.length||NULLSHIFT){ out.force=FORCE; out.nullShift=NULLSHIFT; }   // absent when unset, so a plain run's output is unchanged
out.aliveEnd=cur.tr.length;
out.aliveMin=aliveMin===Infinity?null:aliveMin; out.extinctions=extinctions;   // #258c: living count's floor over the run, and times it hit 0
out.traitSpreadLate=spreadN?+(spreadSum/spreadN).toFixed(4):null;   // #258: mean pairwise trait distance (axes 0-2), late window
out.layers.traits=Object.assign(verdictOf(persistentRate(TR.real,lateFrom,lateTo),TR.sh.map(s=>persistentRate(s.tr,lateFrom,lateTo))),
  {arrivalsByQuarter:q.map(([a,b])=>arrivalsIn(TR.real,a,b)),everAtM:TR.real.first.size,shadowEverAtM:TR.sh.map(s=>s.tr.first.size),
   familyTree:verdictOf(persistentRate(TR.real,lateFrom,lateTo),TT.map(tr=>persistentRate(tr,lateFrom,lateTo)))});
for(const name of LAY){ const Ly=L[name], toksEnd=toksOf(cur,name);
  out.layers[name]=Object.assign(verdictOf(persistentRate(Ly.real,lateFrom,lateTo),Ly.sh.map(s=>persistentRate(s.tr,lateFrom,lateTo))),
    {introductions:Ly.intro,introductionsPer1kLate:+(Ly.introLate*1000/Math.max(1,lateTo-lateFrom)).toFixed(3),
     arrivalsByQuarter:q.map(([a,b])=>arrivalsIn(Ly.real,a,b)),everAtM:Ly.real.first.size,shadowEverAtM:Ly.sh.map(s=>s.tr.first.size),
     standingAtM:[...countOf(toksEnd).values()].filter(n=>n>=M).length,
     familyTree:Object.assign(verdictOf(persistentRate(Ly.real,lateFrom,lateTo),Ly.tsh.map(s=>persistentRate(s.tr,lateFrom,lateTo))),{birthEvents:Ly.ev.birth,lifeEvents:Ly.ev.life})}); }
const g0=germRows.find(r=>r[0]>=lateFrom)||germRows[0], g1=germRows[germRows.length-1], span=Math.max(1,g1[0]-g0[0]);
const rate=i=>+((g1[i]-g0[i])*1000/span).toFixed(3);
out.universe={germlinePrograms:{ever:g1[1],newPer1kLate:rate(1)},atomExprs:{ever:g1[2],newPer1kLate:rate(2)},
  provenAtomExprs:{ever:g1[3],newPer1kLate:rate(3)},motifs:{ever:g1[4],newPer1kLate:rate(4)},lawsKept:{ever:g1[5],per1kLate:g1[5]>=0?rate(5):null}};
out.summary=Object.fromEntries(['traits',...LAY].map(n=>[n,out.layers[n].verdict]));   // against the MIXED null
out.summaryTree=Object.fromEntries(['traits',...LAY].map(n=>[n,out.layers[n].familyTree.verdict]));   // against the TREE null
// #267: selection on novelty, per token layer (see SELECTION above); new keys, so every older field is unchanged
out.selection={novW:NOVW,layers:{}};
for(const name of LAY){ const S=SEL.L[name], base=S.expAll>0?S.birthsAll/S.expAll:0;
  const ix=t=>(S.expNew[t]>0&&base>0)?+((S.birthsNew[t]/S.expNew[t])/base).toFixed(3):null;
  const real=ix(0), sh=[]; for(let t=1;t<=K;t++){ const v=ix(t); if(v!==null)sh.push(v); }
  const lo=sh.length?Math.min(...sh):null, hi=sh.length?Math.max(...sh):null;
  out.selection.layers[name]={index:real,shadows:{min:lo,mean:sh.length?+(sh.reduce((a,b)=>a+b,0)/sh.length).toFixed(3):null,max:hi,n:sh.length},
    verdict:(real===null||!sh.length)?'NO DATA':real>hi?'NOVELTY FAVOURED':real<lo?'NOVELTY DISFAVOURED':'CHANCE',
    birthsLate:S.birthsAll,newShareReal:S.expAll>0?+(S.expNew[0]/S.expAll).toFixed(3):null}; }
out.summarySelection=Object.fromEntries(LAY.map(n=>[n,out.selection.layers[n].verdict]));
console.log(JSON.stringify(out));
