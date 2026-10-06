// lab/loop-analyse.js - what the modules of a generator-in-the-loop run (#292) did: adoption over time, and composition.
//   RUN=pilot [ARM=G] node lab/loop-analyse.js       adoption: per window, each module's carriers, income share and executions, G against I
//        (ARM=A, S or A3 reads a control from lab/loop-control.js instead, beside its own inert twin A3I if that was run, else G)
//        Income share is a module's income over ALL income, modules included. Rows written before that was fixed (no den:'all'
//        in their mods block) held f = income over base income only; they are converted here, f/(1+sum of every module's f).
//   RUN=pilot KO=1 [T=20000] [REPS=3] node lab/loop-analyse.js
//        knockouts from G's current save: each module disarmed in turn, the world run T ticks (REPS draws of the main RNG);
//        dep[k][j]: module k's income with j knocked out against its income with nothing knocked out. A later module DEPENDS on an
//        earlier one when every knockout draw is below half the LOWEST baseline draw (not a paired ratio: rare incomes swing by
//        tens between draws, and a paired ratio called HOARD dependent on modules it never reads) and its baseline income is at
//        least FLOOR (default 50) per 1,000 ticks. Composition depth is the longest chain of such dependencies. The paired
//        ratios are still printed.
//        A module can only DEPEND on a module it reads ('NAME.field' in its source): at tick 800,000 of the pilot the income rule
//        alone said FAT depended on TANK and SMELL, and HOARD on SMELL and SIGNAL, none of which they read. Their incomes are
//        churn held by a few lineages, and whether those lineages are there after 20,000 ticks is a draw. Along a declared read,
//        a knockout tests whether the dependency is LIVE, which is what composition means. Every pair is still printed, and a
//        pair that passes the income rule without a read is marked as noise. Mean alive with each module out is printed too.
//        SELECTION, the tighter test of use: the same runs give each module's carrier share over the last 5,000 ticks armed (the
//        baseline draws) and disarmed (its own knockout draws). Both start from G's population as it is, with the same carriers,
//        so a gap is selection acting now, not two histories drifting apart as G and its twin I do. SELECTED when every armed
//        draw ends above every disarmed one; PURGED when every armed draw ends below. Runs every module (KO_FROM=k to skip
//        the knockouts of modules before k, KO_TO=k after k, so a long analysis can be split over
//        processes; SAVE=<file> reads a snapshot instead of G's live save).
'use strict';
const fs=require('fs'), path=require('path'); const {World}=require('./oee-core.js');
const E=process.env, RUN=E.RUN||'pilot', RUNDIR=E.RUNDIR||path.join(__dirname,'loop',RUN), HEAVY=E.HEAVY||path.join(RUNDIR,'heavy'), WIN=+(E.WIN||50);
const st=JSON.parse(fs.readFileSync(fs.existsSync(path.join(HEAVY,'state.json'))?path.join(HEAVY,'state.json'):path.join(RUNDIR,'state.json'),'utf8'));
const rows=a=>fs.readFileSync(path.join(HEAVY,a+'.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));

if(!E.KO){ const ARM=E.ARM||'G', TW=ARM==='G'?'I':fs.existsSync(path.join(HEAVY,ARM+'I.jsonl'))?ARM+'I':'G', G=rows(ARM), I=rows(TW), twin=TW==='I'||TW===ARM+'I'?'twin':'G', at=new Map(I.map(r=>[r.t,r]));
  const share=(r,id)=>{ if(!r.mods)return 0; const f=r.mods.flux.find(y=>y[0]===id); if(!f)return 0; return r.mods.den==='all'?f[1]:f[1]/(1+r.mods.flux.reduce((a,y)=>a+y[1],0)); };
  const names=new Map(((G.at(-1).mods||{}).list||[]).map(x=>[x.id,x.name]));
  console.log(`== ${RUN} arm ${ARM} (seed ${st.seed}) at tick ${G.at(-1).t}; modules in G: ${st.installed.map(x=>x.k+':'+x.name+'@'+x.tick).join(', ')||'none'}`);
  for(let w0=0;w0+WIN<=G.length;w0+=WIN){ const W=G.slice(w0,w0+WIN), WI=W.map(r=>at.get(r.t)).filter(Boolean), t0=W[0].t, t1=W.at(-1).t;
    const per=[...names].filter(([id])=>W.some(r=>r.mods&&r.mods.list.some(y=>y.id===id))).map(([id,name])=>{ const s=r=>r.mods&&r.mods.list.find(y=>y.id===id);
      const car=W.reduce((a,r)=>a+((s(r)||{}).carriers||0),0)/W.length, sh=W.reduce((a,r)=>a+share(r,id),0)/W.length, ex=W.reduce((a,r)=>a+((s(r)||{}).execs||0),0)/W.length;
      const cI=WI.length?WI.reduce((a,r)=>a+((s(r)||{}).carriers||0),0)/WI.length:NaN;
      const out=W.reduce((a,r)=>a+((s(r)||{}).out||0),0), inc=W.reduce((a,r)=>a+((s(r)||{}).inc||0),0), net=out>0?`, net ${((inc-out)/W.length).toFixed(0)} per 1,000 ticks (in ${(inc/W.length).toFixed(0)}, out ${(out/W.length).toFixed(0)})`:'';
      return `${name}: carried ${(car*100).toFixed(1)}% (${twin} ${(cI*100).toFixed(1)}%), ${(sh*100).toFixed(1)}% of income${net}, ${ex.toFixed(0)} execs`; });
    const N=W.reduce((a,r)=>a+r.N,0)/W.length, NI=WI.length?WI.reduce((a,r)=>a+r.N,0)/WI.length:NaN;
    console.log(`  t${t0}-${t1} N ${N.toFixed(0)} (${twin} ${NI.toFixed(0)}) | ${per.join(' | ')||'-'}`); } }
else { const T=+(E.T||20000), REPS=+(E.REPS||3), FLOOR=+(E.FLOOR||50), save=fs.readFileSync(E.SAVE||path.join(HEAVY,'G.json'),'utf8'), w0=World.load(save), mods=w0.mods||[];
  if(mods.length<2){ console.log('fewer than two modules: nothing to knock out against'); process.exit(0); }
  const inc=(ko,rep)=>{ const w=World.load(save); w.rnd.s=(w.rnd.s^Math.imul(rep+1,0x9e3779b1))|0; if(ko>=0)w.mods[ko].disarmed=true; const tot=new Float64Array(w.mods.length), car=new Float64Array(w.mods.length); let nn=0, ns=0, nc=0;
    for(let s=1;s<=T;s++){ w.step(); if(s%1000===0){ const r=w.sample(); for(const x of r.mods.list)tot[x.id]+=x.inc; nn+=r.N; ns++; if(s>T-5000){ for(const x of r.mods.list)car[x.id]+=x.carriers; nc++; } } } tot.N=Math.round(nn/ns); tot.car=car.map(v=>v/nc); return tot; };
  const base=[...Array(REPS).keys()].map(r=>inc(-1,r)); console.log(`== knockouts from tick ${w0.tick}, ${T} ticks, ${REPS} draws; baseline income per module: ${mods.map((m,i)=>m.name+' '+(base.reduce((a,b)=>a+b[i],0)/REPS).toFixed(0)).join(', ')}`);
  // the earlier modules each module reads ('NAME.field' in its source): only along these can it depend on another
  const reads=mods.map(m=>new Set([...m.src.matchAll(/['"]([A-Z][A-Z0-9_]*)\./g)].map(x=>x[1])));
  console.log(`  reads: ${mods.map((m,i)=>m.name+(reads[i].size?' <- '+[...reads[i]].join('+'):'')).join(', ')}`);
  const dep=mods.map(()=>mods.map(()=>null)), N0=base.map(b=>b.N);
  for(let j=+(E.KO_FROM||1)-1;j<Math.min(mods.length,+(E.KO_TO||mods.length));j++){ const ko=[...Array(REPS).keys()].map(r=>inc(j,r));
    const cb=base.map(b=>b.car[j]), ck=ko.map(x=>x.car[j]), sel=Math.min(...cb)>Math.max(...ck)?'  => SELECTED (armed above every disarmed draw)':Math.max(...cb)<Math.min(...ck)?'  => PURGED (armed below every disarmed draw)':'';
    console.log(`  without ${mods[j].name}: alive ${ko.map((x,r)=>x.N+'/'+N0[r]).join(' ')} | its carriers at the end, armed ${cb.map(v=>(v*100).toFixed(1)).join(' ')} vs disarmed ${ck.map(v=>(v*100).toFixed(1)).join(' ')}${sel}`);
    for(let k=0;k<mods.length;k++){ if(k===j)continue; const ratios=ko.map((x,r)=>base[r][k]>0?x[k]/base[r][k]:NaN), lo=Math.min(...base.map(b=>b[k])), rate=base.reduce((a,b)=>a+b[k],0)/REPS/T*1000;
      const d=reads[k].has(mods[j].name)&&rate>=FLOOR&&ko.every(x=>x[k]<0.5*lo), spurious=!reads[k].has(mods[j].name)&&rate>=FLOOR&&ko.every(x=>x[k]<0.5*lo); dep[k][j]=d;
      if(base.every(b=>!(b[k]>0)))continue;
      console.log(`    ${mods[k].name} income ratio ${ratios.map(v=>Number.isFinite(v)?v.toFixed(2):'-').join(' ')}${d?'  => DEPENDS on it (a read it declares, and live)':spurious?'  (would pass the income rule, but it does not read this module: noise)':''}`); } }
  // composition counts only a later module depending on an earlier one: the earlier was there first, so the later was built on it
  const depth=new Array(mods.length).fill(0); for(let k=0;k<mods.length;k++) for(let j=0;j<k;j++) if(dep[k][j]===true)depth[k]=Math.max(depth[k],depth[j]+1);
  console.log(`  composition depth (longest chain of dependencies): ${Math.max(...depth)} | per module: ${mods.map((m,i)=>m.name+' '+depth[i]).join(', ')}`); }
