// analysis for PREREG-diet.md (#329) and PREREG-diet2.md (#331).  [SEEDS=a,b,..] node lab/inlife/analyse-diet.js <dir>
// files: <seed>_C<0|3>.json and <seed>_T<0|3>.json (harness-sweep.js: CONTROL, DIET), <seed>_Q<0|3>.json (probe-diet.js, DIET),
// and for #331 <seed>_H<0|3>.json (probe-bandherit.js): when present, a DIET run also needs agreement - chance >= 0.2
const fs=require('fs'); const D=process.argv[2]; const seeds=(process.env.SEEDS||'6701,6702,6703,6704,6705').split(',').map(Number), SH=[0,3];
const load=n=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${n}.json`,'utf8')); }catch(e){ return null; } };
const took=q=>{ if(!q)return false; const R=q.rows, t=Math.floor(R.length*2/3), L=R.slice(t); const K=q.K; if(!K)return false;
  const share=new Array(K).fill(0); for(const r of L){ const n=r.alive||1; for(let b=0;b<K;b++) share[b]+=r.band[b]/n/L.length; }
  return share.filter(v=>v>=0.05).length>=2; };
const arm={C:{runs:0,fast:0,mk:0,mkF:0},T:{runs:0,fast:0,mk:0,mkF:0}};
for(const s of seeds) for(const k of SH){
  for(const A of ['C','T']){ const j=load(`${s}_${A}${k}`); if(!j){ console.log(`${s}_${A}${k} missing`); continue; }
    const q=A==='T'?load(`${s}_Q${k}`):null, h=A==='T'?load(`${s}_H${k}`):null;
    let her=null; if(h){ let n=0,a=0,c=0; for(const r of h.rows) if(r.pairs){ n+=r.pairs; a+=r.agreement*r.pairs; c+=r.chanceAgreement*r.pairs; } her=n?{a:a/n,c:c/n}:null; }
    const heritable=!h||(her&&her.a-her.c>=0.2), counted=j.loopErrors===0&&(A==='C'||(took(q)&&heritable));
    const p=j.layers.program.familyTree, v=p.verdict;
    let extra=''; if(q){ const last=q.rows[q.rows.length-1]; extra=` | bands late ${JSON.stringify(last.band)} progs ${JSON.stringify(last.programsPerBand)} took ${took(q)}${her?` | band agreement ${her.a.toFixed(3)} vs chance ${her.c.toFixed(3)}`:''}`; }
    console.log(`${s} ${A==='C'?'CONTROL':'DIET   '} NS${k}${counted?'':' NOT COUNTED'}: program TREE ${v} (real ${p.realPersistentPer1k} vs ${p.shadowPersistentPer1k.min}-${p.shadowPersistentPer1k.max}) markers ${j.summaryTree.marker05}/${j.summaryTree.marker50} alive ${j.aliveEnd}${extra}`);
    if(!counted)continue; const a=arm[A]; a.runs++; if(v==='FASTER THAN CHANCE')a.fast++; for(const m of ['marker05','marker50']){ a.mk++; if(j.summaryTree[m]==='FASTER THAN CHANCE')a.mkF++; } } }
const C=arm.C, T=arm.T;
console.log(`\nCONTROL: program FASTER ${C.fast}/${C.runs}, markers FASTER ${C.mkF}/${C.mk}`);
console.log(`DIET:    program FASTER ${T.fast}/${T.runs}, markers FASTER ${T.mkF}/${T.mk}`);
if(C.runs<6||T.runs<6){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
const chance=T.fast>=Math.max(5,Math.ceil(T.runs/2))&&T.mkF<=0.2*T.mk, control=T.fast>=C.fast+3&&C.runs>=8&&T.runs>=8;
console.log(`beats chance ${chance}, beats control ${control}`);
console.log('VERDICT: '+(chance&&control?'SUPPORTED':(chance||control)?'PARTLY':'NOT SUPPORTED'));
