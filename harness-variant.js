// #261 — ONE ENGINE VARIANT, EVALUATED CHEAPLY. The unit of harness-evolve.js's population.
// A variant is a set of switches and settings applied to the shipped engine:
//   FORCE=a,b     trait-force knockouts (trait-force.js: bleed0 blend0 toll0 motif0 nfd0 vmbleed0), re-installed every tick
//   MECHOFF=a,b   #253's mechanism switches turned OFF (RED_QUEEN NICHE_BUILD NICHE_LOCAL FRONTIER_EXPAND OPCODE_NOVELTY
//                 NOVELTY_ARCHIVE RICH_GRAMMAR) - held off every tick
//   ARMON=a,b     dormant arms turned ON before boot (GROUP_PROBE, GENE_DRAW - #249's two survivors)
//   LAWS=NAME:v,NAME:v   law defaults set once after the first tick (clamped to the row's range); the world may evolve them
// Measures, all draw-free, sampled every 100 ticks: the living count (floor, end), grid-free trait spread (mean pairwise
// distance, axes 0-2) and centred entropy (0.6-wide bins with the population mean at a bin centre) over the late half,
// and LINEAGE NOVELTY: lineage ids that first reach 3 living members in the late half and still have 3 1,000 ticks
// later, per 1,000 ticks. No shadows - the null is the default engine's own replicates, run by the caller.
//   SEED=1 TICKS=5000 FORCE=blend0 MECHOFF=NICHE_LOCAL LAWS=INHERIT_SD:0.3 node harness-variant.js
// Prints one JSON object. No backticks in the appended driver's comments.
try{ require(require('path').join(__dirname,'harness-env.js')).applyKnobs(globalThis); }catch(_){}
require(require('path').join(__dirname,'harness-env.js'))(globalThis);
const fs=require('fs'),path=require('path');
const E=process.env, T=+(E.TICKS||5000), EVERY=100, P=+(E.P||1000);
const list=v=>String(v||'').split(',').filter(Boolean);
const ARMS=['GROUP_PROBE','GENE_DRAW'];
for(const a of list(E.ARMON)){ if(!ARMS.includes(a)){ console.log(JSON.stringify({error:'unknown ARMON '+a})); process.exit(2); } globalThis['__'+a]=1; }
const TF=require(path.join(__dirname,'trait-force.js'));
let code=fs.readFileSync(E.INDEX||path.join(__dirname,'engine.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
let FORCE; try{ FORCE=TF.parse(E.FORCE); code=TF.patch(code,FORCE); }catch(e){ console.log(JSON.stringify({error:e.message})); process.exit(2); }
globalThis.__FORCE=FORCE; globalThis.__MECHOFF=list(E.MECHOFF);
globalThis.__LAWSET=list(E.LAWS).map(s=>{ const i=s.lastIndexOf(':'); return [s.slice(0,i),+s.slice(i+1)]; });
const Module=require('module');const m=new Module('/tmp/variant.js');m.filename='/tmp/variant.js';m.paths=Module._nodeModulePaths('/tmp');
m._compile(code+TF.DRIVER+`
;globalThis.__VA=function(T,EVERY,P){
  for(const n of globalThis.__MECHOFF) if(!MECH_DECLARED.includes(n)) return {error:'unknown MECHOFF '+n};
  const lawsSet={};
  const late=Math.floor(T/2), first=new Map(), hist=new Map(); let floor=Infinity, spreadS=0, entS=0, k=0, errs=0;
  for(let s=1;s<=T;s++){ globalThis.__detMs+=5; globalThis.__applyForce(globalThis.__FORCE);
    for(const n of globalThis.__MECHOFF) mechSet(n,0);
    try{loop();}catch(e){errs++;}
    if(s===1) for(const [name,v] of globalThis.__LAWSET){ const r=LAW_DECLARED.find(x=>x.name===name); if(!r){ lawsSet[name]='unknown'; continue; } const to=__cl(v,r.lo,r.hi); r.set(to); lawsSet[name]=+r.get(); }
    if(s%EVERY) continue;
    const ix=[]; for(let i=0;i<N;i++) if(palive[i])ix.push(i); const n=ix.length; if(n<floor)floor=n;
    const cnt=new Map(); for(const i of ix)cnt.set(pLin[i],(cnt.get(pLin[i])||0)+1);
    const o=new Set(); for(const [l,c] of cnt) if(c>=3){ o.add(l); if(!first.has(l))first.set(l,s); } hist.set(s,o);
    if(s>=late&&n>1){ let sum=0,q=0; for(let a=0;a<n;a+=3) for(let b=a+1;b<n;b+=7){ let d2=0; for(let d=0;d<3&&d<DIMS;d++){ const v=tend[ix[a]*DIMS+d]-tend[ix[b]*DIMS+d]; d2+=v*v; } sum+=Math.sqrt(d2); q++; }
      const mu=[0,0,0]; for(const i of ix) for(let d=0;d<3&&d<DIMS;d++)mu[d]+=tend[i*DIMS+d]/n;
      const c=new Map(); for(const i of ix){ let key=''; for(let d=0;d<3;d++){ const v=d<DIMS?tend[i*DIMS+d]:0; key+=Math.floor((v-mu[d]+0.3)/0.6)+','; } c.set(key,(c.get(key)||0)+1); }
      let h=0; c.forEach(v=>{ const p=v/n; h-=p*Math.log2(p); }); spreadS+=q?sum/q:0; entS+=h; k++; } }
  let pa=0; for(const [l,t0] of first){ if(t0<late||t0+P>T)continue; const o=hist.get(t0+P); if(o&&o.has(l))pa++; }
  let alive=0; for(let i=0;i<N;i++) if(palive[i])alive++;
  return {alive,floor,spreadLate:k?spreadS/k:0,centredHLate:k?entS/k:0,lineagePersistPer1k:pa*1000/Math.max(1,T-P-late),errs,lawsSet}; };`,'/tmp/variant.js');
const r=globalThis.__VA(T,EVERY,P);
console.log(JSON.stringify(Object.assign({seed:E.SEED||'1',ticks:T,force:FORCE,mechOff:globalThis.__MECHOFF,armOn:list(E.ARMON)},r)));
