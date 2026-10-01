// lab/core-invade.js - INVASION FITNESS inside the evolved community: does a later challenger grow when rare, in the world
// it actually arose in? The fresh-world assay (core-assay.js) cannot credit an adaptation that pays only among its own
// community, and #285e found many take-overs that lose a fresh-world replay. Here the save at time S is loaded, and for each
// functional genotype first adaptive after S (core-geno's rule, judged against the neutral population), FRAC of the living
// are given its program, tag and template (energy and place kept) and labelled; the label rides each birth and move. The
// world runs T ticks with mutation on, as it was. Score: the labelled share at the end over the share at the start.
// NULL: FRAC of the living labelled with their programs untouched - a random sample of the residents, whose expected growth
// is 1 (drift aside). A challenger INVADES when a Welch t of its REPS scores against the null's is above 2.2. (The save's
// commonest genotype, transplanted the same way, is reported beside it: on seed 1 it shrank to 0-16% in 3,000 ticks, an
// incumbent at the end of its reign, so it is no yardstick.)
//   LOAD=f.1.c4.json LOG=f.1.all.jsonl WIN=60 REPS=4 T=6000 FRAC=0.05 PICK=8 node lab/core-invade.js
'use strict';
const fs=require('fs'); const {World,fnHash,fnHashList,NEUTRAL0,NEUTRAL0_CHEM}=require('./oee-core.js');
const E=process.env, WIN=+(E.WIN||60), REPS=+(E.REPS||4), T=+(E.T||6000), FRAC=+(E.FRAC||0.05), PICK=+(E.PICK||8);
const saveTxt=fs.readFileSync(E.LOAD,'utf8'); const w0=World.load(saveTxt), S=w0.tick, N0=w0.n0;
const rows=fs.readFileSync(E.LOG,'utf8').trim().split('\n').map(l=>{try{return JSON.parse(l)}catch(e){return null}}).filter(r=>r&&r.N>0&&r.fnGeno);
const rep=new Map(); for(const r of rows) for(const [h,v] of Object.entries(r.fnNew||{})) if(!rep.has(+h))rep.set(+h,v);
const decode=s=>{ const [hex,tag,tmpl]=s.split('|'); const p=[]; for(let i=0;i<hex.length;i+=4)p.push([parseInt(hex.slice(i,i+2),16),parseInt(hex.slice(i+2,i+4),16)]); return {prog:p,tag:+tag,tmpl:+tmpl}; };
// challengers: functional genotypes first adaptive (beating the neutral bar) in a window that starts after the save
const ever=new Set(), ch=[];
for(let a=0;a+WIN<=rows.length;a+=WIN){ const W=rows.slice(a,a+WIN), m=new Map(), na=new Map();
  for(const r of W){ for(const [g,c] of r.fnGeno) m.set(g,(m.get(g)||0)+c/r.N/W.length); for(const [g,c] of r.fnNeutral) na.set(g,(na.get(g)||0)+c/Math.max(1,r.fnNeutralN)/W.length); }
  let bar=0; for(const v of na.values()) if(v>bar)bar=v;
  for(const [g,v] of m) if(v>bar&&!ever.has(g)){ ever.add(g); if(W[0].t>S)ch.push({g,t:W[0].t}); } }
