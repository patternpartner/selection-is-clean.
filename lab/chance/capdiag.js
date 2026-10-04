// lab/chance/capdiag.js - CHANCE-ENGINE diagnosis (TRIAL seeds only): WHY does random capture (RANDCAP) beat directed capture?
// Read-only instrumentation: World.capSrc and World.bNewT are wrapped (the originals are called, no extra RNG draws), and
// World.bodyBirth is wrapped to read the child's body after the original has run. So a run is identical to an unwrapped run.
// Per capture event: substrate q, product t, whether q is already in the parent's chemistry (a substrate or product of one of its
// catalysts), base-network hop distance from that chemistry, q's abundance rank in the parent's cell, energy step, whether the key
// is already in the parent body (redundant) or was ever seen anywhere before (repeat). Per window: breadth (distinct substrates /
// keys captured, distinct species in bodies), the fate of capture-born keys (ever USED by the Lu rule), lineage diversity (distinct
// body sets, effective number exp(H), top share, mean pairwise Jaccard of bodies, fnGenoN).
//   SEED=63 TICKS=90000 OPTS='{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02}' OUT=x.json node lab/chance/capdiag.js
'use strict'; const fs=require('fs'); const {World}=require('../oee-core.js'); const E=process.env;
const w=new World(+(E.SEED||63),JSON.parse(E.OPTS)), P=w.p, M=P.BODY_MAX, S=P.CHEM_S, C=w.C, T=+(E.TICKS||90000), WIN=+(E.WIN||10000);
// undirected base-network adjacency
const adj=[...Array(S)].map(()=>new Set()); for(let q=0;q<S;q++)for(let j=0;j<4;j++){ const t=w.prod[q*4+j]; adj[q].add(t); adj[t].add(q); }
const seq=k=>w.bSeq(k);
let pend=null; const oCap=w.capSrc.bind(w), oNT=w.bNewT.bind(w), oBB=w.bodyBirth.bind(w);
w.capSrc=function(c,L){ const q=oCap(c,L); pend={c,q,t:-1}; return q; };
w.bNewT=function(q){ const t=oNT(q); if(pend&&pend.t===-1&&pend.q===q){ pend.t=t; pend.done=1; } return t; };
const seen=new Set(), born=new Map(), used=new Set(); // born: key -> 'cap'|'other'
const Z=()=>({cap:0,capNoSrc:0,inChem:0,hop:[0,0,0,0,0],abRank:0,abZero:0,dE:0,inParent:0,repeat:0,newKey:0,subs:new Set(),keys:new Set()});
let W=Z(), rowsW=[], out=[];
w.bodyBirth=function(c,t){ pend=null; oBB(c,t); const p=pend; pend=null;
  if(p&&p.done&&p.q>=0&&p.t>=0){ const k=p.q*256+p.t; W.cap++; W.subs.add(p.q); W.keys.add(k);
    const sp=new Set(); let inPar=false; for(let i=0;i<w.bn[c];i++){ const kk=w.bd[c*M+i]; if(kk===k)inPar=true; for(const s of seq(kk))sp.add(s); }
    if(inPar)W.inParent++; if(seen.has(k))W.repeat++; else { W.newKey++; born.set(k,'cap'); }
    // hop distance from parent's chemistry (0 = in it); empty body counts as hop 4+
    let h=4; if(sp.has(p.q))h=0; else if(sp.size){ let fr=[...sp], vis=new Set(sp); for(let d=1;d<4&&h===4;d++){ const nx=[]; for(const u of fr)for(const v of adj[u])if(!vis.has(v)){ if(v===p.q){h=d;break;} vis.add(v); nx.push(v); } fr=nx; } }
    W.hop[h]++; if(h===0)W.inChem++;
    const v=w.mol[p.q*C+c]; let rk=0; for(let s=0;s<S;s++) if(w.mol[s*C+c]>v)rk++; W.abRank+=rk/S; if(!(v>1e-6))W.abZero++; W.dE+=w.eMol[p.q]-w.eMol[p.t]; }
  else if(p&&p.q<0)W.capNoSrc++;
  for(let i=0;i<w.bn[t];i++){ const k=w.bd[t*M+i]; if(!seen.has(k)){ seen.add(k); if(!born.has(k))born.set(k,'other'); } } };
const div=()=>{ const liv=[]; for(let c=0;c<C;c++) if(w.alive[c])liv.push(c); const m=new Map(), sp=new Set(); const sets=[];
  for(const c of liv){ const ks=[]; for(let i=0;i<w.bn[c];i++){ ks.push(w.bd[c*M+i]); for(const s of seq(w.bd[c*M+i]))sp.add(s); } ks.sort((a,b)=>a-b); const id=ks.join(','); m.set(id,(m.get(id)||0)+1); sets.push(new Set(ks)); }
  let H=0, top=0; for(const v of m.values()){ const p=v/liv.length; H-=p*Math.log(p); top=Math.max(top,p); }
  let J=0, nJ=0; for(let i=0;i<200&&liv.length>1;i++){ const a=sets[(Math.random()*sets.length)|0], b=sets[(Math.random()*sets.length)|0]; if(!a.size&&!b.size)continue; let I=0; for(const x of a)if(b.has(x))I++; J+=I/(a.size+b.size-I); nJ++; }
  return {sets:m.size,effN:Math.exp(H),top,jac:nJ?J/nJ:0,species:sp.size}; };
