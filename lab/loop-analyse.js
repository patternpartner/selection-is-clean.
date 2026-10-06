// lab/loop-analyse.js - what the modules of a generator-in-the-loop run (#292) did: adoption over time, and composition.
//   RUN=pilot [ARM=G] node lab/loop-analyse.js       adoption: per window, each module's carriers, income share and executions, G against I
//        (ARM=A, S or A3 reads a control from lab/loop-control.js instead, beside its own inert twin A3I if that was run, else G)
//        Income share is a module's income over ALL income, modules included. Rows written before that was fixed (no den:'all'
//        in their mods block) held f = income over base income only; they are converted here, f/(1+sum of every module's f).
//   RUN=pilot KO=1 [T=20000] [REPS=3] node lab/loop-analyse.js
//        knockouts from G's current save: each module disarmed in turn, the world run T ticks (REPS draws of the main RNG);
//        dep[k][j] = module k's income with j knocked out over its income with nothing knocked out. A later module DEPENDS on an
//        earlier one when that ratio falls below 0.5 on every draw; composition depth is the longest chain of such dependencies.
//        Every pair is printed, both ways: a sense earns nothing itself, so its use shows as an EARLIER module's income falling
//        without it (HELD UP), which is support, not composition. Mean alive with each module out is printed beside the baseline.
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
      return `${name}: carried ${(car*100).toFixed(1)}% (${twin} ${(cI*100).toFixed(1)}%), ${(sh*100).toFixed(1)}% of income, ${ex.toFixed(0)} execs`; });
    const N=W.reduce((a,r)=>a+r.N,0)/W.length, NI=WI.length?WI.reduce((a,r)=>a+r.N,0)/WI.length:NaN;
    console.log(`  t${t0}-${t1} N ${N.toFixed(0)} (${twin} ${NI.toFixed(0)}) | ${per.join(' | ')||'-'}`); } }
else { const T=+(E.T||20000), REPS=+(E.REPS||3), save=fs.readFileSync(path.join(HEAVY,'G.json'),'utf8'), w0=World.load(save), mods=w0.mods||[];
  if(mods.length<2){ console.log('fewer than two modules: nothing to knock out against'); process.exit(0); }
  const inc=(ko,rep)=>{ const w=World.load(save); w.rnd.s=(w.rnd.s^Math.imul(rep+1,0x9e3779b1))|0; if(ko>=0)w.mods[ko].disarmed=true; const tot=new Float64Array(w.mods.length); let nn=0, ns=0;
    for(let s=1;s<=T;s++){ w.step(); if(s%1000===0){ const r=w.sample(); for(const x of r.mods.list)tot[x.id]+=x.inc; nn+=r.N; ns++; } } tot.N=Math.round(nn/ns); return tot; };
  const base=[...Array(REPS).keys()].map(r=>inc(-1,r)); console.log(`== knockouts from tick ${w0.tick}, ${T} ticks, ${REPS} draws; baseline income per module: ${mods.map((m,i)=>m.name+' '+(base.reduce((a,b)=>a+b[i],0)/REPS).toFixed(0)).join(', ')}`);
  const dep=mods.map(()=>mods.map(()=>null)), N0=base.map(b=>b.N);
  for(let j=0;j<mods.length;j++){ const ko=[...Array(REPS).keys()].map(r=>inc(j,r));
    console.log(`  without ${mods[j].name}: alive ${ko.map((x,r)=>x.N+'/'+N0[r]).join(' ')}`);
    for(let k=0;k<mods.length;k++){ if(k===j)continue; const ratios=ko.map((x,r)=>base[r][k]>0?x[k]/base[r][k]:NaN); dep[k][j]=ratios; const d=ratios.every(v=>v<0.5);
      if(base.every(b=>!(b[k]>0)))continue;
      console.log(`    ${mods[k].name} income ratio ${ratios.map(v=>Number.isFinite(v)?v.toFixed(2):'-').join(' ')}${d?(j<k?'  => DEPENDS on it':'  => HELD UP by it (a later module)'):''}`); } }
  // composition counts only a later module depending on an earlier one: the earlier was there first, so the later was built on it
  const depth=new Array(mods.length).fill(0); for(let k=0;k<mods.length;k++) for(let j=0;j<k;j++) if(dep[k][j]&&dep[k][j].every(v=>v<0.5))depth[k]=Math.max(depth[k],depth[j]+1);
  console.log(`  composition depth (longest chain of dependencies): ${Math.max(...depth)} | per module: ${mods.map((m,i)=>m.name+' '+depth[i]).join(', ')}`); }
