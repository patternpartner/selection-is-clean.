// lab/mind.js - a primitive mind inside the world (#293): a tiny neural language model over programs that knows nothing
// at the start and learns only from the world it lives in.
//
// What it sees: the program of every organism that manages to divide (the parent, as it was when it divided). Nothing
// else, ever: no human data, no goal, no reward signal beyond "this program just had a child". Programs that reproduce
// more appear in its data more often, so it learns the statistics of what reproduces here.
//
// What it does: when an organism divides, with probability P the mind writes one instruction of the child (a substitution
// or an insertion at a random position), sampled from what it has learned to expect after the instructions before it.
// Random mutation still happens as before; the mind is an extra, learned variation process. The world's selection still
// decides everything: a child the mind wrote lives or dies like any other.
//
// The model (Bengio et al. 2003, as small as it can be): each instruction is two tokens, its operation and its argument.
// The K tokens before a position are embedded (D numbers each), concatenated, passed through one tanh layer of H units, and
// read out by two softmax heads, one over operations and one over the 256 arguments. Trained online by plain SGD on
// random positions of programs in a ring buffer of recent parents.
//
// Controls use the same proposal rate: MODE 'frozen' keeps the random initial weights and never learns (a fixed, uninformed
// structure), MODE 'uniform' proposes uniformly random instructions (extra random mutation, no model at all).
'use strict';

