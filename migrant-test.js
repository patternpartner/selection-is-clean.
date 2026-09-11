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
  // #196: the chemistry on the wire. Bounds are READ from the engine's own constants (#153).
  const goodChn={...good, chn:[['(a)*(0.9)',3,[[2,-1,0.5]],1,3,8,0.004],0,['(ka)-(kb)',1,null,0,1,40,0],0]};
  out.acceptsChemistry = validNetworkPayload('migrant',goodChn)===true;
  out.acceptsNoChemistry = validNetworkPayload('migrant',good)===true;   // a pre-#196 peer still lands
  out.rejectsBadChemistry = [
    {...good, chn:[['(a)*(0.9)',0,null,0,1,40,0]].concat(new Array(CHANNEL_MAX).fill(0))},  // too many rows
    {...good, chn:[['x'.repeat(UA_EXPR_MAX+1),0,null,0,1,40,0]]},                           // expression over budget
    {...good, chn:[[{evil:1},0,null,0,1,40,0]]},                                            // not a string
    {...good, chn:[['(a)',0,[[99,0,1]],0,1,40,0]]},                                         // tap off the end
    {...good, chn:[['(a)',0,null,0,999,40,0]]},                                             // cadence past the cap
    {...good, chn:[['(a)',0,null,0,1,40,5]]},                                               // infectiousness past the cap
    {...good, chn:'nope'},
  ].every(p=>validNetworkPayload('migrant',p)===false);

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
    ue:[{t:3,m:1,s:0.7,n:-1,a:2}],                          // gate on bound slot 2 -> 'MIG2'
    chn:[['(a)*(0.9)',3,[[2,-1,0.5]],1,3,8,0.004],0,['(ka)-(kb)',1,null,0,1,40,0],0]});   // #196: slots 1 and 3 deliberately empty
  // MAKE THE LANDING CERTAIN, and read the gate's name from the engine rather than restating it.
  // This line used to say genome.netRecvRate=1, and netRecvRate appears ZERO times in engine.html:
  // the gate networkReceive actually applies is "if(Math.random()>genome.netReceptivity)continue".
  // So the setup was a coin flip on whatever the germline's receptivity happened to be, and the
  // migrant landed by luck. On committed HEAD this rig's setup FAILS at TICKS=20, 30, 80, 100 and
  // 200 and passes at 40, 50 and 60; smoke.sh runs it at 40, which is why nobody saw it. Any commit
  // that shifts the RNG stream - every new mutation operator does - flips those, and the commit gets
  // the blame for a setup that was never deterministic. #153's rule, one level over: read the bound
  // from the engine, never restate it.
  genome.netReceptivity=1;
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
  // #196: the chemistry landed, IN SLOT ORDER, with an empty slot keeping its position - ka..kd are
  // bound by index, so a shifted chemistry is #141's stranger reading our dictionary one substrate
  // over. age and uses reset because both are facts about how long a rule has sat HERE, and the
  // LATTICE is not sent and could not be: it is the receiving universe's world state.
  const cb=g.channels||[];
  const cr=k=>(cb[k]&&typeof cb[k].expr==='string')?cb[k]:null;
  out.chemistryTravels = !!cr(0) && cr(0).expr==='(a)*(0.9)' && cr(0).wrap===1 && cr(0).cad===3 &&
                         chanRes(cr(0))===8 && Math.abs(chanRuleXfer(cr(0))-0.004)<1e-5 &&
                         Array.isArray(cr(0).st) && cr(0).st.length===1 && cr(0).st[0][0]===2;
  out.chemistrySlotOrder = !cr(1) && !!cr(2) && cr(2).expr==='(ka)-(kb)' && !cr(3);
  out.chemistryRecordResets = !!cr(0) && cr(0).age===0 && cr(0).uses===0;
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
  // #196 — THE FIFTH CROSSING, open from #188 until now. The payload carried atoms, verbs, operators
  // and the compiler stage and NO channel rule ever left a tab, while #188's own comment claimed "a
  // migrant arrives with a chemistry and an empty medium". Four swings of invented media that could
  // not cross a tab boundary, and no rig owned the question so nothing went red.
  ['acceptsChemistry','a well-formed chemistry is accepted on the wire'],
  ['acceptsNoChemistry','and a pre-#196 peer that sends none still lands'],
  ['rejectsBadChemistry','oversized, overlong, non-string, off-lattice and over-cap chemistries are rejected'],
  ['chemistryTravels','the medium lands as itself: form, manifold, timescale, grain, infectiousness'],
  ['chemistrySlotOrder','in slot order, an empty slot keeping its position'],
  ['chemistryRecordResets','with the record reset and the lattice left behind'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
console.log('\n  landed slots '+JSON.stringify(r.detail.slots)+'   bound '+JSON.stringify(r.detail.bound)
  +'   verb gate -> slot '+r.detail.verbAx);
console.log(bad? '\n'+bad+' FAILED' : '\na lineage can move between hosts and still mean what it meant');
process.exit(bad?1:0);
