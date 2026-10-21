// analysis for PREREG-repl-copy.md.  node lab/inlife/analyse-repl-copy.js <dir>   files: <seed>_<K0|K3|K7|C0|C3|C7>.json (harness-oee.js)
const fs=require('fs'); const D=process.argv[2]; const seeds=[6301,6302,6303,6304,6305], SH=[0,3,7];
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const late=(j,k)=>{ const S=j.series, t=Math.floor(S.length*2/3); return mean(S.slice(t).map(q=>+q[k]||0)); };
const crashed=j=>{ let hi=false; for(const q of j.series){ if(q.N>20)hi=true; else if(hi&&q.N<5)return true; } return false; };
const M=j=>{ const t=j.verdict.diversity_trend, p=j.verdict.program_trend||{};
  return {lin:late(j,'linStanding'), top:late(j,'topSeqShare'), cer:t.centredEntropyRatio, spread:t.spread_late, len:p.progLen_late, seqH:p.seqH_late,
    alive:j.establishment?j.establishment.alive_late:null, est:j.establishment?j.establishment.estFrac:null, er:t.entropyRatio, kinds:t.kinds_late,
    errs:(j.loopErrors||0)+(j.driverErr||0), never:j.livenessNever||[], sig:JSON.stringify(j.series.map(q=>q.N))}; };
const distinct=a=>new Set(a.map(x=>x.sig)).size;
const mv=(a,c,rel,dirUp)=>{ const lo=Math.min(...c), hi=Math.max(...c), cm=mean(c), am=mean(a);
  if(!(Math.abs(am-cm)>rel*Math.abs(cm)))return 'none'; if(a.every(v=>v>hi))return 'UP'; if(a.every(v=>v<lo))return 'DOWN'; return 'none'; };
const rows=[];
for(const s of seeds){ const K=SH.map(k=>load(s,'K'+k)), C=SH.map(k=>load(s,'C'+k));
  if(K.some(x=>!x)||C.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const km=K.map(M), cm=C.map(M);
  const ran=km.every(x=>x.never.indexOf('repl.copyBirth')<0)&&cm.every(x=>x.never.indexOf('repl.copyBirth')>=0);
  const counted=[...km,...cm].every(x=>x.errs===0)&&ran&&distinct(km)>=2&&distinct(cm)>=2;
  const r={s,counted, p1:mv(km.map(x=>x.lin),cm.map(x=>x.lin),0.25), p2:mv(km.map(x=>x.top),cm.map(x=>x.top),0.50),
    cer:(()=>{const a=km.map(x=>x.cer),c=cm.map(x=>x.cer); const lo=Math.min(...c),hi=Math.max(...c),d=mean(a)-mean(c); return Math.abs(d)>0.05&&(a.every(v=>v>hi)?'UP':a.every(v=>v<lo)?'DOWN':'none')||'none';})(),
    spread:mv(km.map(x=>x.spread),cm.map(x=>x.spread),0.10), crash:K.some(crashed)&&!C.some(crashed)};
  const f=(a,k,d)=>a.map(x=>x[k]==null?'-':(+x[k]).toFixed(d)).join(',');
  console.log(`\n${s}${counted?'':'  NOT COUNTED'}  executed ${ran}  distinct K ${distinct(km)} C ${distinct(cm)}  COPY-only crash ${r.crash}`);
  console.log(`  P1 lineages late   COPY ${f(km,'lin',1)}  CONTROL ${f(cm,'lin',1)}  -> ${r.p1}`);
  console.log(`  P2 top genotype    COPY ${f(km,'top',4)}  CONTROL ${f(cm,'top',4)}  -> ${r.p2}`);
  console.log(`  guard cER          COPY ${f(km,'cer',2)}  CONTROL ${f(cm,'cer',2)}  -> ${r.cer}`);
  console.log(`  guard spread_late  COPY ${f(km,'spread',3)}  CONTROL ${f(cm,'spread',3)}  -> ${r.spread}`);
  for(const k of ['len','seqH','alive','est','er','kinds']) console.log(`  [${k}]`.padEnd(10)+`COPY ${f(km,k,3)}  CONTROL ${f(cm,k,3)}`);
  rows.push(r); }
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3), n=(f)=>c.filter(f).length;
const good=n(r=>r.p1==='UP'||r.p2==='DOWN'), badP=n(r=>r.p1==='DOWN'||r.p2==='UP'), badG=n(r=>r.cer==='DOWN'||r.spread==='DOWN'||r.crash);
console.log(`\ncounted ${c.length}/5, need ${need}: primary better ${good}, primary worse ${badP}, guard worse ${badG}`);
let v; if(c.length<3)v='INCONCLUSIVE'; else { const W=badP>=need||badG>=need, B=good>=need&&badP<need&&badG<need;
  v=(good>=need&&W)?'SPLIT':W?'WORSE':B?'BETTER':c.some(r=>r.p1!=='none'||r.p2!=='none')?'NO CONSISTENT DIRECTION':'NO MEASURED DIFFERENCE'; }
console.log('VERDICT: '+v);
