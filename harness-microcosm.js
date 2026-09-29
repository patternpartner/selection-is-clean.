// #260 — THE BACTERIAL MICROCOSM: does a coevolving enemy make novelty beat chance, and does it need numbers?
//
// The user's question: bacteria evolve continuously - can the artwork borrow that? Bacteria have three things this
// engine's worlds lack or have little of: ENORMOUS numbers (selection can see a 0.001% edge where a 300-particle world
// cannot see 0.3%), a COEVOLVING ENEMY (phage: a key that must fit the cell's surface lock, so the lock that is rare
// is the lock that survives - Red Queen), and sideways gene flow (which the engine already has in plenty, #256b).
// This rig tests the first two in isolation, without the engine, with the measurement #256 built for the engine.
//
// BACTERIA are clones: a 16-bit LOCK (the phage receptor) and a 16-bit NEUTRAL TAG nothing reads. A daughter
// mutates with probability MU; a mutation flips ONE of the 32 bits, chosen uniformly - so lock and tag mutate at
// exactly the same rate on exactly the same family tree. The tag is therefore the family-tree null built in: new
// tags spread and hold only by drift and by riding along with whatever their clone does. A lock away from the
// ancestral one costs growth (COST per bit, as real receptors carry nutrients), so novelty is not free.
// Growth is logistic to CAP; everyone dies at rate D.
// PHAGE are clones of a 16-bit KEY. A key infects a lock within H bits (Hamming). Infection is mass action: a cell
// of lock L is infected with probability 1 - exp(-A x (matching virions)), dies, and releases B virions of the
// infecting key (chosen in proportion among the matching keys), each mutated (one of 16 bits) with probability MUP.
// Virions decay at DELTA. PHAGE=0 runs the same world with no phage. Phage arrive at step PHAGE_AT, PHAGE0 virions of the
// ancestral key - rare, into a population that has had time to carry a little lock variation, as in a real culture.
//
// THE MEASURE (#256's, in allele form): every SAMPLE steps, count copies of each lock allele and each tag allele. An
// allele ARRIVES when it first reaches FRAC of the population (at least 3 copies); it PERSISTS if it is still there
// P steps later. Late window: the second half, less P. Output: persistent arrivals per 1,000 steps for locks and for
// tags, and their ratio. Locks above tags = new locks are favoured beyond what the same genealogy gives a neutral
// label - novelty selected, not drifted.
//   SEED=1 STEPS=20000 CAP=20000 PHAGE=1 node harness-microcosm.js
// Own PRNG (mulberry32 from SEED); no engine, no DOM. Prints one JSON object.
const E=process.env;
const SEED=+(E.SEED||1), STEPS=+(E.STEPS||20000), CAP=+(E.CAP||20000), PHAGE=(E.PHAGE??'1')!=='0';
const G=+(E.G||0.1), D=+(E.D||0.05), MU=+(E.MU||0.002), COST=+(E.COST||0.02);
const H=+(E.H||0), A=+(E.A||(0.001)), B=+(E.B||10), MUP=+(E.MUP||0.02), DELTA=+(E.DELTA||0.1);
const SAMPLE=+(E.SAMPLE||50), P=+(E.P||1000), FRAC=+(E.FRAC||0.01);
const PHAGE_AT=+(E.PHAGE_AT||500), PHAGE0=+(E.PHAGE0||10);   // phage arrive rare, after the bacteria have built standing variation
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const r=mulberry(0xBAC7E81A^(SEED*2654435761));
function gauss(){ let u=0,v=0; while(u===0)u=r(); v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function binom(n,p){ if(n<=0||p<=0)return 0; if(p>=1)return n; if(n<40){ let k=0; for(let i=0;i<n;i++) if(r()<p)k++; return k; }
  const m=n*p, sd=Math.sqrt(m*(1-p)); let k=Math.round(m+sd*gauss()); return k<0?0:k>n?n:k; }
const pop16=x=>{ x=x-((x>>1)&0x5555); x=(x&0x3333)+((x>>2)&0x3333); x=(x+(x>>4))&0x0F0F; return (x+(x>>8))&0x1F; };
// SPACE: PATCHES patches on a ring, each holding CAP/PATCHES at most, with a fraction MIG of every clone (bacteria and
// phage) moving to a neighbouring patch each step. A well-mixed culture is famously unstable - the phage burn out after
// one bloom or take the bacteria with them (measured here, 12 parameter sets on seed 1) - and real arms races run in
// structured places: a local wipe-out is recolonised from next door and the cycles run out of step. PATCHES=1 is the
// well-mixed culture.
const PATCHES=+(E.PATCHES||16), MIG=+(E.MIG||0.01), capP=CAP/PATCHES;
const lockOf=k=>k>>>16, tagOf=k=>k&0xFFFF;
const add=(m,k,n)=>{ if(n>0)m.set(k,(m.get(k)||0)+n); };
// bacteria: Map key = lock<<16 | tag -> count. Ancestral lock 0, tag 0. Phage: Map key -> count.
const patch=Array.from({length:PATCHES},()=>({bac:new Map([[0,Math.floor(capP*0.5)]]),phg:new Map()}));
// allele trackers over the WHOLE culture: first arrival step, and per-sample set of alleles at threshold
const tr={lock:{first:new Map(),hist:new Map()},tag:{first:new Map(),hist:new Map()}};
function census(t){ let N=0; const cL=new Map(), cT=new Map();
  for(const pt of patch) for(const [k,n] of pt.bac){ N+=n; add(cL,lockOf(k),n); add(cT,tagOf(k),n); }
  const thr=Math.max(3,Math.ceil(FRAC*N));
  for(const [name,c] of [['lock',cL],['tag',cT]]){ const T=tr[name], o=new Set(); for(const [a,n] of c) if(n>=thr){ o.add(a); if(!T.first.has(a))T.first.set(a,t); } T.hist.set(t,o); }
  let V=0,keys=new Set(); for(const pt of patch) for(const [K,v] of pt.phg){ V+=v; keys.add(K); }
  return {N,locks:cL.size,tags:cT.size,V,keys:keys.size}; }
function stepPatch(pt){
  let N=0; for(const n of pt.bac.values())N+=n;
  // ADSORPTION from the phage side: each free virion sticks to SOME cell with probability 1-exp(-A*N) and leaves the
  // free pool whatever it hit. Only a stick to a cell whose lock its key fits (within H bits) is productive; a stick
  // to a resistant cell is a virion wasted - which is what lets a resistant majority starve its enemy.
  const want=new Map(), released=new Map(), freeLeft=new Map();
  if(pt.phg.size&&N>0){ const pAds=1-Math.exp(-A*N), bacList=[...pt.bac.entries()];
    for(const [K,v] of pt.phg){ const ads=binom(v,pAds); add(freeLeft,K,v-ads); if(!ads)continue;
      let m=0; const lst=[]; for(const [k,n] of bacList) if(pop16((lockOf(k)^K)&0xFFFF)<=H){ m+=n; lst.push([k,n]); }
      let prod=binom(ads,m/N); if(!prod)continue;
      for(let q=0;q<lst.length&&prod>0;q++){ const [k,n]=lst[q]; const share=q===lst.length-1?prod:binom(prod,n/m); m-=n; prod-=share;
        if(share>0){ const w=want.get(k)||[]; w.push([K,share]); want.set(k,w); } } } }
  else for(const [K,v] of pt.phg)add(freeLeft,K,v);
  const nb=new Map(), room=Math.max(0,1-N/capP);
  for(const [k,n] of pt.bac){ const d=pop16(lockOf(k));
    // infection first: every productive stick kills a cell (a cell hit twice dies once - capped at the clone's size)
    let inf=0; const w=want.get(k); if(w){ let req=0; for(const [,c] of w)req+=c; inf=Math.min(n,req);
      for(const [K,c] of w) add(released,K,Math.round(B*c*inf/req)); }
    const alive=n-inf, deaths=binom(alive,D), stay=alive-deaths;
    const births=binom(stay,G*room*Math.max(0,1-COST*d));
    add(nb,k,stay+births);
    const mut=binom(births,MU);
    if(mut>0){ nb.set(k,nb.get(k)-mut); for(let j=0;j<mut;j++){ const bit=(r()*32)|0; add(nb,(k^(1<<bit))>>>0,1); } } }
  pt.bac=new Map(); for(const [k,n] of nb) if(n>0)pt.bac.set(k,n);
  const np=new Map();
  for(const [K,v] of freeLeft){ add(np,K,v-binom(v,DELTA)); }
  for(const [K,v] of released){ const m=binom(v,MUP); add(np,K,v-m); for(let j=0;j<m;j++) add(np,(K^(1<<((r()*16)|0)))&0xFFFF,1); }
  pt.phg=new Map(); for(const [K,v] of np) if(v>0)pt.phg.set(K,v); }
function migrate(){ if(PATCHES<2||MIG<=0)return; const moves=[];
  for(let i=0;i<PATCHES;i++) for(const kind of ['bac','phg']) for(const [k,n] of patch[i][kind]){ const m=binom(n,MIG); if(!m)continue;
    patch[i][kind].set(k,n-m); const j=(i+(r()<0.5?1:PATCHES-1))%PATCHES; moves.push([j,kind,k,m]); }
  for(const [j,kind,k,m] of moves) add(patch[j][kind],k,m);
  for(const pt of patch) for(const kind of ['bac','phg']) for(const [k,n] of pt[kind]) if(n<=0)pt[kind].delete(k); }
const rows=[]; census(0);
let crashed=null, phageGoneAt=null;
for(let t=1;t<=STEPS;t++){
  if(PHAGE&&t===PHAGE_AT)patch[0].phg.set(0,PHAGE0);   // the ancestral key, fitting the ancestral lock, in one patch
  for(const pt of patch)stepPatch(pt);
  migrate();
  if(t%SAMPLE===0){ const c=census(t); if(c.N===0){ crashed=t; break; } if(PHAGE&&t>PHAGE_AT&&c.V===0&&phageGoneAt===null)phageGoneAt=t;
    if(t%1000===0)rows.push([t,c.N,c.locks,c.tags,c.V,c.keys]); }
}
const lateFrom=Math.floor(STEPS/2), lateTo=STEPS-P;
function persist(T){ let n=0,a=0; for(const [al,t0] of T.first){ if(t0<lateFrom||t0>=lateTo)continue; a++; const o=T.hist.get(t0+P); if(o&&o.has(al))n++; } return {persistent:n,arrivals:a}; }
const L=persist(tr.lock), Tg=persist(tr.tag), span=Math.max(1,lateTo-lateFrom);
console.log(JSON.stringify({seed:SEED,steps:STEPS,cap:CAP,patches:PATCHES,phage:PHAGE,crashedAt:crashed,phageGoneAt,
  lockPersistPer1k:+(L.persistent*1000/span).toFixed(3),tagPersistPer1k:+(Tg.persistent*1000/span).toFixed(3),
  lockArrivalsLate:L.arrivals,tagArrivalsLate:Tg.arrivals,locksEverAtThreshold:tr.lock.first.size,tagsEverAtThreshold:tr.tag.first.size,
  params:{G,D,MU,COST,H,A,B,MUP,DELTA,SAMPLE,P,FRAC,PHAGE_AT,PHAGE0,PATCHES,MIG},series:rows}));
