// The neutral shadows, shared by harness-sweep.js (#256) and harness-lawfield.js (#255), so the sweeper's verdicts and
// the tournament's judge are the same measurement and cannot drift apart. Nothing here touches the engine's draws:
// every shadow runs on its own mulberry32 stream, and READER only reads state.
//
// A LAYER maps each living particle to a discrete token (see READER). TRAITS are continuous and use #247's kernel.
// An ARRIVAL is a key's first sample with M carriers; it PERSISTS if it has M carriers again P ticks later.
//
// TWO NULLS, because they answer two different questions (#256b):
//   MIXED  (#247, and #256's first version) - a well-mixed neutral population given the real world's births, deaths
//          and introductions, each child copying a RANDOM parent. Beating it says novelty spreads faster than it
//          would in a population where everyone breeds alike. Reproductive skew alone beats it: if a few families do
//          most of the breeding, anything born into them spreads, whatever it is.
//   TREE   the real family tree, and the real world's own EVENTS replayed at random places on it. The same particles
//          are born, live and die as in the real world, and each child copies its REAL parent's shadow label (a trait
//          child mixes its two real parents' shadow traits, plus the kernel). Every change the real layer makes is
//          replayed with its real result - a child that differs from its parent, a particle whose token changed during
//          its life (a self-edit, or a copy taken sideways from a neighbour) - on a random particle of the same kind:
//          a birth event on a random newborn of the interval, a change during life on a random older particle.
//          Same events, same results, same genealogy; only WHO gets each one is left to chance. Beating it says the
//          particles that really got the new variants went on to hold them better than random recipients would - the
//          variant, or something that comes with it, helps its carriers. That is what selection on novelty looks like.
// Measured before the replay was written (seeds 1-2, 5,000 ticks, slots followed through compaction - see COMPACT):
// births are two-parent and ~80% faithful for programs, never parentless; lineage ids never change during life;
// programs change during life ~1,500 times (80% to a program never seen, 20% to one another particle has); atoms
// 480-650 times and channels 5-430 times, 97-99% of them to a set another particle already carries - sideways
// transfer. A null that only hands out FRESH labels (MIXED, and TREE's first version) cannot see recurrence or
// sideways copying, so both beat it without any selection at all.
const LAYERS=['lineage','program','atoms','channels'];

// Appended to the engine source, so it sees engine scope. AXES trait axes are read (missing ones read 0).
// NO BACKTICKS in this string: it is compiled inside the engine's own source.
const READER=function(AXES){ return `function(){ const D=DIMS, tr=[], lin=[], prog=[], atoms=[], chan=[], idx=[];
    for(let i=0;i<N;i++){ if(!palive[i])continue; idx.push(i); const b=i*D; const t=new Array(${AXES}); for(let a=0;a<${AXES};a++)t[a]=a<D?tend[b+a]:0; tr.push(t);
      lin.push('L'+pLin[i]);
      const p=pProg[i]; let ps=''; if(Array.isArray(p))for(const r of p)ps+=(r?(r[0]|0):-1)+'.'; prog.push(ps);
      const g=pGenome[i]; let as='', cs='';
      if(g&&Array.isArray(g.boundOpcodes)&&Array.isArray(g.userAtoms)){ const s=[]; for(const ai of g.boundOpcodes){ const x=g.userAtoms[ai]; if(x&&x.expression)s.push(x.expression); } s.sort(); as=s.join(' ; '); }
      if(g&&Array.isArray(g.channels)){ const s=[]; for(const r of g.channels)s.push(r&&typeof r.expr==='string'?r.expr:'-'); cs=s.join(' | '); }
      atoms.push(as); chan.push(cs); }
    return {tr,lin,idx,cap:CAP,layers:{lineage:lin,program:prog,atoms,channels:chan}}; }`; };
// births, counted; with a hook, each birth also reports (child, parentA, parentB) - the family tree. Draws nothing.
const BIRTHS=`function(hook){ let b=0; const _ap=addParticle,_ac=addCompound;
    addParticle=function(){const r=_ap.apply(this,arguments); if(r>=0){ b++; if(hook)hook(r,arguments[4],arguments[5]); } return r;};
    addCompound=function(){const r=_ac.apply(this,arguments); if(r>=0){ b++; if(hook)hook(r,arguments[8],arguments[9]); } return r;};
    return function(){const x=b;b=0;return x;}; }`;
