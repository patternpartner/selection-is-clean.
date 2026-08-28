// #141 acceptance test — a lineage that moves between hosts keeps its meaning.
//
// LEAP 25 gave migrants their sender's PROGRAM. But a program is not self-contained: opcodes at
// CORE_OPCODES+k call the sender's bound atoms and opcode 236 emits into the sender's verb slots,
// and neither bank travelled. So a migrant landed speaking its own sentences into somebody else's
// dictionary — the same re-aiming #137 fixed inside one genome, happening across tabs.
//
//   1. THE VOCABULARY TRAVELS, IN ORDER. Bound slot k at the destination denotes the same
//      computation it denoted at the source. This is the whole property; everything else is detail.
//   2. A MISSING SLOT KEEPS ITS PLACE. A tombstoned or absent atom travels as '' and lands as -1,
//      so every slot above it stays aligned instead of shifting up by one.
//   3. SENSE GATES SURVIVE THE HOP, and still point at the right atom (#139's ax is a bound-slot
//      index, and bound-slot order is exactly what this preserves).
//   4. THE WIRE IS VALIDATED. Garbage vocabulary is rejected by validNetworkPayload rather than
//      compiled — an expression string is not coerced into safety the way a bad opcode row is.
//   5. IT DOES NOT LAND ON THE RECEIVER. Installing the migrant's bank must touch only the migrant's
//      own genome, never the host's.
// Exits non-zero on any failure.   node migrant-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/mig.js'); m.filename='/tmp/mig.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  const out={};
  // (4) the wire first — before anything is trusted enough to be installed
  const good={nx:0.5,ny:0.5,tend:[0,0,0],mem:[],plasmid:[],amp:1,phase:0,
              ua:['c+1','','d*2'], ue:[{t:1,m:0,s:0.5,n:-1,a:2}]};
  out.acceptsGoodVocab = validNetworkPayload('migrant',good)===true;
  const tooMany={...good, ua:new Array(MIGRANT_VOCAB_MAX+1).fill('x')};
  const tooLong={...good, ua:['y'.repeat(161)]};
  const notString={...good, ua:[{evil:1}]};
  const badVerb={...good, ue:[{t:1,m:0,s:0.5,n:-1,a:'nope'}]};
  out.rejectsBadVocab = [tooMany,tooLong,notString,badVerb]
        .every(p=>validNetworkPayload('migrant',p)===false);

  // build a HOST bank that is deliberately different, so a wrong index cannot accidentally be right
  genome.userAtoms=[{expression:'HOST0',compiled:null,failed:false,uses:0,state:0},
                    {expression:'HOST1',compiled:null,failed:false,uses:0,state:0},
                    {expression:'HOST2',compiled:null,failed:false,uses:0,state:0}];
  genome.boundOpcodes=[0,1,2];
  genome.userEffects=[{t:7,m:0,s:0.9,nx:-1,ax:0,uses:0,creditTrace:0}];
  const hostAtomsBefore=genome.userAtoms.map(a=>a.expression);
  const hostBoundBefore=genome.boundOpcodes.slice();

  // land a migrant whose slot 1 is a tombstone — the alignment case
  const before=N;
  incomingMigrants.length=0;
  incomingMigrants.push({nx:0.5,ny:0.5,tend:[0.1,0.2,0.3],mem:[],plasmid:[],amp:1,phase:0,
    prog:[[CORE_OPCODES+2,0,0,0.5]],
    ua:['MIG0','','MIG2'],                                  // slot 1 deliberately empty
    ue:[{t:3,m:1,s:0.7,n:-1,a:2}]});                        // gate on bound slot 2 -> 'MIG2'
  genome.netRecvRate=1;
  networkReceive();
  let idx=-1; for(let k=before;k<N;k++) if(palive[k]&&pGenome[k]){idx=k;break;}
  if(idx<0)return {err:'migrant did not land'};
  const g=pGenome[idx];
  const slot=k=>{ const bi=(g.boundOpcodes||[])[k]; return (bi===undefined||bi<0)?null:
                  ((g.userAtoms||[])[bi]||{}).expression; };
  out.vocabularyTravelsInOrder = slot(0)==='MIG0' && slot(2)==='MIG2';
  out.missingSlotKeepsItsPlace = g.boundOpcodes[1]===-1 && slot(1)===null;
  const v=(g.userEffects||[])[0];
  out.senseGateSurvivesTheHop = !!v && (v.ax|0)===2 && slot(v.ax|0)==='MIG2' && v.t===3 && (v.m|0)===1;
  // (5) the host must be untouched
  out.hostBankUntouched = JSON.stringify(genome.userAtoms.map(a=>a.expression))===JSON.stringify(hostAtomsBefore)
                       && JSON.stringify(genome.boundOpcodes)===JSON.stringify(hostBoundBefore)
                       && genome.userEffects.length===1 && genome.userEffects[0].t===7;
  out.detail={landedAt:idx, slots:[slot(0),slot(1),slot(2)], bound:g.boundOpcodes.slice(),
              verbAx:v?(v.ax|0):null};
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'400',10));
if(r.err){ console.log('  SETUP FAILED: '+r.err); process.exit(1); }
const checks=[
  ['acceptsGoodVocab','a well-formed vocabulary is accepted on the wire'],
  ['rejectsBadVocab','oversized, overlong, non-string and bad-verb payloads are rejected'],
  ['vocabularyTravelsInOrder','bound slot k means the same computation at both ends'],
  ['missingSlotKeepsItsPlace','an absent atom lands as a tombstone, not a shift'],
  ['senseGateSurvivesTheHop','a #139 sense gate still points at its own atom after the hop'],
  ['hostBankUntouched','the host’s own bank is not disturbed by the arrival'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
console.log('\n  landed slots '+JSON.stringify(r.detail.slots)+'   bound '+JSON.stringify(r.detail.bound)
  +'   verb gate -> slot '+r.detail.verbAx);
console.log(bad? '\n'+bad+' FAILED' : '\na lineage can move between hosts and still mean what it meant');
process.exit(bad?1:0);
