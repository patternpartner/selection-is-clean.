// #247 — THE NOVELTY CLOCK: is new stuff still arriving, and is it arriving FASTER THAN CHANCE?
//
// The headline number has been entropyRatio, and the notes have said since #219b that mutation spreads traits
// across its bins BY CONSTRUCTION, so a rise in it can be noise. This asks the question the artwork is about
// against a null that has the same noise and nothing else — Bedau's "shadow" method for evolutionary activity.
//
// THE REAL WORLD. The first three trait axes, cut into BINS^3 cells over [-RANGE, RANGE]. A cell is OCCUPIED at
// a sample when at least M living particles sit in it. An ARRIVAL is a cell occupied for the first time since
// WARM. A PERSISTENT arrival is one still occupied P ticks later — new territory that was held, not visited.
//
// THE SHADOWS. K neutral populations, each seeded at WARM as an exact copy of the real population's traits.
// Every EVERY ticks each shadow gets the real world's demography for that interval — D random deaths, then
// B births — and nothing else: a shadow child takes each axis from one of two uniformly random shadow parents
// and adds the engine's own mutation kernel (three uniforms, SD = INHERIT_SD, read live; zero when INHERIT is
// off), clamped to TEND_HARD. No selection, no homogenisers, no niche forces: the arrivals a population makes
// from inheritance, mutation and drift alone. Its own PRNG (mulberry32), so the engine's draws are untouched.
//
// THE CLOCK. Persistent arrivals per 1,000 ticks in the late half (T/2 .. T-P), real against the K shadows.
//   real above every shadow  -> FASTER THAN CHANCE: the world is reaching new territory drift would not
//   real inside their range  -> CHANCE: indistinguishable from mutation and drift
//   real below every shadow  -> SLOWER THAN CHANCE: something is holding novelty back
// Births are counted by wrapping addParticle/addCompound (a successful call is a birth, parented or not);
// deaths are births minus the change in the living count. Neither wrapper draws.
//
// Env: SEED (1)  TICKS (20000)  INDEX (engine.html)  K (8)  BINS (10)  RANGE (1.5)  M (3)  P (2000)
//      WARM (1000)  EVERY (25)  SAMPLE (100)
// Prints one JSON object.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||20000), K=+(E.K||8), BINS=+(E.BINS||10), RANGE=+(E.RANGE||1.5), M=+(E.M||3);
const SAMPLE=+(E.SAMPLE||100), EVERY=+(E.EVERY||25);
// defaults shrink with short budgets so smoke.sh's TICKS=40 boots it without a 1,000-tick warm-up; P stays a multiple of SAMPLE
const WARM=+(E.WARM||Math.min(1000,Math.floor(T/4))), P=+(E.P||Math.max(SAMPLE,Math.min(2000,Math.floor(T/4/SAMPLE)*SAMPLE)));
const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');const m=new Module('/tmp/novelty.js');m.filename='/tmp/novelty.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__NV={
  tick:()=>tick, N:()=>N, alive:i=>!!palive[i], DIMS:()=>DIMS, tend:(i,d)=>tend[i*DIMS+d],
  sd:()=>(typeof inheritOn==='function'&&!inheritOn())?0:INHERIT_SD, hard:()=>TEND_HARD,
  wrapBirths:function(){ let b=0; const _ap=addParticle,_ac=addCompound;
    addParticle=function(){const r=_ap.apply(this,arguments); if(r>=0)b++; return r;};
    addCompound=function(){const r=_ac.apply(this,arguments); if(r>=0)b++; return r;};
    return ()=>{const x=b;b=0;return x;}; },
  step:function(){ globalThis.__detMs+=5; try{loop();}catch(e){ return false; } return true; }
};`,'/tmp/novelty.js');
const NV=globalThis.__NV;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const binOf=v=>{let b=Math.floor((v+RANGE)/(2*RANGE)*BINS);return b<0?0:b>=BINS?BINS-1:b;};
const cellOf=(x,y,z)=>(binOf(x)*BINS+binOf(y))*BINS+binOf(z);
function realTraits(){ const out=[]; const n=NV.N(), D=NV.DIMS();
  for(let i=0;i<n;i++){ if(!NV.alive(i))continue; out.push([NV.tend(i,0),D>1?NV.tend(i,1):0,D>2?NV.tend(i,2):0]); } return out; }
function occupied(traits){ const c=new Map(); for(const t of traits){ const k=cellOf(t[0],t[1],t[2]); c.set(k,(c.get(k)||0)+1); }
  const occ=new Set(); for(const [k,n] of c) if(n>=M) occ.add(k); return occ; }
// an arrival tracker: first-occupancy tick per cell, and the per-sample occupied sets for the persistence check
function tracker(){ return {first:new Map(), hist:[]}; }
function record(tr,t,occ){ for(const k of occ) if(!tr.first.has(k)) tr.first.set(k,t); tr.hist.push([t,occ]); }
function persistentRate(tr,from,to){ // persistent arrivals with first tick in [from,to), per 1k ticks
  let n=0; const at=new Map(tr.hist.map(([t,o])=>[t,o]));
  for(const [k,t0] of tr.first){ if(t0<from||t0>=to)continue; const o=at.get(t0+P); if(o&&o.has(k))n++; }
  return +(n*1000/Math.max(1,to-from)).toFixed(3); }
function arrivalRate(tr,from,to){ let n=0; for(const [,t0] of tr.first) if(t0>=from&&t0<to)n++; return +(n*1000/Math.max(1,to-from)).toFixed(3); }

const takeBirths=NV.wrapBirths();
let errs=0;
for(let s=0;s<WARM;s++) if(!NV.step())errs++;
takeBirths();
const seedTraits=realTraits();
const shadows=[]; for(let k=0;k<K;k++) shadows.push({rng:mulberry(0x9E3779B9^(k*7919+ (+(E.SEED||1))*104729)), pop:seedTraits.map(t=>t.slice()), tr:tracker()});
const real=tracker(); let prevN=seedTraits.length;
const t0=NV.tick(); record(real,0,occupied(seedTraits)); for(const sh of shadows) record(sh.tr,0,occupied(sh.pop));
for(let s=1;s<=T;s++){
  if(!NV.step())errs++;
  if(s%EVERY===0){
    const nowN=realTraits().length, B=takeBirths(), D=Math.max(0,prevN+B-nowN); prevN=nowN;
    const sd=NV.sd(), H=NV.hard();
    for(const sh of shadows){ const r=sh.rng, pop=sh.pop;
      for(let d=0;d<D&&pop.length>0;d++){ const x=(r()*pop.length)|0; pop[x]=pop[pop.length-1]; pop.pop(); }
      const n0=pop.length;
      for(let b=0;b<B;b++){ if(n0===0)break; const a=pop[(r()*n0)|0], c=pop[(r()*n0)|0], ch=[0,0,0];
        for(let ax=0;ax<3;ax++){ let v=(r()<0.5?a:c)[ax]+(r()+r()+r()-1.5)*2*sd; ch[ax]=v>H?H:v<-H?-H:v; } pop.push(ch); } }
  }
  if(s%SAMPLE===0){ record(real,s,occupied(realTraits())); for(const sh of shadows) record(sh.tr,s,occupied(sh.pop)); }
}
const lateFrom=Math.floor(T/2), lateTo=T-P;
const realP=persistentRate(real,lateFrom,lateTo), realA=arrivalRate(real,lateFrom,lateTo);
const shP=shadows.map(sh=>persistentRate(sh.tr,lateFrom,lateTo)), shA=shadows.map(sh=>arrivalRate(sh.tr,lateFrom,lateTo));
const lo=Math.min(...shP), hi=Math.max(...shP), mean=+(shP.reduce((a,b)=>a+b,0)/K).toFixed(3);
const verdict=realP>hi?'FASTER THAN CHANCE':realP<lo?'SLOWER THAN CHANCE':'CHANCE';
console.log(JSON.stringify({seed:E.SEED||'1',ticks:T,warm:WARM,loopErrors:errs,window:[lateFrom,lateTo],
  clock:{verdict,realPersistentPer1k:realP,shadowPersistentPer1k:{min:lo,mean,max:hi,all:shP}},
  arrivals:{realPer1k:realA,shadowPer1k:shA},
  cellsEverOccupied:{real:real.first.size,shadows:shadows.map(sh=>sh.tr.first.size)},
  finalSize:{real:prevN,shadows:shadows.map(sh=>sh.pop.length)},
  params:{K,BINS,RANGE,M,P,EVERY,SAMPLE}}));
