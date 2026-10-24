// analysis for PREREG-scarce.md (#346), from lab/analyse-reg.js.  [SEEDS=7901,7902,7903] node lab/analyse-scarce.js <dir>   (o1 = SCARCE, o2 = CONTROL)
// Manipulation check: the pools of the functions holding 1% or more of income, fill (level / cap) at the first tick of each epoch
// (probe-hops, <w>.hops.json). TWO-READ is an outcome here; the rest as #345.
// Rules on THRESHOLD-FREE measures. From the LOGFULL samples (second half, samples 601-1200): breadth = median per-sample exp(H) over
// ALL functions' income; floor = median per-sample count of functions with income >= 100; hardness = income-weighted mean circuit
// size (lab/core-tasks4.js, 10+ as 10) over the logged income (every function with income >= 10). From the probes on each last save:
// <w>.leak.json (paid outputs after 2+ distinct reads, share fed by 2+ reads), <w>.twowire.json (clean income fed by 2+ reads),
// <w>.hops.json (income at climb >= 2). The legacy 1%-based measures (lab/analyse-four.js's) are printed alongside, ruling on nothing.
'use strict';
const fs=require('fs'); const {CSZ4}=require('./core-tasks4.js');
const D=process.argv[2], seeds=(process.env.SEEDS||'7901,7902,7903').split(',').map(Number), WIN=30, MIN=0.01, MINABS=100;
const med=a=>{ const b=[...a].sort((x,y)=>x-y), n=b.length; return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):0; };
const J=(w,k)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${w}.${k}.json`,'utf8')); }catch(e){ return null; } };
function world(w){ const R=[]; for(let k=0;k<8;k++){ const f=`${D}/${w}.${k}.jsonl`; if(!fs.existsSync(f))break; for(const l of fs.readFileSync(f,'utf8').trim().split('\n')){ try{ R.push(JSON.parse(l)); }catch(e){} } }
  const half=R.slice(Math.floor(R.length/2)).filter(r=>r.tasks&&r.tasks.income>0);
  const expH=med(half.map(r=>r.tasks.expH||0)), floor=med(half.map(r=>(r.tasks.full||[]).filter(([T,x])=>x>=100).length));
  let g=0, gc=0; for(const r of half) for(const [T,x] of (r.tasks.full||[])){ g+=x; gc+=x*Math.min(10,CSZ4[T]); }
  let reads=0, hits=0; for(const r of half){ reads+=(r.ev&&r.ev.reads)||0; hits+=(r.ev&&r.ev.readHits)||0; }
  // legacy: 1%-based windows (as lab/analyse-four.js)
  const RR=R.filter(r=>r.N>0&&r.tasks), ever=new Set(), per=[]; let firstAct=-1;
  for(let w0=0,wi=0;w0+WIN<=RR.length;w0+=WIN,wi++){ const W=RR.slice(w0,w0+WIN), m=new Map(); let inc=0; for(const r of W){ for(const [T,v] of r.tasks.flux) m.set(T,(m.get(T)||0)+v/W.length); inc+=r.tasks.income/W.length; }
    const act=[...m.entries()].filter(([T,v])=>v>=MIN&&v*inc>=MINABS); for(const [T] of act)ever.add(T); if(act.length&&firstAct<0)firstAct=wi; per.push(act.length?Math.max(...act.map(([T])=>Math.min(10,CSZ4[T]))):0); }
  const lk=J(w,'leak'), tw=J(w,'twowire'), hp=J(w,'hops');
  const two=tw?(()=>{ const j=tw.shareOfAllIncome_by_k_0_1_2_3plus; return j.clean_fresh[2]+j.clean_fresh[3]+j.clean_stale[2]+j.clean_stale[3]; })():null;
  return {ticks:R.length?R.at(-1).t:0, hit:reads?hits/reads:0, firstAct, expH, floor, circ:g?gc/g:0, ever:ever.size, sus1:med(per.slice(20,40)),
    paid2:lk?lk.overwrite.paidByReadsFeeding_0_1_2plus[2]:null, two, climb2:hp?hp.incomeByClimb_0_1_2_3plus[2]+hp.incomeByClimb_0_1_2_3plus[3]:null, fill:hp?hp.poolFill.epochFirstTick.band1pct:null}; }
const res={}; for(const s of seeds) for(const o of [1,2]) res[`${s}_o${o}`]=world(`${s}_o${o}`);
const f=x=>x===null?'n/a':(+x.toFixed(3));
for(const s of seeds){ const A=res[`${s}_o1`], B=res[`${s}_o2`];
  console.log(`${s}: SCARCE / CONTROL | easy-pool fill ${f(A.fill)} / ${f(B.fill)} | paid-after-2-reads fed by 2+ ${f(A.paid2)} / ${f(B.paid2)} | clean income fed by 2+ reads ${f(A.two)} / ${f(B.two)} | mean circuit ${f(A.circ)} / ${f(B.circ)} | climb 2+ ${f(A.climb2)} / ${f(B.climb2)} | exp(H) ${f(A.expH)} / ${f(B.expH)} | functions >= 100 ${A.floor} / ${B.floor} || legacy: sustained circuit (1%) ${A.sus1} / ${B.sus1}, ever active (1%) ${A.ever} / ${B.ever} | read hits ${(100*A.hit).toFixed(1)}% / ${(100*B.hit).toFixed(1)}%`); }
const counted=seeds.filter(s=>{ const A=res[`${s}_o1`], B=res[`${s}_o2`]; return A.ticks>=1200000&&B.ticks>=1200000&&A.hit>=0.01&&B.hit>=0.01&&((A.firstAct>=0&&A.firstAct<20)||(B.firstAct>=0&&B.firstAct<20)); });
console.log(`counted seeds: ${counted.length}/3 (${counted.join(',')})`);
if(counted.length<3){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
const n=(fn)=>seeds.filter(s=>fn(res[`${s}_o1`],res[`${s}_o2`])).length;
const M=n((A,B)=>A.fill!==null&&B.fill!==null&&A.fill<=B.fill-0.30)>=2;
const TWO=n((A,B)=>A.two!==null&&B.two!==null&&A.two>B.two)>=2;
const H1=n((A,B)=>A.circ>=B.circ+0.3)>=2&&n((A,B)=>A.circ<B.circ-0.3)===0;
const H2=n((A,B)=>A.climb2!==null&&B.climb2!==null&&A.climb2>=B.climb2+0.05)>=2&&n((A,B)=>A.climb2!==null&&B.climb2!==null&&A.climb2<B.climb2-0.05)===0;
const BR=n((A,B)=>A.expH>=1.1*B.expH)>=2&&n((A,B)=>A.expH<0.9*B.expH)===0;
console.log(`M (easy-pool fill 0.30+ lower on 2 of 3) ${M} | TWO-READ ${TWO} | H1 mean circuit +0.3 ${H1} | H2 climb 2+ +0.05 ${H2} | BROADER exp(H) +10% ${BR}`);
console.log('VERDICT: '+(!M?'NOT APPLIED':(H1&&H2)?'COMPOSES HARDER'+(BR?', AND BROADER':''):(H1||H2)?'PARTLY HARDER ('+(H1?'circuit':'climb')+')'+(BR?', AND BROADER':''):BR?'BROADER, NOT HARDER':'NO GAIN')+(M&&TWO?' (TWO-READ ROSE)':''));
