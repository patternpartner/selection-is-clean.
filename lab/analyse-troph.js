// analysis for PREREG-troph.md (#348).  [SEEDS=8001,8002,8003] node lab/analyse-troph.js <dir>   (o1 = DRAIN, o2 = SCARCE)
// From LOGFULL samples. Per window of 30 samples: mean exp(H) (full vector) and the income-weighted mean circuit (logged income).
// TREND: least-squares slope of window exp(H) over windows 21-40 (per window). LATE NOVELTY: functions whose per-sample income first
// reaches 100 in windows 31-40 (never before in the run). LEVELS (#346's margins): mean circuit and median exp(H) over the second half.
// TAX: second-half mean of ev.trophTax / task income (the manipulation check). Climb 2+ from <w>.hops.json is reported only.
'use strict';
const fs=require('fs'); const {CSZ4}=require('./core-tasks4.js');
const D=process.argv[2], seeds=(process.env.SEEDS||'8001,8002,8003').split(',').map(Number), WIN=30, NW=+(process.env.NW||40), NCHK=NW/5;   // NW=80 for #349's 2,400,000-tick horizon: second half = windows NW/2+1..NW, late = the last 10
const med=a=>{ const b=[...a].sort((x,y)=>x-y), n=b.length; return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):0; };
function world(w){ const R=[]; for(let k=0;k<NCHK;k++){ const f=`${D}/${w}.${k}.jsonl`; if(!fs.existsSync(f))break; for(const l of fs.readFileSync(f,'utf8').trim().split('\n')){ try{ R.push(JSON.parse(l)); }catch(e){} } }
  const win=[], first=new Map();
  R.forEach((r,i)=>{ if(r.tasks&&r.tasks.full) for(const [T,x] of r.tasks.full) if(x>=100&&!first.has(T))first.set(T,Math.floor(i/WIN)); });
  for(let i=0;i+WIN<=R.length;i+=WIN){ const W=R.slice(i,i+WIN).filter(r=>r.tasks&&r.tasks.income>0); if(!W.length){ win.push(null); continue; }
    let H=0,g=0,gc=0; for(const r of W){ H+=r.tasks.expH/W.length; for(const [T,x] of r.tasks.full){ g+=x; gc+=x*Math.min(10,CSZ4[T]); } } win.push({H, circ:g?gc/g:0}); }
  const pts=win.slice(NW/2,NW).map((x,i)=>x?[i,x.H]:null).filter(Boolean), n=pts.length, mx=pts.reduce((s,p)=>s+p[0],0)/n, my=pts.reduce((s,p)=>s+p[1],0)/n;
  const slope=n>2?pts.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/pts.reduce((s,p)=>s+(p[0]-mx)**2,0):0;
  const half=R.slice(Math.floor(R.length/2)).filter(r=>r.tasks&&r.tasks.income>0);
  let g=0,gc=0; for(const r of half) for(const [T,x] of r.tasks.full){ g+=x; gc+=x*Math.min(10,CSZ4[T]); }
  const tax=half.reduce((a,r)=>a+((r.ev&&r.ev.trophTax)||0),0)/Math.max(1,half.reduce((a,r)=>a+r.tasks.income,0));
  let reads=0,hits=0; for(const r of half){ reads+=(r.ev&&r.ev.reads)||0; hits+=(r.ev&&r.ev.readHits)||0; }
  const firstAct=win.findIndex(x=>x&&x.H>1);
  let hp=null; try{ hp=JSON.parse(fs.readFileSync(`${D}/${w}.hops.json`,'utf8')); }catch(e){}
  return {ticks:R.length?R.at(-1).t:0, hit:reads?hits/reads:0, firstAct, slope, late:[...first.values()].filter(k=>k>=NW-10&&k<NW).length,
    circ:g?gc/g:0, expH:med(half.map(r=>r.tasks.expH)), tax, inc:half.reduce((a,r)=>a+r.tasks.income,0)/Math.max(1,half.length),
    a21:win.slice(NW-20,NW-10).filter(Boolean).reduce((s,x,_,a)=>s+x.H/a.length,0), a31:win.slice(NW-10,NW).filter(Boolean).reduce((s,x,_,a)=>s+x.H/a.length,0),
    climb2:hp?hp.incomeByClimb_0_1_2_3plus[2]+hp.incomeByClimb_0_1_2_3plus[3]:null}; }
const res={}; for(const s of seeds) for(const o of [1,2]) res[`${s}_o${o}`]=world(`${s}_o${o}`);
const f=x=>x===null?'n/a':(+x.toFixed(3));
for(const s of seeds){ const A=res[`${s}_o1`], B=res[`${s}_o2`];
  console.log(`${s}: DRAIN / SCARCE | tax share ${f(A.tax)} / ${f(B.tax)} | exp(H) slope per window (w21-40) ${f(A.slope)} / ${f(B.slope)} | exp(H) w21-30 -> w31-40 ${Math.round(A.a21)}->${Math.round(A.a31)} / ${Math.round(B.a21)}->${Math.round(B.a31)} | late novelty (first >=100 in w31-40) ${A.late} / ${B.late} | mean circuit ${f(A.circ)} / ${f(B.circ)} | exp(H) ${f(A.expH)} / ${f(B.expH)} | climb 2+ ${f(A.climb2)} / ${f(B.climb2)} | income ${Math.round(A.inc)} / ${Math.round(B.inc)}`); }
const counted=seeds.filter(s=>{ const A=res[`${s}_o1`], B=res[`${s}_o2`]; return A.ticks>=NW*30000&&B.ticks>=NW*30000&&A.hit>=0.01&&B.hit>=0.01&&((A.firstAct>=0&&A.firstAct<20)||(B.firstAct>=0&&B.firstAct<20)); });
console.log(`counted seeds: ${counted.length}/3 (${counted.join(',')})`);
if(counted.length<3){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
const n=fn=>seeds.filter(s=>fn(res[`${s}_o1`],res[`${s}_o2`])).length;
const M=n(A=>A.tax>=0.10)>=2;
const UP=n(A=>A.slope>=5)>=2, ABOVE=n((A,B)=>A.slope>=B.slope+5)>=2, NOV=n((A,B)=>A.late>B.late)>=2;
const H1=n((A,B)=>A.circ>=B.circ+0.3)>=2&&n((A,B)=>A.circ<B.circ-0.3)===0, BR=n((A,B)=>A.expH>=1.1*B.expH)>=2&&n((A,B)=>A.expH<0.9*B.expH)===0;
console.log(`M (tax at least 10% of task income on 2 of 3) ${M} | UP (DRAIN slope >= +5/window on 2 of 3) ${UP} | ABOVE (DRAIN slope >= SCARCE + 5 on 2 of 3) ${ABOVE} | LATE NOVELTY higher on 2 of 3 ${NOV} | H1 ${H1} | BR ${BR}`);
console.log('VERDICT: '+(!M?'NOT APPLIED':(UP&&ABOVE&&NOV)?'RATCHET':ABOVE?'SLOWER FENCE':'NO TREND EFFECT')+((M&&(H1||BR))?' | levels: '+[H1?'HARDER':'',BR?'BROADER':''].filter(Boolean).join(', '):''));
