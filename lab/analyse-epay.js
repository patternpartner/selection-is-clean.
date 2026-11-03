// analysis for PREREG-epay.md (#344), from lab/analyse-tree.js.  [SEEDS=7701,7702,7703] node lab/analyse-epay.js <dir>   (o1 = ARM, o2 = STRICT)
// Reads <dir>/<seed>_o<arm>.leak.json (lab/probe-leak.js) for the manipulation check and <dir>/<seed>_o<arm>.twowire.json
// (lab/probe-twowire.js) for the two-read outcome, both run on each world's last save.
// As lab/analyse-strict.js (windows of 30,000 ticks; ACTIVE = at least 1% of the window's task income and at least 100 per sample)
// with four-input grading from lab/core-tasks4.js. A circuit size of CMAX reads AT LEAST CMAX and is printed with a '+'.
'use strict';
const fs=require('fs'); const {SZ4,CSZ4,CMAX}=require('./core-tasks4.js');
const D=process.argv[2], WIN=30, MIN=0.01, MINABS=100, seeds=(process.env.SEEDS||'7701,7702,7703').split(',').map(Number), NCH=+(process.env.NCH||8);
const cz=v=>v>=CMAX?CMAX+'+':''+v;
const rowsOf=w=>{ const out=[]; for(let k=0;k<NCH;k++){ const f=`${D}/${w}.${k}.jsonl`; if(!fs.existsSync(f))break; for(const l of fs.readFileSync(f,'utf8').trim().split('\n')){ try{ out.push(JSON.parse(l)); }catch(e){} } } return out; };
const med=a=>{ const b=[...a].sort((x,y)=>x-y), n=b.length; return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):0; };
function windows(rows){ const ever=new Set(), per=[]; let firstAct=-1; const gain=new Map(); let pairsN=0, pairsFn=0; const R=rows.filter(r=>r.N>0&&r.tasks);
  for(let w0=0,wi=0;w0+WIN<=R.length;w0+=WIN,wi++){ const W=R.slice(w0,w0+WIN), m=new Map(); let inc=0;
    for(const r of W){ for(const [T,v] of r.tasks.flux) m.set(T,(m.get(T)||0)+v/W.length); inc+=r.tasks.income/W.length;
      if(r.tasks.pairs){ pairsN+=r.tasks.pairsN; for(const [T,g,n] of r.tasks.pairs){ if(g<0)continue; pairsFn+=n; const d=CSZ4[T]-CSZ4[g]; gain.set(d,(gain.get(d)||0)+n); } } }
    const act=[...m.entries()].filter(([T,v])=>v>=MIN&&v*inc>=MINABS), nw=act.filter(([T])=>!ever.has(T)); for(const [T] of act) ever.add(T); if(act.length&&firstAct<0) firstAct=wi;
    const top=act.length?act.reduce((x,y)=>CSZ4[y[0]]>CSZ4[x[0]]||(CSZ4[y[0]]===CSZ4[x[0]]&&SZ4[y[0]]>SZ4[x[0]])?y:x):null;
    per.push({active:act.length, newN:nw.length, ever:ever.size, hard:act.length?Math.max(...act.map(([T])=>SZ4[T])):0, hardC:top?CSZ4[top[0]]:0, top:top?top[0]:-1}); }
  return {per, ever:ever.size, firstAct, gain:[...gain.entries()].sort((a,b)=>a[0]-b[0]), pairsN, pairsFn}; }
const res={};
for(const s of seeds) for(const o of [1,2]){ const w=`${s}_o${o}`, rows=rowsOf(w); const x=windows(rows);
  const half=rows.slice(Math.floor(rows.length/2)); let reads=0, hits=0, refused=0, notRef=0; for(const r of half){ const e=r.ev||{}; reads+=e.reads||0; hits+=e.readHits||0; refused+=e.copyRefused||0; notRef+=e.notRefused||0; }
  const p=x.per; res[w]={...x, ticks:rows.length?rows.at(-1).t:0, hitShare:reads?hits/reads:0, Nlast:rows.length?rows.at(-1).N:0,
    sus:med(p.slice(20,40).map(q=>q.hardC)), susF:med(p.slice(20,40).map(q=>q.hard)), lastNew:p.slice(-10).filter(q=>q.newN>0).length, g2:(p[19]?p[19].ever:0)-(p[9]?p[9].ever:0), g4:(p[39]?p[39].ever:0)-(p[29]?p[29].ever:0)};
  const q=res[w]; console.log(`${w}: ticks ${q.ticks} windows ${p.length} | ever active ${x.ever} | first active window ${x.firstAct} | read hits ${(100*q.hitShare).toFixed(2)}% (2nd half), copies refused ${refused} complements refused ${notRef} | N ${q.Nlast}`);
  console.log(`    new per window ${p.map(q=>q.newN).join(',')}`);
  console.log(`    circuit hardest per window ${p.map(q=>cz(q.hardC)).join(',')}`);
  console.log(`    formula hardest per window ${p.map(q=>q.hard).join(',')}`);
  console.log(`    hardest per window, function ${p.map(q=>q.top>=0?q.top.toString(16):'-').join(',')}`);
  console.log(`    paid right after a read: ${x.pairsN} (the read word a function: ${x.pairsFn}); circuit gain over the word read (paid - read): ${x.gain.map(([d,n])=>d+':'+n).join(' ')}`); }
