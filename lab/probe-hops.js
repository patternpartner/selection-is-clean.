// lab/probe-hops.js - step 1 after #344 (the user's design): how deep do PAID functions sit in the chain of reads, when in the epoch
// is the payment slot spent, and does the sub-1% tail hold the deeper functions? Loads a saved four-input world (DEPTH on) and runs
// on, drawing nothing beyond the world's own. Uses the core's own composition depth (Rd: INPUT 0, a read word = its publisher's
// depth + 1, NAND the deeper operand; data flow, so an UPPER bound - a read washed out by NAND's controlling 0 still counts).
// Per paid output: its function, depth (0, 1, 2, 3+), income and epoch tick (tick % TASK_EPOCH).
// EXACT depth (the user's controlling-zero rule, per bit): each register keeps 32 depths. INPUT 0; a read word = its publisher's
// per-bit depths + 1; NAND per bit: one operand 0 -> that operand's depth, both 0 -> the smaller, both 1 -> the larger; GET/MOV copy;
// any other change 0. An output's exact depth is its deepest bit. Reported beside the data-flow depth.
// CLIMBING depth (the user's guard; a LOWER bound that no cycle can inflate): every published word carries a climb. An output's climb
// is the largest climb(w)+1 over this epoch's read words w feeding it (data flow, as lab/probe-twowire.js) for which the output's
// exact circuit size is strictly larger than w's; a read that does not climb contributes 0, not its climb. So climb(w) <= gates(w)-1.
// A read word that is not a function, or a step between two 10+ words, cannot be ranked and contributes 0.
// Also (the user's two mechanisms after #344): income at climb >= 2 by epoch tick (tenths), and the pools' fill (level / cap,
// income-weighted over the window's paid functions, split >= 1% / < 1%) at the first and the last tick of each epoch.
// TWO-WIRE GAIN (the user's check after #345's pre-registration): for paid outputs fed by 2+ distinct read words that are functions,
// gates(out) - max_j gates(w_j), income-weighted and counted (10+ as 10). Positive = harder than the hardest wire gated.
// Reported: income by depth; income by depth x share band (the function's share of the probe window's income: >= 1% / < 1%) with
// the income-weighted mean circuit size; the epoch tick at which the paying output came, by depth; and per function the share of
// its payments made at depth 0 (for internalisation: compare saves from early and late in one run).
//   LOAD=lab/out-epay/7701_o1.7.save [WARM=2000] [TICKS=5000] node lab/probe-hops.js
'use strict';
const fs=require('fs'); const {World}=require('./oee-core-tasks.js'); const {CSZ4}=require('./core-tasks4.js');
const E=process.env, w=World.load(fs.readFileSync(E.LOAD,'utf8')), EP=w.p.TASK_EPOCH;
if(!w.Rd) throw new Error('needs DEPTH');
const C=w.C, BD=new Uint8Array(C*4*32), PD=new Uint8Array(C*32), byX=[0,0,0,0], bandX={hi:[0,0,0,0],lo:[0,0,0,0]};
const dA=w.depthAfter.bind(w);
w.depthAfter=function(b,op,arg,before){ bnd(); dA(b,op,arg,before); const s=b+(arg&3), R=this.R, B=b*32, S=s*32;
  if(op===28){ const t=b+(this.p.READ_REG?((arg>>3)&3):0), v=R[t]>>>0, a=this.ahead(b>>2,this.face[b>>2]+(this.p.READ_DIR?arg:0)); RS[t]=v?[[v,PC[a]]]:[]; } else if(op===26){ const m=new Map(); for(const x of RS[b].concat(RS[s]))m.set(x[0],x); RS[b]=[...m.values()].slice(0,4); } else if(op===27)RS[b]=RS[s].slice(); else if(op===2)RS[s]=RS[b].slice(); else { for(let k=0;k<4;k++) if(R[b+k]!==before[k]) RS[b+k]=[]; }
  if(op===24){ BD.fill(0,B,B+32); return; }
  if(op===28){ const t=b+(this.p.READ_REG?((arg>>3)&3):0), T32=t*32, v=R[t]>>>0, a=this.ahead(b>>2,this.face[b>>2]+(this.p.READ_DIR?arg:0)); if(v){ for(let i=0;i<32;i++)BD[T32+i]=Math.min(255,PD[a*32+i]+1); } else BD.fill(0,T32,T32+32); return; }
  if(op===26){ const x=before[0]>>>0, y=before[s-b]>>>0; for(let i=0;i<32;i++){ const xa=(x>>>i)&1, yb=(y>>>i)&1, da=BD[B+i], db=BD[S+i]; BD[B+i]=(!xa&&yb)?da:(xa&&!yb)?db:(!xa&&!yb)?Math.min(da,db):Math.max(da,db); } return; }
  if(op===27){ BD.copyWithin(B,S,S+32); return; } if(op===2){ BD.copyWithin(S,B,B+32); return; }
  for(let k=0;k<4;k++) if(R[b+k]!==before[k]) BD.fill(0,(b+k)*32,(b+k)*32+32); };
