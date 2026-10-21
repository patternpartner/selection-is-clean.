// analysis for PREREG-op225.md.  node lab/inlife/analyse-op225.js <dir>   files: <seed>_<A0..A2|I0..I2>.json (probe225.js stdout)
const fs=require('fs'); const D=process.argv[2]; const seeds=[6201,6202,6203,6204,6205];
const mean=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:0;
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const C=j=>{ const t=j.series.slice(-4); return mean(t.map(q=>q.alive?q.germ225/q.alive:0)); };
const rows=[], pairs=[], flaggedA=[], wouldI=[];
for(const s of seeds){ const A=['A0','A1','A2'].map(a=>load(s,a)), I=['I0','I1','I2'].map(a=>load(s,a));
  if(A.some(x=>!x)||I.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const idOk=[...A,...I].every(j=>j.idMismatch===0), copied=A.filter(j=>j.flagCalls[1]>0).length, counted=idOk&&copied>=2;
  const ca=A.map(C), ci=I.map(C), ma=mean(ca), mi=mean(ci);
  const up=ca.every(v=>v>Math.max(...ci))&&ma>=2*mi&&ma-mi>=0.01, down=ci.every(v=>v>Math.max(...ca))&&mi>=2*ma&&mi-ma>=0.01;
  const mv=up?'UP':down?'DOWN':'none';
  console.log(`${s}${counted?'':'  NOT COUNTED'}  copied in ${copied}/3 ACTIVE  idOk ${idOk}`);
  console.log(`  C active ${ca.map(v=>v.toFixed(4))} (mean ${ma.toFixed(4)})  inert ${ci.map(v=>v.toFixed(4))} (mean ${mi.toFixed(4)})  -> ${mv}`);
  console.log(`  copies ${A.map(j=>j.flagCalls[1])}  would ${I.map(j=>j.flagCalls[0])}  alive_end A ${A.map(j=>j.series[j.series.length-1].alive)} I ${I.map(j=>j.series[j.series.length-1].alive)}`);
  rows.push({s,counted,mv});
  if(counted){ for(const j of A){ const f=j.recs.filter(r=>r.role===1), c=j.recs.filter(r=>r.role===2);
      for(const r of f) flaggedA.push(r.kids);
      const cm=new Map(c.map(r=>[r.pair,r])); for(const r of f){ const k=cm.get(r.pair); if(k) pairs.push(r.kids-k.kids); } }
    for(const j of I) for(const r of j.recs.filter(r=>r.role===1)) wouldI.push(r.kids); } }
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3), up=c.filter(r=>r.mv==='UP').length, down=c.filter(r=>r.mv==='DOWN').length;
console.log(`\ncounted ${c.length}/5, need ${need}: UP ${up}, DOWN ${down}`);
console.log('VERDICT: '+(c.length<3?'INCONCLUSIVE':(up>=need&&down===0)?'SELECTED':(down>=need)?'SELECTED AGAINST':'NOT SHOWN'));
// mechanism readouts (rule on nothing). A flagged particle and its control share a pair id set by the probe.
let a=0x9e3779b9; const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const boot=x=>{ if(!x.length)return [NaN,NaN]; const m=[]; for(let b=0;b<2000;b++){ let s=0; for(let q=0;q<x.length;q++) s+=x[(rnd()*x.length)|0]; m.push(s/x.length); } m.sort((p,q)=>p-q); return [m[50],m[1949]]; };
const ci=boot(pairs); console.log(`\nwithin ACTIVE: flagged - control children, n=${pairs.length}, mean ${mean(pairs).toFixed(3)}, 95% [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]`);
console.log(`across arms: children per flagged ACTIVE ${mean(flaggedA).toFixed(3)} (n=${flaggedA.length}) vs per would-copy INERT ${mean(wouldI).toFixed(3)} (n=${wouldI.length})`);
