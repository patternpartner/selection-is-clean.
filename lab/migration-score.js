// lab/migration-score.js - the metasystem's adaptive novelty, for rings made by lab/migration.js.   node lab/migration-score.js DIR NAME1 [NAME2 ...]   (WIN=30)
// Per world, the core-geno rule: a FUNCTIONAL genotype is ADAPTIVE in a window of WIN samples when its mean share beats every neutral label's.
// Across the ring's worlds the genotypes are compared by their functional hash, which is the same number in every world, so a
// genotype that is adaptive in world A and again in world B (it migrated, or evolved twice) counts ONCE, in the first window it was adaptive
// anywhere. EVER = distinct genotypes adaptive anywhere in the ring; LATE = those whose first window is one of the last 3.
const fs=require('fs'), path=require('path'); const WIN=+(process.env.WIN||30);
function worldWindows(file){ let rows=fs.readFileSync(file,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.fnGeno);
  rows=rows.map(r=>Object.assign({},r,{progGeno:r.fnGeno,neutralGeno:r.fnNeutral,neutralN:r.fnNeutralN})); const out=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN), a=new Map(), sa=new Map();
    for(const r of W){ for(const [g,c] of r.progGeno)a.set(g,(a.get(g)||0)+c/r.N/W.length); for(const [g,c] of r.neutralGeno)sa.set(g,(sa.get(g)||0)+c/Math.max(1,r.neutralN)/W.length); }
    let bar=0; for(const v of sa.values())if(v>bar)bar=v; out.push(new Set([...a.entries()].filter(([g,v])=>v>bar).map(([g])=>g))); }
  return {out,last:rows.at(-1)}; }
function ring(dir,name){ const m=JSON.parse(fs.readFileSync(path.join(dir,name+'.mig.json'),'utf8')); const W=m.SEEDS.map(s=>worldWindows(path.join(dir,`${name}-${s}.jsonl`)));
  const nW=Math.min(...W.map(x=>x.out.length)); const first=new Map(); const per=[];
  for(let w=0;w<nW;w++)for(const x of W)for(const g of x.out[w])if(!first.has(g))first.set(g,w);
  for(const x of W){ const e=new Set(); for(let w=0;w<nW;w++)for(const g of x.out[w])e.add(g); per.push(e.size); }
  const ever=first.size, late=[...first.values()].filter(w=>w>=nW-3).length, sumWorlds=per.reduce((a,b)=>a+b,0);
  const fin=W.map(x=>x.out[nW-1]); let jac=0,pairs=0; for(let i=0;i<fin.length;i++)for(let j=i+1;j<fin.length;j++){ const a=fin[i],b=fin[j]; let inter=0; for(const g of a)if(b.has(g))inter++; const un=a.size+b.size-inter; jac+=un?inter/un:0; pairs++; }
  return {name,windows:nW,ever,late,sumWorlds,perWorld:per,jaccardFinal:+(jac/pairs).toFixed(4),N:W.map(x=>x.last.N),distinctFn:W.map(x=>x.last.fnGenoN),sent:m.sent,landed:m.landed,lost:m.lost}; }
if(require.main===module){ const [dir,...names]=process.argv.slice(2); for(const n of names)console.log(JSON.stringify(ring(dir,n))); }
module.exports={ring};
