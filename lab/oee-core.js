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
const {Mind}=require('./mind.js');   // #293: a primitive mind inside the world, off unless MIND>0 (lab/mind.js)

// ---- the instruction set: 24 that act, 8 that do nothing (the neutral shadow) ----
const OPS=['NOP','LOADK','MOV','ADD','SUB','MUL','IFGT','IFLT','JMP','SENSE_E','SENSE_LIGHT','SENSE_CORPSE',
  'SENSE_AHEAD','SENSE_KIN','SENSE_MATCH','TURN','MOVE','EAT_LIGHT','EAT_CORPSE','ATTACK','DIVIDE','SHARE','SENSE_GRAD','RAND',
  'N0','N1','N2','N3','N4','N5','N6','N7'];
const OP=Object.fromEntries(OPS.map((n,i)=>[n,i]));
// with CHEM on, five of the neutral markers become chemistry and three stay neutral (#286)
const OPS_CHEM=OPS.slice(0,24).concat(['METAB0','METAB1','METAB2','METAB3','SENSE_MOL','N5','N6','N7']); const NEUTRAL0_CHEM=29;
const NOPS=32, NEUTRAL0=24;
const DX=[1,1,0,-1,-1,-1,0,1], DY=[0,1,1,1,0,-1,-1,-1];   // ops 24-31 are the neutral markers
const POP16=new Uint8Array(65536); for(let i=1;i<65536;i++) POP16[i]=POP16[i>>1]+(i&1);   // bit count, same integers as the Kernighan loop (speedup ported from cos/speedup)
const isNeutral=o=>o>=NEUTRAL0;

// the FUNCTIONAL genotype: the program with NOP and the neutral markers dropped and every argument masked to the bits its
// op reads (LOADK and JMP all 8, MOV..IFLT the low 2, TURN the low 3, the rest none). Two programs with the same hash differ
// only where nothing reads, near enough (a dropped marker can shift a JMP or a skip, so this merges a little too much).
const ARGMASK=new Uint8Array(256); ARGMASK[1]=255; for(let q=NOPS;q<256;q++)ARGMASK[q]=255;   // 32 and up: opcodes installed as modules (#292), every argument bit counts
ARGMASK[1]=255; for(let q=2;q<=7;q++)ARGMASK[q]=3; ARGMASK[8]=255; ARGMASK[15]=7; for(let q=24;q<=28;q++)ARGMASK[q]=255;   // 24-28 only count under CHEM
function fnHash(a,o,m,n0){ n0=n0||NEUTRAL0; let h=2166136261|0, k=0; for(let i=0;i<m;i++){ const op=a[o+i*2]; if(op===0||(op>=n0&&op<NOPS))continue; h=Math.imul(h^op,16777619); h=Math.imul(h^(a[o+i*2+1]&ARGMASK[op]),16777619); k++; } return (h^k)>>>0; }
function fnHashList(src,n0){ n0=n0||NEUTRAL0; let h=2166136261|0, k=0; for(const [op,arg] of src){ if(op===0||(op>=n0&&op<NOPS))continue; h=Math.imul(h^op,16777619); h=Math.imul(h^(arg&ARGMASK[op]),16777619); k++; } return (h^k)>>>0; }

// NAND formula size of each three-input function (inputs 0xF0, 0xCC, 0xAA cost 0; NAND(x,y) costs size x + size y + 1)
const TASK_SZ=(()=>{ const S=new Float64Array(256).fill(Infinity); S[0xF0]=0; S[0xCC]=0; S[0xAA]=0;
  for(let ch=true;ch;){ ch=false; for(let x=0;x<256;x++){ if(S[x]===Infinity)continue; for(let y=x;y<256;y++){ if(S[y]===Infinity)continue; const z=(~(x&y))&255, v=S[x]+S[y]+1; if(v<S[z]){ S[z]=v; ch=true; } } } } return S; })();
function h32(a){ a|=0; a=Math.imul(a^(a>>>16),0x45d9f3b); a=Math.imul(a^(a>>>16),0x45d9f3b); return (a^(a>>>16))>>>0; }

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
  // VIRUS (#287), needs CHEM, off by default: lytic viruses that enter through a METABOLIC REACTION, as phage lambda enters
  // E. coli through the maltose transporter (Meyer et al. 2012). A virion's key is one reaction (species*4+j); it infects a
  // host whose program carries METABj for that species, kills it (lysis: store and body to the corpse) and bursts into
  // V_BURST virions, each re-keyed to a random reaction with V_MUT. Escape means giving the reaction up or rerouting through
  // another, which is a new behaviour; the virus then has to find the new route. V_SPEC:0 is the control: keys ignored.
  VIRUS:0, V_ONSET:20000, V_MAX:40000, V_BURST:6, V_DECAY:0.02, V_MOVE:0.5, V_INFECT:0.2, V_MUT:0.1, V_IMMIG:0.1, V_SPEC:1,
  V_SEED:null, V_SEEDN:100,   // a replay can start with V_SEEDN virions of each key in V_SEED, placed at V_ONSET
  // CHEM_BIG (#288), with CHEM: 65,536 species, energies and products drawn from a hash on demand (same small-step rule),
  // molecules kept as sparse per-species layers. METAB and SENSE_MOL address a species with two bytes: their own argument
  // (low) and the next instruction's (high). Each product is a one-bit flip of its substrate, so the enzyme for the next step
  // is one byte change from the enzyme for this one (random 16-bit products needed two at once and nothing past a first
  // step was found in 60,000 ticks). Virus keys are then 18-bit; a mutant moves along the network (another product
  // of the same substrate, or a step downstream), and an immigrant is keyed to a molecule actually present. The 256-species
  // network ran out (#287): this one is too large to exhaust in a run.
  CHEM_BIG:0, V_PRESENT:0.05,
  // TASKS (#290), exclusive of CHEM, off by default: Avida's logic tasks. Each organism is born with three random 32-bit
  // inputs (redrawn until all eight truth-table rows occur), so an output names one three-input boolean function (256 of
  // them) only if its bits agree wherever a row repeats - every row is made to occur at least twice, so a constant cannot. (With 8-bit inputs every row
  // appeared once, any byte was some function, and a LOADK constant earned all 251 within 10,000 ticks.) INPUT reads the next input into R0, NAND sets
  // R0 to NOT(R0 AND Rk), GET copies Rk into R0, OUTPUT pays the function its output computes, once per life: a share
  // TASK_F of that function's own regenerating pool (TASK_CAP, TASK_RATE), so a function few organisms compute pays well.
  // Echoes of an input and constants pay nothing. With VIRUS on, a virion's key is a function and it infects a host that
  // has computed it this life (after Zaman et al. 2014, where coevolving parasites drove complex tasks in Avida).
  // TASK_MAX: how many functions one life can be paid for. Unlimited, a short loop of INPUT, NAND and OUTPUT computes a new
  // genuine function every pass and one program collected all 251 within a few thousand generations; at 1 each lineage
  // specialises, and reaching a hard function means building its circuit.
  // TASK_SCALE: 1 makes each function's pool cap TASK_CAP times its NAND formula size, so a harder function is a richer
  // niche (Avida pays harder tasks more); 0 gives every function the same cap.
  TASKS:0, TASK_CAP:20, TASK_RATE:0.02, TASK_F:0.2, TASK_MAX:1, TASK_SCALE:0,
};

