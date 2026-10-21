// #318 acceptance test - attention selects the form (#314) only while someone is watching.
//   1. A world never watched: drift trials are never judged, nothing is undone, drawHist stays empty.
//   2. Watched: trials are judged (the baseline is set, later trials kept or undone).
//   3. Watched, then left open: every drift of the form while nobody is there is KEPT, and nothing is written
//      into drawHist. Before #318 each one was undone and logged 'u' against the last watched score.
//   4. The viewer returns: the first watched trial only sets a fresh baseline, as after a reload.
// Exits non-zero on any failure.   node draw-attn-test.js   (INDEX=<old engine> to see 3 fail before the fix)
const fs=require('fs'), path=require('path');
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/draw-attn-sim.js'); m.filename='/tmp/draw-attn-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(){
  const out={};
  for(let s=0;s<200;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const look=(on)=>{ if(on){ mx=W*0.5; my=H*0.5; smx=mx; smy=my; } else { mx=-9e3; my=-9e3; smx=-9e3; smy=-9e3; } };
  const tick=(n)=>{ for(let k=0;k<n;k++){ updateAttentionField(); __drawAttnTick(); } };
  const drift=()=>{ const d=genome.draw||(genome.draw=defaultDraw()); d.push([1,0,1,2]); if(d.length>6)d.splice(0,2); __drawTrialEnd(); };
  const histN=()=>(genome.drawHist||[]).length;
  const key=()=>JSON.stringify(genome.draw||[]);

  // (1) never watched
  look(false); const r0=__drawReverted, k0=__drawKept;
  for(let j=0;j<5;j++){ tick(500); drift(); }
  out.neverWatchedNoJudgement = __drawReverted===r0 && __drawKept===k0 && histN()===0;

  // (2) watched: two full 900-watched-tick proposals, then a third
  look(true); tick(3*900+10);
  out.watchedIsJudged = (__drawReverted+__drawKept) > (r0+k0) && histN()>0;
  out.baselineSet = __drawIncScore>0;

  // (3) left open: let the field decay, close out the trial running at departure, then drift while nobody is there
  look(false); tick(2000); drift();
  const rLeft=__drawReverted, hLeft=histN();
  let keptAll=true;
  for(let j=0;j<6;j++){ tick(3000); const before=key(); drift(); if(key()===before)keptAll=false; }
  out.unwatchedDriftNotUndone = __drawReverted===rLeft;
  out.unwatchedDriftKept = keptAll;
  out.unwatchedWritesNoHistory = histN()===hLeft;

  // (4) the viewer returns: the first watched trial sets a baseline and judges nothing
  look(true); const rB=__drawReverted, kB=__drawKept;
  tick(900); // ends the unwatched-then-watched trial at the first proposal
  out.returnStartsAfresh = __drawReverted===rB && __drawKept===kB;
  tick(2*900);
  out.returnJudgesAgain = (__drawReverted+__drawKept) > (rB+kB);
  out.counts={kept:__drawKept, reverted:__drawReverted, hist:histN()};
  return out;
};`, m.filename);

const r=globalThis.__t();
const checks=[
  ['neverWatchedNoJudgement','a world never watched judges nothing and writes no history'],
  ['watchedIsJudged','a watched world judges its trials'],
  ['baselineSet','the watched score becomes the one to beat'],
  ['unwatchedDriftNotUndone','left open, drift of the form is not undone'],
  ['unwatchedDriftKept','left open, each drift is the form that stays'],
  ['unwatchedWritesNoHistory','left open, nothing is written into drawHist'],
  ['returnStartsAfresh','on return, the first trial only sets a baseline'],
  ['returnJudgesAgain','on return, selection resumes'],
];
let fail=0;
for(const [k,msg] of checks){ const ok=r[k]===true; if(!ok)fail++; console.log((ok?'  ok   ':'  FAIL ')+msg); }
console.log('  '+JSON.stringify(r.counts));
console.log(fail?fail+' failing':'all '+checks.length+' ok');
process.exit(fail?1:0);
