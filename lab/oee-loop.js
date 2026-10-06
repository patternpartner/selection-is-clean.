// lab/oee-loop.js - THE GENERATOR IN THE LOOP (#292): one world that never restarts, whose physics is extended while it runs.
// Two arms advance together from the same seed:
//   G  the world itself: every ADD_EVERY ticks it pauses, writes a report on what its organisms are doing, and waits for a
//      generator (a person, or an AI such as the one that wrote this) to put one module into mods/. The module is installed
//      armed and the world carries on from exactly where it stopped.
//   I  the inert twin: the same modules installed at the same ticks, DISARMED - the opcode exists, is copied and mutated and
//      costs its instruction, but does nothing. Whatever G does that I does not is the modules' doing, not the opcodes'.
// Rules for the generator are in lab/loop/PROTOCOL.md. Each invocation advances as far as it can within MAXSEC seconds and
// exits; it can be relaunched at any time (all state is in files) and it never redoes a finished segment.
//   RUN=pilot SEED=1001 node lab/oee-loop.js            (RUNDIR lab/loop/<RUN>: state, reports, modules; HEAVY: saves and logs)
'use strict';
const fs=require('fs'), path=require('path');
const {World,OPS,NOPS}=require('./oee-core.js'); const {fitness}=require('./loop-fitness.js');
const E=process.env, RUN=E.RUN||'pilot', RUNDIR=E.RUNDIR||path.join(__dirname,'loop',RUN), HEAVY=E.HEAVY||path.join(RUNDIR,'heavy');
const SEG=+(E.SEG||25000), ADD_EVERY=+(E.ADD_EVERY||100000), MAXSEC=+(E.MAXSEC||1500), EVERY=1000, T0=Date.now(), ASSAY=+(E.ASSAY||0);   // ASSAY=1: every report carries the fitness assay of every module (lab/loop-fitness.js)
fs.mkdirSync(path.join(RUNDIR,'mods'),{recursive:true}); fs.mkdirSync(HEAVY,{recursive:true});
const SF=path.join(HEAVY,'state.json');   // live state changes every segment, so it sits with the saves; installed.json (committed) changes only when a module goes in
if(!fs.existsSync(SF)&&fs.existsSync(path.join(RUNDIR,'state.json')))fs.renameSync(path.join(RUNDIR,'state.json'),SF);
let st=fs.existsSync(SF)?JSON.parse(fs.readFileSync(SF,'utf8')):{seed:+(E.SEED||1001),opts:E.OPTS?JSON.parse(E.OPTS):{},tick:0,nextAdd:ADD_EVERY,k:1,installed:[],seg:SEG,addEvery:ADD_EVERY};
const saveState=()=>fs.writeFileSync(SF,JSON.stringify(st,null,1));
const arm=a=>({save:path.join(HEAVY,a+'.json'),log:path.join(HEAVY,a+'.jsonl')});
const world=a=>{ const f=arm(a).save; return fs.existsSync(f)?World.load(fs.readFileSync(f,'utf8')):new World(st.seed,st.opts); };
const log=(...x)=>console.log(new Date().toISOString().slice(11,19),...x);

function advance(a,ticks){ const w=world(a); if(w.tick!==st.tick)throw new Error(a+' is at '+w.tick+', state says '+st.tick);
  const out=fs.openSync(arm(a).log,'a'); for(let s=0;s<ticks;s++){ w.step(); if(w.tick%EVERY===0)fs.writeSync(out,JSON.stringify(w.sample())+'\n'); } fs.closeSync(out);
  fs.writeFileSync(arm(a).save+'.tmp',w.save()); fs.renameSync(arm(a).save+'.tmp',arm(a).save); return w; }

function opName(op,w){ if(op<NOPS)return OPS[op]; const m=w.modByOp&&w.modByOp[op]; return m?m.name:'op'+op; }
function decode(hex,w){ const out=[]; for(let i=0;i<hex.length;i+=4){ const op=parseInt(hex.slice(i,i+2),16), arg=parseInt(hex.slice(i+2,i+4),16); if(op===0||(op>=24&&op<NOPS))continue; out.push(opName(op,w)+'('+arg+')'); } return out.join(' '); }