// 64x64 diffusion (ported from cos/speedup). The stored value is the same expression as the general loop, including /4
// (not a multiply), evaluated in the same association; edge cells use the wrapped neighbour directly.
function diffuse64(m,b,t,D,k){
  for(let y=0;y<64;y++){
    const row=y*64, up=(y===0?63:y-1)*64, dn=(y===63?0:y+1)*64, ro=b+row, uo=b+up, dno=b+dn;
    let v=m[ro];
    t[row]=(v+D*((m[ro+63]+m[ro+1]+m[uo]+m[dno])/4-v))*k;
    for(let x=1;x<63;x++){ const i=ro+x; v=m[i]; t[row+x]=(v+D*((m[i-1]+m[i+1]+m[uo+x]+m[dno+x])/4-v))*k; }
    const i=ro+63; v=m[i];
    t[row+63]=(v+D*((m[i-1]+m[ro]+m[uo+63]+m[dno+63])/4-v))*k;
  }
}

class World{
  constructor(seed,opts){
    this.p=Object.assign({},DEF,opts||{});
    const P=this.p, C=P.W*P.H;
    this.rnd=mulberry32((seed>>>0)||1); this.C=C; this.tick=0; this.seed0=(seed>>>0)||1;
    if(P.MIND>0)this.mind=new Mind(this.seed0,{P:P.MIND,MODE:P.MIND_MODE,LR:P.MIND_LR,K:P.MIND_K,H:P.MIND_H,EVERY:P.MIND_EVERY,STEPS:P.MIND_STEPS});   // MIND (#293), not in DEF so a world without it saves exactly as before: the chance it writes an instruction of each child; MIND_MODE learn | frozen | uniform
    this.alive=new Uint8Array(C); this.E=new Float32Array(C); this.age=new Int32Array(C);
    this.pc=new Uint8Array(C); this.face=new Uint8Array(C); this.R=(opts&&opts.TASKS)?new Float64Array(C*4):new Float32Array(C*4);   // TASKS needs registers that hold a 32-bit word exactly
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
    this.nb=new Int32Array(C*8); for(let c=0;c<C;c++){ const x=c%P.W, y=(c/P.W)|0, o=c*8; for(let f=0;f<8;f++) this.nb[o+f]=((y+DY[f]+P.H)%P.H)*P.W+((x+DX[f]+P.W)%P.W); }   // the eight neighbours of every cell, filled once with the old formula
    this.patch=[]; for(let k=0;k<P.PATCHES;k++){ const a=this.rnd()*Math.PI*2; this.patch.push({x:this.rnd()*P.W,y:this.rnd()*P.H,vx:Math.cos(a)*P.PATCH_V,vy:Math.sin(a)*P.PATCH_V}); }
    this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0};
    this.n0=P.CHEM?NEUTRAL0_CHEM:P.TASKS?28:NEUTRAL0;
    if(P.TASKS){ this.tin=new Uint32Array(C*3); this.tic=new Uint8Array(C); this.tdone=new Uint32Array(C*8); this.tcap=new Float64Array(256); for(let T=0;T<256;T++)this.tcap[T]=P.TASK_CAP*(P.TASK_SCALE?TASK_SZ[T]:1); this.tres=Float64Array.from(this.tcap); this.tE=new Float64Array(256); this.tN=new Uint32Array(256); }
    if(P.CHEM&&P.CHEM_BIG){ this.big={layers:new Map(),e:new Map(),pr:new Map(),salt:h32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x00c4e3c4)}; this.molTmp=new Float32Array(C); this.ev.metab=0; this.ev.metabN=0; this.rxE=new Map(); }
    else if(P.CHEM){ const S=P.CHEM_S, cr=mulberry32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x00c4e3c4); this.mol=new Float32Array(C*S); this.molTmp=new Float32Array(C); this.eMol=new Float32Array(S); this.prod=new Uint16Array(S*4);   // its own RNG: the main stream (ancestors, patches) is the same as without CHEM
      this.eMol[0]=1; for(let q=1;q<S;q++)this.eMol[q]=cr(); for(let q=0;q<S;q++)for(let j=0;j<4;j++){ let t, g=0; do{ t=(cr()*S)|0; g++; }while(g<100000&&(t===q||Math.abs(this.eMol[t]-(this.eMol[q]-P.CHEM_STEP))>=P.CHEM_SPREAD)); this.prod[q*4+j]=t; } this.ev.metab=0; this.ev.metabN=0; this.rxE=new Float64Array(S*4); this.molLive=new Uint8Array(S); }   // molLive: species that may be nonzero, so diffusion can skip the rest   // rxE: energy each reaction captured since the last sample   // products lie near the substrate, mostly a little lower
    if(P.VIRUS){ this.vc=new Int32Array(P.V_MAX); this.vk=P.CHEM_BIG?new Uint32Array(P.V_MAX):new Uint16Array(P.V_MAX); this.vn=0; this.vrnd=mulberry32(((seed>>>0)||1)^0x7e577e57); this.ev.lysed=0; this.ev.infections=0; }
    this.updateCap(); for(let c=0;c<C;c++)this.light[c]=this.cap[c];
    // the ancestor: eat light, try to divide, turn. Nothing else is given.
    const anc=[[OP.EAT_LIGHT,0],[OP.DIVIDE,0],[OP.TURN,1]];
    for(let k=0;k<P.W*P.H/16;k++){ const c=(this.rnd()*C)|0; if(this.alive[c])continue; this.place(c,anc,1.0,(this.rnd()*65536)|0,(this.rnd()*65536)|0,0); this.ns.push(0); this.fs.push(0); }
  }
  // ---- geometry ----
  ahead(c,f){ return this.nb[(c<<3)|(f&7)]; }
  updateCap(){ const P=this.p; for(const q of this.patch){ q.x=(q.x+q.vx+P.W)%P.W; q.y=(q.y+q.vy+P.H)%P.H; }
    const r2=P.PATCH_R*P.PATCH_R;
    for(let y=0;y<P.H;y++)for(let x=0;x<P.W;x++){ let v=P.L_MIN;
      for(const q of this.patch){ let dx=Math.abs(x-q.x); dx=Math.min(dx,P.W-dx); let dy=Math.abs(y-q.y); dy=Math.min(dy,P.H-dy); v+=P.L_PEAK*Math.exp(-(dx*dx+dy*dy)/r2); }
      this.cap[y*P.W+x]=v; } }
  place(c,prog,E,tag,tmpl,gen,sh){ const P=this.p, o=c*P.MAXLEN*2; if(P.TASKS)this.taskBirth(c); sh=sh||prog; this.slen[c]=sh.length; for(let i=0;i<sh.length;i++){ this.sprog[o+i*2]=sh[i][0]; this.sprog[o+i*2+1]=sh[i][1]; } this.alive[c]=1; this.E[c]=E; this.age[c]=0; this.pc[c]=0; this.face[c]=(this.rnd()*8)|0;
    this.R.fill(0,c*4,c*4+4); this.len[c]=prog.length; for(let i=0;i<prog.length;i++){ this.prog[o+i*2]=prog[i][0]; this.prog[o+i*2+1]=prog[i][1]; }
    this.tag[c]=tag; this.tmpl[c]=tmpl; this.gen[c]=gen; this.stamp[c]=this.tick; }
  taskBirth(c){ const r=this.rnd, cnt=new Uint8Array(8); let a,b,d, ok;   // redrawn until every truth-table row occurs at least twice, so a constant always meets a repeat it disagrees with
    do{ a=(r()*4294967296)>>>0; b=(r()*4294967296)>>>0; d=(r()*4294967296)>>>0; cnt.fill(0); for(let i=0;i<32;i++)cnt[(((a>>>i)&1)<<2)|(((b>>>i)&1)<<1)|((d>>>i)&1)]++; ok=true; for(let k=0;k<8;k++) if(cnt[k]<2)ok=false; }while(!ok);
    this.tin[c*3]=a; this.tin[c*3+1]=b; this.tin[c*3+2]=d; this.tic[c]=0; this.tdone.fill(0,c*8,c*8+8); }
  taskOut(c,v){ const a=this.tin[c*3], b=this.tin[c*3+1], d=this.tin[c*3+2]; let T=0, set=0;   // which function of (a,b,d) the output v is: each bit position holds one row of the truth table, and repeated rows must agree
    for(let i=0;i<32;i++){ const k=(((a>>>i)&1)<<2)|(((b>>>i)&1)<<1)|((d>>>i)&1), o=(v>>>i)&1; if(set&(1<<k)){ if(((T>>k)&1)!==o)return; } else { set|=1<<k; if(o)T|=1<<k; } }
    if(T===0||T===255||T===0xF0||T===0xCC||T===0xAA)return; if(this.p.TASK_MAX&&this.tcount(c)>=this.p.TASK_MAX)return; const w=c*8+(T>>5), bit=1<<(T&31); if(this.tdone[w]&bit)return; this.tdone[w]|=bit;
    const g=this.tres[T]*this.p.TASK_F; this.tres[T]-=g; this.E[c]+=g; this.tE[T]+=g; this.tN[T]++; }
  tcount(c){ let n=0; for(let k=0;k<8;k++){ let x=this.tdone[c*8+k]; while(x){ x&=x-1; n++; } } return n; }
  kill(c,why){ const P=this.p; this.alive[c]=0; this.tickDeaths++; this.corpse[c]+=Math.max(0,this.E[c])+P.BODY; this.E[c]=0; this.ev[why]++;
    const bf=this.bodyF; if(bf) for(const f of bf){ if(f.energy)this.corpse[c]+=f.A[c]; f.A[c]=0; } }   // a module's body fields die with the body: energy to the corpse, the rest cleared
  moveOrg(a,b){ const P=this.p, L=P.MAXLEN*2; this.alive[b]=1; this.alive[a]=0; this.E[b]=this.E[a]; this.age[b]=this.age[a]; this.pc[b]=this.pc[a]; this.face[b]=this.face[a];
    for(let k=0;k<4;k++)this.R[b*4+k]=this.R[a*4+k]; this.len[b]=this.len[a]; this.prog.copyWithin(b*L,a*L,a*L+L); this.sprog.copyWithin(b*L,a*L,a*L+L); this.slen[b]=this.slen[a];
    this.tag[b]=this.tag[a]; this.tmpl[b]=this.tmpl[a]; this.gen[b]=this.gen[a]; this.stamp[b]=this.stamp[a]; this.E[a]=0;
    { const bf=this.bodyF; if(bf) for(const f of bf){ f.A[b]=f.A[a]; f.A[a]=0; } }   // and so do its module body fields
    if(this.p.TASKS){ for(let k=0;k<3;k++)this.tin[b*3+k]=this.tin[a*3+k]; this.tic[b]=this.tic[a]; for(let k=0;k<8;k++)this.tdone[b*8+k]=this.tdone[a*8+k]; } }
  mutateInto(src,r){ const P=this.p; for(const ins of src){ if(r()<P.MU_SUB){ if(r()<0.5)ins[0]=(r()*(this.nops||NOPS))|0; else ins[1]=(r()*256)|0; } }
    if(src.length<P.MAXLEN&&r()<P.MU_INS)src.splice((r()*(src.length+1))|0,0,[(r()*(this.nops||NOPS))|0,(r()*256)|0]);
    if(src.length>1&&r()<P.MU_DEL)src.splice((r()*src.length)|0,1); return src; }
  // ---- reproduction with mutation (balanced insertion and deletion) ----
  divide(c){ const P=this.p; if(this.E[c]<P.DIV_MIN)return false;
    let t=-1; const f0=this.face[c]; for(let k=0;k<8;k++){ const n=this.ahead(c,f0+k); if(!this.alive[n]){ t=n; break; } } if(t<0)return false;   // no empty neighbour, no child (overwriting the neighbour made DIVIDE free predation: a kill-and-eat loop, about 200 births a tick)
    const o=c*P.MAXLEN*2, n=this.len[c], src=[]; for(let i=0;i<n;i++)src.push([this.prog[o+i*2],this.prog[o+i*2+1]]);
    const r=this.rnd;
    if(this.mind){ this.mind.see(src); this.mind.propose(src,this.nops||NOPS,P.MAXLEN); }   // #293: it sees the parent that divided, and may write one instruction of the child
    this.mutateInto(src,r);
    const sn=this.slen[c], ssrc=[]; for(let i=0;i<sn;i++)ssrc.push([this.sprog[o+i*2],this.sprog[o+i*2+1]]); this.mutateInto(ssrc,this.srnd);   // the shadow child: same birth, its own mutations
    let tg=this.tag[c], tm=this.tmpl[c]; for(let b=0;b<16;b++){ if(r()<P.MU_TAG)tg^=1<<b; if(r()<P.MU_TAG)tm^=1<<b; }
    const half=(this.E[c]-P.BODY)/2; this.E[c]=half;
    let changed=src.length!==n; if(!changed) for(let i=0;i<n;i++){ if(src[i][0]!==this.prog[o+i*2]||src[i][1]!==this.prog[o+i*2+1]){ changed=true; break; } } this.tickBirths.push(changed?1:0); this.tickBirthsF.push(changed&&fnHashList(src,this.n0)!==fnHash(this.prog,o,n,this.n0)?1:0);
    this.place(t,src,half,tg,tm,this.gen[c]+1,ssrc); this.ev.births++; return true; }
  matchP(a,b){ const s=(16-POP16[(this.tmpl[a]^this.tag[b])&0xffff])/16, p=this.p.ATT_POW; if(p===4) return ((s*s)*s)*s; return Math.pow(s,p); }
  kinSim(a,b){ return (16-POP16[(this.tag[a]^this.tag[b])&0xffff])/16; }
  // ---- one organism's time slice ----
  run(c){ const P=this.p, L=P.MAXLEN*2, o=c*L, R=this.R, r4=c*4, n=this.len[c];
    const prog=this.prog, E=this.E, alive=this.alive; let pc=this.pc[c]%Math.max(1,n);
    for(let s=0;s<P.SLICE&&alive[c];s++){
      const op=prog[o+pc*2], arg=prog[o+pc*2+1]; E[c]-=P.C_INSTR; let next=pc+1; if(next===n)next=0;
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
        case 17: { const t=this.light[c]*P.EAT_F; this.light[c]-=t; if(P.CHEM){ this.E[c]+=t*(1-P.CHEM_ALPHA); if(P.CHEM_BIG)this.layer(0)[c]+=t*P.CHEM_ALPHA; else { this.mol[c]+=t*P.CHEM_ALPHA; if(t*P.CHEM_ALPHA>0)this.molLive[0]=1; } } else this.E[c]+=t; this.ev.eatLight+=t; } break;   // EAT_LIGHT (under CHEM part of the take is left as species 0)
        case 18: { const t=this.corpse[c]*P.EAT_F; this.corpse[c]-=t; this.E[c]+=t; this.ev.eatCorpse+=t; } break;   // EAT_CORPSE
        case 19: { const a=this.ahead(c,this.face[c]); this.E[c]-=P.C_ATTACK; if(this.alive[a]){ const take=this.matchP(c,a)*P.ATT_FRAC*this.E[a]; this.E[a]-=take; this.E[c]+=take*P.ATT_EFF; this.ev.attacks++; this.ev.attackTake+=take;
                   if(this.E[a]<=0.01){ this.kill(a,'killed'); } } } break;   // ATTACK
        case 20: this.divide(c); break;                                      // DIVIDE
        case 21: { const a=this.ahead(c,this.face[c]); if(this.alive[a]){ const g=this.E[c]*P.SHARE_F; this.E[c]-=g; this.E[a]+=g; this.ev.shares++; } } break;   // SHARE
        case 22: { const a=this.ahead(c,this.face[c]); R[r4]=this.light[a]-this.light[c]; } break;   // SENSE_GRAD
        case 23: R[r4]=this.rnd(); break;                                    // RAND
        case 24: case 25: case 26: case 27: if(P.TASKS){   // TASKS: 24 INPUT, 25 OUTPUT, 26 NAND, 27 GET
                   if(op===24){ R[r4]=this.tin[c*3+this.tic[c]]; this.tic[c]=(this.tic[c]+1)%3; } else if(op===25)this.taskOut(c,R[r4]>>>0);
                   else if(op===26)R[r4]=(~((R[r4]>>>0)&(R[r4+(arg&3)]>>>0)))>>>0; else R[r4]=R[r4+(arg&3)]; }
                 else if(P.CHEM_BIG){ const q=arg|(this.prog[o+((pc+1)%n)*2+1]<<8), Lq=this.big.layers.get(q);   // METABj, two-byte species
                   if(Lq&&Lq[c]>0){ const j=op-24, pr=this.bprod(q,j), d=this.be(q)-this.be(pr); if(d>0&&d<=P.CHEM_DMAX){ const x=Lq[c]*P.EAT_F; Lq[c]-=x; this.layer(pr)[c]+=x; this.E[c]+=x*d; this.ev.metab+=x*d; this.ev.metabN++; const id=q*4+j; this.rxE.set(id,(this.rxE.get(id)||0)+x*d); } } }
                 else if(P.CHEM){ const S=P.CHEM_S, q=arg&(S-1), pr=this.prod[q*4+op-24], d=this.eMol[q]-this.eMol[pr], C=this.C;   // METABj (mol is species-major: species q in cell c is q*C+c)
                   if(d>0&&d<=P.CHEM_DMAX){ const x=this.mol[q*C+c]*P.EAT_F; if(x>0){ this.mol[q*C+c]-=x; this.mol[pr*C+c]+=x; this.molLive[pr]=1; this.E[c]+=x*d; this.ev.metab+=x*d; this.ev.metabN++; this.rxE[q*4+op-24]+=x*d; } } } break;
        case 28: if(P.CHEM_BIG){ const Lq=this.big.layers.get(arg|(this.prog[o+((pc+1)%n)*2+1]<<8)); R[r4]=Lq?Lq[c]:0; } else if(P.CHEM)R[r4]=this.mol[(arg&(P.CHEM_S-1))*this.C+c]; break;   // SENSE_MOL
        default: if(op>=NOPS&&this.modByOp){ const m=this.modByOp[op]; if(m&&!m.disarmed){ m.execs++; m.spec.op(m.api,c,arg); } } break;   // NOP, the neutral markers, and installed modules (#292)
      }
      pc=next;
    }
    if(this.alive[c])this.pc[c]=pc;
  }
  step(){ const P=this.p, C=this.C; this.tick++;
    if(this.mind&&this.tick%this.mind.EVERY===0)this.mind.train(this.nops||NOPS);
    if(this.tick%10===0)this.updateCap();
    if(P.CHEM&&this.tick%P.CHEM_EVERY===0)this.chemStep();
    if(P.TASKS){ const tr=this.tres, cp=this.tcap; for(let T=0;T<256;T++)tr[T]+=P.TASK_RATE*(cp[T]-tr[T]); }   // each function's pool regrows toward its cap
    if(this.mods) for(const m of this.mods) if(m.spec.step&&!m.disarmed)m.spec.step(m.api);
    { const rate=P.L_RATE, kd=1-P.CORPSE_DECAY, light=this.light, cap=this.cap, corpse=this.corpse;
      for(let c=0;c<C;c++){ const l=light[c]; light[c]=l+rate*(cap[c]-l); if(corpse[c]>0)corpse[c]*=kd; } }
    const ord=this.order, r=this.rnd; for(let i=C-1;i>0;i--){ const j=(r()*(i+1))|0; const t=ord[i]; ord[i]=ord[j]; ord[j]=t; }
    for(let k=0;k<C;k++){ const c=ord[k]; if(!this.alive[c]||this.stamp[c]===this.tick)continue; this.stamp[c]=this.tick;
      this.E[c]-=P.C_BASE; this.age[c]++;
      this.run(c);
      // the organism may have moved: find it by its own cell or leave; deaths are checked after the slice
    }
    if(P.VIRUS&&this.tick>=P.V_ONSET)this.virusStep();
    for(let c=0;c<C;c++){ if(!this.alive[c])continue; if(this.E[c]<=0)this.kill(c,'starve'); else if(this.age[c]>P.MAX_AGE)this.kill(c,'old'); }
    if(!this.count())this.reseed();
    this.neutralStep();
  }
  be(q){ if(q===0)return 1; const B=this.big; let v=B.e.get(q); if(v===undefined){ v=h32(q^B.salt)/4294967296; if((q&(q-1))===0)v=0.7+0.2*v; B.e.set(q,v); } return v; }   // species 0's one-bit neighbours sit at 0.7-0.9, so every first step pays 0.1-0.3 (seed 2 had none worth running)
  bprod(q,j){ const B=this.big, P=this.p; let a=B.pr.get(q); if(a)return a[j];   // products are one bit-flip from the substrate (an enzyme's specificity moves in small steps), so the next step is one byte change away
    const eq=this.be(q), tgt=eq-P.CHEM_STEP, bits=[]; for(let b=0;b<16;b++)bits.push(b); let hs=h32(q^B.salt^0x51ed27);
    for(let i=15;i>0;i--){ hs=h32(hs+i); const k=hs%(i+1); const t=bits[i]; bits[i]=bits[k]; bits[k]=t; }
    const ok=[], rest=[]; for(const b of bits){ const t=q^(1<<b); (Math.abs(this.be(t)-tgt)<P.CHEM_SPREAD?ok:rest).push(t); }
    rest.sort((x,y)=>Math.abs(this.be(x)-tgt)-Math.abs(this.be(y)-tgt)); a=ok.concat(rest).slice(0,4); B.pr.set(q,a); return a[j]; }
  layer(q){ let L=this.big.layers.get(q); if(!L){ L=new Float32Array(this.C); this.big.layers.set(q,L); } return L; }
  chemStepBig(){ const P=this.p, C=this.C, W=P.W, H=P.H, t=this.molTmp, D=P.CHEM_D, k=Math.pow(1-P.CHEM_DECAY,P.CHEM_EVERY);
    for(const [q,m] of this.big.layers){ let tot=0;
      for(let y=0;y<H;y++){ const yu=((y+H-1)%H)*W, yd=((y+1)%H)*W, y0=y*W; for(let x=0;x<W;x++){ const xl=(x+W-1)%W, xr=(x+1)%W, c=y0+x, v=m[c];
        const nv=(v+D*((m[y0+xl]+m[y0+xr]+m[yu+x]+m[yd+x])/4-v))*k; t[c]=nv; tot+=nv; } }
      if(tot<1e-4)this.big.layers.delete(q); else m.set(t); } }
  chemStep(){ if(this.p.CHEM_BIG)return this.chemStepBig(); const P=this.p, S=P.CHEM_S, C=this.C, W=P.W, H=P.H, m=this.mol, t=this.molTmp, D=P.CHEM_D, k=Math.pow(1-P.CHEM_DECAY,P.CHEM_EVERY);
    const fast=W===64&&H===64, live=this.molLive;   // species-major, so each scan is contiguous (cell-major made this the slowest part of a tick)
    for(let q=0;q<S;q++){ if(live[q]===0)continue; const b=q*C;   // molLive is set on every write that can make a species nonzero, and cleared here when the stencil leaves it at zero
      if(fast) diffuse64(m,b,t,D,k);
      else for(let y=0;y<H;y++){ const yu=b+((y+H-1)%H)*W, yd=b+((y+1)%H)*W, y0=y*W; for(let x=0;x<W;x++){ const xl=(x+W-1)%W, xr=(x+1)%W, c=y0+x, v=m[b+c];
        t[c]=(v+D*((m[b+y0+xl]+m[b+y0+xr]+m[yu+x]+m[yd+x])/4-v))*k; } }
      m.set(t,b); let nz=0; for(let c=0;c<C;c++) if(t[c]>0){ nz=1; break; } live[q]=nz; } }
  carries(c,key){ if(this.p.TASKS)return (this.tdone[c*8+(key>>5)]&(1<<(key&31)))!==0;   // TASKS: the host computed that function this life
    const L=this.p.MAXLEN*2, o=c*L, n=this.len[c], op=24+(key&3), q=key>>2;
    if(this.p.CHEM_BIG){ for(let i=0;i<n;i++) if(this.prog[o+i*2]===op&&(this.prog[o+i*2+1]|(this.prog[o+((i+1)%n)*2+1]<<8))===q)return true; return false; }
    for(let i=0;i<n;i++) if(this.prog[o+i*2]===op&&this.prog[o+i*2+1]===q)return true; return false; }
  vmutate(k,r){ if(this.p.TASKS)return (r()*256)|0; if(!this.p.CHEM_BIG)return (r()*this.p.CHEM_S*4)|0; const q=k>>>2, j=k&3; return r()<0.5?q*4+((r()*4)|0):this.bprod(q,j)*4+((r()*4)|0); }   // big: along the network
  vimmigrant(r){ if(this.p.TASKS)return (r()*256)|0; if(!this.p.CHEM_BIG)return (r()*this.p.CHEM_S*4)|0; const B=this.big.layers; if(!B.size||r()>=this.p.V_PRESENT)return (r()*262144)|0; let i=(r()*B.size)|0; for(const q of B.keys()){ if(i--===0)return q*4+((r()*4)|0); } return 0; }   // big: mostly a random key, as in #287; keyed to a molecule present only V_PRESENT of the time (always so, first steps were hit 50x as often as in #287)
  virusStep(){ const P=this.p, r=this.vrnd, vc=this.vc, vk=this.vk, NR=P.CHEM_S*4;
    if(P.V_SEED&&this.tick===P.V_ONSET) for(const k of P.V_SEED) for(let n=0;n<P.V_SEEDN&&this.vn<P.V_MAX;n++){ vc[this.vn]=(r()*this.C)|0; vk[this.vn]=k; this.vn++; }
    if(r()<P.V_IMMIG&&this.vn<P.V_MAX){ vc[this.vn]=(r()*this.C)|0; vk[this.vn]=this.vimmigrant(r); this.vn++; }   // a trickle of immigrants, so viruses cannot be lost for good
    for(let i=this.vn-1;i>=0;i--){
      if(r()<P.V_DECAY){ this.vn--; vc[i]=vc[this.vn]; vk[i]=vk[this.vn]; continue; }
      let c=vc[i]; if(r()<P.V_MOVE){ c=this.ahead(c,(r()*8)|0); vc[i]=c; }
      if(this.alive[c]&&(!P.V_SPEC||this.carries(c,vk[i]))&&r()<P.V_INFECT){ this.ev.infections++; this.kill(c,'lysed');
        const k=vk[i]; this.vn--; vc[i]=vc[this.vn]; vk[i]=vk[this.vn];   // the virion is used up; its burst is added at the end, where this backward pass has been
        for(let b=0;b<P.V_BURST&&this.vn<P.V_MAX;b++){ vc[this.vn]=c; vk[this.vn]=r()<P.V_MUT?this.vmutate(k,r):k; this.vn++; } } } }
  neutralStep(){ const ns=this.ns, r=this.nrnd;
    for(let d=0;d<this.tickDeaths&&ns.length;d++){ const k=(r()*ns.length)|0; ns[k]=ns[ns.length-1]; ns.pop(); }
    const m=ns.length; for(const ch of this.tickBirths){ const par=m?ns[(r()*m)|0]:0; ns.push(ch||!m?this.nsNext++:par); }
    { const fs=this.fs, fr=this.frnd; for(let d=0;d<this.tickDeaths&&fs.length;d++){ const k=(fr()*fs.length)|0; fs[k]=fs[fs.length-1]; fs.pop(); }
      const fm=fs.length; for(const ch of this.tickBirthsF){ const par=fm?fs[(fr()*fm)|0]:0; fs.push(ch||!fm?this.fsNext++:par); } }
    this.tickBirths.length=0; this.tickBirthsF.length=0; this.tickDeaths=0; }
  // ---- MODULES (#292): physics installed into a running world ----
  // A module is source text evaluating to {name, fields, init(api), op(api,c,arg), step(api)}. It gets the next free opcode
  // (32 and up), enters programs only through mutation, and runs only through the interface below. ENERGY ONLY MOVES: the one
  // way to change a store (an organism's E, light, corpse, or a field the module declares {energy:true}) is api.move, which
  // takes at most what is there; api.spend destroys an organism's energy as heat. So a module can never create energy.
  // Information fields ({energy:false}) are free to read and write. A module draws only from its own random stream, so it
  // never disturbs the world's. DISARMED (the inert twin): the opcode exists, is copied and mutated and costs its instruction,
  // but op, init and step never run.
  installMod(src,opt){ opt=opt||{}; const spec=(new Function('"use strict"; return ('+src+');'))();
    if(!spec||typeof spec.op!=='function'||!spec.name)throw new Error('a module needs a name and an op(api,c,arg)');
    if(!this.mods){ this.mods=[]; this.modByOp=[]; this.nops=NOPS; }
    const op=this.nops; if(op>255)throw new Error('no opcodes left');
    const m={id:this.mods.length,name:spec.name,op,src,spec,disarmed:!!opt.disarmed,at:this.tick,fields:{},energyField:{},execs:0,inc:0,out:0,
      rnd:mulberry32((((this.p.MOD_SEED!==undefined?this.p.MOD_SEED:this.seed0)>>>0)||1)^(0x6d6f6400+op))};
    for(const [k,f] of Object.entries(spec.fields||{})){ const A=new Float32Array(this.C); m.energyField[k]=!!(f&&f.energy); if(f&&f.init){ if(m.energyField[k])throw new Error('an energy field must start empty: '+k); if(f.body)throw new Error('a body field starts empty in every newborn: '+k); A.fill(f.init); } m.fields[k]=A;
      if(f&&f.body){ m.bodyField=m.bodyField||{}; m.bodyField[k]=true; (this.bodyF=this.bodyF||[]).push({A,energy:m.energyField[k]}); } }   // body: belongs to the organism in the cell, not the cell
    m.api=this.modApi(m); this.mods.push(m); this.modByOp[op]=m; this.nops=op+1;
    if(!opt.noInit&&!m.disarmed&&spec.init)spec.init(m.api);
    return m; }
  modApi(m){ const w=this, C=w.C, P=w.p;
    // a field is named 'field' (this module's own) or 'NAME.field' (an earlier module's), so later physics can build on earlier physics
    const oc=new Map(), owner=k=>{ let r=oc.get(k); if(r)return r; const i=k.indexOf('.'); if(i<0)r=[m,k]; else { const o=w.mods.find(x=>x.name===k.slice(0,i)); if(!o||o.id>=m.id)throw new Error(m.name+': no earlier module '+k.slice(0,i)); r=[o,k.slice(i+1)]; } oc.set(k,r); return r; };   // a name always resolves the same way, so it is looked up once
    const store=k=>{ if(k==='E')return w.E; if(k==='light')return w.light; if(k==='corpse')return w.corpse; const [o,f]=owner(k); if(!o.fields[f]||!o.energyField[f])throw new Error(m.name+': not an energy store: '+k); return o.fields[f]; };
    const info=k=>{ const [o,f]=owner(k); if(!o.fields[f])throw new Error(m.name+': no field '+k); return o.fields[f]; };
    const isEnergy=k=>{ if(k==='E'||k==='light'||k==='corpse')return true; const [o,f]=owner(k); return !!o.energyField[f]; };
    const isBody=k=>{ if(k==='E')return true; if(k==='light'||k==='corpse')return false; const [o,f]=owner(k); return !!(o.bodyField&&o.bodyField[f]); };
    return {
      C, W:P.W, H:P.H, get tick(){ return w.tick; },
      rand:()=>m.rnd(),
      alive:c=>w.alive[c]===1, ahead:(c,turn)=>w.ahead(c,w.face[c]+(turn|0)), face:c=>w.face[c], age:c=>w.age[c], tag:c=>w.tag[c], gen:c=>w.gen[c],
      E:c=>w.E[c], light:c=>w.light[c], corpse:c=>w.corpse[c],
      reg:(c,k)=>w.R[c*4+(k&3)], setReg:(c,k,v)=>{ w.R[c*4+(k&3)]=Number.isFinite(v)?v:0; },
      get:(k,c)=>isEnergy(k)?store(k)[c]:info(k)[c],
      set:(k,c,v)=>{ if(isEnergy(k))throw new Error(m.name+': energy cannot be set, only moved: '+k); const [o]=owner(k); if(o!==m)throw new Error(m.name+': only its own information fields can be written: '+k); if(isBody(k)&&!w.alive[c])return; info(k)[c]=Number.isFinite(v)?v:0; },
      move:(fk,fc,tk,tc,amt)=>{ if(!(amt>0))return 0; const F=store(fk), T=store(tk);
        if(isBody(fk)&&!w.alive[fc])return 0; if(isBody(tk)&&!w.alive[tc])return 0;   // a body store exists only while its organism lives
        const a=Math.min(amt,Math.max(0,F[fc])); if(!(a>0))return 0; F[fc]-=a; T[tc]+=a; if(tk==='E')m.inc+=a; if(fk==='E')m.out+=a; return a; },
      spend:(c,amt)=>{ if(!(amt>0)||!w.alive[c])return 0; w.E[c]-=amt; m.out+=amt; return amt; },
      diffuse:(k,D)=>{ if(owner(k)[0]!==m)throw new Error(m.name+': only its own fields diffuse: '+k); if(isBody(k))throw new Error(m.name+': a body field does not spread: '+k); const A=info(k), t=new Float32Array(C), W=P.W, H=P.H; for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const c=y*W+x, v=A[c]; t[c]=v+D*((A[y*W+(x+W-1)%W]+A[y*W+(x+1)%W]+A[((y+H-1)%H)*W+x]+A[((y+1)%H)*W+x])/4-v); } A.set(t); },
      decay:(k,f)=>{ const [o]=owner(k); if(o!==m)throw new Error(m.name+': only its own fields decay: '+k); const A=info(k); for(let c=0;c<C;c++)A[c]*=1-f; } }; }
  // ev: this sample's counters (sample() has already reset the live ones). Shares are over ALL income, modules included (den:'all');
  // until this was fixed the module term sat inside the comment on this line, so older rows hold shares of base income only.
  modSample(ev){ if(!this.mods)return null; let tot=(ev.eatLight||0)+(ev.eatCorpse||0)+(ev.attackTake||0)*this.p.ATT_EFF+(ev.metab||0); for(const m of this.mods)tot+=m.inc;
    const L=this.p.MAXLEN*2, carriers=new Map(); let n=0; for(let c=0;c<this.C;c++){ if(!this.alive[c])continue; n++; const o=c*L, seen=new Set(); for(let i=0;i<this.len[c];i++){ const op=this.prog[o+i*2]; if(op>=NOPS)seen.add(op); } for(const op of seen)carriers.set(op,(carriers.get(op)||0)+1); }
    const list=this.mods.map(m=>{ let fe=0; for(const [k,A] of Object.entries(m.fields)) if(m.energyField[k]) for(let c=0;c<this.C;c++)fe+=A[c];
      const r={id:m.id,name:m.name,op:m.op,disarmed:m.disarmed,at:m.at,execs:m.execs,inc:+m.inc.toFixed(2),out:+m.out.toFixed(2),carriers:n?+((carriers.get(m.op)||0)/n).toFixed(4):0,fieldEnergy:+fe.toFixed(2)}; m.execs=0; m.inc=0; m.out=0; return r; });
    return {nops:this.nops,den:'all',list,flux:list.filter(r=>r.inc>0).map(r=>[r.id,tot>0?+(r.inc/tot).toFixed(4):0])}; }
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
    let chem=null; if(P.CHEM_BIG){ let molE=0, present=0; for(const [q,m] of this.big.layers){ let t=0; for(let c=0;c<this.C;c++)t+=m[c]; molE+=t*this.be(q); if(t>0.5)present++; }
      const fl=[...this.rxE.entries()]; let ft=0; for(const [x,v] of fl)ft+=v; fl.sort((a,b)=>b[1]-a[1]); this.rxE.clear();
      chem={molE:+molE.toFixed(1),present,layers:this.big.layers.size,flux:fl.slice(0,24).map(([x,v])=>[x,+(v/ft).toFixed(4)]),fluxN:fl.length,metab:+(this.ev.metab||0).toFixed(1),metabN:this.ev.metabN||0}; }
    else if(P.CHEM){ const S=P.CHEM_S, tot=new Float64Array(S); for(let i=0;i<this.C*S;i++)tot[(i/this.C)|0]+=this.mol[i];
      let molE=0, present=0; for(let q=0;q<S;q++){ molE+=tot[q]*this.eMol[q]; if(tot[q]>0.5)present++; }
      const rx=new Map(); for(const c of liv){ const o=c*L, seen=new Set(); for(let i=0;i<this.len[c];i++){ const op=this.prog[o+i*2]; if(op>=24&&op<=27){ const q=this.prog[o+i*2+1]&(S-1), pr=this.prod[q*4+op-24]; { const d=this.eMol[q]-this.eMol[pr]; if(d>0&&d<=P.CHEM_DMAX)seen.add(q*4+op-24); } } } for(const x of seen)rx.set(x,(rx.get(x)||0)+1); }
      const fl=[]; let ft=0; for(let x=0;x<S*4;x++) if(this.rxE[x]>0){ fl.push([x,this.rxE[x]]); ft+=this.rxE[x]; } fl.sort((a,b)=>b[1]-a[1]); this.rxE.fill(0);
      chem={molE:+molE.toFixed(1),present,flux:fl.slice(0,24).map(([x,v])=>[x,+(v/ft).toFixed(4)]),fluxN:fl.length,reactions:rx.size,topRx:[...rx.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([x,v])=>[x,+(v/liv.length).toFixed(3)]),metab:+(this.ev.metab||0).toFixed(1),metabN:this.ev.metabN||0}; }
    let tasks=null; if(P.TASKS){ let tot=0, on=0; for(let T=0;T<256;T++){ tot+=this.tE[T]; if(this.tN[T])on++; }
      const held=new Float64Array(256); for(const c of liv) for(let k=0;k<8;k++){ let x=this.tdone[c*8+k]; while(x){ const b=31-Math.clz32(x); held[k*32+b]++; x&=~(1<<b); } }
      const fl=[]; for(let T=0;T<256;T++) if(this.tE[T]>0)fl.push([T,this.tE[T]]); fl.sort((a,b)=>b[1]-a[1]);
      tasks={income:+tot.toFixed(1),performed:on,flux:fl.slice(0,32).map(([T,v])=>[T,+(v/tot).toFixed(4)]),held:[...held.entries()].filter(([T,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,32).map(([T,v])=>[T,+(v/liv.length).toFixed(3)])};
      this.tE.fill(0); this.tN.fill(0); }
    let vir=null; if(P.VIRUS){ const km=new Map(); for(let i=0;i<this.vn;i++)km.set(this.vk[i],(km.get(this.vk[i])||0)+1); const top=[...km.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
      vir={virions:this.vn,keys:km.size,top:top.map(([k,v])=>{ let h=0; for(const c of liv) if(this.carries(c,k))h++; return [k,v,h]; })}; }   // top keys: [key, virions, living hosts carrying it]
    const ev=this.ev; this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0}; if(P.CHEM){ this.ev.metab=0; this.ev.metabN=0; } if(P.VIRUS){ this.ev.lysed=0; this.ev.infections=0; }
    return {t:this.tick,N:n,meanLen:n?+(len/n).toFixed(2):0,meanGen:n?+(gsum/n).toFixed(1):0,maxGen:gmax,energy:{stores:+E.toFixed(1),light:+ground.toFixed(1),corpses:+dead.toFixed(1)},
      genotypes:geno.size,topGenoShare:n?+(gTop/n).toFixed(3):0,ev,race:{meanMatch:mn?+(mt/mn).toFixed(4):0,tags:tags.size,newTags,everTags:this.everTags.size,attackers:n?+(atk/n).toFixed(3):0},
      opShare:Array.from(opC,v=>n?+(v/n).toFixed(4):0),
      bigrams:Object.fromEntries([...bgC.entries()].filter(([b,v])=>v/n>=0.01).map(([b,v])=>[b,+(v/n).toFixed(4)])),
      shadowOpShare:Array.from(sopC,v=>n?+(v/n).toFixed(4):0),
      progGeno:[...pg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60), shadowGeno:[...spg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60), progGenoN:pg.size, shadowGenoN:spg.size, neutralGeno:(()=>{ const m=new Map(); for(const l of this.ns)m.set(l,(m.get(l)||0)+1); return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60); })(), neutralN:this.ns.length, fnGeno:fgTop, fnGenoN:fg.size, fnNeutral, fnNeutralN:this.fs.length, fnNew,
      shadowBigrams:Object.fromEntries([...sbgC.entries()].filter(([b,v])=>v/n>=0.01).map(([b,v])=>[b,+(v/n).toFixed(4)])),
      reseeds:this.reseeds||0, ...(chem?{chem,n0:this.n0}:{}), ...(tasks?{tasks,n0:this.n0}:{}), ...(vir?{vir}:{}), ...(this.mods?{mods:this.modSample(ev)}:{}), ...(this.mind?{mind:this.mind.report(this.nops||NOPS)}:{})}; }
}

