// lab/locksmith/pick.js TRIALDIR OUTJOBS - applies the registered trial rule (lab/LOCKSMITH.md) and, if the gate passes, writes the
// deciding round's job file. Prints the choice and the gate; exit 0 = launch, exit 2 = STOPPED AT TRIAL.
// Rule: among X5/X10/X20 that did not collapse on either trial seed, the highest mean S; ties by mean Sf, then mean reactions
// ever active, then the larger R_EVERY (fewer interventions). Gate: launch unless no X variant survived, or the chosen X has S
// strictly below P0 on BOTH trial seeds.
'use strict';
const {execFileSync}=require('child_process'), fs=require('fs'), path=require('path');
const [DIR,OUT]=process.argv.slice(2), SEEDS=['7301','7302'], VAR={X5:5000,X10:10000,X20:20000};
const txt=execFileSync('node',[path.join(__dirname,'score.js'),DIR,'SEEDS='+SEEDS.join(','),'ARMS=X5,X10,X20,P0,BP10,BN10'],{encoding:'utf8'});
console.log(txt.split('\n').filter(l=>/^73/.test(l)).join('\n'));
const R={}; for(const l of txt.split('\n')){ const m=l.match(/^(\d+) (\S+)\s+rows \d+ N \d+( COLLAPSED)? \| S ([\d.]+) .*?Sf ([\d.]+) .*everActive (\d+)/); if(m){ (R[m[2]]=R[m[2]]||{})[m[1]]={col:!!m[3],S:+m[4],Sf:+m[5],ev:+m[6]}; } }
const mean=(a,k)=>SEEDS.reduce((x,s)=>x+R[a][s][k],0)/SEEDS.length;
const ok=Object.keys(VAR).filter(a=>R[a]&&SEEDS.every(s=>R[a][s]&&!R[a][s].col));
if(!ok.length){ console.log('STOPPED AT TRIAL: every X variant collapsed on a trial seed'); process.exit(2); }
ok.sort((a,b)=>mean(b,'S')-mean(a,'S')||mean(b,'Sf')-mean(a,'Sf')||mean(b,'ev')-mean(a,'ev')||VAR[b]-VAR[a]); const X=ok[0], RE=VAR[X];
console.log('CHOSEN '+X+' (R_EVERY '+RE+'): mean S '+mean(X,'S').toFixed(3)+', mean Sf '+mean(X,'Sf').toFixed(3)+', mean everActive '+mean(X,'ev'));
if(SEEDS.every(s=>R[X][s].S<R.P0[s].S)){ console.log('STOPPED AT TRIAL: chosen X below P0 on S on both trial seeds'); process.exit(2); }
const base='"CHEM":1,"CHEM_BIG":1,"FLUXALL":1', L=['# LOCKSMITH deciding round - unseen seeds 7311-7313, 1,200,000 ticks, R_EVERY '+RE+' (chosen by the trial rule, '+X+')'];
for(const s of ['7311','7312','7313']){ L.push(`X ${s} {${base},"REACH":1,"R_EVERY":${RE}}`); for(const k of [0,1,2])L.push(`P${k} ${s} {${base},"NULLSHIFT":${k}}`);
  L.push(`BP ${s} {${base},"REACH":2,"R_EVERY":${RE}}`); L.push(`BN ${s} {${base},"REACH":3,"R_EVERY":${RE}}`); }
fs.writeFileSync(OUT,L.join('\n')+'\n'); console.log('GATE PASSED: deciding round written to '+OUT);
