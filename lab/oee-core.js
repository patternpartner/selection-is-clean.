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

function mulberry32(a){ const f=function(){ f.s|=0; f.s=f.s+0x6D2B79F5|0; let t=Math.imul(f.s^f.s>>>15,1|f.s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; f.s=a|0; return f; }   // f.s is the state, so a run can be saved and resumed exactly

// ---- the instruction set: 24 that act, 8 that do nothing (the neutral shadow) ----
const OPS=['NOP','LOADK','MOV','ADD','SUB','MUL','IFGT','IFLT','JMP','SENSE_E','SENSE_LIGHT','SENSE_CORPSE',
  'SENSE_AHEAD','SENSE_KIN','SENSE_MATCH','TURN','MOVE','EAT_LIGHT','EAT_CORPSE','ATTACK','DIVIDE','SHARE','SENSE_GRAD','RAND',
  'N0','N1','N2','N3','N4','N5','N6','N7'];
const OP=Object.fromEntries(OPS.map((n,i)=>[n,i]));
// with CHEM on, five of the neutral markers become chemistry and three stay neutral (#286)
const OPS_CHEM=OPS.slice(0,24).concat(['METAB0','METAB1','METAB2','METAB3','SENSE_MOL','N5','N6','N7']); const NEUTRAL0_CHEM=29;
const NOPS=32, NEUTRAL0=24;
const DX=[1,1,0,-1,-1,-1,0,1], DY=[0,1,1,1,0,-1,-1,-1];   // ops 24-31 are the neutral markers
const isNeutral=o=>o>=NEUTRAL0;

// the FUNCTIONAL genotype: the program with NOP and the neutral markers dropped and every argument masked to the bits its
// op reads (LOADK and JMP all 8, MOV..IFLT the low 2, TURN the low 3, the rest none). Two programs with the same hash differ
// only where nothing reads, near enough (a dropped marker can shift a JMP or a skip, so this merges a little too much).
const ARGMASK=new Uint8Array(NOPS); ARGMASK[1]=255; for(let q=2;q<=7;q++)ARGMASK[q]=3; ARGMASK[8]=255; ARGMASK[15]=7; for(let q=24;q<=28;q++)ARGMASK[q]=255;   // 24-28 only count under CHEM
function fnHash(a,o,m,n0){ n0=n0||NEUTRAL0; let h=2166136261|0, k=0; for(let i=0;i<m;i++){ const op=a[o+i*2]; if(op===0||op>=n0)continue; h=Math.imul(h^op,16777619); h=Math.imul(h^(a[o+i*2+1]&ARGMASK[op]),16777619); k++; } return (h^k)>>>0; }
function fnHashList(src,n0){ n0=n0||NEUTRAL0; let h=2166136261|0, k=0; for(const [op,arg] of src){ if(op===0||op>=n0)continue; h=Math.imul(h^op,16777619); h=Math.imul(h^(arg&ARGMASK[op]),16777619); k++; } return (h^k)>>>0; }

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
  // CHEMISTRY (#286), off by default: S molecule species, each with a fixed energy content (species 0 holds 1, the rest
  // random) and four fixed products. Eating light leaves CHEM_ALPHA of the take in the cell as species 0; METABj turns a
  // share of the cell's species (arg) into its j-th product and keeps the energy difference when it is positive. Every
  // product is waste in the cell, food for whoever carries the next step. Molecules diffuse and decay; energy is conserved.
  // A reaction runs only when it releases at most CHEM_DMAX: without that one step from species 0 to the lowest product
  // took 99% of the energy and nothing was left for a next step (#286); with it, energy comes out in pathways. Products are
  // drawn with energy within CHEM_SPREAD of (substrate - CHEM_STEP), so most reactions are small usable steps downhill;
  // drawn at random, seed 2 had no usable reaction out of species 0 at all.
  CHEM:0, CHEM_S:256, CHEM_ALPHA:0.5, CHEM_D:0.2, CHEM_EVERY:5, CHEM_DECAY:0.0005, CHEM_DMAX:0.3, CHEM_STEP:0.15, CHEM_SPREAD:0.2,   // CHEM_SEED (unset: the world's seed) picks the network, so a replay can share it
};

class World{
  constructor(seed,opts){
    this.p=Object.assign({},DEF,opts||{});
    const P=this.p, C=P.W*P.H;
    this.rnd=mulberry32((seed>>>0)||1); this.C=C; this.tick=0;
    this.alive=new Uint8Array(C); this.E=new Float32Array(C); this.age=new Int32Array(C);
    this.pc=new Uint8Array(C); this.face=new Uint8Array(C); this.R=new Float32Array(C*4);
    this.len=new Uint8Array(C); this.prog=new Uint8Array(C*P.MAXLEN*2);
    this.sprog=new Uint8Array(C*P.MAXLEN*2); this.slen=new Uint8Array(C); this.srnd=mulberry32(((seed>>>0)||1)^0x5eed5eed);   // the SHADOW genome: same genealogy, same mutation process, never executed
    // the NEUTRAL SHADOW POPULATION (Bedau and Packard): genotype labels only. Each tick it gets the real world's number of
    // births and deaths, with parents and victims picked at random, and a child takes a new label exactly when the real
    // child was a mutant. So a label grows only by luck, and a real genotype that outgrows every label grew by selection.
    this.ns=[]; this.nsNext=1; this.nrnd=mulberry32(((seed>>>0)||1)^0x0badf00d); this.tickBirths=[]; this.tickDeaths=0;
    // and a second one for FUNCTIONAL genotypes (fnHash: neutral ops dropped, argument bits an op ignores masked), where a
    // child is new only when the real child's functional genotype changed. fnRep keeps which functional genotypes have had a
    // representative program written out, so later analysis can replay them head to head.
    this.fs=[]; this.fsNext=1; this.frnd=mulberry32(((seed>>>0)||1)^0x0f00d5ed); this.tickBirthsF=[]; this.fnRep=new Set();
    this.tag=new Uint16Array(C); this.tmpl=new Uint16Array(C); this.stamp=new Int32Array(C).fill(-1);
    this.gen=new Int32Array(C);                                  // generation depth
    this.light=new Float32Array(C); this.cap=new Float32Array(C); this.corpse=new Float32Array(C);
    this.order=new Int32Array(C); for(let i=0;i<C;i++)this.order[i]=i;
    this.patch=[]; for(let k=0;k<P.PATCHES;k++){ const a=this.rnd()*Math.PI*2; this.patch.push({x:this.rnd()*P.W,y:this.rnd()*P.H,vx:Math.cos(a)*P.PATCH_V,vy:Math.sin(a)*P.PATCH_V}); }
    this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0};
    this.n0=P.CHEM?NEUTRAL0_CHEM:NEUTRAL0;
    if(P.CHEM){ const S=P.CHEM_S, cr=mulberry32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x00c4e3c4); this.mol=new Float32Array(C*S); this.molTmp=new Float32Array(C); this.eMol=new Float32Array(S); this.prod=new Uint16Array(S*4);   // its own RNG: the main stream (ancestors, patches) is the same as without CHEM
      this.eMol[0]=1; for(let q=1;q<S;q++)this.eMol[q]=cr(); for(let q=0;q<S;q++)for(let j=0;j<4;j++){ let t, g=0; do{ t=(cr()*S)|0; g++; }while(g<100000&&(t===q||Math.abs(this.eMol[t]-(this.eMol[q]-P.CHEM_STEP))>=P.CHEM_SPREAD)); this.prod[q*4+j]=t; } this.ev.metab=0; this.ev.metabN=0; this.rxE=new Float64Array(S*4); }   // rxE: energy each reaction captured since the last sample   // products lie near the substrate, mostly a little lower
    this.updateCap(); for(let c=0;c<C;c++)this.light[c]=this.cap[c];
    // the ancestor: eat light, try to divide, turn. Nothing else is given.
    const anc=[[OP.EAT_LIGHT,0],[OP.DIVIDE,0],[OP.TURN,1]];
    for(let k=0;k<P.W*P.H/16;k++){ const c=(this.rnd()*C)|0; if(this.alive[c])continue; this.place(c,anc,1.0,(this.rnd()*65536)|0,(this.rnd()*65536)|0,0); this.ns.push(0); this.fs.push(0); }
  }
  // ---- geometry ----
  ahead(c,f){ const P=this.p, x=c%P.W, y=(c/P.W)|0; const dx=DX[f&7], dy=DY[f&7]; return ((y+dy+P.H)%P.H)*P.W+((x+dx+P.W)%P.W); }
  updateCap(){ const P=this.p; for(const q of this.patch){ q.x=(q.x+q.vx+P.W)%P.W; q.y=(q.y+q.vy+P.H)%P.H; }
    const r2=P.PATCH_R*P.PATCH_R;
    for(let y=0;y<P.H;y++)for(let x=0;x<P.W;x++){ let v=P.L_MIN;
      for(const q of this.patch){ let dx=Math.abs(x-q.x); dx=Math.min(dx,P.W-dx); let dy=Math.abs(y-q.y); dy=Math.min(dy,P.H-dy); v+=P.L_PEAK*Math.exp(-(dx*dx+dy*dy)/r2); }
      this.cap[y*P.W+x]=v; } }
  place(c,prog,E,tag,tmpl,gen,sh){ const P=this.p, o=c*P.MAXLEN*2; sh=sh||prog; this.slen[c]=sh.length; for(let i=0;i<sh.length;i++){ this.sprog[o+i*2]=sh[i][0]; this.sprog[o+i*2+1]=sh[i][1]; } this.alive[c]=1; this.E[c]=E; this.age[c]=0; this.pc[c]=0; this.face[c]=(this.rnd()*8)|0;
    this.R.fill(0,c*4,c*4+4); this.len[c]=prog.length; for(let i=0;i<prog.length;i++){ this.prog[o+i*2]=prog[i][0]; this.prog[o+i*2+1]=prog[i][1]; }
    this.tag[c]=tag; this.tmpl[c]=tmpl; this.gen[c]=gen; this.stamp[c]=this.tick; }
  kill(c,why){ const P=this.p; this.alive[c]=0; this.tickDeaths++; this.corpse[c]+=Math.max(0,this.E[c])+P.BODY; this.E[c]=0; this.ev[why]++; }
  moveOrg(a,b){ const P=this.p, L=P.MAXLEN*2; this.alive[b]=1; this.alive[a]=0; this.E[b]=this.E[a]; this.age[b]=this.age[a]; this.pc[b]=this.pc[a]; this.face[b]=this.face[a];
    for(let k=0;k<4;k++)this.R[b*4+k]=this.R[a*4+k]; this.len[b]=this.len[a]; this.prog.copyWithin(b*L,a*L,a*L+L); this.sprog.copyWithin(b*L,a*L,a*L+L); this.slen[b]=this.slen[a];
    this.tag[b]=this.tag[a]; this.tmpl[b]=this.tmpl[a]; this.gen[b]=this.gen[a]; this.stamp[b]=this.stamp[a]; this.E[a]=0; }
  mutateInto(src,r){ const P=this.p; for(const ins of src){ if(r()<P.MU_SUB){ if(r()<0.5)ins[0]=(r()*NOPS)|0; else ins[1]=(r()*256)|0; } }
    if(src.length<P.MAXLEN&&r()<P.MU_INS)src.splice((r()*(src.length+1))|0,0,[(r()*NOPS)|0,(r()*256)|0]);
    if(src.length>1&&r()<P.MU_DEL)src.splice((r()*src.length)|0,1); return src; }
  // ---- reproduction with mutation (balanced insertion and deletion) ----
  divide(c){ const P=this.p; if(this.E[c]<P.DIV_MIN)return false;
    let t=-1; const f0=this.face[c]; for(let k=0;k<8;k++){ const n=this.ahead(c,f0+k); if(!this.alive[n]){ t=n; break; } } if(t<0)return false;   // no empty neighbour, no child (overwriting the neighbour made DIVIDE free predation: a kill-and-eat loop, about 200 births a tick)
    const o=c*P.MAXLEN*2, n=this.len[c], src=[]; for(let i=0;i<n;i++)src.push([this.prog[o+i*2],this.prog[o+i*2+1]]);
    const r=this.rnd;
    this.mutateInto(src,r);
    const sn=this.slen[c], ssrc=[]; for(let i=0;i<sn;i++)ssrc.push([this.sprog[o+i*2],this.sprog[o+i*2+1]]); this.mutateInto(ssrc,this.srnd);   // the shadow child: same birth, its own mutations
    let tg=this.tag[c], tm=this.tmpl[c]; for(let b=0;b<16;b++){ if(r()<P.MU_TAG)tg^=1<<b; if(r()<P.MU_TAG)tm^=1<<b; }
    const half=(this.E[c]-P.BODY)/2; this.E[c]=half;
    let changed=src.length!==n; if(!changed) for(let i=0;i<n;i++){ if(src[i][0]!==this.prog[o+i*2]||src[i][1]!==this.prog[o+i*2+1]){ changed=true; break; } } this.tickBirths.push(changed?1:0); this.tickBirthsF.push(changed&&fnHashList(src,this.n0)!==fnHash(this.prog,o,n,this.n0)?1:0);
    this.place(t,src,half,tg,tm,this.gen[c]+1,ssrc); this.ev.births++; return true; }
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
        case 17: { const t=this.light[c]*P.EAT_F; this.light[c]-=t; if(P.CHEM){ this.E[c]+=t*(1-P.CHEM_ALPHA); this.mol[c]+=t*P.CHEM_ALPHA; } else this.E[c]+=t; this.ev.eatLight+=t; } break;   // EAT_LIGHT (under CHEM part of the take is left as species 0)
        case 18: { const t=this.corpse[c]*P.EAT_F; this.corpse[c]-=t; this.E[c]+=t; this.ev.eatCorpse+=t; } break;   // EAT_CORPSE
        case 19: { const a=this.ahead(c,this.face[c]); this.E[c]-=P.C_ATTACK; if(this.alive[a]){ const take=this.matchP(c,a)*P.ATT_FRAC*this.E[a]; this.E[a]-=take; this.E[c]+=take*P.ATT_EFF; this.ev.attacks++; this.ev.attackTake+=take;
                   if(this.E[a]<=0.01){ this.kill(a,'killed'); } } } break;   // ATTACK
        case 20: this.divide(c); break;                                      // DIVIDE
        case 21: { const a=this.ahead(c,this.face[c]); if(this.alive[a]){ const g=this.E[c]*P.SHARE_F; this.E[c]-=g; this.E[a]+=g; this.ev.shares++; } } break;   // SHARE
        case 22: { const a=this.ahead(c,this.face[c]); R[r4]=this.light[a]-this.light[c]; } break;   // SENSE_GRAD
        case 23: R[r4]=this.rnd(); break;                                    // RAND
        case 24: case 25: case 26: case 27: if(P.CHEM){ const S=P.CHEM_S, q=arg&(S-1), pr=this.prod[q*4+op-24], d=this.eMol[q]-this.eMol[pr], C=this.C;   // METABj (mol is species-major: species q in cell c is q*C+c)
                   if(d>0&&d<=P.CHEM_DMAX){ const x=this.mol[q*C+c]*P.EAT_F; if(x>0){ this.mol[q*C+c]-=x; this.mol[pr*C+c]+=x; this.E[c]+=x*d; this.ev.metab+=x*d; this.ev.metabN++; this.rxE[q*4+op-24]+=x*d; } } } break;
        case 28: if(P.CHEM)R[r4]=this.mol[(arg&(P.CHEM_S-1))*this.C+c]; break;   // SENSE_MOL
        default: break;                                                      // NOP and the eight neutral markers
      }
      pc=next;
    }
    if(this.alive[c])this.pc[c]=pc;
  }
  step(){ const P=this.p, C=this.C; this.tick++;
    if(this.tick%10===0)this.updateCap();
    if(P.CHEM&&this.tick%P.CHEM_EVERY===0)this.chemStep();
    for(let c=0;c<C;c++){ const l=this.light[c]; this.light[c]=l+P.L_RATE*(this.cap[c]-l); if(this.corpse[c]>0)this.corpse[c]*=1-P.CORPSE_DECAY; }
    const ord=this.order, r=this.rnd; for(let i=C-1;i>0;i--){ const j=(r()*(i+1))|0; const t=ord[i]; ord[i]=ord[j]; ord[j]=t; }
    for(let k=0;k<C;k++){ const c=ord[k]; if(!this.alive[c]||this.stamp[c]===this.tick)continue; this.stamp[c]=this.tick;
      this.E[c]-=P.C_BASE; this.age[c]++;
      this.run(c);
      // the organism may have moved: find it by its own cell or leave; deaths are checked after the slice
    }
    for(let c=0;c<C;c++){ if(!this.alive[c])continue; if(this.E[c]<=0)this.kill(c,'starve'); else if(this.age[c]>P.MAX_AGE)this.kill(c,'old'); }
    if(!this.count())this.reseed();
    this.neutralStep();
  }
  chemStep(){ const P=this.p, S=P.CHEM_S, C=this.C, W=P.W, H=P.H, m=this.mol, t=this.molTmp, D=P.CHEM_D, k=Math.pow(1-P.CHEM_DECAY,P.CHEM_EVERY);
    for(let q=0;q<S;q++){ const b=q*C; let any=false; for(let c=0;c<C;c++) if(m[b+c]>0){ any=true; break; } if(!any)continue;   // species-major, so each scan is contiguous (cell-major made this the slowest part of a tick)
      for(let y=0;y<H;y++){ const yu=b+((y+H-1)%H)*W, yd=b+((y+1)%H)*W, y0=y*W; for(let x=0;x<W;x++){ const xl=(x+W-1)%W, xr=(x+1)%W, c=y0+x, v=m[b+c];
        t[c]=(v+D*((m[b+y0+xl]+m[b+y0+xr]+m[yu+x]+m[yd+x])/4-v))*k; } }
      m.set(t,b); } }
  neutralStep(){ const ns=this.ns, r=this.nrnd;
    for(let d=0;d<this.tickDeaths&&ns.length;d++){ const k=(r()*ns.length)|0; ns[k]=ns[ns.length-1]; ns.pop(); }
    const m=ns.length; for(const ch of this.tickBirths){ const par=m?ns[(r()*m)|0]:0; ns.push(ch||!m?this.nsNext++:par); }
    { const fs=this.fs, fr=this.frnd; for(let d=0;d<this.tickDeaths&&fs.length;d++){ const k=(fr()*fs.length)|0; fs[k]=fs[fs.length-1]; fs.pop(); }
      const fm=fs.length; for(const ch of this.tickBirthsF){ const par=fm?fs[(fr()*fm)|0]:0; fs.push(ch||!fm?this.fsNext++:par); } }
    this.tickBirths.length=0; this.tickBirthsF.length=0; this.tickDeaths=0; }
  count(){ let n=0; for(let c=0;c<this.C;c++)n+=this.alive[c]; return n; }
  reseed(){ const anc=[[OP.EAT_LIGHT,0],[OP.DIVIDE,0],[OP.TURN,1]]; this.reseeds=(this.reseeds||0)+1;
    for(let k=0;k<this.C/16;k++){ const c=(this.rnd()*this.C)|0; if(!this.alive[c]){ this.place(c,anc,1.0,(this.rnd()*65536)|0,(this.rnd()*65536)|0,0); this.ns.push(0); this.fs.push(0); } } }
  // ---- readouts (draw nothing) ----
  sample(){ const P=this.p, L=P.MAXLEN*2; let n=0, len=0, E=0, gmax=0, gsum=0;
    const opC=new Float64Array(NOPS), bgC=new Map(), geno=new Map(), sopC=new Float64Array(NOPS), sbgC=new Map(), pg=new Map(), spg=new Map(); const fg=new Map(), fgCell=new Map();   // functional genotypes, and one living cell of each   // pg/spg: real and shadow PROGRAM genotypes (ops and args, hashed the same way)
    for(let c=0;c<this.C;c++){ if(!this.alive[c])continue; n++; const m=this.len[c], o=c*L; len+=m; E+=this.E[c]; gsum+=this.gen[c]; if(this.gen[c]>gmax)gmax=this.gen[c];
      const seen=new Uint8Array(NOPS), bs=new Set(); let key='';
      for(let i=0;i<m;i++){ const op=this.prog[o+i*2]; seen[op]=1; key+=op+'.'+this.prog[o+i*2+1]+','; if(i+1<m)bs.add(op*NOPS+this.prog[o+(i+1)*2]); }
      for(let q=0;q<NOPS;q++)if(seen[q])opC[q]++;
      for(const b of bs)bgC.set(b,(bgC.get(b)||0)+1);
      key+='|'+this.tag[c]+'|'+this.tmpl[c]; geno.set(key,(geno.get(key)||0)+1);
      { let h=2166136261|0; for(let i=0;i<m*2;i++)h=Math.imul(h^this.prog[o+i],16777619); h=(h^m)>>>0; pg.set(h,(pg.get(h)||0)+1); const fh=fnHash(this.prog,o,m,this.n0); fg.set(fh,(fg.get(fh)||0)+1); if(!fgCell.has(fh))fgCell.set(fh,c);
        let sh=2166136261|0; const smm=this.slen[c]; for(let i=0;i<smm*2;i++)sh=Math.imul(sh^this.sprog[o+i],16777619); sh=(sh^smm)>>>0; spg.set(sh,(spg.get(sh)||0)+1); }
      { const sm=this.slen[c], sseen=new Uint8Array(NOPS), sbs=new Set(); for(let i=0;i<sm;i++){ const op=this.sprog[o+i*2]; sseen[op]=1; if(i+1<sm)sbs.add(op*NOPS+this.sprog[o+(i+1)*2]); } for(let q=0;q<NOPS;q++)if(sseen[q])sopC[q]++; for(const b of sbs)sbgC.set(b,(sbgC.get(b)||0)+1); } }
    let ground=0, dead=0; for(let c=0;c<this.C;c++){ ground+=this.light[c]; dead+=this.corpse[c]; }
    let gTop=0; for(const v of geno.values()) if(v>gTop)gTop=v;
    // the tag race: how well the living's attack templates fit the living's surface tags (random pairs, no draws - a fixed
    // stride over the living list), how many distinct tags exist, and how many of this sample's tags were never seen before
    const liv=[]; for(let c=0;c<this.C;c++) if(this.alive[c])liv.push(c); let mt=0, mn=0; for(let a=0;a<Math.min(400,liv.length);a++){ const i=liv[(a*7919)%liv.length], j=liv[(a*104729+17)%liv.length]; if(i!==j){ mt+=this.matchP(i,j); mn++; } }
    const tags=new Set(); for(const c of liv)tags.add(this.tag[c]); if(!this.everTags)this.everTags=new Set(); let newTags=0; for(const t of tags) if(!this.everTags.has(t)){ this.everTags.add(t); newTags++; }
    let atk=0; for(const c of liv){ const o=c*L; for(let q=0;q<this.len[c];q++) if(this.prog[o+q*2]===19){ atk++; break; } }
    const fgTop=[...fg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60), fnNew={};
    for(const [h] of fgTop.slice(0,10)) if(!this.fnRep.has(h)){ this.fnRep.add(h); const c=fgCell.get(h), o=c*L; let hex=''; for(let i=0;i<this.len[c]*2;i++)hex+=this.prog[o+i].toString(16).padStart(2,'0'); fnNew[h]=hex+'|'+this.tag[c]+'|'+this.tmpl[c]; }
    const fnNeutral=(()=>{ const m=new Map(); for(const l of this.fs)m.set(l,(m.get(l)||0)+1); return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60); })();
    let chem=null; if(P.CHEM){ const S=P.CHEM_S, tot=new Float64Array(S); for(let i=0;i<this.C*S;i++)tot[(i/this.C)|0]+=this.mol[i];
      let molE=0, present=0; for(let q=0;q<S;q++){ molE+=tot[q]*this.eMol[q]; if(tot[q]>0.5)present++; }
      const rx=new Map(); for(const c of liv){ const o=c*L, seen=new Set(); for(let i=0;i<this.len[c];i++){ const op=this.prog[o+i*2]; if(op>=24&&op<=27){ const q=this.prog[o+i*2+1]&(S-1), pr=this.prod[q*4+op-24]; { const d=this.eMol[q]-this.eMol[pr]; if(d>0&&d<=P.CHEM_DMAX)seen.add(q*4+op-24); } } } for(const x of seen)rx.set(x,(rx.get(x)||0)+1); }
      const fl=[]; let ft=0; for(let x=0;x<S*4;x++) if(this.rxE[x]>0){ fl.push([x,this.rxE[x]]); ft+=this.rxE[x]; } fl.sort((a,b)=>b[1]-a[1]); this.rxE.fill(0);
      chem={molE:+molE.toFixed(1),present,flux:fl.slice(0,24).map(([x,v])=>[x,+(v/ft).toFixed(4)]),fluxN:fl.length,reactions:rx.size,topRx:[...rx.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([x,v])=>[x,+(v/liv.length).toFixed(3)]),metab:+(this.ev.metab||0).toFixed(1),metabN:this.ev.metabN||0}; }
    const ev=this.ev; this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0}; if(P.CHEM){ this.ev.metab=0; this.ev.metabN=0; }
    return {t:this.tick,N:n,meanLen:n?+(len/n).toFixed(2):0,meanGen:n?+(gsum/n).toFixed(1):0,maxGen:gmax,energy:{stores:+E.toFixed(1),light:+ground.toFixed(1),corpses:+dead.toFixed(1)},
      genotypes:geno.size,topGenoShare:n?+(gTop/n).toFixed(3):0,ev,race:{meanMatch:mn?+(mt/mn).toFixed(4):0,tags:tags.size,newTags,everTags:this.everTags.size,attackers:n?+(atk/n).toFixed(3):0},
      opShare:Array.from(opC,v=>n?+(v/n).toFixed(4):0),
      bigrams:Object.fromEntries([...bgC.entries()].filter(([b,v])=>v/n>=0.01).map(([b,v])=>[b,+(v/n).toFixed(4)])),
      shadowOpShare:Array.from(sopC,v=>n?+(v/n).toFixed(4):0),
      progGeno:[...pg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60), shadowGeno:[...spg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60), progGenoN:pg.size, shadowGenoN:spg.size, neutralGeno:(()=>{ const m=new Map(); for(const l of this.ns)m.set(l,(m.get(l)||0)+1); return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60); })(), neutralN:this.ns.length, fnGeno:fgTop, fnGenoN:fg.size, fnNeutral, fnNeutralN:this.fs.length, fnNew,
      shadowBigrams:Object.fromEntries([...sbgC.entries()].filter(([b,v])=>v/n>=0.01).map(([b,v])=>[b,+(v/n).toFixed(4)])),
      reseeds:this.reseeds||0, ...(chem?{chem,n0:this.n0}:{})}; }
}

