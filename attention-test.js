// #135 acceptance test — attention as a physical law.
// Four properties, and the first is the one that protects everything already in the file:
//   1. UNOBSERVED == UNCHANGED. With no pointer, upkeep must sum to exactly N*METABOLIC_ENERGY_DRAW,
//      the flat charge it replaced. A world nobody looks at must be the world that existed before.
//   2. The field actually forms where the pointer rests, and decays when it leaves.
//   3. `at` binds in a compiled atom — the sense is readable by evolved code, not just by the engine.
//   4. The gradient is real: standing in attention costs measurably less than standing outside it.
// Exits non-zero on any failure.   node attention-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/attn-sim.js'); m.filename='/tmp/attn-sim.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  const out={};
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }

  // (1) UNOBSERVED == UNCHANGED. mx/my start at -9e3 and nothing has touched them.
  let sum=0,alive=0; for(let i=0;i<N;i++){ if(!palive[i])continue; sum+=attnUpkeep(i); alive++; }
  out.unobservedUpkeepExact = Math.abs(sum-(alive*METABOLIC_ENERGY_DRAW)) < 1e-12;
  out.unobservedPeak = attnPeak;

  // (2) the field forms under the pointer, and fades after it leaves
  mx=W*0.5; my=H*0.5; smx=mx; smy=my;
  for(let k=0;k<60;k++) updateAttentionField();
  const peakWatched = attnPeak;
  const atCentre = attnField[__cl(Math.floor((H*0.5)/(H/FIELD_H))*FIELD_W+Math.floor((W*0.5)/(W/FIELD_W)),0,FIELD_W*FIELD_H-1)];
  out.fieldForms = peakWatched>0.05 && atCentre>0.05;
  mx=-9e3; my=-9e3; smx=-9e3; smy=-9e3;
  for(let k=0;k<400;k++) updateAttentionField();
  out.fieldFades = attnPeak < peakWatched*0.5;

  // (3) 'at' binds in a compiled atom — an expression using it must evaluate, not fail
  const probe={expression:'at*2', compiled:null, failed:false, uses:0, state:0};
  uaCtxAt=0.7;
  const got=uaCall(probe,0,0);
  out.atBinds = !probe.failed && Math.abs(got-1.4)<1e-6;
  // and the grammar can actually emit it
  out.atInVocabulary = USER_VARS.indexOf('at')>=0 && UA_ALL_VARS.indexOf('at')>=0;
  // the var-swap regex must match 'at' as a whole token, not chop it into 'a'
  out.atSurvivesVarRegex = ('at+b'.match(UA_VAR_RE)||[]).indexOf('at')>=0;

  // (4) the gradient is real and points the right way
  mx=W*0.5; my=H*0.5; smx=mx; smy=my;
  for(let k=0;k<80;k++) updateAttentionField();
  let watched=-1, unwatched=-1;
  for(let i=0;i<N;i++){ if(!palive[i])continue;
    if(attentionAt(i)>0.2 && watched<0) watched=i;
    if(attentionAt(i)===0 && unwatched<0) unwatched=i; }
  if(watched>=0&&unwatched>=0){
    out.cheaperUnderAttention = attnUpkeep(watched) < attnUpkeep(unwatched);
    out.discount = +(1-attnUpkeep(watched)/attnUpkeep(unwatched)).toFixed(3);
  } else {
    // place two particles by hand if the population happened not to straddle the boundary
    const a=0,b=1; px[a]=W*0.5; py[a]=H*0.5; px[b]=W*0.02; py[b]=H*0.02;
    out.cheaperUnderAttention = attnUpkeep(a) < attnUpkeep(b);
    out.discount = +(1-attnUpkeep(a)/attnUpkeep(b)).toFixed(3);
  }
  out.livenessFired = (__liveness['attention.field']|0) > 0;
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'800',10));
const checks=[
  ['unobservedUpkeepExact','an unlooked-at world costs exactly what it always did'],
  ['fieldForms','attention accumulates where the pointer rests'],
  ['fieldFades','attention decays once the pointer leaves'],
  ['atBinds','`at` binds in a compiled atom'],
  ['atInVocabulary','the grammar can emit `at`'],
  ['atSurvivesVarRegex','`at` is one token to the var-swap regex, not an `a`'],
  ['cheaperUnderAttention','being looked at lowers the cost of living'],
  ['livenessFired','the census sees it happen'],
];
let bad=0;
for(const [k,desc] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(24)+desc); }
console.log('\n  attention discount where watched: '+(r.discount!==undefined?(r.discount*100).toFixed(1)+'%':'n/a')
  +'   unobserved peak: '+r.unobservedPeak);
console.log(bad? '\n'+bad+' FAILED' : '\nattention is a physical law, and an unwatched world is unchanged');
process.exit(bad?1:0);
