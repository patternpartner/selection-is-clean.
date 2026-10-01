// lab/oee-core.js - a LEAN EVOLUTION CORE, built to ask one question fast: does adaptive novelty keep arriving?
// Not the artwork. engine.html is the universe; this is a bench beside it, designed from what #273-#284 learned in it:
//   - the evolving thing must be the thing that reproduces (#273): DIVIDE is an instruction, paid from the organism's
//     own store, and nothing else makes babies;
//   - energy must be conserved and starvation must kill (#278b, #278c): light is the only source, a child's "body" is
//     paid at birth and returned as a corpse at death, and an empty store is death;
//   - a generalist must not win for free (#282, #283): every executed instruction costs energy;
//   - the genetic system must be able to make leaner AND richer programs (#283): insertion and deletion are balanced;
//   - space must keep lineages apart (#282): one organism per cell on a torus, children placed next to the parent;
//   - the measure must be calibrated (#274, #281): 8 of the 32 opcodes do nothing and are drawn by mutation at the same
//     rate as the rest, so a behaviour counts as adaptive only when it beats every neutral one.
// Pure JS, typed arrays, seeded RNG, no DOM. A World is stepped with step(); sample() returns readouts.

'use strict';

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ---- the instruction set: 24 that act, 8 that do nothing (the neutral shadow) ----
const OPS=['NOP','LOADK','MOV','ADD','SUB','MUL','IFGT','IFLT','JMP','SENSE_E','SENSE_LIGHT','SENSE_CORPSE',
  'SENSE_AHEAD','SENSE_KIN','SENSE_MATCH','TURN','MOVE','EAT_LIGHT','EAT_CORPSE','ATTACK','DIVIDE','SHARE','SENSE_GRAD','RAND',
  'N0','N1','N2','N3','N4','N5','N6','N7'];
const OP=Object.fromEntries(OPS.map((n,i)=>[n,i]));
const NOPS=32, NEUTRAL0=24;
const DX=[1,1,0,-1,-1,-1,0,1], DY=[0,1,1,1,0,-1,-1,-1];   // ops 24-31 are the neutral markers
const isNeutral=o=>o>=NEUTRAL0;

const DEF={
  W:64, H:64, MAXLEN:64, SLICE:10,         // world size; program length cap; instructions run per organism per tick
  C_INSTR:0.001, C_BASE:0.001,            // energy per executed instruction, and per tick just for being alive
  C_MOVE:0.01, C_ATTACK:0.01,              // extra cost of moving and of attacking
  L_MIN:0.04, L_PEAK:0.6, L_RATE:0.05,     // light: background capacity, patch peak, regrowth rate toward capacity
  PATCHES:3, PATCH_R:9, PATCH_V:0.004,     // drifting light patches: count, radius (cells), speed (cells per tick)
  EAT_F:0.5,                                // fraction of the cell's light (or corpse) taken per EAT
  DIV_MIN:1.2, BODY:0.4,                    // energy needed to divide; the child's body, paid at birth, returned at death
  CORPSE_DECAY:0.0005,                      // corpses fade (a sink, so dead energy does not pile up forever)
  ATT_FRAC:0.5, ATT_EFF:0.8, ATT_POW:4,     // attack takes up to half the target's store, 80% efficient, match^4
  SHARE_F:0.25,
  MAX_AGE:400,
  MU_SUB:0.006, MU_INS:0.04, MU_DEL:0.04, MU_TAG:0.004,   // per-instruction substitution; per-copy insert/delete; per-bit tag flip
};

