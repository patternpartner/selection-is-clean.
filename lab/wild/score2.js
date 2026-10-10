// lab/wild/score2.js - the WILD-MIND-2 deciding rule, exactly as lab/WILD-MIND-2.md pre-registers it. Committed with it.
//   node lab/wild/score2.js <dir> [seeds, default 3421,3422,3423]   (<dir> holds <ARM>.<seed>.<rep>.json + .done from run2.sh)
// Primary, per run: ET = program-layer persistent arrivals per 1,000 ticks (late half) MINUS the mean of the run's eight TREE
// shadows (the real family tree, the real births, deaths and changes replayed on random recipients: supply matched exactly).
'use strict';
const fs=require('fs'), path=require('path');
const D=process.argv[2]||'.', SEEDS=(process.argv[3]||'3421,3422,3423').split(',').map(Number), REPS=[0,1,2,3,4,5];
const ARMS=['KEEPER','SHAM','UNIFORM','LEARN','OFF'], STRICT=['SHAM','UNIFORM'], MEANS=['LEARN','OFF'];
const rd=(a,s,k)=>{ const f=path.join(D,a+'.'+s+'.'+k); try{ return fs.existsSync(f+'.done')?JSON.parse(fs.readFileSync(f+'.json','utf8')):null; }catch(e){ return null; } };
const ET=r=>+(r.layers.program.realPersistentPer1k-r.layers.program.familyTree.shadowPersistentPer1k.mean).toFixed(3);
const EM=r=>+(r.layers.program.realPersistentPer1k-r.layers.program.shadowPersistentPer1k.mean).toFixed(3);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length, f3=x=>x===null||x===undefined||isNaN(x)?'-':(+x).toFixed(3);
let pending=false, learned=0, guardFail=[]; const rows=[];
for(const s of SEEDS){
  const R={}; for(const a of ARMS) R[a]=REPS.map(k=>rd(a,s,k));
  if(Object.values(R).some(v=>v.some(x=>!x))){ console.log(s+': pending ('+ARMS.map(a=>a+' '+R[a].filter(Boolean).length+'/6').join(', ')+')'); pending=true; continue; }
  const e={}; for(const a of ARMS) e[a]=R[a].map(ET);
  const K=a=>R[a].map(r=>(r.mind&&r.mind.keeper)||{}), kk=K('KEEPER'), ks=K('SHAM');
  // executed: every KEEPER replicate wrote and labelled edits, and the keeper LEARNED: its mean prequential log loss is
  // under the base-rate log loss, and it scored the edits that were held above the edits that were lost
  const wrote=R.KEEPER.every(r=>r.mind&&r.mind.uses>0)&&kk.every(x=>x.labelled>0);
  const llK=mean(kk.map(x=>x.logLoss)), llB=mean(kk.map(x=>x.baseLogLoss)), sep=mean(kk.map(x=>x.predHeld-x.predLost));
  // added after the trial seed, before any deciding run: SHAM showed held-minus-lost separation with no information (time
  // trends do it), so the keeper's separation must also beat SHAM's on the same seed
  const sepS=mean(ks.map(x=>x.predHeld-x.predLost));
  // strengthened round (WILD-MIND-2.md, 'Strengthened keeper'): its log loss must also be under SHAM's
  const llS=mean(ks.map(x=>x.logLoss));
  const learn=wrote&&llK<llB&&llK<llS&&sep>0&&sep>sepS; if(learn)learned++;
  const offClear=R.OFF.every(r=>!r.extinctions&&r.aliveEnd>20), bad=R.KEEPER.filter(r=>r.loopErrors>0||(offClear&&(r.extinctions>0||r.aliveEnd<5)));
  if(bad.length)guardFail.push(s);
  const mK=mean(e.KEEPER), T=mK>0&&e.KEEPER.filter(x=>x>0).length>=4;
  const lostStrict=STRICT.filter(a=>!(mK>Math.max(...e[a]))), lostMean=MEANS.filter(a=>!(mK>mean(e[a]))), C=!lostStrict.length&&!lostMean.length;
  rows.push({s,learn,T,C});
  console.log(s+': keeper '+(learn?'LEARNED':'did not learn')+' (log loss '+f3(llK)+' v base '+f3(llB)+', held-minus-lost score '+f3(sep)+' v sham '+f3(sepS)+
    ') | sham log loss '+f3(mean(ks.map(x=>x.logLoss)))+' v '+f3(mean(ks.map(x=>x.baseLogLoss)))+' | held rate KEEPER '+f3(mean(kk.map(x=>x.heldRate)))+' SHAM '+f3(mean(ks.map(x=>x.heldRate))));
  for(const a of ARMS) console.log('   '+a.padEnd(7)+' ET '+JSON.stringify(e[a])+' mean '+f3(mean(e[a]))+' | E vs MIXED mean '+f3(mean(R[a].map(EM)))+
    ' | real '+JSON.stringify(R[a].map(r=>r.layers.program.realPersistentPer1k))+' | sel '+R[a].map(r=>((r.selection.layers.program||{}).verdict||'-').split(' ').pop()).join(',')+
    ' | traits '+R[a].map(r=>r.layers.traits.verdict.split(' ')[0]).join(',')+' | alive '+R[a].map(r=>r.aliveEnd).join(','));
  console.log('   twin (ET>0 in mean and on >=4 of 6): '+(T?'PASS':'fail')+' | controls (above every SHAM and UNIFORM replicate, above LEARN and OFF means): '+
    (C?'PASS':'fail ('+[...lostStrict.map(a=>a+' band'),...lostMean.map(a=>a+' mean')].join(', ')+')')+(bad.length?' | GUARD FAIL':'')); }
if(pending){ console.log('VERDICT: pending'); process.exit(0); }
const both=rows.filter(r=>r.learn&&r.T&&r.C).length, Tn=rows.filter(r=>r.learn&&r.T).length, Cn=rows.filter(r=>r.learn&&r.C).length;
const v= learned<2?'NO-GO: the keeper did not learn on 2 of 3 seeds (learned on '+learned+')'
  : guardFail.length?'NO-GO (guard failed on '+guardFail.join(',')+')'
  : both>=2?'GO: the keeper makes the world hold new programs beyond its exact-supply no-selection twin and beyond sham, uniform, learning and no mind, on '+both+' of 3 seeds'
  : Cn>=2&&Tn<2?'ABOVE THE ARMS, NOT THE TWIN - NO-GO'
  : Tn>=2&&Cn<2?'TWIN ONLY: the keeper is not shown to matter beyond its controls - NO-GO'
  : 'NO-GO';
console.log('keeper learned on '+learned+' | twin pass '+Tn+' | controls pass '+Cn+' | all three '+both+' (need 2 of 3)');
console.log('VERDICT: '+v);
