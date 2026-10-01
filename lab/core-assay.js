// lab/core-assay.js - HEAD-TO-HEAD COMPETITION for the functional genotypes core-geno calls new and adaptive.
// A genotype that outgrows the neutral population could still have spread by luck in a structured world, or ridden a
// background it shares with its rivals. This replays it: for each genotype first adaptive in window w, its INCUMBENT is
// the commonest functional genotype of window w-1. Both representatives (program, tag, template, as the run wrote them
// out) go into a fresh world, NPER each at random cells, mutation off, for T ticks; the challenger's share of the living
// at the end is the score. The NULL is the incumbent against itself, told apart by a label that rides each birth and
// move and touches nothing else. A challenger WINS when a Welch t of its REPS shares against the null's REPS shares is above
// 2.2 (LOSES below -2.2); STRICT also asks that its mean beat every null replicate. The null is wide (sd about 0.17 at
// T=3000: drift in a structured world, not founding - placing each challenger next to an incumbent did not narrow it).
//   WIN=60 REPS=6 T=3000 NPER=200 [PICK=8] [Q=4] node lab/core-assay.js seed.all.jsonl
//   a chemistry run: OPTS='{"CHEM":1,"CHEM_SEED":2}' ... (the representatives' functional hashes use the run's neutral boundary)
// PICK caps how many challengers are replayed in each of Q equal parts of the run (evenly spaced), so the cost is bounded.
// VIRUS_REPLAY=1 (a CHEM+VIRUS run, OPTS with CHEM and VIRUS): each pair is replayed twice - with the viruses that were
// circulating in the incumbent's window (its three commonest keys, 100 virions each, keys fixed, no immigrants), and with
// no virus - each against its own self-vs-self null. A challenger that wins only with the virus present was selected as
// an escape (#287; the design follows Meyer et al. 2012).
'use strict';
const fs=require('fs'); const {World,fnHashList,NEUTRAL0,NEUTRAL0_CHEM}=require('./oee-core.js');
const E=process.env, WIN=+(E.WIN||60), REPS=+(E.REPS||6), T=+(E.T||3000), NPER=+(E.NPER||200), PICK=+(E.PICK||8), Q=+(E.Q||4);
const NOMUT=Object.assign(E.OPTS?JSON.parse(E.OPTS):{},{MU_SUB:0,MU_INS:0,MU_DEL:0,MU_TAG:0});   // OPTS: the run's own options; under CHEM give CHEM_SEED the run's seed so the replay has its reaction network
const N0=NOMUT.CHEM?NEUTRAL0_CHEM:NEUTRAL0;
const decode=s=>{ const [hex,tag,tmpl]=s.split('|'); const p=[]; for(let i=0;i<hex.length;i+=4)p.push([parseInt(hex.slice(i,i+2),16),parseInt(hex.slice(i+2,i+4),16)]); return {prog:p,tag:+tag,tmpl:+tmpl}; };

// one competition: a (label 1) against b (label 0); returns label 1's share of the living after T ticks
function compete(a,b,seed,xo){
  const w=new World(seed,xo?Object.assign({},NOMUT,xo):NOMUT); w.alive.fill(0); w.E.fill(0); const lab=new Uint8Array(w.C);
  const od=w.divide, om=w.moveOrg;
  w.divide=function(c){ let t=-1; const f0=this.face[c]; for(let k=0;k<8;k++){ const n=this.ahead(c,f0+k); if(!this.alive[n]){ t=n; break; } } const b0=this.ev.births; const r=od.call(this,c); if(this.ev.births>b0&&t>=0)lab[t]=lab[c]; return r; };
  w.moveOrg=function(x,y){ lab[y]=lab[x]; return om.call(this,x,y); };
  const r=w.rnd; for(const [g,L] of [[a,1],[b,0]]){ let k=0, guard=0; while(k<NPER&&guard++<1e6){ const c=(r()*w.C)|0; if(w.alive[c])continue; w.place(c,g.prog.map(x=>x.slice()),1.0,g.tag,g.tmpl,0); lab[c]=L; k++; } }
  for(let s=0;s<T;s++){ w.step(); if(w.reseeds)return 0.5; }   // both lines died out: no information either way
  let n=0, one=0; for(let c=0;c<w.C;c++) if(w.alive[c]){ n++; one+=lab[c]; } return n?one/n:NaN;
}

