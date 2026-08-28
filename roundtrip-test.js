// #139b acceptance test — what survives being saved and loaded back.
//
// This exists because of a bug I shipped and caught here: #139 added a sense gate (`ax`) to verbs and
// I wired it through birth, mutation, seeding, inheritance and sanitisation — but NOT through
// encodeGenome. Everything worked perfectly until you pressed save, and then the creature came back
// having quietly forgotten every sense it had bound to an act. Nothing errored. Nothing logged.
// It is the exact shape of the germline/population bug moved into the time dimension: structure that
// exists, works, and does not make a crossing.
//
// So: author a genome with every kind of self-made structure on it, round-trip it through the real
// encode/decode path, and assert each kind comes back. Every future structural field gets a line here.
// Exits non-zero on any failure.   node roundtrip-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/rt.js'); m.filename='/tmp/rt.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={};
  // Author one of everything, with values chosen so a lost field cannot masquerade as a default.
  genome.userAtoms=[{expression:'c+1',compiled:null,failed:false,uses:7,state:0},
                    {expression:'d*2',compiled:null,failed:false,uses:3,state:0}];
  genome.boundOpcodes=[1,-1,0];                       // includes a #137 tombstone in the middle
  genome.userEffects=[
    {t:3,m:1,s:0.75,nx:1,ax:2,uses:11,creditTrace:0}, // composed AND sense-gated
    {t:5,m:0,s:0.40,nx:-1,ax:-1,uses:2,creditTrace:0} // plain
  ];
  genome.effectSenseRate=0.42; genome.effectComposeRate=0.61;

  const before={
    atoms:genome.userAtoms.map(a=>a.expression),
    bound:genome.boundOpcodes.slice(),
    verbs:genome.userEffects.map(e=>[e.t,e.m,+e.s.toFixed(3),e.nx,e.ax]),
    senseRate:genome.effectSenseRate, composeRate:genome.effectComposeRate,
  };
  const blob=encodeGenome();
  out.encodes = typeof blob==='string' && blob.length>10;

  // wipe, then decode the blob back over the top
  genome.userAtoms=[]; genome.boundOpcodes=[]; genome.userEffects=[];
  genome.effectSenseRate=0; genome.effectComposeRate=0;
  out.decodes = decodeGenome(blob)===true;

  const after={
    atoms:(genome.userAtoms||[]).map(a=>a.expression),
    bound:(genome.boundOpcodes||[]).slice(),
    verbs:(genome.userEffects||[]).map(e=>[e.t,e.m,+(+e.s).toFixed(3),
      (e.nx===undefined?-1:e.nx|0),(e.ax===undefined||e.ax===null?-1:e.ax|0)]),
    senseRate:genome.effectSenseRate, composeRate:genome.effectComposeRate,
  };
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  out.atomsSurvive       = eq(before.atoms, after.atoms);
  out.boundSlotsSurvive  = eq(before.bound, after.bound);   // positions AND the -1 tombstone
  out.verbsSurvive       = eq(before.verbs.map(v=>v.slice(0,4)), after.verbs.map(v=>v.slice(0,4)));
  out.senseGatesSurvive  = eq(before.verbs.map(v=>v[4]),        after.verbs.map(v=>v[4]));
  out.structuralRatesSurvive = Math.abs(after.senseRate-before.senseRate)<1e-6
                            && Math.abs(after.composeRate-before.composeRate)<1e-6;
  out.detail={before:before.verbs, after:after.verbs, boundBefore:before.bound, boundAfter:after.bound};
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'400',10));
const checks=[
  ['encodes','the genome serialises'],
  ['decodes','and reads back'],
  ['atomsSurvive','self-written expressions survive the trip'],
  ['boundSlotsSurvive','bound-opcode positions survive, tombstones included'],
  ['verbsSurvive','verbs survive with target, mode, scale and successor'],
  ['senseGatesSurvive','sense gates survive — the field this test was written for'],
  ['structuralRatesSurvive','the genes governing composition and sensing survive'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
console.log('\n  verbs  before '+JSON.stringify(r.detail.before)+'\n         after  '+JSON.stringify(r.detail.after));
console.log('  bound  before '+JSON.stringify(r.detail.boundBefore)+'   after '+JSON.stringify(r.detail.boundAfter));
console.log(bad? '\n'+bad+' FAILED' : '\na saved creature comes back whole');
process.exit(bad?1:0);