// compact() (every 45 ticks) moves each living particle down into the lowest free slot. Anything a rig keeps PER SLOT
// follows a different particle afterwards unless it is moved too - the family tree's labels and traits, a marker, a
// probe's history. This reports the move before it happens: ni[old slot] = new slot, or -1 for the dead. Draws nothing.
// #256b's first version had no such hook, so its tree null scrambled every 45 ticks, and a probe built the same way
// read 32,000 "in-life program changes" in 5,000 ticks that were particles changing slots, not programs changing.
const COMPACT=`function(hook){ const _c=compact;
    compact=function(){ const ni=new Int32Array(N); let w=0; for(let r=0;r<N;r++){ if(palive[r]){ ni[r]=w; w++; } else ni[r]=-1; }
      _c.apply(this,arguments); if(hook)hook(ni); }; }`;
// apply a compaction to per-slot arrays (typed or plain); stride = values per slot
function compactArray(a,ni,stride){ stride=stride||1; for(let r=0;r<ni.length;r++){ const w=ni[r]; if(w<0||w===r)continue; for(let d=0;d<stride;d++)a[w*stride+d]=a[r*stride+d]; } }
function compactList(list,ni){ const out=[]; for(const i of list){ const w=i<ni.length?ni[i]:-1; if(w>=0)out.push(w); } return out; }
// the universe's own germline: its program shape, its authored expressions (raw, and proven - uses>0), its motifs
const GERM=`function(){ const G=genome||{}; let ps=''; if(Array.isArray(G.vmProgram))for(const r of G.vmProgram)ps+=(r?(r[0]|0):-1)+'.';
    const raw=[], proven=[]; if(Array.isArray(G.userAtoms))for(const a of G.userAtoms){ if(a&&a.expression){ raw.push(a.expression); if((a.uses|0)>0)proven.push(a.expression); } }
    const motifs=[]; if(Array.isArray(G.stableMotifs))for(const mo of G.stableMotifs){ if(mo&&mo.t)motifs.push(mo.t.map(x=>Math.round(x*5)).join(',')); }
    const lv=(typeof __liveness!=='undefined'&&__liveness)?__liveness:null;
    return {prog:ps,raw,proven,motifs,lawKept:lv?(lv['cosmos.lawKept']|0):-1}; }`;

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const countOf=a=>{ const c=new Map(); for(const x of a)c.set(x,(c.get(x)||0)+1); return c; };
function tracker(){ return {first:new Map(),hist:new Map()}; }
// seen (optional): keys that count as already arrived - a world's own history, so a shadow counts against the same past
function record(tr,t,counts,M,seen){ const o=new Set(); for(const [k,n] of counts) if(n>=M){ o.add(k); if(!tr.first.has(k)&&!(seen&&seen.has(k)))tr.first.set(k,t); } tr.hist.set(t,o); }
function persistentIn(tr,from,to,P){ let n=0; for(const [k,t0] of tr.first){ if(t0<from||t0>=to)continue; const o=tr.hist.get(t0+P); if(o&&o.has(k))n++; } return n; }
function arrivalsIn(tr,from,to){ let n=0; for(const [,t0] of tr.first) if(t0>0&&t0>=from&&t0<to)n++; return n; }   // t=0 is the starting set, not an arrival
// #247's kernel: D random deaths, then B children, each axis from one of two random parents plus three uniforms at SD sd
function traitStep(pop,D,B,sd,H,r,axes){
  for(let d=0;d<D&&pop.length>0;d++){ const x=(r()*pop.length)|0; pop[x]=pop[pop.length-1]; pop.pop(); }
  const n0=pop.length;
  for(let b=0;b<B;b++){ if(n0===0)break; const a=pop[(r()*n0)|0], c=pop[(r()*n0)|0], ch=new Array(axes);
    for(let ax=0;ax<axes;ax++){ let v=(r()<0.5?a:c)[ax]+(r()+r()+r()-1.5)*2*sd; ch[ax]=v>H?H:v<-H?-H:v; } pop.push(ch); } }
// infinite alleles fed the real world: D deaths, B children copying a random parent's label, then each real
// introduction (its carrier count c when first seen) as a fresh label - a mutant on a newborn when there is one,
// a cohort of c carriers taken from one existing label with at least c (a lineage mint)
function labelStep(pop,D,B,intro,r,fresh){
  for(let d=0;d<D&&pop.length>0;d++){ const x=(r()*pop.length)|0; pop[x]=pop[pop.length-1]; pop.pop(); }
  const n0=pop.length; for(let b=0;b<B;b++){ if(n0===0)break; pop.push(pop[(r()*n0)|0]); }
  for(const c of intro){ if(pop.length===0)break; const f=fresh();
    if(c<=1){ const x=B>0&&pop.length>n0?n0+((r()*(pop.length-n0))|0):((r()*pop.length)|0); pop[x]=f; continue; }
    const hc=countOf(pop), big=[]; for(const [k,n] of hc) if(n>=c&&k!==f)big.push(k);
    if(big.length){ const src=big[(r()*big.length)|0]; const at=[]; for(let x=0;x<pop.length;x++) if(pop[x]===src)at.push(x);
      for(let j=0;j<c;j++){ const q=j+((r()*(at.length-j))|0); [at[j],at[q]]=[at[q],at[j]]; pop[at[j]]=f; } }
    else for(let j=0;j<c&&j<pop.length;j++) pop[(r()*pop.length)|0]=f; } }
