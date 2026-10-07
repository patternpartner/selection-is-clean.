// lab/score-294b.js - score the #294b deciding run against its rule, written before the run (OEE-NOTES #294b).
//   node lab/score-294b.js [DIR=lab/mindrun/heavy/d294]
// Per world: pairs (minds that hear one partner world) against the null band of minds that learn alone: the control and
// three replicates that differ only in the mind's own random stream (MIND_SEED 1-3). BETTER when pairs is above every one
// of the four on that world, WORSE when below every one. Primary measure: functional adaptive genotypes ever (core-geno,
// WIN=40, ten windows over 400,000 ticks); secondary: first-time adaptive genotypes in the last three windows.
'use strict';
const fs=require('fs'), path=require('path'), {execFileSync}=require('child_process');
const DIR=process.env.DIR||path.join(__dirname,'mindrun','heavy','d294'), WORLDS=[2301,2302,2303,2304], NULLS=['alone','null1','null2','null3'], T=400;
const rows=f=>fs.readFileSync(f,'utf8').trim().split('\n').map(x=>JSON.parse(x));
function geno(f){ const o=execFileSync('node',[path.join(__dirname,'core-geno.js'),f],{env:{...process.env,WIN:'40'}}).toString();
  const m=o.match(/adaptive genotypes ever (\d+) \| new per window ([\d,]+)/); if(!m)throw new Error('no genotype line for '+f);
  const w=m[2].split(',').map(Number); return {ever:+m[1],late:w.slice(-3).reduce((a,b)=>a+b,0)}; }
const call=(x,band)=>x>Math.max(...band)?'BETTER':x<Math.min(...band)?'WORSE':'inside';
let counted=0; const res={ever:[],late:[]};
for(const w of WORLDS){ const f=a=>path.join(DIR,`${a}-${w}.jsonl`), need=['pairs',...NULLS,'uniform'];
  const miss=need.filter(a=>!fs.existsSync(f(a))||rows(f(a)).length<T); if(miss.length){ console.log(`${w}: not finished (${miss.join(', ')})`); continue; }
  const P=rows(f('pairs')), abroad=P.reduce((a,r)=>a+(r.abroad||0),0), ran=P[P.length-1].mind.uses>0&&abroad>0&&NULLS.every(a=>rows(f(a)).slice(-1)[0].mind.uses>0);
  if(!ran){ console.log(`${w}: NOT COUNTED (the mind or the exchange did not run: abroad ${abroad})`); continue; } counted++;
  const p=geno(f('pairs')), band=NULLS.map(a=>geno(f(a))), u=geno(f('uniform'));
  const ce=call(p.ever,band.map(b=>b.ever)), cl=call(p.late,band.map(b=>b.late)); res.ever.push(ce); res.late.push(cl);
  console.log(`${w}: counted (pairs took in ${abroad} foreign examples) | ever: pairs ${p.ever}, alone band ${band.map(b=>b.ever).join('/')} -> ${ce}`+
    ` | late: pairs ${p.late}, band ${band.map(b=>b.late).join('/')} -> ${cl} | uniform (one run, no band) ever ${u.ever} late ${u.late}`); }
const k=Math.ceil(2*counted/3), n=(a,v)=>a.filter(x=>x===v).length;
if(counted<3) console.log(`counted worlds ${counted} < 3: INCONCLUSIVE`);
else { const ver=a=>n(a,'BETTER')>=k?'BETTER':n(a,'WORSE')>=k?'WORSE':'NOT DIFFERENT';
  const e=ver(res.ever), l=ver(res.late), split=(e==='BETTER'&&l==='WORSE')||(e==='WORSE'&&l==='BETTER');
  console.log(`counted ${counted}; needed ${k}. Primary (adaptive ever): ${e} (BETTER on ${n(res.ever,'BETTER')}, WORSE on ${n(res.ever,'WORSE')}). Secondary (late): ${l} (BETTER on ${n(res.late,'BETTER')}, WORSE on ${n(res.late,'WORSE')}).`);
  console.log(split?'R1: SPLIT':e==='BETTER'?'R1: MET - minds that learn from a partner world produce more novelty than minds that learn alone, beyond the null band':'R1: NOT MET'); }
