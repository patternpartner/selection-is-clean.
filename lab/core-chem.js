// lab/core-chem.js - what the chemistry worlds (CHEM=1) did with their reaction network, over time.
// A reaction is ACTIVE in a window when it captured at least MIN of the window's metabolic income (the engine's per-reaction
// flux). Carrying a METAB instruction is not enough: most carried reactions have no substrate and run dry (hitchhikers). Each adopted reaction is placed in the network by DEPTH: the fewest steps from species 0 (the molecule light
// leaves behind) to its substrate, along usable steps. A deeper adopted reaction feeds on a molecule that only exists because
// other organisms made it. Reported per window: reactions active, how many for the first time, the deepest active, the
// metabolic income, the molecular energy left unused, and how many species are present.
//   SEED=1 WIN=30 [MIN=0.01] node lab/core-chem.js c.1.all.jsonl
'use strict';
const fs=require('fs'); const {World}=require('./oee-core.js');
const E=process.env, WIN=+(E.WIN||30), MIN=+(E.MIN||0.01);
for(const f of process.argv.slice(2)){
  const seed=+(E.SEED||(f.match(/\.(\d+)\.(all|c\d+)\.jsonl$/)||[])[1]||1);
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.chem);
  const w=new World(seed,Object.assign({CHEM:1},rows.length?{}:{})), S=w.p.CHEM_S, e=w.eMol, pr=w.prod, DM=w.p.CHEM_DMAX;
  const depth=new Int32Array(S).fill(-1); depth[0]=0; const qd=[0]; while(qd.length){ const q=qd.shift(); for(let j=0;j<4;j++){ const t=pr[q*4+j], d=e[q]-e[t]; if(d>0&&d<=DM&&depth[t]<0){ depth[t]=depth[q]+1; qd.push(t); } } }
  const ever=new Set(), out=[], newPer=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN), m=new Map(); let inc=0, molE=0, pres=0;
    for(const r of W){ for(const [x,v] of (r.chem.flux||[])) m.set(x,(m.get(x)||0)+v/W.length); inc+=r.chem.metab/W.length; molE+=r.chem.molE/W.length; pres+=r.chem.present/W.length; }
    const ad=[...m.entries()].filter(([x,v])=>v>=MIN).sort((a,b)=>b[1]-a[1]); const nw=ad.filter(([x])=>!ever.has(x)); for(const [x] of ad)ever.add(x); newPer.push(nw.length);
    const dOf=x=>depth[(x/4)|0]; const deep=ad.length?Math.max(...ad.map(([x])=>dOf(x))):-1;
    out.push(`  t${W[0].t}-${W.at(-1).t} gen~${W.at(-1).meanGen} N~${Math.round(W.reduce((a,r)=>a+r.N,0)/W.length)} | active ${ad.length} (new ${nw.length}: ${nw.slice(0,6).map(([x,v])=>'d'+dOf(x)+':'+v.toFixed(2)).join(' ')}) | deepest d${deep} | income ${inc.toFixed(0)} | unused molE ${molE.toFixed(0)} | species ${pres.toFixed(1)}`); }
  let nr=0, maxd=0; for(let q=0;q<S;q++) if(depth[q]>=0){ maxd=Math.max(maxd,depth[q]); for(let j=0;j<4;j++){ const d=e[q]-e[pr[q*4+j]]; if(d>0&&d<=DM)nr++; } }
  console.log('==',f.split('/').pop(),'seed',seed,'| network: usable reactions reachable',nr,'max depth',maxd,'| reactions ever active',ever.size,'| new per window',newPer.join(','));
  console.log(out.join('\n'));
}