console.log('window end | captures | distinct capture substrates | distinct capture keys | repeat-capture rate (key seen before) | redundant (key already in parent) | substrate in parent chemistry (hop0) | hop1/hop2/hop3+ | mean abundance rank of substrate in cell (0=most) | substrate absent in cell | mean energy step | new capture keys | new USED keys this window (cap/other) | distinct body sets | effective body sets exp(H) | top body share | mean pairwise Jaccard | species in bodies | fnGenoN | N | body size | catalyst kinds | pathway share of body catalysts | mean pathway length | body share of chem income');
let dv=[];
for(let s=1;s<=T;s++){ w.step(); if(s%1000===0){ rowsW.push(w.sample()); dv.push(div()); }
  if(s%WIN===0){ const inc=new Map(), car=new Map(); for(const r of rowsW){ for(const [k,v] of r.body.bU)inc.set(k,(inc.get(k)||0)+v/rowsW.length); for(const [k,v] of r.body.bC)car.set(k,(car.get(k)||0)+v/rowsW.length); }
    const u=new Set([...[...inc].filter(([k,v])=>v>=0.01).map(([k])=>k),...[...car].filter(([k,v])=>v>=0.01).map(([k])=>k)]); let nc=0, no=0; for(const k of u) if(!used.has(k)){ used.add(k); if(born.get(k)==='cap')nc++; else no++; }
    const mm=(a,f)=>a.reduce((x,y)=>x+f(y),0)/a.length, n=Math.max(1,W.cap);
    const row={t:s,cap:W.cap,subs:W.subs.size,keys:W.keys.size,repeat:W.repeat/n,inParent:W.inParent/n,hop0:W.hop[0]/n,hop1:W.hop[1]/n,hop2:W.hop[2]/n,hop3:W.hop[3]/n+W.hop[4]/n,abRank:W.abRank/n,abZero:W.abZero/n,dE:W.dE/n,newCap:W.newKey,newUsedCap:nc,newUsedOther:no,
      sets:mm(dv,d=>d.sets),effN:mm(dv,d=>d.effN),top:mm(dv,d=>d.top),jac:mm(dv,d=>d.jac),species:mm(dv,d=>d.species),fnGenoN:mm(rowsW,r=>r.fnGenoN),N:mm(rowsW,r=>r.N),size:mm(rowsW,r=>r.body.size),kinds:mm(rowsW,r=>r.body.kinds),chainShare:mm(rowsW,r=>r.body.chainShare||0),chainLen:mm(rowsW,r=>r.body.chainLen||0),inc:rowsW.reduce((x,r)=>x+r.body.inc,0),metab:rowsW.reduce((x,r)=>x+r.body.metab,0)};
    out.push(row); const f=x=>(100*x).toFixed(1)+'%';
    console.log(`${s} | ${row.cap} | ${row.subs} | ${row.keys} | ${f(row.repeat)} | ${f(row.inParent)} | ${f(row.hop0)} | ${f(row.hop1)}/${f(row.hop2)}/${f(row.hop3)} | ${row.abRank.toFixed(3)} | ${f(row.abZero)} | ${row.dE.toFixed(3)} | ${row.newCap} | ${nc+no} (${nc}/${no}) | ${row.sets.toFixed(0)} | ${row.effN.toFixed(1)} | ${row.top.toFixed(3)} | ${row.jac.toFixed(3)} | ${row.species.toFixed(0)} | ${row.fnGenoN.toFixed(0)} | ${row.N.toFixed(0)} | ${row.size.toFixed(2)} | ${row.kinds.toFixed(0)} | ${f(row.chainShare)} | ${row.chainLen.toFixed(2)} | ${f(row.inc/Math.max(1e-9,row.inc+row.metab))}`);
    W=Z(); rowsW=[]; dv=[]; } }
let ec=0, uc=0, eo=0, uo=0; for(const [k,o] of born){ if(o==='cap'){ ec++; if(used.has(k))uc++; } else { eo++; if(used.has(k))uo++; } }
const tot={capKeys:ec,capUsed:uc,capUsedFrac:uc/Math.max(1,ec),otherKeys:eo,otherUsed:uo,otherUsedFrac:uo/Math.max(1,eo),seen:seen.size};
console.log('TOTAL '+JSON.stringify(tot)); if(E.OUT)fs.writeFileSync(E.OUT,JSON.stringify({opts:P===undefined?0:JSON.parse(E.OPTS),seed:+E.SEED,rows:out,tot}));
