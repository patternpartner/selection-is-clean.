// #254 — THE LAB FIELD: #252's stage 2, the judge BETWEEN worlds. #253 gave each world a switchboard judged only by
// a survival floor, which keeps whatever does not shrink the population (#234). This runs K worlds side by side,
// each in its own process with its switchboard on, and every EPOCH ticks holds a tournament: worlds are paired at
// random and the one with the lower score ADOPTS the other's whole switchboard (a bundle - the combining #252 asks
// for), each switch then flipped with probability MUT. ARM=control runs the same worlds, epochs and scores with no
// adoption, so any difference is the tournament's.
//
// THE SCORE IS ONE MEASURE, AND THE NOVELTY CLOCK IS KEPT OUT OF IT. Score = mean effective number of lineages
// (1/sum p^2 over pLin) across the epoch, sampled every 250 ticks. The independent check - which the tournament
// never sees - is the novelty clock's arrival count (#247's grid: first 3 trait axes, BINS^3 cells over +/-RANGE,
// occupied at >= M members): new cells first occupied during the epoch. If the judged score rises and the clock
// does not, the field is gaming its score.
// Every measurement draws nothing from the engine; the tournament's own choices use its own PRNG.
//
//   ARM=tournament|control K=6 SEED0=80 TICKS=60000 EPOCH=10000 MUT=0.1 MECH_PACE=5 node harness-field.js
// Output: one JSON object - per epoch, per world {seed, score, arrivals, alive, board, adoptedFrom}; and at the end,
// the switch-by-switch share of worlds holding each mechanism on.
const path=require('path'), fs=require('fs'), cp=require('child_process');
const E=process.env;
if(process.argv[2]==='--world'){
  // ── one world, driven over IPC ──────────────────────────────────────────────────────────────────────────
  process.env.SWITCHBOARD='1';
  try{ require(path.join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
  require(path.join(__dirname,'harness-env.js'))(globalThis);
  const code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
  const Module=require('module');const m=new Module('/tmp/field-world.js');m.filename='/tmp/field-world.js';m.paths=Module._nodeModulePaths('/tmp');
  m._compile(code+`
;globalThis.__FW={
  step:function(){ globalThis.__detMs+=5; try{loop();return true;}catch(e){return false;} },
  census:function(BINS,RANGE,M){ const cnt=new Map(); let n=0; const cells=new Map(); const D=DIMS;
    const bin=v=>{let b=Math.floor((v+RANGE)/(2*RANGE)*BINS);return b<0?0:b>=BINS?BINS-1:b;};
    for(let i=0;i<N;i++){ if(!palive[i])continue; n++; cnt.set(pLin[i],(cnt.get(pLin[i])||0)+1);
      const k=(bin(tend[i*D])*BINS+bin(D>1?tend[i*D+1]:0))*BINS+bin(D>2?tend[i*D+2]:0); cells.set(k,(cells.get(k)||0)+1); }
    let s2=0; cnt.forEach(c=>{const p=c/(n||1);s2+=p*p;}); const occ=[]; cells.forEach((c,k)=>{ if(c>=M)occ.push(k); });
    return {n,effN:s2>0?1/s2:0,occ}; },
  board:function(){ return mechState().values; },
  setBoard:function(v){ if(__lawTrial&&__lawTrial.mech!==undefined)__lawTrial=null;   // an adopted bundle replaces a switch still on trial
    for(const n of MECH_DECLARED) if(v[n]===0||v[n]===1) mechSet(n,v[n]); },
  log:function(){ return __mechLog.slice(); }
};`,'/tmp/field-world.js');
  const FW=globalThis.__FW, BINS=+(E.BINS||10), RANGE=+(E.RANGE||1.5), M=+(E.M||3);
  const seen=new Set(); let errs=0;
  process.on('message',msg=>{
    if(msg.cmd==='epoch'){ let sum=0,k=0,arr=0,alive=0;
      for(let s=1;s<=msg.ticks;s++){ if(!FW.step())errs++;
        if(s%250===0){ const c=FW.census(BINS,RANGE,M); sum+=c.effN; k++; alive=c.n; for(const x of c.occ) if(!seen.has(x)){ seen.add(x); if(msg.count)arr++; } } }
      process.send({score:k?sum/k:0,arrivals:arr,alive,board:FW.board(),errs}); }
    else if(msg.cmd==='board') process.send({board:FW.board()});
    else if(msg.cmd==='set'){ FW.setBoard(msg.board); process.send({board:FW.board()}); }
    else if(msg.cmd==='log') process.send({log:FW.log()});
    else if(msg.cmd==='exit') process.exit(0);
  });
  process.send({ready:true});
  return;
}
// ── the coordinator ──────────────────────────────────────────────────────────────────────────────────────────
const ARM=E.ARM||'tournament', K=+(E.K||6), SEED0=+(E.SEED0||80), T=+(E.TICKS||60000), EPOCH=+(E.EPOCH||10000), MUT=+(E.MUT||0.1);
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=mulberry(0xF1E1D^SEED0);
const worlds=[];
for(let i=0;i<K;i++){ const seed=SEED0+i;
  const ch=cp.fork(__filename,['--world'],{env:Object.assign({},process.env,{SEED:String(seed)}),stdio:['ignore','ignore','inherit','ipc']});
  worlds.push({seed,ch}); }
const ask=(w,msg)=>new Promise(res=>{ w.ch.once('message',res); w.ch.send(msg); });
(async()=>{
  await Promise.all(worlds.map(w=>new Promise(r=>w.ch.once('message',r))));
  const epochs=[]; const nE=Math.floor(T/EPOCH);
  for(let e=0;e<nE;e++){
    const res=await Promise.all(worlds.map(w=>ask(w,{cmd:'epoch',ticks:EPOCH,count:e>0})));   // epoch 0 seeds the clock's "seen" set
    const rows=worlds.map((w,i)=>({seed:w.seed,score:+res[i].score.toFixed(2),arrivals:res[i].arrivals,alive:res[i].alive,board:res[i].board,errs:res[i].errs,adoptedFrom:null}));
    if(ARM==='tournament'&&e<nE-1){
      const idx=worlds.map((_,i)=>i); for(let i=idx.length-1;i>0;i--){ const j=(R()*(i+1))|0; [idx[i],idx[j]]=[idx[j],idx[i]]; }
      for(let p=0;p+1<idx.length;p+=2){ const a=idx[p], b=idx[p+1]; if(rows[a].score===rows[b].score)continue;
        const win=rows[a].score>rows[b].score?a:b, lose=win===a?b:a; const nb=Object.assign({},rows[win].board);
        for(const n in nb) if(R()<MUT) nb[n]=nb[n]?0:1;
        await ask(worlds[lose],{cmd:'set',board:nb}); rows[lose].adoptedFrom=worlds[win].seed; } }
    epochs.push({epoch:e,tick:(e+1)*EPOCH,worlds:rows});
    process.stderr.write('epoch '+e+' '+rows.map(r=>r.seed+':'+r.score+'/'+r.arrivals).join(' ')+'\n');
  }
  const last=epochs[epochs.length-1].worlds, share={};
  for(const n of Object.keys(last[0].board)) share[n]=+(last.filter(r=>r.board[n]===1).length/last.length).toFixed(2);
  const logs=await Promise.all(worlds.map(w=>ask(w,{cmd:'log'})));
  for(const w of worlds) w.ch.send({cmd:'exit'});
  console.log(JSON.stringify({arm:ARM,K,seed0:SEED0,ticks:T,epoch:EPOCH,mut:MUT,mechPace:E.MECH_PACE||'1',
    finalShareOn:share,epochs,mechLogs:logs.map((l,i)=>({seed:worlds[i].seed,log:l.log}))}));
})();