const tbx=w.taskBirth.bind(w); w.taskBirth=function(c){ tbx(c); BD.fill(0,c*128,c*128+128); for(let k=0;k<4;k++)RS[c*4+k]=[]; PC[c]=0; };
const RS=Array.from({length:C*4},()=>[]), PC=new Uint8Array(C), byCl=[0,0,0,0], bandCl={hi:[0,0,0,0],lo:[0,0,0,0]}; let ep=w.epoch();
const bnd=()=>{ const e=w.epoch(); if(e!==ep){ ep=e; for(let r=0;r<C*4;r++)RS[r]=[]; } };
const gates=v=>{ const T=w.fn4(v); return T<0?-1:Math.min(10,CSZ4[T]); };
const gain2=new Map(), gain2n=new Map(); let gain2g=0;
const climbTick=new Float64Array(10), fill={first:{hi:0,lo:0,n:0},last:{hi:0,lo:0,n:0}};
const per=new Map(); let on=false; const tickBins=Array.from({length:4},()=>new Float64Array(10));
const orig=w.taskOut;
w.taskOut=function(c,v){ const d=Math.min(3,this.Rd[c*4]); let xd=0; for(let i=0;i<32;i++){ const q=BD[c*128+i]; if(q>xd)xd=q; } xd=Math.min(3,xd); PD.set(BD.subarray(c*128,c*128+32),c*32); bnd(); const go=gates(v); let mg=-1, nf=0; for(const [wi] of RS[c*4]){ const gi=gates(wi); if(gi>=0){ nf++; if(gi>mg)mg=gi; } } const g2=(nf>=2&&go>=0)?go-mg:null; let cl=0; if(go>0&&go<10) for(const [wi,ci] of RS[c*4]){ const gi=gates(wi); if(gi>=0&&go>gi)cl=Math.max(cl,ci+1); } PC[c]=Math.min(255,cl); const cl3=Math.min(3,cl); const b=this.E[c]; orig.call(this,c,v); const g=this.E[c]-b; if(!(g>0)||!on)return;
  const T=this.fn4(v); let p=per.get(T); if(!p){ p={g:0,n:0,byD:[0,0,0,0],byX:[0,0,0,0],byC:[0,0,0,0]}; per.set(T,p); } p.g+=g; p.n++; p.byD[d]+=g; p.byX[xd]+=g; p.byC[cl3]+=g; if(g2!==null){ gain2.set(g2,(gain2.get(g2)||0)+g); gain2n.set(g2,(gain2n.get(g2)||0)+1); gain2g+=g; } if(cl>=2)climbTick[Math.floor((this.tick%EP)/(EP/10))]+=g; tickBins[d][Math.floor((this.tick%EP)/(EP/10))]+=g; };
