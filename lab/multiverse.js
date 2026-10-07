// lab/multiverse.js - several oee-core worlds side by side, each with its own mind, the minds learning from one another's
// worlds (#294).
//   ARM=alone|pairs|ring|all SEEDS=2201,2202,2203,2204 TICKS=100000 OPTS='{"MIND":0.2}' [SYNC=50] [OUT=dir] node lab/multiverse.js
// Each world runs in its own worker thread. Every SYNC ticks every world stops. Each mind has recorded the examples its own
// world gave it since the last stop (the programs of dividing parents, or the changes that worked: whatever its data is), and
// is given as many again from abroad, split evenly between the worlds it hears:
//   alone  none (the minds of #293)
//   pairs  its partner only (worlds 1 and 2, 3 and 4, ...)
//   ring   its two neighbours (world i hears i-1 and i+1, round the ring)
//   all    every other world (a broadcast: everyone hears everyone)
// So a mind that hears anyone learns half from home and half from abroad, whatever the arm: the arms differ only in whom it
// hears. Foreign examples go through the same see() as home ones, before the next ticks, in world order, and are never passed
// on (a mind exports only what its own world showed it). Nothing but the worlds is ever data.
// Deterministic, and a chunked run equals an unchunked one (TICKS must be a multiple of SYNC and of 1000). Logs OUT/<arm>-<seed>
// .jsonl, one core sample per 1000 ticks, and saves OUT/<arm>-<seed>.json; when every save exists the run resumes from them.
'use strict';
const fs=require('fs'), path=require('path'), {Worker,isMainThread,parentPort,workerData}=require('worker_threads');

if(!isMainThread){ const {World}=require('./oee-core.js'), {seed,opts,load,log}=workerData;
  const w=load?World.load(fs.readFileSync(load,'utf8')):new World(seed,opts), m=w.mind;
  if(!m)throw new Error('multiverse: OPTS has no MIND');
  const see=m.see.bind(m); let home=[];   // what this world showed its mind since the last stop
  m.see=(prog,at)=>{ home.push([prog.map(x=>[x[0],x[1]]),at===undefined?-1:at]); see(prog,at); };
  if(load){ const L=fs.readFileSync(log,'utf8').split('\n').filter(x=>x), k=w.tick/1000;   // a killed chunk may have logged past its save
    if(L.length<k)throw new Error('multiverse: '+log+' has fewer lines than its save has ticks'); fs.writeFileSync(log,L.slice(0,k).map(x=>x+'\n').join('')); }
  else fs.writeFileSync(log,'');
  const t0=Date.now(), fd=fs.openSync(log,'a');
  parentPort.on('message',msg=>{
    for(const [p,at] of msg.inbox) see(p,at>=0?at:undefined);   // abroad, after home, before the next ticks
    if(msg.save){ fs.closeSync(fd); fs.writeFileSync(msg.save,w.save()); parentPort.postMessage({saved:true}); return; }
    home=[];
    for(let s=0;s<msg.n;s++){ w.step(); if(w.tick%1000===0){ const r=w.sample(); r.wallS=+((Date.now()-t0)/1000).toFixed(1); fs.writeSync(fd,JSON.stringify(r)+'\n'); } }
    parentPort.postMessage({home,tick:w.tick}); });
  return; }

// who each world hears
function sources(arm,i,n){ if(arm==='alone')return [];
  if(arm==='pairs'){ const j=i^1; return j<n?[j]:[]; }
  if(arm==='ring')return n<2?[]:n===2?[1-i]:[(i+n-1)%n,(i+1)%n];
  if(arm==='all')return [...Array(n).keys()].filter(j=>j!==i);
  throw new Error('multiverse: ARM '+arm); }
// as many foreign examples as the mind had from home, split evenly between its sources, evenly spaced through each source
function inbox(i,homeN,outs,src){ const box=[]; if(!src.length)return box;
  for(let k=0;k<src.length;k++){ const o=outs[src[k]], q=Math.round(homeN*(k+1)/src.length)-Math.round(homeN*k/src.length);
    if(o.length) for(let r=0;r<q;r++) box.push(o[Math.floor((r+0.5)*o.length/q)%o.length]); }
  return box; }
module.exports={sources,inbox};

if(require.main===module){ const E=process.env, ARM=E.ARM||'alone', SEEDS=(E.SEEDS||'2201,2202,2203,2204').split(',').map(Number);
  const T=+(E.TICKS||100000), SYNC=+(E.SYNC||50), OUT=E.OUT||path.join(__dirname,'mindrun','heavy'), opts=E.OPTS?JSON.parse(E.OPTS):{MIND:0.2};
  if(T%SYNC||T%1000)throw new Error('multiverse: TICKS must be a multiple of SYNC and of 1000');
  const n=SEEDS.length, f=SEEDS.map(s=>path.join(OUT,`${E.NAME||ARM}-${s}`)), resume=f.every(x=>fs.existsSync(x+'.json'));
  if(!resume&&f.some(x=>fs.existsSync(x+'.json')))throw new Error('multiverse: some worlds of this run have saves and some do not');
  const ws=SEEDS.map((seed,i)=>new Worker(__filename,{workerData:{seed,opts,load:resume?f[i]+'.json':null,log:f[i]+'.jsonl'}}));
  for(const x of ws)x.on('error',e=>{ console.error(e); process.exit(1); });
  const ask=(i,msg)=>new Promise(ok=>{ ws[i].once('message',ok); ws[i].postMessage(msg); });
  (async()=>{ let boxes=SEEDS.map(()=>[]); const src=SEEDS.map((_,i)=>sources(ARM,i,n));
    for(let t=0;t<T;t+=SYNC){ const rep=await Promise.all(ws.map((_,i)=>ask(i,{inbox:boxes[i],n:SYNC}))), outs=rep.map(r=>r.home);
      boxes=SEEDS.map((_,i)=>inbox(i,outs[i].length,outs,src[i]));
      if((t+SYNC)%100000===0)console.log(`${ARM} at tick ${rep[0].tick}`); }
    await Promise.all(ws.map((_,i)=>ask(i,{inbox:boxes[i],save:f[i]+'.json'})));
    for(const x of ws)await x.terminate(); console.log(`${ARM} ${SEEDS.join(',')} done`); })().catch(e=>{ console.error(e); process.exit(1); }); }