// ---- save and resume: every field is a typed array or a plain value, so a run can be carried across windows exactly ----
const ARRAYS=['alive','E','age','pc','face','R','len','prog','sprog','slen','tag','tmpl','stamp','gen','light','cap','corpse','order'];
const CHEM_ARRAYS=['mol','eMol','prod'], TASK_ARRAYS=['tin','tic','tdone','tres'];
World.prototype.save=function(){ const o={p:this.p,tick:this.tick,seed0:this.seed0,...(this.mind?{mind:this.mind.save()}:{}),...(this.mods?{mods:this.mods.map(m=>({src:m.src,disarmed:m.disarmed,at:m.at,rnd:m.rnd.s,fields:Object.fromEntries(Object.entries(m.fields).map(([k,A])=>[k,Buffer.from(A.buffer).toString('base64')]))}))}:{}),rnd:this.rnd.s,srnd:this.srnd.s,patch:this.patch,reseeds:this.reseeds||0,everTags:this.everTags?[...this.everTags]:[],ns:this.ns,nsNext:this.nsNext,nrnd:this.nrnd.s,fs:this.fs,fsNext:this.fsNext,frnd:this.frnd.s,fnRep:[...this.fnRep],...(this.p.VIRUS?{vn:this.vn,vrnd:this.vrnd.s,vc:Buffer.from(this.vc.buffer,0,this.vn*4).toString('base64'),vk:Buffer.from(this.vk.buffer,0,this.vn*this.vk.BYTES_PER_ELEMENT).toString('base64')}:{}),a:{}};
  if(this.p.CHEM_BIG){ o.big={}; for(const [q,m] of this.big.layers)o.big[q]=Buffer.from(m.buffer).toString('base64'); }
  for(const k of ARRAYS.concat(this.p.CHEM&&!this.p.CHEM_BIG?CHEM_ARRAYS:[],this.p.TASKS?TASK_ARRAYS:[]))o.a[k]=Buffer.from(this[k].buffer,this[k].byteOffset,this[k].byteLength).toString('base64'); return JSON.stringify(o); };
