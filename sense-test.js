// #139 acceptance test — a sense bound to an act.
// The point of the feature is that the two invention systems compose: an atom the creature wrote can
// decide whether a verb it wrote fires. The point of the TEST is that this cannot become the fifth
// instance of the bug that has bitten four times, so the crossing is checked as hard as the semantics.
//   1. UNGATED IS UNCHANGED. ax=-1 (and a verb from a save written before #139, which has no ax at
//      all) must behave EXACTLY as before — same realised amount, to the bit.
//   2. THE GATE IS REAL. An atom that says "no" withholds the act; one that says "yes" lets it
//      through nearly whole. Not decoration.
//   3. IT CAN ONLY WITHHOLD. The squash is (0,1), so a gated act can never exceed the ungated one.
//      This is what keeps the feature out of the energy accounting entirely.
//   4. FAILURE IS SILENT AND SAFE. A dangling slot, a #137 tombstone, an atom that throws — every one
//      returns the ungated amount rather than zero or NaN.
//   5. IT CROSSES BY EXPRESSION, NOT BY INDEX. Seeding a gated verb into a particle whose bank holds
//      the same expression at a DIFFERENT slot must land on that expression; a particle that does not
//      carry it must receive the verb ungated rather than wrongly gated.
// Exits non-zero on any failure.   node sense-test.js
const fs=require('fs'), path=require('path');
require(path.join(__dirname,'harness-env.js'))(globalThis);
const code=fs.readFileSync(process.env.INDEX||path.join(__dirname,'engine.html'),'utf8')
  .match(/<script>([\s\S]*)<\/script>/)[1];
const Module=require('module');
const m=new Module('/tmp/sense.js'); m.filename='/tmp/sense.js'; m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+`
;globalThis.__t=function(ticks){
  const out={};
  for(let s=0;s<ticks;s++){ globalThis.__detMs+=5; try{loop();}catch(e){} }
  let i=-1; for(let k=0;k<N;k++) if(palive[k]&&pGenome[k]){i=k;break;}
  if(i<0)return{err:'no live particle'};

  // Build a known bank on the CARRIER (execution reads genome, which we repoint exactly as the VM
  // callers do) so the test measures the real path rather than a convenient one.
  const G=pGenome[i]; const _save=genome; genome=G;
  G.userAtoms=[{expression:'-9',compiled:null,failed:false,uses:0,state:0},   // squash(-9) ~ 0.0001 : NO
               {expression:'9', compiled:null,failed:false,uses:0,state:0}];  // squash(9)  ~ 0.9999 : YES
  G.boundOpcodes=[0,1];
  const drive=(eff)=>{ amp[i]=1.0;
    const before=amp[i];
    for(let z=0;z<vmActions.length;z++)vmActions[z]=0;
    G.userEffects=[eff];
    vmActions[EFFECT_SLOT0+0]=1.0;
    applyUserEffects(i,-1,1.0);
    return +(amp[i]-before).toFixed(9); };

  const base ={t:0,m:0,s:1,nx:-1,ax:-1,uses:0,creditTrace:0};
  const legacy={t:0,m:0,s:1,nx:-1,uses:0,creditTrace:0};        // pre-#139 save: no ax field at all
  const noGate={t:0,m:0,s:1,nx:-1,ax:0,uses:0,creditTrace:0};   // -> atom '-9' -> withhold
  const yesGate={t:0,m:0,s:1,nx:-1,ax:1,uses:0,creditTrace:0};  // -> atom '9'  -> allow
  const dangling={t:0,m:0,s:1,nx:-1,ax:99,uses:0,creditTrace:0};// slot past the end
  const tomb={t:0,m:0,s:1,nx:-1,ax:2,uses:0,creditTrace:0};     // points at a #137 tombstone

  const dBase=drive(base), dLegacy=drive(legacy), dNo=drive(noGate), dYes=drive(yesGate);
  out.ungatedUnchanged   = dBase!==0 && dLegacy===dBase;
  out.gateWithholds      = Math.abs(dNo) < Math.abs(dBase)*0.01;
  out.gateAllows         = Math.abs(dYes) > Math.abs(dBase)*0.9;
  out.canOnlyWithhold    = Math.abs(dYes) <= Math.abs(dBase)+1e-12
                        && Math.abs(dNo)  <= Math.abs(dBase)+1e-12;
  G.boundOpcodes=[0,1,-1];                                       // add a tombstoned slot
  const dDangle=drive(dangling), dTomb=drive(tomb);
  out.failureIsUngated   = dDangle===dBase && dTomb===dBase;
  out.noNaN              = [dBase,dLegacy,dNo,dYes,dDangle,dTomb].every(x=>isFinite(x));
  out.detail={dBase,dNo,dYes,dDangle};

  // (5) THE CROSSING. Germline gate on expression 'X'; the receiving particle carries 'X' at a
  // different slot. Index-copying would land on the wrong atom; expression-matching lands right.
  genome=_save;
  genome.userAtoms=[{expression:'c+1',compiled:null,failed:false,uses:0,state:0},
                    {expression:'d*2',compiled:null,failed:false,uses:0,state:0}];
  genome.boundOpcodes=[0,1];
  genome.userEffects=[{t:0,m:0,s:1,nx:-1,ax:1,uses:0,creditTrace:0}];   // gate on 'd*2' (germline slot 1)
  let tgt=-1; for(let k=0;k<N;k++) if(palive[k]&&pGenome[k]&&k!==i){tgt=k;break;}
  const T=pGenome[tgt];
  T.userAtoms=[{expression:'zzz',compiled:null,failed:false,uses:0,state:0},
               {expression:'qqq',compiled:null,failed:false,uses:0,state:0},
               {expression:'d*2',compiled:null,failed:false,uses:0,state:0}];  // same expr, slot 2
  T.boundOpcodes=[0,1,2];
  T.userEffects=[];
  const remapped=remapEffectAx(genome.userEffects[0],T);
  out.crossesByExpression = remapped===2;                       // NOT 1, which is what copying gives
  // a particle that does not carry the expression must receive it ungated
  const T2={userAtoms:[{expression:'nope',compiled:null,failed:false,uses:0,state:0}],boundOpcodes:[0]};
  out.crossesUngatedWhenAbsent = remapEffectAx(genome.userEffects[0],T2)===-1;
  out.detail.remapped=remapped;
  return out;
};`, m.filename);

const r=globalThis.__t(parseInt(process.env.TICKS||'600',10));
if(r.err){ console.log('  SETUP FAILED: '+r.err); process.exit(1); }
const checks=[
  ['ungatedUnchanged','ax=-1 and a pre-#139 save behave exactly as before'],
  ['gateWithholds','an atom saying no withholds the act'],
  ['gateAllows','an atom saying yes lets it through'],
  ['canOnlyWithhold','a gate can never amplify — it is out of the energy accounting'],
  ['failureIsUngated','dangling slot and #137 tombstone fall back to ungated'],
  ['noNaN','no path produces NaN'],
  ['crossesByExpression','the gate crosses by expression, landing on the right atom'],
  ['crossesUngatedWhenAbsent','a particle lacking the expression receives the verb ungated'],
];
let bad=0;
for(const [k,d] of checks){ const ok=r[k]===true; if(!ok)bad++;
  console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
console.log('\n  ungated '+r.detail.dBase+'   gated-no '+r.detail.dNo
  +'   gated-yes '+r.detail.dYes+'   remapped slot '+r.detail.remapped);
console.log(bad? '\n'+bad+' FAILED' : '\na sense the creature wrote can decide whether an act it wrote fires');
process.exit(bad?1:0);