for(let s=0;s<+(E.WARM||2000);s++) w.step(); on=true;
const fillAt=key=>{ if(!per.size)return; let t=0; for(const p of per.values())t+=p.g; let hi=0,lo=0,gh=0,gl=0; for(const [T,p] of per){ const f=w.tres[T]/w.tcap[T]; if(p.g/t>=0.01){ hi+=p.g*f; gh+=p.g; } else { lo+=p.g*f; gl+=p.g; } } const F=fill[key]; F.hi+=gh?hi/gh:0; F.lo+=gl?lo/gl:0; F.n++; };
for(let s=0;s<+(E.TICKS||5000);s++){ w.step(); const et=w.tick%EP; if(et===0)fillAt('first'); else if(et===EP-1)fillAt('last'); }
let tot=0; for(const p of per.values()) tot+=p.g;
const byD=[0,0,0,0], band={hi:{g:0,byD:[0,0,0,0],cs:0,nf:0}, lo:{g:0,byD:[0,0,0,0],cs:0,nf:0}};
for(const [T,p] of per){ const b=p.g/tot>=0.01?band.hi:band.lo; b.g+=p.g; b.nf++; b.cs+=p.g*Math.min(10,CSZ4[T]); for(let k=0;k<4;k++){ b.byD[k]+=p.byD[k]; byD[k]+=p.byD[k]; byX[k]+=p.byX[k]; (b===band.hi?bandX.hi:bandX.lo)[k]+=p.byX[k]; byCl[k]+=p.byC[k]; (b===band.hi?bandCl.hi:bandCl.lo)[k]+=p.byC[k]; } }
const sh=(a,t)=>a.map(x=>+(x/Math.max(1e-9,t)).toFixed(3));
const H=-[...per.values()].reduce((a,p)=>{ const q=p.g/tot; return a+q*Math.log(q); },0);
console.log(JSON.stringify({load:E.LOAD.split('/').slice(-2).join('/'), epay:w.p.TASK_EPAY||0, functionsPaid:per.size, effectiveFunctions:+Math.exp(H).toFixed(1),
  incomeByDepth_0_1_2_3plus:sh(byD,tot), incomeByExactDepth_0_1_2_3plus:sh(byX,tot), incomeByClimb_0_1_2_3plus:sh(byCl,tot),
  band1pct:{functions:band.hi.nf, incomeShare:+(band.hi.g/tot).toFixed(3), byDepth:sh(band.hi.byD,band.hi.g), byExactDepth:sh(bandX.hi,band.hi.g), byClimb:sh(bandCl.hi,band.hi.g), meanCircuit:+(band.hi.cs/Math.max(1e-9,band.hi.g)).toFixed(2)},
  bandBelow1pct:{functions:band.lo.nf, incomeShare:+(band.lo.g/tot).toFixed(3), byDepth:sh(band.lo.byD,band.lo.g), byExactDepth:sh(bandX.lo,band.lo.g), byClimb:sh(bandCl.lo,band.lo.g), meanCircuit:+(band.lo.cs/Math.max(1e-9,band.lo.g)).toFixed(2)},
  epochTickTenths_byDepth:tickBins.map(a=>sh([...a],a.reduce((x,y)=>x+y,0))),
  twoWireGain:{incomeShareOfAll:+(gain2g/tot).toFixed(4), byGain:[...gain2.entries()].sort((a,b)=>a[0]-b[0]).map(([d,x])=>[d,+(x/Math.max(1e-9,gain2g)).toFixed(3),gain2n.get(d)])},
  climb2plusByEpochTickTenth:sh([...climbTick],climbTick.reduce((x,y)=>x+y,0)),
  poolFill:{epochFirstTick:{band1pct:+(fill.first.hi/Math.max(1,fill.first.n)).toFixed(3), below1pct:+(fill.first.lo/Math.max(1,fill.first.n)).toFixed(3)}, epochLastTick:{band1pct:+(fill.last.hi/Math.max(1,fill.last.n)).toFixed(3), below1pct:+(fill.last.lo/Math.max(1,fill.last.n)).toFixed(3)}},
  depth0ShareTop:[...per.entries()].sort((a,b)=>b[1].g-a[1].g).slice(0,12).map(([T,p])=>T.toString(16)+'/c'+CSZ4[T]+':'+(p.byD[0]/p.g).toFixed(2))}));