class World{
  constructor(seed,opts){
    this.p=Object.assign({},DEF,opts||{});
    const P=this.p, C=P.W*P.H;
    this.rnd=mulberry32((seed>>>0)||1); this.C=C; this.tick=0;
    this.alive=new Uint8Array(C); this.E=new Float32Array(C); this.age=new Int32Array(C);
    this.pc=new Uint8Array(C); this.face=new Uint8Array(C); this.R=new Float32Array(C*4);
    this.len=new Uint8Array(C); this.prog=new Uint8Array(C*P.MAXLEN*2);
    this.tag=new Uint16Array(C); this.tmpl=new Uint16Array(C); this.stamp=new Int32Array(C).fill(-1);
    this.gen=new Int32Array(C);                                  // generation depth
    this.light=new Float32Array(C); this.cap=new Float32Array(C); this.corpse=new Float32Array(C);
    this.order=new Int32Array(C); for(let i=0;i<C;i++)this.order[i]=i;
    this.patch=[]; for(let k=0;k<P.PATCHES;k++){ const a=this.rnd()*Math.PI*2; this.patch.push({x:this.rnd()*P.W,y:this.rnd()*P.H,vx:Math.cos(a)*P.PATCH_V,vy:Math.sin(a)*P.PATCH_V}); }
    this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0};
    this.updateCap(); for(let c=0;c<C;c++)this.light[c]=this.cap[c];
    // the ancestor: eat light, try to divide, turn. Nothing else is given.
    const anc=[[OP.EAT_LIGHT,0],[OP.DIVIDE,0],[OP.TURN,1]];
    for(let k=0;k<P.W*P.H/16;k++){ const c=(this.rnd()*C)|0; if(this.alive[c])continue; this.place(c,anc,1.0,(this.rnd()*65536)|0,(this.rnd()*65536)|0,0); }
  }
  // ---- geometry ----
  ahead(c,f){ const P=this.p, x=c%P.W, y=(c/P.W)|0; const dx=DX[f&7], dy=DY[f&7]; return ((y+dy+P.H)%P.H)*P.W+((x+dx+P.W)%P.W); }
  updateCap(){ const P=this.p; for(const q of this.patch){ q.x=(q.x+q.vx+P.W)%P.W; q.y=(q.y+q.vy+P.H)%P.H; }
    const r2=P.PATCH_R*P.PATCH_R;
    for(let y=0;y<P.H;y++)for(let x=0;x<P.W;x++){ let v=P.L_MIN;
      for(const q of this.patch){ let dx=Math.abs(x-q.x); dx=Math.min(dx,P.W-dx); let dy=Math.abs(y-q.y); dy=Math.min(dy,P.H-dy); v+=P.L_PEAK*Math.exp(-(dx*dx+dy*dy)/r2); }
      this.cap[y*P.W+x]=v; } }
  place(c,prog,E,tag,tmpl,gen){ const P=this.p, o=c*P.MAXLEN*2; this.alive[c]=1; this.E[c]=E; this.age[c]=0; this.pc[c]=0; this.face[c]=(this.rnd()*8)|0;
    this.R.fill(0,c*4,c*4+4); this.len[c]=prog.length; for(let i=0;i<prog.length;i++){ this.prog[o+i*2]=prog[i][0]; this.prog[o+i*2+1]=prog[i][1]; }
    this.tag[c]=tag; this.tmpl[c]=tmpl; this.gen[c]=gen; this.stamp[c]=this.tick; }
  kill(c,why){ const P=this.p; this.alive[c]=0; this.corpse[c]+=Math.max(0,this.E[c])+P.BODY; this.E[c]=0; this.ev[why]++; }
  moveOrg(a,b){ const P=this.p, L=P.MAXLEN*2; this.alive[b]=1; this.alive[a]=0; this.E[b]=this.E[a]; this.age[b]=this.age[a]; this.pc[b]=this.pc[a]; this.face[b]=this.face[a];
    for(let k=0;k<4;k++)this.R[b*4+k]=this.R[a*4+k]; this.len[b]=this.len[a]; this.prog.copyWithin(b*L,a*L,a*L+L);
    this.tag[b]=this.tag[a]; this.tmpl[b]=this.tmpl[a]; this.gen[b]=this.gen[a]; this.stamp[b]=this.stamp[a]; this.E[a]=0; }
  // ---- reproduction with mutation (balanced insertion and deletion) ----
  divide(c){ const P=this.p; if(this.E[c]<P.DIV_MIN)return false;
    let t=-1; const f0=this.face[c]; for(let k=0;k<8;k++){ const n=this.ahead(c,f0+k); if(!this.alive[n]){ t=n; break; } } if(t<0)return false;   // no empty neighbour, no child (overwriting the neighbour made DIVIDE free predation: a kill-and-eat loop, about 200 births a tick)
    const o=c*P.MAXLEN*2, n=this.len[c], src=[]; for(let i=0;i<n;i++)src.push([this.prog[o+i*2],this.prog[o+i*2+1]]);
    const r=this.rnd;
    for(const ins of src){ if(r()<P.MU_SUB){ if(r()<0.5)ins[0]=(r()*NOPS)|0; else ins[1]=(r()*256)|0; } }
    if(src.length<P.MAXLEN&&r()<P.MU_INS)src.splice((r()*(src.length+1))|0,0,[(r()*NOPS)|0,(r()*256)|0]);
    if(src.length>1&&r()<P.MU_DEL)src.splice((r()*src.length)|0,1);
    let tg=this.tag[c], tm=this.tmpl[c]; for(let b=0;b<16;b++){ if(r()<P.MU_TAG)tg^=1<<b; if(r()<P.MU_TAG)tm^=1<<b; }
    const half=(this.E[c]-P.BODY)/2; this.E[c]=half;
    this.place(t,src,half,tg,tm,this.gen[c]+1); this.ev.births++; return true; }
  matchP(a,b){ let x=(this.tmpl[a]^this.tag[b])&0xffff, m=0; while(x){ x&=x-1; m++; } const s=(16-m)/16; return Math.pow(s,this.p.ATT_POW); }
  kinSim(a,b){ let x=(this.tag[a]^this.tag[b])&0xffff, m=0; while(x){ x&=x-1; m++; } return (16-m)/16; }
  // ---- one organism's time slice ----
  run(c){ const P=this.p, L=P.MAXLEN*2, o=c*L, R=this.R, r4=c*4, n=this.len[c]; let pc=this.pc[c]%Math.max(1,n);
    for(let s=0;s<P.SLICE&&this.alive[c];s++){
      const op=this.prog[o+pc*2], arg=this.prog[o+pc*2+1]; this.E[c]-=P.C_INSTR; let next=(pc+1)%n;
      switch(op){
        case 1: R[r4]=(arg-128)/32; break;                                   // LOADK
        case 2: R[r4+(arg&3)]=R[r4]; break;                                  // MOV
        case 3: R[r4]+=R[r4+(arg&3)]; break;                                 // ADD
        case 4: R[r4]-=R[r4+(arg&3)]; break;                                 // SUB
        case 5: R[r4]*=R[r4+(arg&3)]; if(!Number.isFinite(R[r4]))R[r4]=0; if(R[r4]>1e6)R[r4]=1e6; if(R[r4]<-1e6)R[r4]=-1e6; break;   // MUL
        case 6: if(R[r4]>R[r4+(arg&3)])next=(pc+2)%n; break;                 // IFGT: skip next when R0 > Rk
        case 7: if(R[r4]<R[r4+(arg&3)])next=(pc+2)%n; break;                 // IFLT
        case 8: next=(((pc+(arg-128))%n)+n)%n; break;                        // JMP (relative)
        case 9: R[r4]=this.E[c]; break;                                      // SENSE_E
        case 10: R[r4]=this.light[c]; break;                                 // SENSE_LIGHT
        case 11: R[r4]=this.corpse[c]; break;                                // SENSE_CORPSE
        case 12: { const a=this.ahead(c,this.face[c]); R[r4]=this.alive[a]?1+this.E[a]:0; } break;   // SENSE_AHEAD
        case 13: { const a=this.ahead(c,this.face[c]); R[r4]=this.alive[a]?this.kinSim(c,a):-1; } break;   // SENSE_KIN
        case 14: { const a=this.ahead(c,this.face[c]); R[r4]=this.alive[a]?this.matchP(c,a):-1; } break;   // SENSE_MATCH
        case 15: this.face[c]=(this.face[c]+(arg&7))&7; break;               // TURN
        case 16: { const a=this.ahead(c,this.face[c]); this.E[c]-=P.C_MOVE; if(!this.alive[a]){ this.moveOrg(c,a); this.pc[a]=next; this.ev.moves++; return; } } break;   // MOVE
        case 17: { const t=this.light[c]*P.EAT_F; this.light[c]-=t; this.E[c]+=t; this.ev.eatLight+=t; } break;   // EAT_LIGHT
        case 18: { const t=this.corpse[c]*P.EAT_F; this.corpse[c]-=t; this.E[c]+=t; this.ev.eatCorpse+=t; } break;   // EAT_CORPSE
        case 19: { const a=this.ahead(c,this.face[c]); this.E[c]-=P.C_ATTACK; if(this.alive[a]){ const take=this.matchP(c,a)*P.ATT_FRAC*this.E[a]; this.E[a]-=take; this.E[c]+=take*P.ATT_EFF; this.ev.attacks++; this.ev.attackTake+=take;
                   if(this.E[a]<=0.01){ this.kill(a,'killed'); } } } break;   // ATTACK
        case 20: this.divide(c); break;                                      // DIVIDE
        case 21: { const a=this.ahead(c,this.face[c]); if(this.alive[a]){ const g=this.E[c]*P.SHARE_F; this.E[c]-=g; this.E[a]+=g; this.ev.shares++; } } break;   // SHARE
        case 22: { const a=this.ahead(c,this.face[c]); R[r4]=this.light[a]-this.light[c]; } break;   // SENSE_GRAD
        case 23: R[r4]=this.rnd(); break;                                    // RAND
        default: break;                                                      // NOP and the eight neutral markers
      }
      pc=next;
    }
    if(this.alive[c])this.pc[c]=pc;
  }
  step(){ const P=this.p, C=this.C; this.tick++;
    if(this.tick%10===0)this.updateCap();
    for(let c=0;c<C;c++){ const l=this.light[c]; this.light[c]=l+P.L_RATE*(this.cap[c]-l); if(this.corpse[c]>0)this.corpse[c]*=1-P.CORPSE_DECAY; }
    const ord=this.order, r=this.rnd; for(let i=C-1;i>0;i--){ const j=(r()*(i+1))|0; const t=ord[i]; ord[i]=ord[j]; ord[j]=t; }
    for(let k=0;k<C;k++){ const c=ord[k]; if(!this.alive[c]||this.stamp[c]===this.tick)continue; this.stamp[c]=this.tick;
      this.E[c]-=P.C_BASE; this.age[c]++;
      this.run(c);
      // the organism may have moved: find it by its own cell or leave; deaths are checked after the slice
    }
    for(let c=0;c<C;c++){ if(!this.alive[c])continue; if(this.E[c]<=0)this.kill(c,'starve'); else if(this.age[c]>P.MAX_AGE)this.kill(c,'old'); }
    if(!this.count())this.reseed();
  }
  count(){ let n=0; for(let c=0;c<this.C;c++)n+=this.alive[c]; return n; }
  reseed(){ const anc=[[OP.EAT_LIGHT,0],[OP.DIVIDE,0],[OP.TURN,1]]; this.reseeds=(this.reseeds||0)+1;
    for(let k=0;k<this.C/16;k++){ const c=(this.rnd()*this.C)|0; if(!this.alive[c])this.place(c,anc,1.0,(this.rnd()*65536)|0,(this.rnd()*65536)|0,0); } }
  // ---- readouts (draw nothing) ----
  sample(){ const P=this.p, L=P.MAXLEN*2; let n=0, len=0, E=0, gmax=0, gsum=0;
    const opC=new Float64Array(NOPS), bgC=new Map(), geno=new Map();
    for(let c=0;c<this.C;c++){ if(!this.alive[c])continue; n++; const m=this.len[c], o=c*L; len+=m; E+=this.E[c]; gsum+=this.gen[c]; if(this.gen[c]>gmax)gmax=this.gen[c];
      const seen=new Uint8Array(NOPS), bs=new Set(); let key='';
      for(let i=0;i<m;i++){ const op=this.prog[o+i*2]; seen[op]=1; key+=op+'.'+this.prog[o+i*2+1]+','; if(i+1<m)bs.add(op*NOPS+this.prog[o+(i+1)*2]); }
      for(let q=0;q<NOPS;q++)if(seen[q])opC[q]++;
      for(const b of bs)bgC.set(b,(bgC.get(b)||0)+1);
      key+='|'+this.tag[c]+'|'+this.tmpl[c]; geno.set(key,(geno.get(key)||0)+1); }
    let ground=0, dead=0; for(let c=0;c<this.C;c++){ ground+=this.light[c]; dead+=this.corpse[c]; }
    let gTop=0; for(const v of geno.values()) if(v>gTop)gTop=v;
    const ev=this.ev; this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0};
    return {t:this.tick,N:n,meanLen:n?+(len/n).toFixed(2):0,meanGen:n?+(gsum/n).toFixed(1):0,maxGen:gmax,energy:{stores:+E.toFixed(1),light:+ground.toFixed(1),corpses:+dead.toFixed(1)},
      genotypes:geno.size,topGenoShare:n?+(gTop/n).toFixed(3):0,ev,
      opShare:Array.from(opC,v=>n?+(v/n).toFixed(4):0),
      bigrams:Object.fromEntries([...bgC.entries()].filter(([b,v])=>v/n>=0.01).map(([b,v])=>[b,+(v/n).toFixed(4)])),
      reseeds:this.reseeds||0}; }
}

module.exports={World,OPS,OP,NOPS,NEUTRAL0,isNeutral,DEF};
