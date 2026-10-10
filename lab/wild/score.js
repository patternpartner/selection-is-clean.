// lab/wild/score.js - the wild-mind deciding rule, exactly as lab/WILD-MIND.md pre-registers it. Committed with it.
//   node lab/wild/score.js <dir> [seeds, default 3411,3412,3413]     (<dir> holds <ARM>.<seed>.<rep>.json + .done from run.sh)
// Primary, per run: E = program-layer persistent arrivals per 1,000 ticks in the late half, MINUS the mean of the run's own
// eight MIXED neutral shadows (harness-sweep.js; the shadows get the run's real births, deaths and introductions, so E nets
// out how much new material an arm supplies, and E>0 means new programs were held beyond what drift holds on the same supply).
'use strict';
const fs=require('fs'), path=require('path');
const D=process.argv[2]||'.', SEEDS=(process.argv[3]||'3411,3412,3413').split(',').map(Number), REPS=[0,1,2,3], CTRL=['OFF','LEARN','UNIFORM'];
const rd=(a,s,k)=>{ const f=path.join(D,a+'.'+s+'.'+k); try{ return fs.existsSync(f+'.done')?JSON.parse(fs.readFileSync(f+'.json','utf8')):null; }catch(e){ return null; } };
const E=r=>+(r.layers.program.realPersistentPer1k-r.layers.program.shadowPersistentPer1k.mean).toFixed(3);
// E against the TREE null too (the real family tree, the real events replayed on random recipients: supply matched exactly).
// Added after the trial seed, before any deciding run: see WILD-MIND.md, 'Change before the deciding round'.
const ET=r=>+(r.layers.program.realPersistentPer1k-r.layers.program.familyTree.shadowPersistentPer1k.mean).toFixed(3);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length, f3=x=>x===null||x===undefined?'-':(+x).toFixed(3);
let counted=0, pass=0, guardFail=[], pending=false; const rows=[];
for(const s of SEEDS){
  const R={}; for(const a of ['SURPRISE',...CTRL]) R[a]=REPS.map(k=>rd(a,s,k));
  if(Object.values(R).some(v=>v.some(x=>!x))){ console.log(s+': pending ('+Object.entries(R).map(([a,v])=>a+' '+v.filter(Boolean).length+'/4').join(', ')+')'); pending=true; continue; }
  const e={}; for(const a in R) e[a]=R[a].map(E);
  // executed first: every SURPRISE replicate wrote children, and wrote wilder than LEARN (mean surprisal of what it wrote, under its own model)
  const sS=mean(R.SURPRISE.map(r=>r.mind?r.mind.surprisal:0)), sL=mean(R.LEARN.map(r=>r.mind?r.mind.surprisal:0));
  const ran=R.SURPRISE.every(r=>r.mind&&r.mind.uses>0)&&sS>sL;
  // guard: no loop errors; no SURPRISE replicate extinct or crashed where every OFF replicate was clear
  const offClear=R.OFF.every(r=>!r.extinctions&&r.aliveEnd>20), bad=R.SURPRISE.filter(r=>r.loopErrors>0||(offClear&&(r.extinctions>0||r.aliveEnd<5)));
  if(bad.length)guardFail.push(s);
  const mS=mean(e.SURPRISE), mT=mean(R.SURPRISE.map(ET)), T=mS>0&&e.SURPRISE.filter(x=>x>0).length>=3&&mT>0;
  const C=CTRL.every(a=>mS>Math.max(...e[a])), lost=CTRL.filter(a=>!(mS>Math.max(...e[a])));
  if(ran)counted++; if(ran&&T&&C)pass++;
  rows.push({s,ran,T,C});
  console.log(s+': '+(ran?'counted':'NOT counted')+' | surprisal SURPRISE '+f3(sS)+' v LEARN '+f3(sL)+' nats');
  for(const a of ['SURPRISE',...CTRL]) console.log('   '+a.padEnd(8)+' E '+JSON.stringify(e[a])+' mean '+f3(mean(e[a]))+
    ' | real '+JSON.stringify(R[a].map(r=>r.layers.program.realPersistentPer1k))+' intro/1k '+JSON.stringify(R[a].map(r=>r.layers.program.introductionsPer1kLate))+
    ' | TREE '+R[a].map(r=>r.layers.program.familyTree.verdict.split(' ')[0]).join(',')+' | sel '+R[a].map(r=>(r.selection.layers.program||{}).verdict||'-').map(v=>v.split(' ').pop()).join(',')+
    ' | traits '+R[a].map(r=>r.layers.traits.verdict.split(' ')[0]).join(',')+' | alive '+R[a].map(r=>r.aliveEnd).join(','));
  console.log('   SURPRISE E vs TREE '+JSON.stringify(R.SURPRISE.map(ET))+' mean '+f3(mT));
  console.log('   twin (E>0 in mean and on >=3 of 4, and E vs TREE >0 in mean): '+(T?'PASS':'fail')+' | controls (mean E above every replicate of OFF, LEARN, UNIFORM): '+(C?'PASS':'fail, not above '+lost.join(', '))+(bad.length?' | GUARD FAIL':'')); }
if(pending){ console.log('VERDICT: pending'); process.exit(0); }
const Tn=rows.filter(r=>r.ran&&r.T).length, Cn=rows.filter(r=>r.ran&&r.C).length;
const v= counted<3?'INCONCLUSIVE ('+counted+' of 3 seeds counted)'
  : guardFail.length?'NO-GO (guard failed on '+guardFail.join(',')+')'
  : pass>=2?'GO: the surprise mind holds new programs beyond its no-selection twin AND beyond the mind-off, learning and uniform bands, on '+pass+' of 3 seeds'
  : Cn>=2&&Tn<2?'WILDER, NOT SELECTED: above the other arms but not beyond its own no-selection twin - NO-GO'
  : Tn>=2&&Cn<2?'TWIN ONLY: beyond drift but not beyond the other arms (the model is not shown to matter) - NO-GO'
  : 'NO-GO';
console.log('counted '+counted+' | twin pass '+Tn+' | controls pass '+Cn+' | both '+pass+' (need 2 of 3)');
console.log('VERDICT: '+v);