const TMAX=+(process.env.TMAX||1200000), started=w=>res[w].firstAct>=0&&res[w].firstAct<20;   // a seed counts only if something to compare exists in the second half
const counted=seeds.filter(s=>{ const L=res[`${s}_o1`], C=res[`${s}_o2`]; return L.ticks>=TMAX&&C.ticks>=TMAX&&L.hitShare>=0.01&&C.hitShare>=0.01&&(started(`${s}_o1`)||started(`${s}_o2`)); });   // both arms read
console.log(`\ncircuit table: exact up to ${CMAX-1} gates, ${CMAX}+ = at least ${CMAX}`);
for(const s of seeds){ const L=res[`${s}_o1`], C=res[`${s}_o2`]; console.log(`${s}: sustained circuit (median windows 21-40) ARM ${cz(L.sus)} STRICT ${cz(C.sus)} | formula ${L.susF} / ${C.susF} | ever active ${L.ever} / ${C.ever} | windows with a new active function, last 10: ${L.lastNew} / ${C.lastNew} | ever-active growth Q2 -> Q4: ARM ${L.g2} -> ${L.g4}, STRICT ${C.g2} -> ${C.g4}`); }
console.log(`counted seeds: ${counted.length}/3 (${counted.join(',')})`);
if(counted.length<3){ console.log('VERDICT: INCONCLUSIVE'); process.exit(0); }
const tw=w=>{ try{ const j=JSON.parse(fs.readFileSync(`${D}/${w}.twowire.json`,'utf8')).shareOfAllIncome_by_k_0_1_2_3plus; return j.clean_fresh[2]+j.clean_fresh[3]+j.clean_stale[2]+j.clean_stale[3]; }catch(e){ return null; } };
const lk=w=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${w}.leak.json`,'utf8')).preemption.slotUsedBy2ndRead; }catch(e){ return null; } };
for(const s of seeds) console.log(`${s}: second distinct reads made with the payment slot already spent: ARM ${lk(`${s}_o1`)} STRICT ${lk(`${s}_o2`)} | clean income fed by 2+ distinct reads: ARM ${tw(`${s}_o1`)} STRICT ${tw(`${s}_o2`)}`);
const M=seeds.filter(s=>lk(`${s}_o1`)!==null&&lk(`${s}_o2`)!==null&&lk(`${s}_o1`)<=lk(`${s}_o2`)-0.20).length>=2;
const TWO=seeds.filter(s=>tw(`${s}_o1`)!==null&&tw(`${s}_o1`)>tw(`${s}_o2`)).length>=2;
const A=seeds.filter(s=>{ const L=res[`${s}_o1`], C=res[`${s}_o2`]; return (L.sus>=CMAX&&C.sus>=CMAX)?L.susF>=C.susF+1:L.sus>=C.sus+1; }).length, Alow=seeds.some(s=>{ const L=res[`${s}_o1`], C=res[`${s}_o2`]; return (L.sus>=CMAX&&C.sus>=CMAX)?L.susF<C.susF:L.sus<C.sus; });
const B=seeds.filter(s=>res[`${s}_o1`].ever>res[`${s}_o2`].ever).length;
const Cn=seeds.filter(s=>res[`${s}_o1`].lastNew>=5).length, Csum=seeds.reduce((a,s)=>a+res[`${s}_o1`].lastNew,0)>seeds.reduce((a,s)=>a+res[`${s}_o2`].lastNew,0);
const Dn=seeds.filter(s=>{ const L=res[`${s}_o1`]; return L.g4>=0.5*L.g2&&L.g4>0; }).length;
const rA=A>=2&&!Alow, rB=B>=2, rC=Cn>=2&&Csum, rD=Dn>=2;
console.log(`manipulation check M (slot spent at 2nd read 20+ points lower on 2 of 3) ${M} | TWO-READ (more 2+-read clean income on 2 of 3) ${TWO} | rule A harder by 1+ on ${A}/3, lower on any: ${Alow} -> ${rA} | rule B breadth ${B}/3 ${rB} | rule C late novelty ${Cn}/3 (ARM more than STRICT summed: ${Csum}) ${rC} | rule D no deceleration ${Dn}/3 ${rD}`);
console.log('VERDICT: '+(!M?'NOT APPLIED':(!rA&&!TWO)?'NO CHANGE':!rA?'MORE TWO-READ, NOT HARDER':(rC&&rD)?'OPENS':'HARDER'+(TWO?', WITH MORE TWO-READ':'')+(rB?', AND BROADER':'')));
