// lab/renew/rn-check.js - LOCAL-RENEWAL readout and pre-registered rules (lab/LOCAL-RENEWAL.md). Written before any trial run.
// PRIMARY metric S = "used novelty that sticks": windows of 10 samples (10k ticks). A body trick (catalyst key) is USED in a window when
//   its mean share of chemical income is >= 1% or it is carried by >= 1% of organisms (the Lu rule of lab/chance/ce-trial.js). NEW USED in
//   w = used in w and never used before. STICKY in w = new used in w AND still used in w+2. S = mean sticky count per window over the late
//   third of the windows that have a w+2 (450k: windows 29..42 of 0..44; 150k: windows 9..12).
// Also per run: late N (mean over the last third of samples), reseeds, injected energy (sample.rn.inj summed) and cap-binding share.
//   node lab/renew/rn-check.js metric DIR 'ARMS' 'SEEDS'             -> table (+ JSON with OUT=)
//   node lab/renew/rn-check.js tune DIR 'SEEDS'                       -> renewal-cap choice (arms RENEW-c<cap>, MATCHED-c<cap>, BASE)
//   node lab/renew/rn-check.js go DIR 'SEEDS'                         -> go / no-go (arms RENEW MATCHED D RANDCAP DRIFT DRIFT-RN SHUF-RN BASE)
'use strict'; const fs=require('fs'), path=require('path');
const WIN=10, MIN=0.01;
const read=f=>{ if(!fs.existsSync(f))return null; const L=fs.readFileSync(f,'utf8').trim().split('\n').filter(x=>x.startsWith('{')); return L.length?L.map(JSON.parse):null; };
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
function run(dir,arm,seed){ const rows=read(path.join(dir,`${arm}-${seed}.jsonl`)); if(!rows)return null; const nW=Math.floor(rows.length/WIN), used=[];
  for(let w=0;w<nW;w++){ const W=rows.slice(w*WIN,(w+1)*WIN), inc=new Map(), car=new Map();
    for(const r of W){ const b=r.body||{}; for(const [k,v] of (b.bU||[]))inc.set(k,(inc.get(k)||0)+v/W.length); for(const [k,v] of (b.bC||[]))car.set(k,(car.get(k)||0)+v/W.length); }
    used.push(new Set([...[...inc].filter(([k,v])=>v>=MIN).map(([k])=>k),...[...car].filter(([k,v])=>v>=MIN).map(([k])=>k)])); }
  const ever=new Set(), nu=[], st=[]; for(let w=0;w<nW;w++){ const n=[...used[w]].filter(k=>!ever.has(k)); n.forEach(k=>ever.add(k)); nu.push(n.length); st.push(w+2<nW?n.filter(k=>used[w+2].has(k)).length:NaN); }
  const E=nW-2, th=Math.floor(E/3), late=st.slice(E-th,E), lateNu=nu.slice(E-th,E), lr=rows.slice(Math.floor(rows.length*2/3));
  const inj=rows.reduce((s,r)=>s+((r.rn&&r.rn.inj)||0),0), bind=mean(rows.filter(r=>r.rn).map(r=>r.rn.bind));
  return {t:rows.at(-1).t,nW,S:mean(late),newUsedLate:mean(lateNu),stickShare:mean(lateNu)>0?mean(late)/mean(lateNu):NaN,N:mean(lr.map(r=>r.N)),reseeds:rows.at(-1).reseeds||0,inj,bind}; }
const f2=v=>Number.isFinite(v)?v.toFixed(2):'-';
function table(dir,arms,seeds){ const R={}, out=['arm seed | ticks | S (sticky new used / window, late third) | new used / window (late third) | sticky share | late N | reseeds | injected energy | cap binding share'];
  for(const s of seeds) for(const a of arms){ const x=run(dir,a,s); if(!x)continue; R[a+'|'+s]=x; out.push(`${a} ${s} | ${x.t} | ${f2(x.S)} | ${f2(x.newUsedLate)} | ${f2(x.stickShare)} | ${x.N.toFixed(0)} | ${x.reseeds} | ${x.inj.toFixed(0)} | ${f2(x.bind)}`); } return {R,out}; }
const [mode,dir,A,B]=process.argv.slice(2);
if(mode==='metric'){ const {R,out}=table(dir,A.split(' '),B.split(' ')); console.log(out.join('\n')); if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(R)); }
else if(mode==='tune'){ // RULE (pre-registered): candidate caps 1.5, 5, 15 (energy per chemistry step). A cap qualifies if on every trial seed: MATCHED's
  // injected energy is within +-10% of RENEW's, the cap binds in >= 95% of chemistry steps in both arms, no arm reseeds, and RENEW and MATCHED late N >= 50% of BASE. Among qualifying caps pick the highest
  // mean_s S(RENEW) / mean_s S(MATCHED) (ratio of seed means; +0.5 added to both means so a zero denominator is defined); ties within
  // 0.02 go to the SMALLER cap. No qualifying cap => STOP (no deciding round; MATCHED must be redesigned).
  const seeds=A.split(' '), caps=['1.5','5','15'], out=[]; let best=null;
  for(const c of caps){ let ok=true, why=[]; const sR=[], sM=[];
    for(const s of seeds){ const r=run(dir,'RENEW-c'+c,s), m=run(dir,'MATCHED-c'+c,s), b=run(dir,'BASE',s); if(!r||!m||!b){ ok=false; why.push(`missing ${s}`); continue; }
      sR.push(r.S); sM.push(m.S); const em=r.inj>0?m.inj/r.inj:NaN; if(!(em>=0.9&&em<=1.1)){ ok=false; why.push(`seed ${s} energy MATCHED/RENEW ${f2(em)}`); } if(!(r.bind>=0.95&&m.bind>=0.95)){ ok=false; why.push(`seed ${s} cap binding ${f2(r.bind)}/${f2(m.bind)}`); }
      if(r.reseeds||m.reseeds){ ok=false; why.push(`seed ${s} reseed`); } if(r.N<0.5*b.N||m.N<0.5*b.N){ ok=false; why.push(`seed ${s} N collapse`); } }
    const ratio=(mean(sR)+0.5)/(mean(sM)+0.5); out.push(`cap ${c}: S RENEW ${sR.map(f2).join(',')} | S MATCHED ${sM.map(f2).join(',')} | ratio ${f2(ratio)} | ${ok?'qualifies':'does not qualify: '+why.join('; ')}`);
    if(ok&&(!best||ratio>best.ratio+0.02))best={c,ratio}; }
  out.push(best?`FROZEN RN_CAP ${best.c}`:'STOP: no cap qualifies'); console.log(out.join('\n')); }
