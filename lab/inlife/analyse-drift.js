// analysis for PREREG-drift.md.  node lab/inlife/analyse-drift.js <dir>   files: <seed>_<R0|R3|R7|F0|F3|F7|D0>.json (probe-drift.js)
const fs=require('fs'); const D=process.argv[2]; const seeds=[6501,6502,6503,6504,6505], SH=[0,3,7];
const load=(s,a)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${a}.json`,'utf8')); }catch(e){ return null; } };
const at=(rows,G,key)=>{ let p={gens:0,v:null}; for(const r of rows){ const v=key(r); if(r.gens>=G){ if(p.v===null||r.gens===p.gens)return v; return p.v+(v-p.v)*(G-p.gens)/(r.gens-p.gens); } p={gens:r.gens,v}; } return p.v; };
const sig=j=>JSON.stringify(j.rows.map(r=>r.alive)), distinct=a=>new Set(a.map(sig)).size;
const rows=[];
for(const s of seeds){ const R=SH.map(k=>load(s,'R'+k)), F=SH.map(k=>load(s,'F'+k)), Df=load(s,'D0');
  if(R.some(x=>!x)||F.some(x=>!x)||!Df){ console.log(s,'incomplete'); continue; }
  const counted=distinct(R)>=2&&distinct(F)>=2;
  const G=Math.min(...[...R,...F].map(j=>j.rows[j.rows.length-1].gens));
  const r=R.map(j=>at(j.rows,G,q=>q.founders)), f=F.map(j=>at(j.rows,G,q=>q.founders));
  const mx=[]; for(const j of R) for(let k=0;k<j.rows[0].shadow.length;k++) mx.push(at(j.rows,G,q=>q.shadow[k]));
  const faster=r.every(v=>v<Math.min(...f))&&r.every(v=>v<Math.min(...mx)), slower=r.every(v=>v>Math.max(...f));
  const call=faster?'FASTER THAN DRIFT':slower?'SLOWER THAN DRIFT':'WITHIN DRIFT';
  const fmt=a=>a.map(v=>v==null?'-':(+v).toFixed(1)).join(', ');
  const mint=j=>{ const l=j.rows[j.rows.length-1]; return (1000*l.linMints/Math.max(1,l.births)).toFixed(2); };
  const end=j=>j.rows[j.rows.length-1];
  console.log(`\n${s}${counted?'':'  NOT COUNTED'}  G* = ${G.toFixed(2)} generations  -> ${call}`);
  console.log(`  founders at G*   REPL ${fmt(r)}   FROZEN ${fmt(f)}   MIXED ${Math.min(...mx).toFixed(1)}-${Math.max(...mx).toFixed(1)}`);
  console.log(`  at 10,000 ticks  REPL gens ${R.map(j=>end(j).gens)} founders ${R.map(j=>end(j).founders)} lin ${R.map(j=>end(j).linStanding)} | FROZEN gens ${F.map(j=>end(j).gens)} founders ${F.map(j=>end(j).founders)} alive ${F.map(j=>end(j).alive)} | DEFAULT gens ${end(Df).gens} founders ${end(Df).founders} lin ${end(Df).linStanding}`);
  console.log(`  pLin mints per 1,000 births   REPL ${R.map(mint)}   FROZEN ${F.map(mint)}   DEFAULT ${mint(Df)}`);
  rows.push({s,counted,call}); }
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3), n=x=>c.filter(r=>r.call===x).length;
console.log(`\ncounted ${c.length}/5, need ${need}: faster ${n('FASTER THAN DRIFT')}, within ${n('WITHIN DRIFT')}, slower ${n('SLOWER THAN DRIFT')}`);
console.log('VERDICT: '+(c.length<3?'INCONCLUSIVE':n('FASTER THAN DRIFT')>=need?'SWEEP':(n('WITHIN DRIFT')+n('SLOWER THAN DRIFT'))>=need?'NOT A SWEEP':'MIXED'));