// the report the generator reads before writing module k: what G's organisms live on, what they run, what lies unused
function report(k){ const w=world('G'), wi=world('I'); const rows=fs.readFileSync(arm('G').log,'utf8').trim().split('\n').map(l=>JSON.parse(l));
  const irows=fs.readFileSync(arm('I').log,'utf8').trim().split('\n').map(l=>JSON.parse(l)); const last=rows.slice(-Math.min(rows.length,ADD_EVERY/EVERY)), r=rows.at(-1), ri=irows.at(-1);
  const avg=f=>last.reduce((a,x)=>a+(f(x)||0),0)/last.length;
  const reps=new Map(); for(const x of rows) for(const [h,v] of Object.entries(x.fnNew||{})) if(!reps.has(+h))reps.set(+h,v.split('|')[0]);
  const L=[];
  L.push(`# Report ${k}: world ${RUN} (seed ${st.seed}) at tick ${w.tick}`,'',`Write module ${k} into \`mods/${k}-<name>.js\` following \`lab/loop/PROTOCOL.md\`. The world resumes the moment it appears.`,'');
  L.push('## The population',`- alive ${r.N} (inert twin ${ri.N}); mean program length ${r.meanLen} (twin ${ri.meanLen}); mean generation ${r.meanGen}`,`- distinct functional programs ${r.fnGenoN}; the commonest holds ${r.fnGeno&&r.fnGeno[0]?(r.fnGeno[0][1]/r.N*100).toFixed(1):0}%`,'');
  L.push(`## Income, mean per 1,000 ticks over the last ${last.length*EVERY} ticks`,`- light eaten ${avg(x=>x.ev.eatLight).toFixed(1)} | corpses eaten ${avg(x=>x.ev.eatCorpse).toFixed(1)} | taken by attack ${avg(x=>x.ev.attackTake*w.p.ATT_EFF).toFixed(1)} (${avg(x=>x.ev.killed).toFixed(1)} kills)`);
  if(w.mods) for(const m of w.mods){ const s=x=>x.mods&&x.mods.list.find(y=>y.id===m.id); L.push(`- module ${m.name} (op ${m.op}, since tick ${m.at}): income ${avg(x=>s(x)&&s(x).inc).toFixed(2)}, energy put in ${avg(x=>s(x)&&s(x).out).toFixed(2)}, executions ${avg(x=>s(x)&&s(x).execs).toFixed(0)}, carried by ${(avg(x=>s(x)&&s(x).carriers)*100).toFixed(1)}% now ${s(r)?(s(r).carriers*100).toFixed(1):0}%, energy held in its fields ${s(r)?s(r).fieldEnergy:0}`); }
  L.push('',`## Energy lying in the world now`,`- light ${r.energy.light}, corpses ${r.energy.corpses}, in organisms ${r.energy.stores}`,'');
  L.push('## The commonest programs now (functional: neutral markers dropped), share of the living');
  for(const [h,n] of (r.fnGeno||[]).slice(0,8)) L.push(`- ${(n/r.N*100).toFixed(1)}%: ${reps.has(h)?decode(reps.get(h),w):'(no representative written)'}`);
  L.push('','## Instructions carried, share of the living');
  L.push('- '+r.opShare.map((v,q)=>[q,v]).filter(([q,v])=>v>=0.05&&q>0&&q<24).sort((a,b)=>b[1]-a[1]).map(([q,v])=>OPS[q]+' '+(v*100).toFixed(0)+'%').join(', '));
  const af=path.join(RUNDIR,`assay-${k}.json`);
  if(ASSAY&&w.mods&&w.mods.length){ if(!fs.existsSync(af)){ const t0=Date.now(), rows=fitness(fs.readFileSync(arm('G').save,'utf8'),{T:2000,REPS:4}); fs.writeFileSync(af,JSON.stringify({tick:w.tick,T:2000,REPS:4,rows},null,1)); log(`assay for report ${k}: ${((Date.now()-t0)/1000).toFixed(0)} s`); }
    const A=JSON.parse(fs.readFileSync(af,'utf8')); L.push('','## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)',
      '- s is the carriers\' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.');
    for(const r of A.rows) L.push(`- ${r.name}: carried ${(r.share*100).toFixed(1)}%, effect ${(r.effect*1000).toFixed(2)} (t ${r.t.toFixed(1)}), carriers' births ${r.births}: ${r.verdict==='-'?'not told from zero':r.verdict}`); }
  L.push('','## Modules so far'); if(!st.installed.length)L.push('- none'); for(const x of st.installed)L.push(`- ${x.k}: ${x.name} at tick ${x.tick} (${x.file})`);
  fs.writeFileSync(path.join(RUNDIR,`report-${k}.md`),L.join('\n')+'\n'); }

function validate(src){ const w=world('G'); w.installMod(src); for(let s=0;s<2000;s++)w.step(); const r=w.sample(); return r.N; }   // a throwaway copy: the module must run 2,000 ticks without error

let ran=0;
while((Date.now()-T0)/1000<MAXSEC){
  if(st.tick===st.nextAdd){ const k=st.k, pre=k+'-', f=fs.readdirSync(path.join(RUNDIR,'mods')).filter(x=>x.startsWith(pre)&&x.endsWith('.js')).sort()[0];
    if(!f){ if(!fs.existsSync(path.join(RUNDIR,`report-${k}.md`))){ report(k); log(`wrote report-${k}.md`); } console.log(`WAITING for module ${k}: write ${path.join(RUNDIR,'mods',k+'-<name>.js')}`); saveState(); process.exit(0); }
    const src=fs.readFileSync(path.join(RUNDIR,'mods',f),'utf8'); const n=validate(src); log(`module ${k} (${f}) ran 2,000 ticks on a copy, ${n} alive`);
    for(const a of ['G','I']){ const w=world(a); const m=w.installMod(src,{disarmed:a==='I'}); fs.writeFileSync(arm(a).save,w.save()); if(a==='G')st.installed.push({k,file:f,name:m.name,op:m.op,tick:st.tick}); }
    st.k++; st.nextAdd+=ADD_EVERY; saveState(); fs.writeFileSync(path.join(RUNDIR,'installed.json'),JSON.stringify({seed:st.seed,opts:st.opts,addEvery:st.addEvery,installed:st.installed},null,1)); continue; }
  const n=Math.min(SEG,st.nextAdd-st.tick); for(const a of ['G','I'])advance(a,n); st.tick+=n; saveState(); ran+=n; log(`tick ${st.tick} (next module due at ${st.nextAdd})`); }
console.log(`time budget used: advanced ${ran} ticks this launch, now at ${st.tick}`);