World.load=function(txt){ const o=JSON.parse(txt); const w=new World(1,o.p); w.tick=o.tick; w.rnd.s=o.rnd; w.srnd.s=o.srnd; w.patch=o.patch; w.reseeds=o.reseeds; w.everTags=new Set(o.everTags); w.ns=o.ns||[]; w.nsNext=o.nsNext||1; if(o.nrnd!==undefined)w.nrnd.s=o.nrnd; w.fs=o.fs||[]; w.fsNext=o.fsNext||1; if(o.frnd!==undefined)w.frnd.s=o.frnd; w.fnRep=new Set(o.fnRep||[]); if(o.p.VIRUS&&o.vn!==undefined){ w.vn=o.vn; w.vrnd.s=o.vrnd; new Uint8Array(w.vc.buffer).set(Buffer.from(o.vc,'base64')); new Uint8Array(w.vk.buffer).set(Buffer.from(o.vk,'base64')); }
  if(o.p.CHEM_BIG&&o.big) for(const q of Object.keys(o.big)){ const L=w.layer(+q); new Uint8Array(L.buffer).set(Buffer.from(o.big[q],'base64')); }
  for(const k of ARRAYS.concat(o.p.CHEM&&!o.p.CHEM_BIG?CHEM_ARRAYS:[],o.p.TASKS?TASK_ARRAYS:[])){ const b=Buffer.from(o.a[k],'base64'); const A=w[k]; new Uint8Array(A.buffer,A.byteOffset,A.byteLength).set(b); }
  if(o.seed0!==undefined)w.seed0=o.seed0;
  if(o.mind)w.mind=Mind.load(o.mind);   // the mind resumes with its weights, its memory of parents and its random stream
  if(o.mods) for(const d of o.mods){ const m=w.installMod(d.src,{disarmed:d.disarmed,noInit:true}); m.at=d.at; m.rnd.s=d.rnd; for(const [k,b] of Object.entries(d.fields)) new Uint8Array(m.fields[k].buffer).set(Buffer.from(b,'base64')); }   // modules re-installed in order, so each gets its old opcode
  if(w.molLive){ const S=w.p.CHEM_S, C=w.C, m=w.mol, live=w.molLive; for(let q=0;q<S;q++){ const b=q*C; let on=0; for(let c=0;c<C;c++) if(m[b+c]>0){ on=1; break; } live[q]=on; } }   // rebuilt from the restored molecules, so a resume skips nothing that is present
  return w; };
module.exports={TASK_SZ,World,OPS,OP,NOPS,NEUTRAL0,isNeutral,DEF,fnHash,fnHashList,ARGMASK,OPS_CHEM,NEUTRAL0_CHEM};
