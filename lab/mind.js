// lab/mind.js - a primitive mind inside the world (#293): a tiny neural language model over programs that knows nothing
// at the start and learns only from the world it lives in.
//
// What it sees: the program of every organism that manages to divide (the parent, as it was when it divided). Nothing
// else, ever: no human data, no goal, no reward signal beyond "this program just had a child". Programs that reproduce
// more appear in its data more often, so it learns the statistics of what reproduces here.
//
// What it does: when an organism divides, with probability P the mind rewrites one instruction of the child at a random
// position, sampled from what it has learned to expect after the instructions before it (always a different instruction).
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
    // CURIOSITY (v4), both off by default: NOVEL=b writes instructions in proportion to p^-b, what it does NOT expect (b>0),
    // instead of p, what it does; WHERE='uncertain' picks the place to change in proportion to the square of its own
    // uncertainty there (the entropy of what it predicts), instead of anywhere at random.
    this.NOVEL=o.NOVEL||0; this.WHERE=o.WHERE||'random';
    // GROWTH (#295b), off by default: GROW=g TRIES g more hidden units whenever the world outgrows it, that is when its loss
    // (operations plus arguments) has risen TOL above the lowest it reached since it last tried, up to HMAX units. New units
    // start with random input weights and zero output weights, so growing changes nothing it predicts until it learns to use
    // them. The learning rate is scaled by H0/H (H0 the size it started at): an SGD step moves the output in proportion to
    // the number of hidden units, so without this a mind twice as big learns twice as jumpily (#295's first version did
    // that, got worse with every unit, and grew itself to the cap). A try is a TRIAL of TRIAL trainings: on every example
    // the loss is also taken with the new units switched off, and at the end the new units are KEPT only if the loss with
    // them is lower, otherwise removed. PER (#295), off by default: train PER steps per example seen since the last
    // training (at most STEPS) instead of STEPS always, so a mind that sees one lineage's few divisions does not train its
    // handful of memories to death.
    this.GROW=o.GROW||0; this.HMAX=o.HMAX||128; this.TOL=o.TOL||0.1; this.TRIAL=o.TRIAL||40; this.H0=o.H0||this.H; this.lossMin=Infinity; this.grown=0; this.kept=0; this.trial=null; this.PER=o.PER||0; this.seen=0;
    this.rnd=mulberry32(((seed>>>0)||1)^0x6d696e64);   // its own random stream: it never draws from the world's
    const K=this.K, D=this.D, H=this.H, r=this.rnd, init=(n,s)=>{ const a=new Float32Array(n); for(let i=0;i<n;i++)a[i]=(r()*2-1)*s; return a; };
    this.emb=init(VOCAB*D,0.1); this.W1=init(K*D*H,1/Math.sqrt(K*D)); this.b1=new Float32Array(H);
    this.Wo=init(H*MAXOPS,1/Math.sqrt(H)); this.bo=new Float32Array(MAXOPS); this.Wa=init(H*NARG,1/Math.sqrt(H)); this.ba=new Float32Array(NARG);
    this.buf=[]; this.bufAt=0; this.lossO=0; this.lossA=0; this.nTrain=0; this.uses=0;
    this.x=new Float32Array(K*D); this.h=new Float32Array(H); this.p=new Float32Array(NARG); this.dh=new Float32Array(H); }

  // the K tokens before token position j of a program (an array of [op,arg]), padded with BOS
  ctx(prog,j,extra){ const K=this.K, c=new Array(K); for(let q=0;q<K;q++){ const t=j-K+q; c[q]=t<0?BOS:(t&1?MAXOPS+prog[t>>1][1]:prog[t>>1][0]); } if(extra!==undefined){ c.shift(); c.push(extra); } return c; }

  // forward pass to one head (arg=false: operations, the first nops of them; arg=true: arguments); fills this.p
  forward(c,arg,nops,upto){ const K=this.K, D=this.D, H=this.H, x=this.x, h=this.h, U=upto||H;   // upto: read out only the first upto units (a growth trial's switched-off comparison)
    for(let q=0;q<K;q++){ const e=c[q]*D; for(let d=0;d<D;d++)x[q*D+d]=this.emb[e+d]; }
    for(let u=0;u<H;u++){ let s=this.b1[u]; for(let i=0;i<K*D;i++)s+=x[i]*this.W1[i*H+u]; h[u]=Math.tanh(s); }
    const W=arg?this.Wa:this.Wo, b=arg?this.ba:this.bo, n=arg?NARG:nops, M=arg?NARG:MAXOPS, p=this.p; let mx=-Infinity;
    for(let v=0;v<n;v++){ let s=b[v]; for(let u=0;u<U;u++)s+=h[u]*W[u*M+v]; p[v]=s; if(s>mx)mx=s; }
    let z=0; for(let v=0;v<n;v++){ p[v]=Math.exp(p[v]-mx); z+=p[v]; } for(let v=0;v<n;v++)p[v]/=z; return n; }

  // one SGD step on predicting target (an operation, or an argument when arg) after context c; returns the loss
  learn(c,target,arg,nops){ const K=this.K, D=this.D, H=this.H, n=this.forward(c,arg,nops), p=this.p, h=this.h, x=this.x, lr=H===this.H0?this.LR:this.LR*this.H0/H;
    const W=arg?this.Wa:this.Wo, b=arg?this.ba:this.bo, M=arg?NARG:MAXOPS, dh=this.dh; dh.fill(0); const loss=-Math.log(Math.max(1e-9,p[target]));
    for(let v=0;v<n;v++){ const g=p[v]-(v===target?1:0); b[v]-=lr*g; for(let u=0;u<H;u++){ dh[u]+=g*W[u*M+v]; W[u*M+v]-=lr*g*h[u]; } }
    for(let u=0;u<H;u++)dh[u]*=1-h[u]*h[u];
    for(let i=0;i<K*D;i++){ let gx=0; for(let u=0;u<H;u++){ gx+=dh[u]*this.W1[i*H+u]; this.W1[i*H+u]-=lr*dh[u]*x[i]; } const q=(i/D)|0, e=c[q]*D+(i%D); this.emb[e]-=lr*gx; }
    for(let u=0;u<H;u++)this.b1[u]-=lr*dh[u];
    return loss; }

  sample(arg,nops){ const p=this.p, n=arg?NARG:nops;
    if(this.NOVEL>0){ let z=0; for(let v=0;v<n;v++){ p[v]=Math.pow(Math.max(p[v],1e-6),-this.NOVEL); z+=p[v]; } for(let v=0;v<n;v++)p[v]/=z; }   // curious: the unexpected
    const r=this.rnd(); let a=0; for(let v=0;v<n;v++){ a+=p[v]; if(r<a)return v; } return n-1; }
  // entropy of what it predicts at instruction i of a program: its operation and, given the operation there, its argument
  unsure(src,i,nops){ let h=0; const p=this.p; let n=this.forward(this.ctx(src,2*i),false,nops); for(let v=0;v<n;v++)if(p[v]>0)h-=p[v]*Math.log(p[v]);
    n=this.forward(this.ctx(src,2*i,src[i][0]<nops?src[i][0]:0),true,nops); for(let v=0;v<n;v++)if(p[v]>0)h-=p[v]*Math.log(p[v]); return h; }

  // the world tells it about a parent that divided. With at (an instruction position) it is a CHANGE that worked: the
  // parent carries a change at that position, made when it was born, and it has just had a child (DATA 'changes', v3).
  // Without, it is the whole program (DATA 'parents', v2): any position may be learned from.
  see(prog,at){ this.seen++; const e={p:prog.map(x=>[x[0],x[1]]),at:at===undefined?-1:at}; if(this.buf.length<this.BUF)this.buf.push(e); else { this.buf[this.bufAt]=e; this.bufAt=(this.bufAt+1)%this.BUF; } }

  // learning, every EVERY ticks: STEPS random token positions from the buffer
  train(nops){ const steps=this.PER?Math.min(this.STEPS,Math.round(this.PER*this.seen)):this.STEPS; this.seen=0;
    if(this.MODE!=='learn'||this.buf.length<16||!steps)return; let lo=0, la=0, no=0, na=0;
    for(let s=0;s<steps;s++){ const e=this.buf[(this.rnd()*this.buf.length)|0], pr=e.p; if(!pr.length)continue;
      const j=e.at>=0&&e.at<pr.length?2*e.at+(this.rnd()<0.5?0:1):(this.rnd()*pr.length*2)|0, arg=(j&1)===1;
      const tgt=arg?pr[j>>1][1]:pr[j>>1][0]; if(!arg&&tgt>=nops)continue; const cx=this.ctx(pr,j), T=this.trial;
      if(T){ this.forward(cx,arg,nops,T.from); T.off-=Math.log(Math.max(1e-9,this.p[tgt])); }
      const l=this.learn(cx,tgt,arg,nops); if(T){ T.on+=l; T.k++; } if(arg){ la+=l; na++; } else { lo+=l; no++; } }
    const a=0.98; if(no)this.lossO=this.nTrain?a*this.lossO+(1-a)*lo/no:lo/no; if(na)this.lossA=this.nTrain?a*this.lossA+(1-a)*la/na:la/na; this.nTrain++;
    if(this.GROW&&this.trial&&++this.trial.n>=this.TRIAL){ const T=this.trial; this.trial=null; if(T.on<T.off)this.kept++; else this.shrink(T.from); this.lossMin=this.lossO+this.lossA; }
    else if(this.GROW&&!this.trial&&this.nTrain>40){ const l=this.lossO+this.lossA; if(l<this.lossMin)this.lossMin=l; else if(l>this.lossMin+this.TOL&&this.H<this.HMAX)this.tryGrow(); } }

  tryGrow(){ const from=this.H; this.grow(Math.min(this.GROW,this.HMAX-this.H)); this.trial={from,n:0,k:0,on:0,off:0}; }
  // back to its first `to` hidden units: the growth did not help
  shrink(to){ const H=this.H, I=this.K*this.D, W1=new Float32Array(I*to); for(let i=0;i<I;i++)for(let u=0;u<to;u++)W1[i*to+u]=this.W1[i*H+u];
    this.W1=W1; this.b1=this.b1.slice(0,to); this.Wo=this.Wo.slice(0,to*MAXOPS); this.Wa=this.Wa.slice(0,to*NARG); this.H=to; this.h=new Float32Array(to); this.dh=new Float32Array(to); }

  // dh more hidden units (#295): every old weight kept, the new units' input weights random, their output weights zero
  grow(dh){ const K=this.K, D=this.D, H=this.H, H2=H+dh, I=K*D, r=this.rnd, sc=1/Math.sqrt(I), W1=new Float32Array(I*H2);
    for(let i=0;i<I;i++){ for(let u=0;u<H;u++)W1[i*H2+u]=this.W1[i*H+u]; for(let u=H;u<H2;u++)W1[i*H2+u]=(r()*2-1)*sc; }
    const b1=new Float32Array(H2), Wo=new Float32Array(H2*MAXOPS), Wa=new Float32Array(H2*NARG); b1.set(this.b1); Wo.set(this.Wo); Wa.set(this.Wa);   // the output weights are unit-major: rows past H are the new units, zero
    this.W1=W1; this.b1=b1; this.Wo=Wo; this.Wa=Wa; this.H=H2; this.h=new Float32Array(H2); this.dh=new Float32Array(H2); this.grown++; }

  // a child mind (#295): its parent's knowledge (weights and memories), its own random stream, and its heritable settings
  // changed a little, each with even odds: curiosity NOVEL by up to 0.2 (kept in 0-2), learning rate LR by up to half again
  // either way (kept in 0.005-0.3), and with odds 1 in 5 GROW more hidden units if it grows at all. Draws from the parent's stream.
  // Each also carries a SHADOW of NOVEL and LR (sNOVEL, sLR): inherited and mutated by exactly the same rule, never used. A
  // bounded walk drifts away from its bound (from NOVEL 0 half the changes are lost to the floor, so curiosity creeps up by
  // drift alone), and the shadow is that drift: only a setting that moves away from its shadow among the minds the world
  // keeps has been selected.
  child(){ const r=this.rnd, o=this.save(); o.rnd=(r()*4294967296)|0; const m=Mind.load(o); m.uses=0;
    const nov=v=>Math.max(0,Math.min(2,v+(r()*2-1)*0.2)), lr=v=>Math.max(0.005,Math.min(0.3,v*Math.exp((r()*2-1)*0.4)));
    if(this.sNOVEL===undefined){ m.sNOVEL=this.NOVEL; m.sLR=this.LR; }
    if(r()<0.5)m.NOVEL=nov(m.NOVEL); if(r()<0.5)m.LR=lr(m.LR); if(r()<0.5)m.sNOVEL=nov(m.sNOVEL); if(r()<0.5)m.sLR=lr(m.sLR);
    if(m.GROW&&!m.trial&&m.H<m.HMAX&&r()<0.2)m.tryGrow();   // born bigger, on trial like any growth
    return m; }

  // the mind writes into a child about to be born: it replaces one instruction at a random place with one it samples, and
  // the new instruction always differs from the old (resampled until it does). Substitution only, so the mind never
  // changes a program's length: in the first pilot it also inserted (40%) with no matching deletion, and every arm with
  // proposals bloated (mean length 22-39 against 9), the learning one most. Every arm (learn, frozen, uniform) therefore
  // adds exactly the same amount of change; only what it writes differs.
  propose(src,nops,maxlen){ if(!(this.P>0)||!src.length||this.rnd()>=this.P)return false; this.uses++;
    let i;
    if(this.WHERE==='uncertain'&&this.MODE==='learn'){ const w=src.map((x,k)=>{ const h=this.unsure(src,k,nops); return h*h; }); let z=0; for(const x of w)z+=x; let r=this.rnd()*z; i=src.length-1; for(let k=0;k<w.length;k++){ r-=w[k]; if(r<0){ i=k; break; } } }   // curious: where it is unsure
    else i=(this.rnd()*src.length)|0;
    const old=src[i]; let op=old[0], arg=old[1];
    for(let tries=0;tries<16&&op===old[0]&&arg===old[1];tries++){
      if(this.MODE==='uniform'){ op=(this.rnd()*nops)|0; arg=(this.rnd()*256)|0; }
      else { this.forward(this.ctx(src,2*i),false,nops); op=this.sample(false,nops); this.forward(this.ctx(src,2*i,op),true,nops); arg=this.sample(true,nops); } }
    if(op===old[0]&&arg===old[1]){ arg=(arg+1+((this.rnd()*255)|0))&255; }   // sixteen draws gave back the same: change the argument
    src[i]=[op,arg]; return true; }

  report(nops){ return {mode:this.MODE,p:this.P,uses:this.uses,trained:this.nTrain,lossOp:+this.lossO.toFixed(3),lossArg:+this.lossA.toFixed(3),uniformOp:+Math.log(nops).toFixed(3),uniformArg:+Math.log(256).toFixed(3),buf:this.buf.length,...(this.GROW?{H:this.H,grown:this.grown,kept:this.kept,trial:!!this.trial}:{})}; }

  save(){ const b=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
    return {K:this.K,D:this.D,H:this.H,LR:this.LR,P:this.P,MODE:this.MODE,BUF:this.BUF,EVERY:this.EVERY,STEPS:this.STEPS,NOVEL:this.NOVEL,WHERE:this.WHERE,rnd:this.rnd.s,emb:b(this.emb),W1:b(this.W1),b1:b(this.b1),Wo:b(this.Wo),bo:b(this.bo),Wa:b(this.Wa),ba:b(this.ba),
      buf:this.buf.map(e=>[e.p.map(x=>x[0].toString(16).padStart(2,'0')+x[1].toString(16).padStart(2,'0')).join(''),e.at]),bufAt:this.bufAt,lossO:this.lossO,lossA:this.lossA,nTrain:this.nTrain,uses:this.uses,
      ...(this.GROW?{GROW:this.GROW,HMAX:this.HMAX,TOL:this.TOL,TRIAL:this.TRIAL,H0:this.H0,lossMin:isFinite(this.lossMin)?this.lossMin:null,grown:this.grown,kept:this.kept,trial:this.trial}:{}),...(this.PER?{PER:this.PER,seen:this.seen}:{}),...(this.sNOVEL!==undefined?{sNOVEL:this.sNOVEL,sLR:this.sLR}:{})}; }
  static load(o){ const m=new Mind(1,o); m.rnd.s=o.rnd; const f=(k)=>{ const t=Buffer.from(o[k],'base64'); new Uint8Array(m[k].buffer).set(t); };
    for(const k of ['emb','W1','b1','Wo','bo','Wa','ba'])f(k);
    const dec=s=>{ const p=[]; for(let i=0;i<s.length;i+=4)p.push([parseInt(s.slice(i,i+2),16),parseInt(s.slice(i+2,i+4),16)]); return p; };
    // older saves held whole programs only
    m.buf=o.buf.map(x=>Array.isArray(x)?{p:dec(x[0]),at:x[1]}:{p:dec(x),at:-1});
    m.bufAt=o.bufAt; m.lossO=o.lossO; m.lossA=o.lossA; m.nTrain=o.nTrain; m.uses=o.uses;
    m.lossMin=o.lossMin==null?Infinity:o.lossMin; m.grown=o.grown||0; m.kept=o.kept||0; m.trial=o.trial?{...o.trial}:null; m.seen=o.seen||0; if(o.sNOVEL!==undefined){ m.sNOVEL=o.sNOVEL; m.sLR=o.sLR; } return m; }
}
// MIX (v5, the user's suggestion: "there is nothing to stop it being all three"). One mind with all three drives at once:
// two networks, one learning WHAT EXISTS (the programs of parents, as v2) and one learning WHAT WORKS (changes that went on
// to reproduce, as v3), and three ways to write a child, one chosen at random for each proposal:
//   exploit       - from what exists, what it expects (v2)
//   the unexpected - from what exists, what it does NOT expect (p^-NOVEL)
//   unsure        - from what works, at the place it is least able to predict (WHERE uncertain)
// The total rate is still P, one instruction per proposal, so it adds exactly as much change as every other arm.
// v6 and v7 (MIND_ADAPT: the world chose the drive for each proposal by Thompson sampling, judged by the divisions of each
// drive's children, or by how many lineages each founded reached 10 living members) were measured on two seeds and deleted:
// both times the world chose the exploiter and novelty was the lowest of any mind (OEE-NOTES #293). They are in 9a763cd.
class MixMind{
  constructor(seed,o){ o=o||{}; this.kind='mix'; this.P=o.P??0.2; this.EVERY=o.EVERY||50; this.NOVEL=o.NOVEL||0.5;
    this.exists=new Mind(seed,{...o,P:1,NOVEL:0,WHERE:'random',MODE:'learn'}); this.works=new Mind(((seed>>>0)^0x0bad5eed)>>>0,{...o,P:1,NOVEL:0,WHERE:'uncertain',MODE:'learn'});
    this.rnd=mulberry32(((seed>>>0)||1)^0x6d697821); this.uses=[0,0,0]; }
  see(prog,at){ this.exists.see(prog); if(at!==undefined&&at>=0)this.works.see(prog,at); }
  train(nops){ this.exists.train(nops); this.works.train(nops); }
  propose(src,nops,maxlen){ if(!(this.P>0)||!src.length||this.rnd()>=this.P)return false; const k=(this.rnd()*3)|0; this.uses[k]++;
    if(k===2)return this.works.propose(src,nops,maxlen);
    this.exists.NOVEL=k===1?this.NOVEL:0; const r=this.exists.propose(src,nops,maxlen); this.exists.NOVEL=0; return r; }
  report(nops){ const a=this.exists.report(nops), b=this.works.report(nops); return {mode:'mix',p:this.P,uses:this.uses,lossOp:a.lossOp,lossArg:a.lossArg,worksLossOp:b.lossOp,worksLossArg:b.lossArg,uniformOp:a.uniformOp,uniformArg:a.uniformArg}; }
  save(){ return {kind:'mix',P:this.P,EVERY:this.EVERY,NOVEL:this.NOVEL,rnd:this.rnd.s,uses:this.uses,exists:this.exists.save(),works:this.works.save()}; }
  static load(o){ const m=Object.create(MixMind.prototype); m.kind='mix'; m.P=o.P; m.EVERY=o.EVERY; m.NOVEL=o.NOVEL; m.rnd=mulberry32(1); m.rnd.s=o.rnd; m.uses=o.uses.slice(); m.exists=Mind.load(o.exists); m.works=Mind.load(o.works); return m; }
}
module.exports={Mind,MixMind};
