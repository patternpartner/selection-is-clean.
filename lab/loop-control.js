// lab/loop-control.js - the controls for a generator-in-the-loop run (#292), built from its installed.json.
//   MODE=A  all at once: a fresh world from the same seed with every module installed armed at tick 0. If A does as well as G,
//           sequence and response did not matter; it is just a bigger menu.
//   MODE=S  same schedule, another history: a fresh world from seed SEED2 with each module installed armed at the tick it went
//           into G. If S uses the modules as G did, they were good physics in any such world, not a response to this one.
// Each launch advances as far as it can within MAXSEC seconds and exits; relaunch to continue. Logs and saves sit beside G's,
// as <MODE>.jsonl and <MODE>.json (A3.jsonl with NMOD=3), in the same sample format, so loop-analyse reads them with ARM=<MODE>.
//   RUN=pilot MODE=A [TO=<tick>] node lab/loop-control.js
'use strict';
const fs=require('fs'), path=require('path'); const {World}=require('./oee-core.js');
const E=process.env, RUN=E.RUN||'pilot', RUNDIR=E.RUNDIR||path.join(__dirname,'loop',RUN), HEAVY=E.HEAVY||path.join(RUNDIR,'heavy');
const MODE=E.MODE||'A', SEG=+(E.SEG||25000), MAXSEC=+(E.MAXSEC||1500), EVERY=1000, T0=Date.now();
const inst=JSON.parse(fs.readFileSync(path.join(RUNDIR,'installed.json'),'utf8')), mods=inst.installed.slice(0,+(E.NMOD||inst.installed.length));
const TAG=MODE+(E.NMOD?E.NMOD:'');   // NMOD=n: an interim control with only the first n modules, kept apart from the final one
const live=JSON.parse(fs.readFileSync(path.join(HEAVY,'state.json'),'utf8')), TO=+(E.TO||live.tick);
const seed=MODE==='S'?+(E.SEED2||inst.seed+1):inst.seed, at=x=>MODE==='A'?0:x.tick;
const save=path.join(HEAVY,TAG+'.json'), logf=path.join(HEAVY,TAG+'.jsonl');
const src=x=>fs.readFileSync(path.join(RUNDIR,'mods',x.file),'utf8');
const log=(...x)=>console.log(new Date().toISOString().slice(11,19),...x);

let w=fs.existsSync(save)?World.load(fs.readFileSync(save,'utf8')):new World(seed,inst.opts||{});
if(!fs.existsSync(save)&&fs.existsSync(logf))fs.unlinkSync(logf);   // a log without a save is from an abandoned start
const have=()=>(w.mods||[]).length;
if(MODE==='A'&&w.tick>0&&have()<mods.length)throw new Error(TAG+' was started with '+have()+' modules and the list now has '+mods.length+': A installs them all at tick 0, so start it again');
log(`${RUN} ${TAG}: seed ${seed}, at tick ${w.tick}, ${have()} of ${mods.length} modules in, running to ${TO}`);
while(w.tick<TO&&(Date.now()-T0)/1000<MAXSEC){
  while(have()<mods.length&&at(mods[have()])<=w.tick){ const x=mods[have()], m=w.installMod(src(x)); if(m.op!==x.op)throw new Error(x.name+' got op '+m.op+', in G it is '+x.op); log(`installed ${x.name} (op ${m.op}) at tick ${w.tick}`); }
  const next=have()<mods.length?Math.min(TO,at(mods[have()])):TO, n=Math.min(SEG,next-w.tick);
  const out=fs.openSync(logf,'a'); for(let s=0;s<n;s++){ w.step(); if(w.tick%EVERY===0)fs.writeSync(out,JSON.stringify(w.sample())+'\n'); } fs.closeSync(out);
  fs.writeFileSync(save+'.tmp',w.save()); fs.renameSync(save+'.tmp',save); log(`tick ${w.tick}`); }
console.log(w.tick>=TO?`${TAG} DONE at ${w.tick}`:`${TAG} paused at ${w.tick} of ${TO}`);