// the tree null's step for one label layer: classify every living slot's real change since the last step - a newborn
// that differs from its parent (a birth event), an older particle whose token changed (a change during life) - then
// replay each event, with its real result, on a random newborn / random older particle in every shadow. Slots outside
// the tree (a parentless birth, a parent itself too new to have been read) take the real label as a plain copy.
function treeStep(Ly,lab,idx,born){
  const T=Ly.tree, R=T.real[Ly.name], BP=T.bpr[Ly.name];
  const alive=new Set(idx), nbs=new Set(); for(const i of born) if(alive.has(i))nbs.add(i);
  const nb=[...nbs], old=[]; for(const i of idx) if(!nbs.has(i))old.push(i);
  const birthEv=[], lifeEv=[], copyIn=[];
  for(let j=0;j<idx.length;j++){ const i=idx[j], r=lab[j];
    if(nbs.has(i)){ const par=BP[i]; if(par<0)copyIn.push(i,r); else if(r!==par)birthEv.push(r); }
    else { const p=R[i]; if(p<0)copyIn.push(i,r); else if(r!==p)lifeEv.push(r); }
    R[i]=r; }
  Ly.ev.birth+=birthEv.length; Ly.ev.life+=lifeEv.length;
  for(const s of Ly.tsh){ const L=s.L, rr=s.rng;
    for(let q=0;q<copyIn.length;q+=2)L[copyIn[q]]=copyIn[q+1];
    place(L,nb,birthEv,rr); place(L,old,lifeEv,rr); } }
// each event on a different recipient while there are recipients left, then round again
function place(L,pool,ev,r){ if(!ev.length||!pool.length)return; const a=pool.slice(); let m=a.length;
  for(const v of ev){ if(m===0)m=a.length; const q=(r()*m)|0, i=a[q]; a[q]=a[m-1]; a[m-1]=i; m--; L[i]=v; } }
// a label layer: real ids, the set of tokens ever seen, K shadows; step() takes this interval's tokens.
// st (optional) carries a world's history across epochs (#255): its ids, the tokens it has ever shown, and the keys it
// has ever held at M - so an epoch's arrivals, real and shadow alike, count only what this world never held before.
// Without st (the sweeper) the layer starts from nothing, and behaves exactly as it did before st existed.
function labelLayer(name,toks,K,seedMix,M,st,tree,idx){
  const S=st||{ids:new Map(),next:0,seen:null,atM:null};
  const idOf=k=>{ let v=S.ids.get(k); if(v===undefined){ v=S.next++; S.ids.set(k,v); } return v; };
  const lab=toks.map(idOf);
  if(!S.seen)S.seen=new Set(toks); else for(const k of toks)S.seen.add(k);
  const hist=S.atM?new Set(S.atM):undefined;
  const Ly={name,seen:S.seen,idOf,fresh:()=>S.next++,real:tracker(),intro:0,
    sh:Array.from({length:K},(_,k)=>({rng:mulberry(0x51ED270B^(k*7919+seedMix+name.length*31337)),pop:lab.slice(),tr:tracker()}))};
  record(Ly.real,0,countOf(lab),M,hist); for(const s of Ly.sh) record(s.tr,0,countOf(s.pop),M,hist);
  if(tree){ Ly.tree=tree; Ly.ev={birth:0,life:0}; if(!tree.lab[name])tree.addLayer(name); for(let j=0;j<idx.length;j++)tree.real[name][idx[j]]=lab[j];
    Ly.tsh=[]; for(let k=0;k<K;k++){ const L=tree.lab[name][k]; for(let j=0;j<idx.length;j++)L[idx[j]]=lab[j];
      const tr=tracker(); record(tr,0,countOf(lab),M,hist); Ly.tsh.push({rng:mulberry(0x3C6EF372^(k*7919+seedMix+name.length*31337)),L,tr}); } }
  Ly.step=function(toks,D,B,sample,t,idx,born){ const intro=[]; const cnt=countOf(toks);
    for(const [k,n] of cnt) if(!Ly.seen.has(k)){ Ly.seen.add(k); intro.push(n); }
    Ly.intro+=intro.length; const lab=toks.map(idOf);
    for(const s of Ly.sh) labelStep(s.pop,D,B,intro,s.rng,Ly.fresh);
    if(Ly.tsh) treeStep(Ly,lab,idx,born);
    if(sample){ record(Ly.real,t,countOf(lab),M,hist); for(const s of Ly.sh) record(s.tr,t,countOf(s.pop),M,hist);
      if(Ly.tsh) for(const s of Ly.tsh){ const a=new Array(idx.length); for(let j=0;j<idx.length;j++)a[j]=s.L[idx[j]]; record(s.tr,t,countOf(a),M,hist); } }
    return intro.length; };
  // the real world's history grows by what it held this epoch; the shadows' is thrown away
  Ly.close=function(){ if(S.atM) for(const k of Ly.real.first.keys())S.atM.add(k); };
  return Ly; }
