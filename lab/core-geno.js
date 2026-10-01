// lab/core-geno.js - evolutionary activity of whole PROGRAM GENOTYPES against the shadow (Bedau and Packard's level).
// Ops and op pairs are a bounded measure (529 working pairs; a few dozen are ever useful), so a pair count must run dry
// even if evolution keeps finding new programs. Genotypes have no ceiling. Each sample records the 60 commonest real
// program genotypes and the 60 commonest shadow ones (same hash of ops and args). The shadow shares the family tree,
// so its genotype sizes are what drift and hitchhiking alone produce. In each window of WIN samples a real genotype is
// ADAPTIVE when its mean share beats every shadow genotype's; reported: how many, and how many for the first time.
'use strict';
const fs=require('fs'); const WIN=+(process.env.WIN||30);
for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.progGeno);
  if(!rows.length){ console.log('==',f.split('/').pop(),'no genotype data'); continue; }
  const ever=new Set(), news=[], sigs=[], bars=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN);
    const a=new Map(), sa=new Map(); for(const r of W){ for(const [g,c] of r.progGeno) a.set(g,(a.get(g)||0)+c/r.N/W.length); for(const [g,c] of r.shadowGeno) sa.set(g,(sa.get(g)||0)+c/r.N/W.length); }
    let bar=0; for(const v of sa.values()) if(v>bar)bar=v;
    const sig=[...a.entries()].filter(([g,v])=>v>bar).map(([g])=>g); const nw=sig.filter(g=>!ever.has(g)); for(const g of sig)ever.add(g);
    news.push(nw.length); sigs.push(sig.length); bars.push(bar.toFixed(3)); }
  console.log('==',f.split('/').pop(),'samples',rows.length,'| adaptive genotypes ever',ever.size,'| new per window',news.join(','),'| present per window',sigs.join(','),'| shadow bar',bars.join(','));
}