else if(mode==='go'){ // RULE (pre-registered): GO only if ALL hold.
  // (1) On >= 2 of the 3 deciding seeds, RENEW beats EVERY null: S(RENEW) > S of MATCHED, D, RANDCAP and SHUF-RN (strictly), and for
  //     the no-selection null, as a difference: S(RENEW) - S(D) > S(DRIFT-RN) - S(DRIFT) (renewal must help more WITH selection than
  //     it helps drift). Reason: on the existing stage-2 data (seeds 113-115, not used here) plain DRIFT scores S 15-22 against D 3.6-10,
  //     because inert shadow bodies carry many tricks at >= 1%; a direct S(RENEW) > S(DRIFT-RN) is reported but is not part of the bar.
  // (2) mean_s S(RENEW) >= 1.10 x mean_s S(RANDCAP) AND >= 1.10 x mean_s S(MATCHED) (ratio of seed means).
  // (3) No population collapse: no arm reseeds on any seed and every arm's late N >= 50% of BASE's on every seed.
  // (4) Food matched: on every seed MATCHED's injected energy is within +-10% of RENEW's.
  // Secondary (reported, not part of the bar): Lu and LuInc from lab/chance/ce-trial.js, sticky share, cap binding.
  const seeds=A.split(' '), nulls=['MATCHED','D','RANDCAP','SHUF-RN'], out=[]; let wins=0, collapse=[], match=[]; const S={};
  for(const a of ['RENEW',...nulls,'DRIFT','DRIFT-RN']) S[a]=[];
  for(const s of seeds){ const x={}; for(const a of ['RENEW',...nulls,'DRIFT','DRIFT-RN','BASE'])x[a]=run(dir,a,s); if(Object.values(x).some(v=>!v)){ out.push(`seed ${s}: missing runs`); continue; }
    for(const a of ['RENEW',...nulls,'DRIFT','DRIFT-RN'])S[a].push(x[a].S); const beat=nulls.filter(n=>x.RENEW.S>x[n].S), dd=(x.RENEW.S-x.D.S)>(x['DRIFT-RN'].S-x.DRIFT.S); if(beat.length===nulls.length&&dd)wins++;
    out.push(`seed ${s}: S RENEW ${f2(x.RENEW.S)} | `+nulls.map(n=>`${n} ${f2(x[n].S)}`).join(' | ')+` | beats ${beat.length}/${nulls.length} | renewal effect with selection ${f2(x.RENEW.S-x.D.S)} vs under drift ${f2(x['DRIFT-RN'].S-x.DRIFT.S)} ${dd?'PASS':'FAIL'} | (not in bar) direct vs DRIFT-RN ${f2(x['DRIFT-RN'].S)} ${x.RENEW.S>x['DRIFT-RN'].S?'above':'not above'}`);
    for(const a of ['RENEW',...nulls,'DRIFT','DRIFT-RN']){ if(x[a].reseeds)collapse.push(`${a} ${s} reseeds`); if(x[a].N<0.5*x.BASE.N)collapse.push(`${a} ${s} N ${x[a].N.toFixed(0)} < 50% of BASE ${x.BASE.N.toFixed(0)}`); }
    const em=x.RENEW.inj>0?x.MATCHED.inj/x.RENEW.inj:NaN; if(!(em>=0.9&&em<=1.1))match.push(`seed ${s} energy MATCHED/RENEW ${f2(em)}`); }
  // DRIFT-RN and SHUF-RN get the same RENEW 1 food as RENEW; their injected energy is reported in the metric table.
  const rR=mean(S.RENEW)/mean(S.RANDCAP), rM=mean(S.RENEW)/mean(S.MATCHED);
  const c1=wins>=2, c2=rR>=1.10&&rM>=1.10, c3=!collapse.length, c4=!match.length;
  out.push(`(1) seeds beating every null (DRIFT as difference): ${wins}/3 ${c1?'PASS':'FAIL'}`, `(2) mean S ratio vs RANDCAP ${f2(rR)}, vs MATCHED ${f2(rM)} (need >= 1.10 both) ${c2?'PASS':'FAIL'}`,
    `(3) collapse: ${c3?'none PASS':collapse.join('; ')+' FAIL'}`, `(4) food match: ${c4?'PASS':match.join('; ')+' FAIL'}`, (c1&&c2&&c3&&c4)?'GO: local renewal supports sticky used novelty on these seeds (descriptive claim only for this world)':'NO-GO');
  console.log(out.join('\n')); }
