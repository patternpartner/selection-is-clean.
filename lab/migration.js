// lab/migration.js - a ring of oee-core worlds that exchange whole ORGANISMS (the user's multi-tab idea, tested in the lean core).
//   MODE=none|ring|sham SEEDS=a,b,c,d TICKS=400000 MIG=0.01 NAME=arm OUT=dir [OPTS='{"NULLSHIFT":3}'] [SYNC=50] node lab/migration.js
// Each world runs in its own worker thread; every SYNC ticks the main thread collects emigrants and routes them.
//   none  no exchange (the control; the worlds are exactly four independent core-run worlds)
//   ring  an emigrant goes to one of its two neighbours round the ring, chosen at random, and arrives one round later
//   sham  an emigrant goes back to ITS OWN world, one round later, at a random empty cell: the same removal and reinsertion
//         and the same disturbance, with nothing exchanged (the control for "migration works by being disruptive")
// MIG is the fraction of a world's living that emigrates per 1,000 ticks (an accumulator, so it is exact on average).
// Who leaves, where it lands and where it goes come from a migration random stream of its own (seeded from the seeds), never
// from a world's stream: with MODE=none, or MIG=0, a world is byte-identical to a plain core-run world. An organism that finds
// no empty cell is lost (counted). The emigrant carries its program, shadow program, tag, template, generation and energy; its
// body energy leaves and returns with it, so migration moves energy and does not make any (checked in migration-test.js).
// Logs OUT/<NAME>-<seed>.jsonl, one core sample per 1,000 ticks, and OUT/<NAME>.mig.json (migrants sent, landed, lost).
'use strict';
const fs=require('fs'), path=require('path'), {Worker,isMainThread,parentPort,workerData}=require('worker_threads');
if(!isMainThread){ const {World}=require('./oee-core.js'), {seed,opts,log}=workerData; const w=new World(seed,opts); const fd=fs.openSync(log,'w'); const t0=Date.now();
  parentPort.on('message',msg=>{
    let landed=0,lost=0; for(const [rec,u] of msg.imm){ if(w.immigrate(rec,u))landed++; else lost++; }
    const out=[]; for(const u of msg.emigU){ const r=w.emigrate(u); if(r)out.push(r); }
    for(let s=0;s<msg.n;s++){ w.step(); if(w.tick%1000===0){ const r=w.sample(); r.wallS=+((Date.now()-t0)/1000).toFixed(1); fs.writeSync(fd,JSON.stringify(r)+'\n'); } }
    let N=0; for(let c=0;c<w.C;c++) if(w.alive[c])N++;
    parentPort.postMessage({N,emig:out,tick:w.tick,landed,lost}); });
  return; }
function mulberry32(a){ const f=function(){ f.s|=0; f.s=f.s+0x6D2B79F5|0; let t=Math.imul(f.s^f.s>>>15,1|f.s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; f.s=a|0; return f; }
module.exports={mulberry32};
if(require.main===module){ const E=process.env, MODE=E.MODE||'none', SEEDS=(E.SEEDS||'2301,2302,2303,2304').split(',').map(Number), T=+(E.TICKS||400000), SYNC=+(E.SYNC||50),
  MIG=+(E.MIG||0), OUT=E.OUT||path.join(__dirname,'migrun'), NAME=E.NAME||MODE, opts=E.OPTS?JSON.parse(E.OPTS):{}, n=SEEDS.length;
  if(T%1000||T%SYNC)throw new Error('migration: TICKS must be a multiple of 1000 and of SYNC'); if(!['none','ring','sham'].includes(MODE))throw new Error('migration: MODE '+MODE); if(MODE==='ring'&&n<3)throw new Error('migration: a ring needs 3 or more worlds');
  fs.mkdirSync(OUT,{recursive:true}); const rnd=mulberry32(SEEDS.reduce((a,s)=>Math.imul(a^s,16777619),2166136261)^0x6d696772);
  const ws=SEEDS.map((seed,i)=>new Worker(__filename,{workerData:{seed,opts,log:path.join(OUT,`${NAME}-${seed}.jsonl`)}}));
  for(const x of ws)x.on('error',e=>{ console.error(e); process.exit(1); });
  const ask=(i,msg)=>new Promise(ok=>{ ws[i].once('message',ok); ws[i].postMessage(msg); });
  (async()=>{ let inbox=SEEDS.map(()=>[]), Ns=SEEDS.map(()=>0), acc=SEEDS.map(()=>0); const stat={sent:0,landed:0,lost:0,perWorldOut:SEEDS.map(()=>0)};
    for(let t=0;t<T;t+=SYNC){
      const emigU=SEEDS.map((_,i)=>{ const us=[]; if(MODE!=='none'&&MIG>0){ acc[i]+=MIG*Ns[i]*SYNC/1000; const k=Math.floor(acc[i]); acc[i]-=k; for(let j=0;j<k;j++)us.push(rnd()); } return us; });
      const rep=await Promise.all(ws.map((_,i)=>ask(i,{imm:inbox[i],emigU:emigU[i],n:SYNC})));
      inbox=SEEDS.map(()=>[]);
      rep.forEach((r,i)=>{ Ns[i]=r.N; stat.landed+=r.landed; stat.lost+=r.lost; for(const rec of r.emig){ stat.sent++; stat.perWorldOut[i]++; const dest=MODE==='sham'?i:(rnd()<0.5?(i+1)%n:(i+n-1)%n); inbox[dest].push([rec,rnd()]); } });
      if((t+SYNC)%100000===0)console.log(`${NAME} at tick ${rep[0].tick}`); }
    for(const x of ws)await x.terminate(); fs.writeFileSync(path.join(OUT,`${NAME}.mig.json`),JSON.stringify({MODE,MIG,SEEDS,T,SYNC,opts,...stat,inTransit:inbox.reduce((a,b)=>a+b.length,0)})); console.log(`${NAME} done, ${stat.sent} sent`); })().catch(e=>{ console.error(e); process.exit(1); }); }