// ---- save and resume: every field is a typed array or a plain value, so a run can be carried across windows exactly ----
const ARRAYS=['alive','E','age','pc','face','R','len','prog','sprog','slen','tag','tmpl','stamp','gen','light','cap','corpse','order'];
const CHEM_ARRAYS=['mol','eMol','prod'];
World.prototype.save=function(){ const o={p:this.p,tick:this.tick,rnd:this.rnd.s,srnd:this.srnd.s,patch:this.patch,reseeds:this.reseeds||0,everTags:this.everTags?[...this.everTags]:[],ns:this.ns,nsNext:this.nsNext,nrnd:this.nrnd.s,fs:this.fs,fsNext:this.fsNext,frnd:this.frnd.s,fnRep:[...this.fnRep],a:{}};
  for(const k of ARRAYS.concat(this.p.CHEM?CHEM_ARRAYS:[]))o.a[k]=Buffer.from(this[k].buffer,this[k].byteOffset,this[k].byteLength).toString('base64'); return JSON.stringify(o); };
World.load=function(txt){ const o=JSON.parse(txt); const w=new World(1,o.p); w.tick=o.tick; w.rnd.s=o.rnd; w.srnd.s=o.srnd; w.patch=o.patch; w.reseeds=o.reseeds; w.everTags=new Set(o.everTags); w.ns=o.ns||[]; w.nsNext=o.nsNext||1; if(o.nrnd!==undefined)w.nrnd.s=o.nrnd; w.fs=o.fs||[]; w.fsNext=o.fsNext||1; if(o.frnd!==undefined)w.frnd.s=o.frnd; w.fnRep=new Set(o.fnRep||[]);
  for(const k of ARRAYS.concat(o.p.CHEM?CHEM_ARRAYS:[])){ const b=Buffer.from(o.a[k],'base64'); const A=w[k]; new Uint8Array(A.buffer,A.byteOffset,A.byteLength).set(b); } return w; };
module.exports={World,OPS,OP,NOPS,NEUTRAL0,isNeutral,DEF,fnHash,fnHashList,ARGMASK,OPS_CHEM,NEUTRAL0_CHEM};