function newHistory(){ return {ids:new Map(),next:0,seen:null,atM:new Set()}; }
// THE TREE NULL's state: per shadow, a label per particle slot for every layer and AXES trait values per slot.
// onBirth runs inside the engine's birth call (via BIRTHS' hook) and draws only from the shadows' own streams.
// A parentless birth is marked and takes the real world's value at the next step, as a copy - it is outside the tree.
function familyTree(K,seedMix,CAP,axes){
  const T={K,axes,CAP,sd:0.2,H:3,born:[],lab:{},real:{},bpr:{},tr:[],rng:[]};
  // a layer: K shadow label arrays, the real id each slot showed at the last step, and each newborn's parent's real id
  T.addLayer=function(n){ T.lab[n]=Array.from({length:K},()=>new Int32Array(CAP).fill(-1)); T.real[n]=new Int32Array(CAP).fill(-1); T.bpr[n]=new Int32Array(CAP).fill(-1); };
  for(const n of LAYERS)T.addLayer(n);
  for(let k=0;k<K;k++){ T.tr.push(new Float64Array(CAP*axes).fill(NaN)); T.rng.push(mulberry(0x7EE5EED5^(k*7919+seedMix))); }
  T.onBirth=function(i,pa,pb){ pa=(pa>=0)?pa:-1; pb=(pb>=0)?pb:-1; T.born.push(i);
    for(const n in T.lab){ const Ls=T.lab[n]; for(let k=0;k<K;k++) Ls[k][i]=pa>=0?Ls[k][pa]:-2; T.bpr[n][i]=pa>=0?T.real[n][pa]:-2; }   // every layer registered, a rig's own included
    for(let k=0;k<K;k++){ const X=T.tr[k], r=T.rng[k], o=i*axes;
      if(pa<0){ for(let a=0;a<axes;a++)X[o+a]=NaN; continue; }
      for(let a=0;a<axes;a++){ const src=(pb>=0&&r()<0.5)?pb:pa; let v=X[src*axes+a]+(r()+r()+r()-1.5)*2*T.sd; X[o+a]=v>T.H?T.H:v<-T.H?-T.H:v; } } };
  // copy the real world into every shadow: all living slots (at the start), or only those the tree could not fill
  T.syncTraits=function(idx,tr,all){ for(let k=0;k<K;k++){ const X=T.tr[k]; for(let j=0;j<idx.length;j++){ const o=idx[j]*axes; if(all||X[o]!==X[o]) for(let a=0;a<axes;a++)X[o+a]=tr[j][a]; } } };
  T.onCompact=function(ni){ for(const n in T.lab){ for(const L of T.lab[n]) compactArray(L,ni,1); compactArray(T.real[n],ni,1); compactArray(T.bpr[n],ni,1); }
    for(const X of T.tr) compactArray(X,ni,axes);
    const nb=compactList(T.born,ni); T.born.length=0; for(const i of nb)T.born.push(i); };
  T.traitsOf=function(k,idx){ const X=T.tr[k], out=new Array(idx.length); for(let j=0;j<idx.length;j++){ const o=idx[j]*axes; const t=new Array(axes); for(let a=0;a<axes;a++)t[a]=X[o+a]; out[j]=t; } return out; };
  return T; }
module.exports={LAYERS,READER,BIRTHS,COMPACT,compactArray,compactList,GERM,mulberry,countOf,tracker,record,persistentIn,arrivalsIn,traitStep,labelStep,labelLayer,newHistory,familyTree};
