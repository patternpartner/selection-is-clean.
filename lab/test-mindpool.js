// lab/test-mindpool.js - minds that are born, grow and die (#295) in a real world: births happen, every organism's mind is
// a living one, the census agrees with the world, and a run resumes exactly from a save.   node lab/test-mindpool.js
'use strict';
const {World}=require('./oee-core.js'), crypto=require('crypto'); let fails=0; const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if(!c)fails++; };
const md5=s=>crypto.createHash('md5').update(s).digest('hex').slice(0,12);
const o={MIND:0.2,MIND_POOL:8,MIND_BIRTH:0.01,MIND_MATURE:500,MIND_GROW:8};
const w=new World(2201,o); for(let t=0;t<4000;t++)w.step(); const r=w.sample().pool;
console.log('  ',JSON.stringify(r));
ok(r.births>8,'minds are born ('+r.births+' births)');
ok(r.deaths+r.retired>0&&r.alive>0,'minds die and others live ('+r.deaths+' died, '+r.retired+' replaced, '+r.alive+' alive)');
let bad=0; const cnt=new Map(); for(let c=0;c<w.C;c++){ const id=w.mindId[c]; if(!w.alive[c]&&id)bad++; if(w.alive[c]&&id){ if(!w.pool[id-1])bad++; cnt.set(id,(cnt.get(id)||0)+1); } }
ok(bad===0,'every organism that carries a mind carries a living one, and the dead carry none ('+bad+' wrong)');
w.mindCensus(); ok(w.pool.every((e,k)=>!e||e.n===(cnt.get(k+1)||0)),'the census counts each mind\'s carriers as the world holds them');
ok(r.maxGen>=1&&w.pool.some(e=>e&&e.m.sNOVEL!==undefined),'child minds carry shadows of their settings');
const sv=w.save(), a=World.load(sv); for(let t=0;t<1500;t++){ w.step(); a.step(); }
ok(md5(w.save())===md5(a.save()),'a run resumed from a save is the same run');
const p=new World(2201,{MIND:0.2}), q=new World(2201,{MIND:0.2,MIND_POOL:8,MIND_BIRTH:0}); for(let t=0;t<1500;t++){ p.step(); q.step(); }
ok(p.sample().N===q.sample().N&&p.mind.uses===q.mind.uses,'with no births the pool changes nothing the AI does');
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
