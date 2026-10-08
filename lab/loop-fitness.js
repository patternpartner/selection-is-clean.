// lab/loop-fitness.js - is a module SELECTED? A fitness assay for generator-in-the-loop runs (#292).
// Carrier share cannot answer it: from one population, a module's carriers after 20,000 ticks ranged 4.9-30.8% across draws
// (pilot, tick 800,000), because lineage sweeps move every opcode far more than selection on it does. This counts events
// instead. From a save, for each module, the same population runs T ticks with the module ARMED and with it DISARMED, REPS
// draws each. Every birth and death is attributed to whether the parent (or the dead) carries the module's opcode, and
//   s = (births - deaths per carrier per tick) - (births - deaths per non-carrier per tick)
// is the carriers' growth advantage. Carrying an opcode is linked to everything else in the carriers' programs, and that link
// is the same in both arms at the start; what differs is only whether the opcode does anything. So
//   effect = s armed - s disarmed
// is the module's own effect on its carriers' growth, over thousands of events in a window too short for the two arms'
// populations to drift far apart. SELECTED when every armed draw's s is above every disarmed draw's s; AGAINST when every one
// is below. The Welch t of the two sets of draws is printed beside it.
//   RUN=pilot [SAVE=<file>] [T=2000] [REPS=4] [ONLY=NAME,NAME] node lab/loop-fitness.js
'use strict';
const fs=require('fs'), path=require('path'); const {World}=require('./oee-core.js');

function assay(save,j,armed,rep,T){ const w=World.load(save); w.rnd.s=(w.rnd.s^Math.imul(rep+1,0x9e3779b1))|0; if(!armed)w.mods[j].disarmed=true;
  const op=w.mods[j].op, L=w.p.MAXLEN*2, carries=c=>{ const o=c*L; for(let i=0;i<w.len[c];i++) if(w.prog[o+i*2]===op)return 1; return 0; };
  const b=[0,0], d=[0,0], n=[0,0]; const div=w.divide.bind(w), kill=w.kill.bind(w);
  w.divide=c=>{ const k=carries(c), ok=div(c); if(ok)b[k]++; return ok; };
  w.kill=(c,why)=>{ d[carries(c)]++; return kill(c,why); };
  for(let s=0;s<T;s++){ w.step(); if(s%20===0) for(let c=0;c<w.C;c++) if(w.alive[c])n[carries(c)]+=20; }   // organism-ticks, counted every 20 ticks
  const r=k=>n[k]>0?(b[k]-d[k])/n[k]:NaN; return {s:r(1)-r(0), share:n[1]/(n[0]+n[1]), births:b[1], deaths:d[1]}; }
const mean=x=>x.reduce((p,q)=>p+q,0)/x.length;
const welch=(a,b)=>{ const v=x=>{ const u=mean(x); return x.reduce((p,q)=>p+(q-u)*(q-u),0)/(x.length-1); }; return (mean(a)-mean(b))/Math.sqrt(v(a)/a.length+v(b)/b.length); };

// every module in the save (or those named in only), armed against disarmed: one row each
function fitness(save,{T=2000,REPS=4,only=null}={}){ const mods=World.load(save).mods||[], rows=[];
  for(let j=0;j<mods.length;j++){ if(only&&!only.has(mods[j].name))continue;
    const A=[...Array(REPS).keys()].map(r=>assay(save,j,true,r,T)), D=[...Array(REPS).keys()].map(r=>assay(save,j,false,r,T)), sa=A.map(x=>x.s), sd=D.map(x=>x.s);
    const verdict=Math.min(...sa)>Math.max(...sd)?'SELECTED':Math.max(...sa)<Math.min(...sd)?'AGAINST':'-';
    rows.push({name:mods[j].name,id:j,share:A[0].share,sa,sd,effect:mean(sa)-mean(sd),t:welch(sa,sd),births:A.reduce((p,x)=>p+x.births,0),verdict}); }
  return rows; }
const fmt=(r,f=x=>(x*1000).toFixed(2))=>`${r.name.padEnd(8)} carried ${(r.share*100).toFixed(1)}% | s armed ${r.sa.map(f).join(' ')} | disarmed ${r.sd.map(f).join(' ')} | effect ${f(r.effect)} t ${r.t.toFixed(1)} | carriers' births ${r.births} | ${r.verdict}`;
module.exports={fitness,fmt};

if(require.main===module){ const E=process.env, RUN=E.RUN||'pilot', RUNDIR=E.RUNDIR||path.join(__dirname,'loop',RUN), HEAVY=E.HEAVY||path.join(RUNDIR,'heavy');
  const T=+(E.T||2000), REPS=+(E.REPS||4), save=fs.readFileSync(E.SAVE||path.join(HEAVY,'G.json'),'utf8');
  console.log(`== fitness assay from tick ${World.load(save).tick}: ${T} ticks, ${REPS} draws per arm; s = carriers' growth advantage per 1,000 ticks`);
  for(const r of fitness(save,{T,REPS,only:E.ONLY?new Set(E.ONLY.split(',')):null})) console.log('  '+fmt(r)); }