function mulberry32(a){ const f=function(){ f.s|=0; f.s=f.s+0x6D2B79F5|0; let t=Math.imul(f.s^f.s>>>15,1|f.s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; f.s=a|0; return f; }

const MAXOPS=256, NARG=256, VOCAB=MAXOPS+NARG+1, BOS=MAXOPS+NARG;   // tokens: operation o is o, argument a is MAXOPS+a, BOS pads the start

class Mind{
  constructor(seed,o){ o=o||{};
    this.K=o.K||6; this.D=o.D||16; this.H=o.H||64; this.LR=o.LR||0.05; this.P=o.P??0.2; this.MODE=o.MODE||'learn';
    this.BUF=o.BUF||1024; this.EVERY=o.EVERY||50; this.STEPS=o.STEPS||100;
    this.rnd=mulberry32(((seed>>>0)||1)^0x6d696e64);   // its own random stream: it never draws from the world's
    const K=this.K, D=this.D, H=this.H, r=this.rnd, init=(n,s)=>{ const a=new Float32Array(n); for(let i=0;i<n;i++)a[i]=(r()*2-1)*s; return a; };
    this.emb=init(VOCAB*D,0.1); this.W1=init(K*D*H,1/Math.sqrt(K*D)); this.b1=new Float32Array(H);
    this.Wo=init(H*MAXOPS,1/Math.sqrt(H)); this.bo=new Float32Array(MAXOPS); this.Wa=init(H*NARG,1/Math.sqrt(H)); this.ba=new Float32Array(NARG);
    this.buf=[]; this.bufAt=0; this.lossO=0; this.lossA=0; this.nTrain=0; this.uses=0;
    this.x=new Float32Array(K*D); this.h=new Float32Array(H); this.p=new Float32Array(NARG); this.dh=new Float32Array(H); }

  // the K tokens before token position j of a program (an array of [op,arg]), padded with BOS
  ctx(prog,j,extra){ const K=this.K, c=new Array(K); for(let q=0;q<K;q++){ const t=j-K+q; c[q]=t<0?BOS:(t&1?MAXOPS+prog[t>>1][1]:prog[t>>1][0]); } if(extra!==undefined){ c.shift(); c.push(extra); } return c; }

  // forward pass to one head (arg=false: operations, the first nops of them; arg=true: arguments); fills this.p
  forward(c,arg,nops){ const K=this.K, D=this.D, H=this.H, x=this.x, h=this.h;
    for(let q=0;q<K;q++){ const e=c[q]*D; for(let d=0;d<D;d++)x[q*D+d]=this.emb[e+d]; }
    for(let u=0;u<H;u++){ let s=this.b1[u]; for(let i=0;i<K*D;i++)s+=x[i]*this.W1[i*H+u]; h[u]=Math.tanh(s); }
    const W=arg?this.Wa:this.Wo, b=arg?this.ba:this.bo, n=arg?NARG:nops, M=arg?NARG:MAXOPS, p=this.p; let mx=-Infinity;
    for(let v=0;v<n;v++){ let s=b[v]; for(let u=0;u<H;u++)s+=h[u]*W[u*M+v]; p[v]=s; if(s>mx)mx=s; }
    let z=0; for(let v=0;v<n;v++){ p[v]=Math.exp(p[v]-mx); z+=p[v]; } for(let v=0;v<n;v++)p[v]/=z; return n; }

  // one SGD step on predicting target (an operation, or an argument when arg) after context c; returns the loss
  learn(c,target,arg,nops){ const K=this.K, D=this.D, H=this.H, n=this.forward(c,arg,nops), p=this.p, h=this.h, x=this.x, lr=this.LR;
    const W=arg?this.Wa:this.Wo, b=arg?this.ba:this.bo, M=arg?NARG:MAXOPS, dh=this.dh; dh.fill(0); const loss=-Math.log(Math.max(1e-9,p[target]));
    for(let v=0;v<n;v++){ const g=p[v]-(v===target?1:0); b[v]-=lr*g; for(let u=0;u<H;u++){ dh[u]+=g*W[u*M+v]; W[u*M+v]-=lr*g*h[u]; } }
    for(let u=0;u<H;u++)dh[u]*=1-h[u]*h[u];
    for(let i=0;i<K*D;i++){ let gx=0; for(let u=0;u<H;u++){ gx+=dh[u]*this.W1[i*H+u]; this.W1[i*H+u]-=lr*dh[u]*x[i]; } const q=(i/D)|0, e=c[q]*D+(i%D); this.emb[e]-=lr*gx; }
    for(let u=0;u<H;u++)this.b1[u]-=lr*dh[u];
    return loss; }

  sample(arg,nops){ const r=this.rnd(), p=this.p, n=arg?NARG:nops; let a=0; for(let v=0;v<n;v++){ a+=p[v]; if(r<a)return v; } return n-1; }

  // the world tells it about a parent that divided
  see(prog){ const cp=prog.map(x=>[x[0],x[1]]); if(this.buf.length<this.BUF)this.buf.push(cp); else { this.buf[this.bufAt]=cp; this.bufAt=(this.bufAt+1)%this.BUF; } }

  // learning, every EVERY ticks: STEPS random token positions from the buffer
  train(nops){ if(this.MODE!=='learn'||this.buf.length<16)return; let lo=0, la=0, no=0, na=0;
    for(let s=0;s<this.STEPS;s++){ const pr=this.buf[(this.rnd()*this.buf.length)|0]; if(!pr.length)continue; const j=(this.rnd()*pr.length*2)|0, arg=(j&1)===1;
      const tgt=arg?pr[j>>1][1]:pr[j>>1][0]; if(!arg&&tgt>=nops)continue; const l=this.learn(this.ctx(pr,j),tgt,arg,nops); if(arg){ la+=l; na++; } else { lo+=l; no++; } }
    const a=0.98; if(no)this.lossO=this.nTrain?a*this.lossO+(1-a)*lo/no:lo/no; if(na)this.lossA=this.nTrain?a*this.lossA+(1-a)*la/na:la/na; this.nTrain++; }

  // the mind writes into a child about to be born: returns true when it changed it
  propose(src,nops,maxlen){ if(!(this.P>0)||this.rnd()>=this.P)return false; this.uses++;
    const ins=src.length<maxlen&&(src.length===0||this.rnd()<0.4), i=(this.rnd()*(ins?src.length+1:src.length))|0;
    let op, arg;
    if(this.MODE==='uniform'){ op=(this.rnd()*nops)|0; arg=(this.rnd()*256)|0; }
    else { const c=this.ctx(src,2*i); this.forward(c,false,nops); op=this.sample(false,nops); this.forward(this.ctx(src,2*i,op),true,nops); arg=this.sample(true,nops); }
    if(ins)src.splice(i,0,[op,arg]); else src[i]=[op,arg]; return true; }

  report(nops){ return {mode:this.MODE,p:this.P,uses:this.uses,trained:this.nTrain,lossOp:+this.lossO.toFixed(3),lossArg:+this.lossA.toFixed(3),uniformOp:+Math.log(nops).toFixed(3),uniformArg:+Math.log(256).toFixed(3),buf:this.buf.length}; }

  save(){ const b=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
    return {K:this.K,D:this.D,H:this.H,LR:this.LR,P:this.P,MODE:this.MODE,BUF:this.BUF,EVERY:this.EVERY,STEPS:this.STEPS,rnd:this.rnd.s,emb:b(this.emb),W1:b(this.W1),b1:b(this.b1),Wo:b(this.Wo),bo:b(this.bo),Wa:b(this.Wa),ba:b(this.ba),
      buf:this.buf.map(p=>p.map(x=>x[0].toString(16).padStart(2,'0')+x[1].toString(16).padStart(2,'0')).join('')),bufAt:this.bufAt,lossO:this.lossO,lossA:this.lossA,nTrain:this.nTrain,uses:this.uses}; }
  static load(o){ const m=new Mind(1,o); m.rnd.s=o.rnd; const f=(k)=>{ const t=Buffer.from(o[k],'base64'); new Uint8Array(m[k].buffer).set(t); };
    for(const k of ['emb','W1','b1','Wo','bo','Wa','ba'])f(k);
    m.buf=o.buf.map(s=>{ const p=[]; for(let i=0;i<s.length;i+=4)p.push([parseInt(s.slice(i,i+2),16),parseInt(s.slice(i+2,i+4),16)]); return p; }); m.bufAt=o.bufAt; m.lossO=o.lossO; m.lossA=o.lossA; m.nTrain=o.nTrain; m.uses=o.uses; return m; }
}
module.exports={Mind};