// the incumbent: the save's commonest functional genotype, with one living carrier as its representative
const L=w0.p.MAXLEN*2, cnt=new Map(), cell=new Map(); for(let c=0;c<w0.C;c++) if(w0.alive[c]){ const h=fnHash(w0.prog,c*L,w0.len[c],N0); cnt.set(h,(cnt.get(h)||0)+1); if(!cell.has(h))cell.set(h,c); }
const incH=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0][0], ic=cell.get(incH); const INC={prog:[],tag:w0.tag[ic],tmpl:w0.tmpl[ic]}; for(let i=0;i<w0.len[ic];i++)INC.prog.push([w0.prog[ic*L+i*2],w0.prog[ic*L+i*2+1]]);
// run(G,k): G is the genotype transplanted into FRAC of the living; with G null the residents are labelled unchanged.
function run(G,k){ const w=World.load(saveTxt); w.rnd.s=(w.rnd.s^Math.imul(k+1,0x9e3779b1))|0; const lab=new Uint8Array(w.C);
  const od=w.divide, om=w.moveOrg;
  w.divide=function(c){ let t=-1; const f0=this.face[c]; for(let q=0;q<8;q++){ const n=this.ahead(c,f0+q); if(!this.alive[n]){ t=n; break; } } const b0=this.ev.births; const r=od.call(this,c); if(this.ev.births>b0&&t>=0)lab[t]=lab[c]; return r; };
  w.moveOrg=function(x,y){ lab[y]=lab[x]; return om.call(this,x,y); };
  const liv=[]; for(let c=0;c<w.C;c++) if(w.alive[c])liv.push(c); const n=Math.max(1,Math.round(liv.length*FRAC)); let r=k*7919+13;
  for(let i=0;i<n;i++){ r=(Math.imul(r,1103515245)+12345)>>>0; const j=i+(r%(liv.length-i)); const t=liv[i]; liv[i]=liv[j]; liv[j]=t; const c=liv[i];
    if(G){ const o=c*L; w.len[c]=G.prog.length; for(let q=0;q<G.prog.length;q++){ w.prog[o+q*2]=G.prog[q][0]; w.prog[o+q*2+1]=G.prog[q][1]; } w.pc[c]=0; w.tag[c]=G.tag; w.tmpl[c]=G.tmpl; } lab[c]=1; }
  const s0=n/liv.length; for(let s=0;s<T;s++)w.step(); let N=0, one=0; for(let c=0;c<w.C;c++) if(w.alive[c]){ N++; one+=lab[c]; } return N?(one/N)/s0:0; }
const stat=(t,n)=>{ const m=t.reduce((x,y)=>x+y,0)/t.length, nm=n.reduce((x,y)=>x+y,0)/n.length, vt=t.reduce((x,y)=>x+(y-m)**2,0)/(t.length-1), vn=n.reduce((x,y)=>x+(y-nm)**2,0)/(n.length-1); return {m,nm,tt:(m-nm)/Math.sqrt((vt+vn)/t.length||1e-9)}; };
const nul=[], incG=[]; for(let k=0;k<REPS;k++){ nul.push(run(null,100+k)); incG.push(run(INC,100+k)); }
const step=Math.max(1,ch.length/PICK), pick=[]; for(let i=0;i<ch.length&&pick.length<PICK;i+=step)pick.push(ch[Math.floor(i)]);
console.log('==',E.LOAD.split('/').pop(),'save tick',S,'| challengers after the save',ch.length,'| replayed',pick.length,'| null (random residents) growth',nul.map(x=>x.toFixed(2)).join(' '),'| incumbent transplanted',incG.map(x=>x.toFixed(2)).join(' '));
let inv=0, lose=0, miss=0;
for(const e of pick){ if(!rep.has(e.g)){ miss++; continue; } const G=decode(rep.get(e.g)); if(fnHashList(G.prog,N0)!==e.g){ miss++; continue; }
  const sc=[]; for(let k=0;k<REPS;k++)sc.push(run(G,100+k)); const s=stat(sc,nul), v=s.tt>2.2?'INVADES':s.tt<-2.2?'FAILS':'tie'; if(v==='INVADES')inv++; if(v==='FAILS')lose++;
  console.log(`  first adaptive at t${e.t} len ${G.prog.length} | growth when rare ${s.m.toFixed(2)} [${sc.map(x=>x.toFixed(2)).join(' ')}] vs null ${s.nm.toFixed(2)} | t ${s.tt.toFixed(1)} ${v}`); }
console.log(`  invades ${inv} / fails ${lose} / tie ${pick.length-inv-lose-miss} / no representative ${miss}`);
