// lab/wild/score3.js - the WILD-MIND-3 deciding rule, exactly as lab/WILD-MIND-3.md pre-registers it. Committed with it.
//   node lab/wild/score3.js <dir> [seeds, default 3541,3542,3543] [reps, default 0..5]
// Primary, per run: S = income-only sticky novelty (lab/used-novelty.js, #291) over the run's INCOME_OUT rows: a program
// (operation sequence) is USED in a window of WIN=10 samples (1,000 ticks) when its mean share of the creatures' gross intake
// is at least MIN=1%; new(w) = used in w and never before; st(w) = how many of new(w) are still used in w+LAG (LAG=2);
// S = mean st over the late third. Carrier share is never read.
'use strict';
const fs=require('fs'), path=require('path'), U=require(path.join(__dirname,'..','used-novelty.js'));
const D=process.argv[2]||'.', SEEDS=(process.argv[3]||'3541,3542,3543').split(',').map(Number), REPS=(process.argv[4]||'0,1,2,3,4,5').split(',').map(Number);
const ARMS=(process.env.ARMS||'EARNER TWIN ESHAM UNIFORM LEARN OFF').split(' '), STRICT=['ESHAM','UNIFORM'], MEANS=['LEARN','OFF'];
const WIN=10, MIN=0.01, LAG=2, REL=1.10;
const rd=(a,s,k)=>{ const f=path.join(D,a+'.'+s+'.'+k); try{ if(!fs.existsSync(f+'.done'))return null; const r=JSON.parse(fs.readFileSync(f+'.json','utf8'));
  r.S=U.S(U.readRows(f+'.jsonl'),{WIN,MIN,LAG}).late; return r; }catch(e){ return null; } };
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length, f3=x=>x===null||x===undefined||isNaN(x)?'-':(+x).toFixed(3);
let pending=false, learned=0, guardFail=[]; const rows=[], sE=[], sT=[];
for(const s of SEEDS){
  const R={}; for(const a of ARMS) R[a]=REPS.map(k=>rd(a,s,k));
  if(Object.values(R).some(v=>v.some(x=>!x))){ console.log(s+': pending ('+ARMS.map(a=>a+' '+R[a].filter(Boolean).length+'/'+REPS.length).join(', ')+')'); pending=true; continue; }
  const S={}; for(const a of ARMS) S[a]=R[a].map(r=>r.S);
  const J=a=>R[a].map(r=>(r.mind&&r.mind.earner)||{}), je=J('EARNER'), js=R.ESHAM?J('ESHAM'):null;
  // LEARNING: every EARNER replicate wrote and labelled edits; its mean prequential log loss is under the base-rate log loss AND
  // under ESHAM's; and it scored income-bearing novel children above the rest by more than ESHAM did (and by more than 0)
  const wrote=R.EARNER.every(r=>r.mind&&r.mind.uses>0)&&je.every(x=>x.labelled>0);
  const llE=mean(je.map(x=>x.logLoss)), llB=mean(je.map(x=>x.baseLogLoss)), sep=mean(je.map(x=>x.predPos-x.predNeg));
  const llS=js?mean(js.map(x=>x.logLoss)):NaN, sepS=js?mean(js.map(x=>x.predPos-x.predNeg)):NaN;
  const learn=wrote&&llE<llB&&llE<llS&&sep>0&&sep>sepS; if(learn)learned++;
  const offClear=R.OFF?R.OFF.every(r=>!r.extinctions&&r.aliveEnd>20):true, bad=R.EARNER.filter(r=>r.loopErrors>0||(offClear&&(r.extinctions>0||r.aliveEnd<5)));
  if(bad.length)guardFail.push(s);
  const mE=mean(S.EARNER);
  // TWIN: beat the program-fecundity-blind twin OUTRIGHT: in the mean, and paired replicate by replicate on at least 4 of 6
  const T=R.TWIN?(mE>mean(S.TWIN)&&S.EARNER.filter((x,k)=>x>S.TWIN[k]).length>=4):false;
  if(R.TWIN){ sE.push(mE); sT.push(mean(S.TWIN)); }
  const lostStrict=STRICT.filter(a=>R[a]&&!(mE>Math.max(...S[a]))), lostMean=MEANS.filter(a=>R[a]&&!(mE>mean(S[a]))), C=!lostStrict.length&&!lostMean.length;
  rows.push({s,learn,T,C});
  console.log(s+': earner '+(learn?'LEARNED':'did not learn')+' (log loss '+f3(llE)+' v base '+f3(llB)+' v esham '+f3(llS)+', pos-minus-neg score '+f3(sep)+' v esham '+f3(sepS)+
    ') | positive rate EARNER '+f3(mean(je.map(x=>x.posRate)))+(js?' ESHAM '+f3(mean(js.map(x=>x.posRate))):'')+' | novel-child rate EARNER '+f3(mean(je.map(x=>x.novRate))));
  for(const a of ARMS) console.log('   '+a.padEnd(7)+' S '+JSON.stringify(S[a].map(x=>+x.toFixed(3)))+' mean '+f3(mean(S[a]))+' | alive '+R[a].map(r=>r.aliveEnd).join(',')+
    ' | real prog/1k '+R[a].map(r=>r.layers.program.realPersistentPer1k).join(','));
  console.log('   twin (mean, and paired >=4 of 6): '+(T?'PASS':'fail')+' | controls (above every ESHAM and UNIFORM replicate, above LEARN and OFF means): '+
    (C?'PASS':'fail ('+[...lostStrict.map(a=>a+' band'),...lostMean.map(a=>a+' mean')].join(', ')+')')+(bad.length?' | GUARD FAIL':'')); }
if(pending){ console.log('VERDICT: pending'); process.exit(0); }
const rel=sE.length?(mean(sE)+1)/(mean(sT)+1):NaN;
const both=rows.filter(r=>r.learn&&r.T&&r.C).length, Tn=rows.filter(r=>r.learn&&r.T).length, Cn=rows.filter(r=>r.learn&&r.C).length;
const v= learned<2?'NO-GO: the earner did not learn on 2 of 3 seeds (learned on '+learned+')'
  : guardFail.length?'NO-GO (guard failed on '+guardFail.join(',')+')'
  : !(rel>=REL)?'NO-GO: over seeds the earner does not beat its twin by '+REL+' on S+1 (rel '+f3(rel)+')'
  : both>=2?'GO: the earner makes this world invent programs that earn and keep earning, beyond its program-fecundity-blind twin and beyond sham, uniform, learning and no mind, on '+both+' of 3 seeds'
  : Cn>=2&&Tn<2?'ABOVE THE ARMS, NOT THE TWIN - NO-GO'
  : Tn>=2&&Cn<2?'TWIN ONLY: the earner is not shown to matter beyond its controls - NO-GO'
  : 'NO-GO';
console.log('earner learned on '+learned+' | twin pass '+Tn+' | controls pass '+Cn+' | all three '+both+' (need 2 of 3) | twin rel (S+1) '+f3(rel));
console.log('VERDICT: '+v);
