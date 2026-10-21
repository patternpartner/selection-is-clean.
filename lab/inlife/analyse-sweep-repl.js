// analysis for PREREG-sweep-repl.md (and Step 2's arms).  node lab/inlife/analyse-sweep-repl.js <dir> [prefix]
// files: <seed>_<prefix><shift>.json (harness-sweep.js), shifts 0 and 3; prefix defaults to S
const fs=require('fs'); const D=process.argv[2], P=process.argv[3]||'S'; const seeds=(process.env.SEEDS||'6601,6602,6603,6604,6605').split(',').map(Number);
const load=(s,k)=>{ try{ return JSON.parse(fs.readFileSync(`${D}/${s}_${P}${k}.json`,'utf8')); }catch(e){ return null; } };
const rows=[];
for(const s of seeds){ const R=[0,3].map(k=>load(s,k)); if(R.some(x=>!x)){ console.log(s,'incomplete'); continue; }
  const ok=j=>j.loopErrors===0&&j.summaryTree&&j.summaryTree.marker05==='CHANCE'&&j.summaryTree.marker50==='CHANCE';
  const counted=R.every(ok), v=R.map(j=>j.layers.program.familyTree.verdict);
  const call=v.every(x=>x==='FASTER THAN CHANCE')?'FASTER':v.every(x=>x==='SLOWER THAN CHANCE')?'SLOWER':'CHANCE';
  console.log(`\n${s}${counted?'':'  NOT COUNTED'}  program TREE: ${v.join(' / ')}  -> ${call}`);
  for(const j of R){ const p=j.layers.program, t=p.familyTree;
    console.log(`  NULLSHIFT run: program persistent/1k real ${t.realPersistentPer1k} vs TREE ${JSON.stringify(t.shadowPersistentPer1k)} | markers TREE ${j.summaryTree.marker05}/${j.summaryTree.marker50} | alive end ${j.aliveEnd}`);
    console.log(`    TREE ${JSON.stringify(j.summaryTree)}`);
    console.log(`    MIXED ${JSON.stringify(j.summary)}`); }
  rows.push({s,counted,call}); }
const c=rows.filter(r=>r.counted), need=Math.ceil(c.length*2/3), n=x=>c.filter(r=>r.call===x).length;
console.log(`\ncounted ${c.length}/${seeds.length}, need ${need}: faster ${n('FASTER')}, chance ${n('CHANCE')}, slower ${n('SLOWER')}`);
console.log('VERDICT: '+(c.length<3?'INCONCLUSIVE':n('FASTER')>=need?'PROGRAMS OUTPACE THE TREE NULL':(n('CHANCE')+n('SLOWER'))>=need?'AT CHANCE':'MIXED'));