for(const f of process.argv.slice(2)){
  const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.fnGeno);
  const rep=new Map(); for(const r of rows) for(const [h,v] of Object.entries(r.fnNew||{})) if(!rep.has(+h))rep.set(+h,v);
  const ever=new Set(), events=[]; let prevTop=null, prevKeys=[];
  for(let w0=0;w0+WIN<=rows.length;w0+=WIN){ const W=rows.slice(w0,w0+WIN), a=new Map(), na=new Map();
    for(const r of W){ for(const [g,c] of r.fnGeno) a.set(g,(a.get(g)||0)+c/r.N/W.length); for(const [g,c] of r.fnNeutral) na.set(g,(na.get(g)||0)+c/Math.max(1,r.fnNeutralN)/W.length); }
    let bar=0; for(const v of na.values()) if(v>bar)bar=v;
    let top=null, tv=-1; for(const [g,v] of a) if(v>tv){ tv=v; top=g; }
    for(const [g,v] of a) if(v>bar&&!ever.has(g)){ ever.add(g); if(prevTop!==null&&g!==prevTop)events.push({w:w0/WIN,t:W[0].t,g,inc:prevTop,share:v,keys:prevKeys}); }
    { const km=new Map(); for(const r of W) if(r.vir) for(const [k,n] of r.vir.top) km.set(k,(km.get(k)||0)+n); prevKeys=[...km.entries()].sort((x,y)=>y[1]-x[1]).slice(0,3).map(([k])=>k); }
    prevTop=top; }
  const nW=Math.floor(rows.length/WIN), chosen=[];
  for(let q=0;q<Q;q++){ const inQ=events.filter(e=>e.w>=q*nW/Q&&e.w<(q+1)*nW/Q); const step=Math.max(1,inQ.length/PICK); for(let i=0;i<inQ.length&&chosen.filter(e=>e.q===q).length<PICK;i+=step)chosen.push(Object.assign(inQ[Math.floor(i)],{q})); }
  console.log('==',f.split('/').pop(),'| windows',nW,'| new adaptive with an incumbent',events.length,'| replayed',chosen.length);
  const perQ=Array.from({length:Q},()=>({n:0,win:0,lose:0,miss:0})); const nulls=new Map();   // the null depends only on the incumbent
  for(const e of chosen){ const P=perQ[e.q]; if(!rep.has(e.g)||!rep.has(e.inc)){ P.miss++; console.log(`  w${e.w} t${e.t} challenger ${e.g} incumbent ${e.inc}: no representative`); continue; }
    const A=decode(rep.get(e.g)), B=decode(rep.get(e.inc));
    if(fnHashList(A.prog,N0)!==e.g||fnHashList(B.prog,N0)!==e.inc){ P.miss++; console.log('  representative hash mismatch'); continue; }
    const VX=E.VIRUS_REPLAY?{V_SEED:e.keys,V_SEEDN:100,V_ONSET:1,V_MUT:0,V_IMMIG:0}:null;
    if(VX){ const off={VIRUS:0}, tO=[], nO=[], tV=[], nV=[]; for(let k=0;k<REPS;k++){ tO.push(compete(A,B,7001+k,off)); nO.push(compete(B,B,9001+k,off)); tV.push(compete(A,B,7001+k,VX)); nV.push(compete(B,B,9001+k,VX)); }
      const st=(t,n)=>{ const m=t.reduce((x,y)=>x+y,0)/REPS, nm=n.reduce((x,y)=>x+y,0)/REPS, vt=t.reduce((x,y)=>x+(y-m)**2,0)/(REPS-1), vn=n.reduce((x,y)=>x+(y-nm)**2,0)/(REPS-1), tt=(m-nm)/Math.sqrt((vt+vn)/REPS||1e-9); return {m,nm,tt,v:tt>2.2?'WIN':tt<-2.2?'LOSE':'tie'}; };
      const sv=st(tV,nV), so=st(tO,nO); P.n++; if(sv.v==='WIN')P.win++; if(sv.v==='LOSE')P.lose++; if(sv.v==='WIN'&&so.v!=='WIN')P.strict=(P.strict||0)+1;
      console.log(`  q${e.q+1} w${e.w} t${e.t} keys ${e.keys.join('/')} | WITH VIRUS challenger ${sv.m.toFixed(2)} null ${sv.nm.toFixed(2)} t ${sv.tt.toFixed(1)} ${sv.v} | NO VIRUS challenger ${so.m.toFixed(2)} null ${so.nm.toFixed(2)} t ${so.tt.toFixed(1)} ${so.v}${sv.v==='WIN'&&so.v!=='WIN'?' | ESCAPE':''}`); continue; }
    if(!nulls.has(e.inc)){ const nl=[]; for(let k=0;k<REPS;k++)nl.push(compete(B,B,9001+k)); nulls.set(e.inc,nl); }
    const test=[], nul=nulls.get(e.inc); for(let k=0;k<REPS;k++)test.push(compete(A,B,7001+k));
    const m=test.reduce((x,y)=>x+y,0)/REPS, nmax=Math.max(...nul), nmin=Math.min(...nul), nm=nul.reduce((x,y)=>x+y,0)/REPS;
    const vt=test.reduce((x,y)=>x+(y-m)**2,0)/(REPS-1), vn=nul.reduce((x,y)=>x+(y-nm)**2,0)/(REPS-1), tt=(m-nm)/Math.sqrt((vt+vn)/REPS||1e-9);
    const verdict=tt>2.2?'WIN':tt<-2.2?'LOSE':'tie', strict=m>nmax?' STRICT':''; P.n++; if(verdict==='WIN')P.win++; if(verdict==='LOSE')P.lose++; if(strict)P.strict=(P.strict||0)+1;
    console.log(`  q${e.q+1} w${e.w} t${e.t} len ${A.prog.length} vs ${B.prog.length} | challenger share ${m.toFixed(3)} [${test.map(x=>x.toFixed(2)).join(' ')}] | null mean ${nm.toFixed(2)} range ${nmin.toFixed(2)}-${nmax.toFixed(2)} | t ${tt.toFixed(1)} ${verdict}${strict}`); }
  console.log(E.VIRUS_REPLAY?'  per quarter (replayed / win with virus / lose with virus / escape = wins only with the virus / no rep): ':'  per quarter (replayed / win / lose / strict win / no rep): '+perQ.map((P,q)=>`Q${q+1} ${P.n}/${P.win}/${P.lose}/${P.strict||0}/${P.miss}`).join('  '));
}
