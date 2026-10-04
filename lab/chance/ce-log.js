// lab/chance/ce-log.js - READ-ONLY trick logger for heritable-body worlds (cos/chance-logging). Attach with
//   const lg=new TrickLog(world, out); world.lg=lg;   then call lg.bin() after every 1000-tick sample and lg.window() every 5000.
// The world calls lg.place/kill/move/birth/carry/inc (hooks in lab/oee-core.js, all behind `if(this.lg)`). The logger never draws
// a random number and never writes world state; byte-identity vs an unlogged run is checked by lab/chance/ce-logcheck.js.
// Output: one JSON line per record (out = function(line)).
//   {"ev":"life", t, key, life, gnew, o, k, anc, par, ch, pset, seq?}  a key goes from 0 to >=1 living carriers (a trick is created:
//       o = "mut" | "fuse" | "cap" | "dup" | "init"; k = walk length of a capture (steps); anc = the key it was mutated from, or the two
//       keys fused, or -1 for a capture; par / ch = logger ids of the body donor (parent; random organism under BODY_SHUF) and child;
//       pset = donor's body keys; seq = pathway species sequence (seq[0] = its input substrate), given the first time a pathway id is seen;
//       gnew = 1 if this key was never carried before in the run (0 = re-created)
//   {"ev":"end", t, key, life, t0, o, peak, tPeak, ct, inc, sub, sPk, sFin, sDie, eDie(why), dS/dO/dK (carrier deaths: starve/old/killed
//       or other), cb (births by carriers), nl (copies not passed on at those births)}  the last carrier of a key dies (that life ends).
//       ct = copy-ticks (one per tick per body copy), inc = income (would-be income under BODY_DRIFT), sub = summed input-substrate
//       concentration in the carrier's own cell over those copy-ticks; sPk = highest mean substrate per copy-tick in any 1000-tick bin of
//       the life; sFin = the same in the final (partial) bin; sDie = substrate in the last carrier's cell when it died.
//   {"ev":"win", t, N, births, k:[[key, carriers at window end, copy-ticks, income, substrate sum, carrier births, copies not passed,
//       carrier deaths],...] for EVERY key carried in the window, cx:[[key, carriers scanned, carriers holding every ancestor key,
//       sum of ancestor-key fraction held]] for lives younger than 50k ticks, molMean:[mean concentration per species, 4 sig. digits],
//       evN:{origin:count of lineage-new key events in the window (child holds a key its donor lacks)}}
'use strict';
class TrickLog{
  constructor(w,out){ if(!w.bd)throw new Error('TrickLog needs HBODY+CHEM'); if(w.ip)throw new Error('TrickLog: XFEED body run is not hooked');
    this.out=out; this.C=w.C; this.M=w.p.BODY_MAX; this.id=new Int32Array(w.C).fill(-1); this.nid=0; this.cap=0; this.grow(70000);
    this.lifeN=new Map(); this.L=new Map(); this.seqSeen=new Set(); this.touched=[]; this.inBin=new Uint8Array(this.cap); this.evN={}; this.births=0;
    for(let c=0;c<w.C;c++) if(w.alive[c]){ this.id[c]=this.nid++; const ks=this.keys(w,c); for(const k of ks){ this.ensure(k); if(this.cnt[k]++===0)this.start(w,k,'init',0,-1,-1,this.id[c],[]); } } }
  grow(n){ const F=(a,T)=>{ const b=new T(n); if(a)b.set(a); return b; }; this.cnt=F(this.cnt,Int32Array); this.wCT=F(this.wCT,Float64Array); this.wInc=F(this.wInc,Float64Array); this.wSub=F(this.wSub,Float64Array);
    this.wCB=F(this.wCB,Int32Array); this.wNL=F(this.wNL,Int32Array); this.wD=F(this.wD,Int32Array); this.bCT=F(this.bCT,Float64Array); this.lInc=F(this.lInc,Float64Array); this.bSub=F(this.bSub,Float64Array); if(this.inBin)this.inBin=F(this.inBin,Uint8Array); this.cap=n; }
  ensure(k){ if(k>=this.cap){ let n=this.cap; while(n<=k)n*=2; this.grow(n); } }
  keys(w,c){ const M=this.M, s=new Set(); for(let i=0;i<w.bn[c];i++)s.add(w.bd[c*M+i]); return s; }
  sub0(w,k){ return k<65536?k>>8:w.chS[k-65536][0]; }
  place(w,c){ this.id[c]=this.nid++; }
  move(w,a,b){ this.id[b]=this.id[a]; this.id[a]=-1; }
  start(w,k,o,kLen,anc,par,ch,pset){ const n=(this.lifeN.get(k)||0)+1; this.lifeN.set(k,n); const r={ev:'life',t:w.tick,key:k,life:n,gnew:n===1?1:0,o,k:kLen,anc,par,ch,pset};
    if(k>=65536&&!this.seqSeen.has(k)){ this.seqSeen.add(k); r.seq=w.chS[k-65536]; } this.out(JSON.stringify(r));
    let ancSet=null; if(o==='mut')ancSet=[anc]; else if(o==='fuse')ancSet=anc; else if(o==='cap')ancSet=pset; if(ancSet&&!ancSet.length)ancSet=null;
    this.L.set(k,{t0:w.tick,life:n,o,peak:1,tPeak:w.tick,ct:0,inc:0,sub:0,sPk:0,sLast:NaN,dS:0,dO:0,dK:0,dX:0,cb:0,nl:0,anc:ancSet}); this.bCT[k]=0; this.bSub[k]=0; this.lInc[k]=0; }
  birth(w,c,src,t,L,O,A){ this.births++; const ps=this.keys(w,src), cs=new Set(); const pset=[...ps];
    for(const k of ps){ this.wCB[k]++; const l=this.L.get(k); if(l)l.cb++; }
    for(let i=0;i<L.length;i++){ const k=L[i]; if(cs.has(k))continue; cs.add(k); this.ensure(k);
      if(!ps.has(k)){ const o=['inh','mut','dup','fuse','cap'][O[i]]; this.evN[o]=(this.evN[o]||0)+1; }
      if(this.cnt[k]++===0){ const o=['inh','mut','dup','fuse','cap'][O[i]], kl=o==='cap'?(k<65536?1:w.chS[k-65536].length-1):0; this.start(w,k,o,kl,A[i],this.id[src],this.id[t],pset); }
      else { const l=this.L.get(k); if(l&&this.cnt[k]>l.peak){ l.peak=this.cnt[k]; l.tPeak=w.tick; } } }
    for(const k of ps) if(!cs.has(k)){ this.wNL[k]++; const l=this.L.get(k); if(l)l.nl++; } }
  carry(k,s){ this.wCT[k]++; this.wSub[k]+=s; this.bCT[k]++; this.bSub[k]+=s; if(!this.inBin[k]){ this.inBin[k]=1; this.touched.push(k); } }
  inc(k,v){ this.wInc[k]+=v; this.lInc[k]+=v; }
  kill(w,c,why){ const C=this.C;
    for(const k of this.keys(w,c)){ this.wD[k]++; const l=this.L.get(k); if(!l)continue; if(why==='starve')l.dS++; else if(why==='old')l.dO++; else if(why==='killed')l.dK++; else l.dX++;
      if(--this.cnt[k]===0){ const q=this.sub0(w,k), bs=this.bCT[k]>0?this.bSub[k]/this.bCT[k]:NaN, sFin=Number.isFinite(bs)?bs:l.sLast, sPk=Math.max(l.sPk,Number.isFinite(bs)?bs:0);
        const ct=l.ct+this.bCT[k], sub=l.sub+this.bSub[k];
        this.out(JSON.stringify({ev:'end',t:w.tick,key:k,life:l.life,t0:l.t0,o:l.o,peak:l.peak,tPeak:l.tPeak,ct,inc:+this.lInc[k].toPrecision(6),sub:+sub.toPrecision(6),sPk:+sPk.toPrecision(5),sFin:Number.isFinite(sFin)?+sFin.toPrecision(5):null,sDie:+w.mol[q*C+c].toPrecision(5),eDie:why,dS:l.dS,dO:l.dO,dK:l.dK,dX:l.dX,cb:l.cb,nl:l.nl}));
        this.L.delete(k); this.bCT[k]=0; this.bSub[k]=0; } } this.id[c]=-1; }
  bin(w){ // called after each 1000-tick sample: fold the bin into each live key's life totals
    for(const k of this.touched){ this.inBin[k]=0; const l=this.L.get(k); if(l&&this.bCT[k]>0){ const s=this.bSub[k]/this.bCT[k]; if(s>l.sPk)l.sPk=s; l.sLast=s; l.ct+=this.bCT[k]; l.sub+=this.bSub[k]; } this.bCT[k]=0; this.bSub[k]=0; }
    this.touched.length=0; }
  window(w){ const k=[], C=this.C, S=w.p.CHEM_S; 
    for(let x=0;x<this.cap;x++) if(this.wCT[x]>0||this.cnt[x]>0||this.wD[x]>0){ k.push([x,this.cnt[x],this.wCT[x],+this.wInc[x].toPrecision(6),+this.wSub[x].toPrecision(6),this.wCB[x],this.wNL[x],this.wD[x]]); }
    // coexistence scan over living carriers of young lives that have ancestor keys
    const cx=new Map(); for(let c=0;c<C;c++){ if(!w.alive[c]||!w.bn[c])continue; const ks=this.keys(w,c); for(const x of ks){ const l=this.L.get(x); if(!l||!l.anc||w.tick-l.t0>50000)continue; let h=0; for(const a of l.anc) if(ks.has(a))h++; const r=cx.get(x)||[x,0,0,0]; r[1]++; if(h===l.anc.length)r[2]++; r[3]+=h/l.anc.length; cx.set(x,r); } }
    const molMean=[]; for(let q=0;q<S;q++){ let s=0; for(let c=0;c<C;c++)s+=w.mol[q*C+c]; molMean.push(+(s/C).toPrecision(4)); }
    let N=0; for(let c=0;c<C;c++)if(w.alive[c])N++;
    this.out(JSON.stringify({ev:'win',t:w.tick,N,births:this.births,evN:this.evN,k,cx:[...cx.values()].map(r=>[r[0],r[1],r[2],+r[3].toFixed(3)]),molMean}));
    this.wCT.fill(0); this.wInc.fill(0); this.wSub.fill(0); this.wCB.fill(0); this.wNL.fill(0); this.wD.fill(0); this.evN={}; this.births=0; }
}
module.exports={TrickLog};
