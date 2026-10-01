// lab/core-geno.js - evolutionary activity of whole PROGRAM GENOTYPES against the NEUTRAL SHADOW POPULATION (Bedau and Packard).
// The bar is the neutral population (same births, deaths and mutants per tick; parents and victims picked at random), so a
// genotype passes only by outgrowing what luck alone produced. (The same-family-tree program shadow is NOT a valid bar at
// this level: real mutants that are harmful die and real genotypes stay whole, while shadow genotypes splinter freely and
// drift in length, so the bar sinks and purifying selection alone clears it - that was #285c. Set BAR=shadow to see it.)
// Ops and op pairs are a bounded measure (529 working pairs; a few dozen are ever useful), so a pair count must run dry
// even if evolution keeps finding new programs. Genotypes have no ceiling. Each sample records the 60 commonest real
// program genotypes and the 60 commonest shadow ones (same hash of ops and args). The shadow shares the family tree,
// so its genotype sizes are what drift and hitchhiking alone produce. In each window of WIN samples a real genotype is
// ADAPTIVE when its mean share beats every shadow genotype's; reported: how many, and how many for the first time.
// MODE=fn (the default when the log has it) judges FUNCTIONAL genotypes (neutral ops dropped, ignored argument bits masked)
// against a neutral population that takes a new label only when the real child's functional genotype changed. The raw
// genotype against the raw neutral population over-counts: purifying selection keeps the real top genotype above every
// neutral label, so each change of top genotype counts as new, including changes that only touch a neutral op or an
// ignored argument (#285d).
'use strict';
const fs=require('fs'); const WIN=+(process.env.WIN||30);
for(const f of process.argv.slice(2)){
  let rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.progGeno&&(process.env.BAR==='shadow'||r.neutralGeno));
  const FN=(process.env.MODE||(rows.length&&rows[0].fnGeno?'fn':'raw'))==='fn';
  if(FN) rows=rows.filter(r=>r.fnGeno).map(r=>Object.assign({},r,{progGeno:r.fnGeno,neutralGeno:r.fnNeutral,neutralN:r.fnNeutralN}));
  if(!rows.length){ console.log('==',f.split('/').pop(),'no genotype data'); continue; }
  const ever=new Set(), news=[], sigs=[], bars=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN);
    const a=new Map(), sa=new Map(); for(const r of W){ for(const [g,c] of r.progGeno) a.set(g,(a.get(g)||0)+c/r.N/W.length); const B=process.env.BAR==='shadow'?r.shadowGeno:r.neutralGeno, BN=process.env.BAR==='shadow'?r.N:r.neutralN; for(const [g,c] of B) sa.set(g,(sa.get(g)||0)+c/Math.max(1,BN)/W.length); }
    let bar=0; for(const v of sa.values()) if(v>bar)bar=v;
    const sig=[...a.entries()].filter(([g,v])=>v>bar).map(([g])=>g); const nw=sig.filter(g=>!ever.has(g)); for(const g of sig)ever.add(g);
    news.push(nw.length); sigs.push(sig.length); bars.push(bar.toFixed(3)); }
  console.log('==',f.split('/').pop(),FN?'[functional]':'[raw]','samples',rows.length,'| adaptive genotypes ever',ever.size,'| new per window',news.join(','),'| present per window',sigs.join(','),'| shadow bar',bars.join(','));
}
