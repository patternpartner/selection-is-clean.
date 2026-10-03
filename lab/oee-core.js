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
  // NICHE (lab/PREREG-niche.md), needs CHEM (the 256-species network), off by default: NICHE CONSTRUCTION. Neutral marker 29
  // becomes BUILD. BUILD in an empty cell FOUNDS a structure from two molecules in the cell (species arg and the next
  // instruction's arg); in a cell that holds a structure it EXTENDS it with species arg. A structure is durable: it sits in its
  // cell (no diffusion), decays NICHE_DECAY per tick (about 20x slower than molecules), and outlives its builder. Its binding
  // energy delta(operands), drawn from a hash (about 40% of pairs release energy, up to CHEM_DMAX), goes to the builder; the
  // structure keeps the rest, so energy is conserved. Every structure catalyses METAB in its cell (x 1+NICHE_CAT).
  //   NICHE 1 - NON-EXPANDING: every structure is the same inert STRUCT. Extending it is one of 256 fixed reactions.
  //   NICHE 2 - EXPANDING: every structure is a COMPOUND named by its operands (registered on first build: no list, no
  //             ceiling on how many). Each compound is a CATALYST for one reaction of its own, outside the base network:
  //             it turns its last-attached species a into a species t drawn by hash of the compound from ALL species a
  //             step downhill of a (not just a's 4 base products). Neutral marker 30 becomes CATAL: run the cell's
  //             structure's reaction (EAT_F of the cell's a), keeping the energy, like METAB. Each new compound also
  //             opens 256 extension reactions of its own. So what can be done grows with what has been built.
  //             (The catalysed transformations are among the 256 base species, so at most ~65,000 of them exist, 64x the
  //             base network's 1,024; compounds themselves are unbounded.)
  //   NICHE 3 - NICHE 2 with founding taken from the organisms: BUILD only extends; structures are founded at RANDOM places
  //             from random molecules present, NICHE_FOUND_SCHED per NICHE_EVERY ticks (from a NICHE 2 run), energy dissipated.
  NICHE:0, NICHE_F:0.5, NICHE_CAT:0.5, NICHE_DECAY:0.00005, NICHE_FOUND_SCHED:null, NICHE_EVERY:1000,
  // NICHE v2 (lab/PREREG-niche-v2.md), three separable properties, each off by default (v1 behaviour when all are off):
  //   NICHE_R (a, SHARED): CATAL uses the nearest compound structure within Chebyshev radius R (own cell first), on the
  //     organism's own molecules, so one structure serves every organism around it. 0 = its own cell only (v1).
  //   NICHE_COPY (b, HERITABLE): neutral marker 31 becomes COPY: the organism copies the recipe (compound id) of the nearest
  //     compound within R (or its own cell) into a heritable recipe slot; offspring inherit it. BUILD in an empty cell with
  //     a recipe builds that compound whole (amount NICHE_BX, paying NICHE_BCOST from the store, which dissipates). Building or
  //     extending a structure also sets the builder's recipe. So a useful structure can spread by copying.
  //   NICHE_OPEN (c, RESOURCE-OPENING): a compound of depth >= NICHE_OPEN_D opens an energy CHANNEL named by a hash of the
  //     compound (16-bit, so up to 65,536 channels). Each channel is its own pool, regrowing toward NICHE_OPEN_CAP at
  //     NICHE_OPEN_RATE, that no base reaction can reach. A CATAL that uses such a compound also takes NICHE_OPEN_F of
  //     its pool. A rarely used channel is full, so a new compound that opens a new channel pays. Which compounds open
  //     which channels is not listed anywhere: it follows from depth and a hash of the composition.
  //   NICHE_RAND_SCHED (availability null): organisms cannot BUILD at all. Instead [found, extend, copy] events per
  //     NICHE_EVERY ticks (from a full run's per-sample counts) are applied at random: found a random present pair in a
  //     random empty cell; extend a random structure with a random present species; place a copy of a random existing
  //     compound in a random empty cell. No energy goes to any organism.
  NICHE_R:0, NICHE_COPY:0, NICHE_BX:0.05, NICHE_BCOST:0.1, NICHE_OPEN:0, NICHE_OPEN_D:2, NICHE_OPEN_CAP:5, NICHE_OPEN_RATE:0.002, NICHE_OPEN_F:0.1, NICHE_OPEN_P:1, NICHE_XCOST:0, NICHE_CMAX:2000000, NICHE_RAND_SCHED:null,
  // NICHE v3 (lab/PREREG-niche-v3.md), each off by default (v2 behaviour when all are off):
  //   NICHE_GC: every NICHE_GC_EVERY ticks (one tick after a sample) compounds held by no structure, no recipe slot and no
  //     held compound's ancestry are freed (their ids reused). Compound identity and properties (channel key, catalysis
  //     target) then come from a hash of COMPOSITION, not creation order; sample output names compounds by that hash.
  //     Channel pools regrown to within 1e-9 of full are dropped (re-created full on next use: same state).
  //   NICHE_BLD: heritable BUILDER bit per organism (start share NICHE_B0, flipped with prob NICHE_BMUT per birth, own RNG).
  //     BUILD does nothing for a non-builder (freeloaders still use structures within R).
  //   NICHE_UP: structures have a CONDITION in [0,1] decaying by NICHE_UDECAY per tick; catalysis and channel yields are
  //     scaled by it; below NICHE_UMIN the structure is gone. A builder that BUILDs on its own cell's structure first
  //     MAINTAINS it if its condition is below NICHE_UREN (pays NICHE_UCOST, condition back to 1; extending also renews it), then may extend as before.
  //   NICHE_BSCHED (selection null): a child's builder bit is drawn at random with the probability given per NICHE_EVERY
  //     ticks (a matched run's builder share), not inherited.
  NICHE_GC:0, NICHE_GC_EVERY:1000, NICHE_BLD:0, NICHE_B0:0.5, NICHE_BMUT:0.002, NICHE_UP:0, NICHE_UDECAY:0.0003, NICHE_UMIN:0.05, NICHE_UCOST:0.05, NICHE_UREN:0.7, NICHE_BSCHED:null,
  // SKIN (lab/PREREG-skin.md), needs NICHE, each off by default (v3 behaviour when all are off): a MEMBRANE. Structures are
  //   no longer in cells but INSIDE organisms: what an organism founds, extends, builds from a recipe or maintains is its own
  //   internal stock (one compound, as one cell held one in v1-v3), carried when it moves and lost when it dies. Its
  //   catalysis (CATAL, the METAB bonus, channel income) pays only its owner; nobody within NICHE_R gets anything, and
  //   COPY can only read the organism's own stock. NICHE_RAND_SCHED under SKIN puts its events into random LIVING organisms.
  //   NICHE_SKIN_INH 1: the stock is INHERITED, split at division (child and parent each keep half the amount, the same
  //     compound and condition); 0: reset at birth (the child starts with no stock; the recipe slot is still inherited).
  //   NICHE_SKIN_REGROW 1: upkeep (NICHE_UP) also tops the amount back up to NICHE_BX, so a maintained stock does not dilute away.
  //   NICHE_PERM 1: heritable PERMEABILITY p in [0,1] per organism (start NICHE_P0, or uniform when < 0; at birth, with prob
  //     NICHE_PMUT, p moves by a uniform step in +-NICHE_PSTEP, clamped; own RNG). An organism with no stock of its own may
  //     CATAL on the nearest stock-holding organism within NICHE_R at yield x p(user) x p(owner) (it leaks out of the owner
  //     and is absorbed by the user), and COPY its recipe with probability p(user) x p(owner). Off: everyone sealed (p = 0).
  // AUTOCAT (lab/PHASEA-autocatalysis.md), needs NICHE, off by default: CATALYSED ASSEMBLY. Phase A found that 99.9% of founding
  //   attempts fail because a species the BUILD names is absent from the cell (about 4 of 256 are present). With NICHE_AC 1, a
  //   founding BUILD whose named species are absent, made within reach of an existing compound structure (see acCat), binds
  //   present species instead (acBind: the genome still picks which); (with NICHE_AC_X) an EXTEND whose named species is short
  //   binds a present one the same way (the structure itself is the catalyst). So every structure makes the next build likelier: the rate of
  //   construction feeds back on itself. Energetics, costs, the binding rule and compound identity are unchanged.
  //   NICHE_AC_X 1: extension is catalysed too (an EXTEND short of its named species binds a present one).
  //   NICHE_AC_B: probability that an UNcatalysed founding BUILD binds present species anyway (a slow spontaneous rate, so a
  //     world without structures can nucleate). Its own RNG stream, so the main and permeability streams are untouched.
  //   NICHE_AC 2 (NAMED SYNTHESIS): a catalysed founding makes the compound the genome NAMES (its two operand species), from
  //     whatever feedstock is present (nFoundAC), rather than binding the present species themselves; so what is built stays
  //     heritable and exact, and a mutation in BUILD's arguments builds a different compound.
  //   NICHE_RAND_NAMED 1 (with AC 2 and NICHE_RAND_SCHED): the random null's founds name a uniformly random pair, made from
  //     random present feedstock (the null that matches named synthesis); 0: random present pairs, as in v2-skin.
  NICHE_AC:0, NICHE_AC_X:0, NICHE_AC_B:0, NICHE_RAND_NAMED:0,
  // SCARCITY (lab/PHASEA2-scarcity.md), needs CHEM (256-species network), off by default (SCAR_T 0): the base economy runs
  //   down. From tick SCAR_ON, over SCAR_T ticks (linear ramp, then held):
  //   - every BASE METAB reaction runs at a rate factor falling from 1 to SCAR_MIN (the share of the cell's substrate turned
  //     over per METAB). Unconverted molecules simply stay in the cell (they diffuse and decay as before), so energy is
  //     conserved; structure-catalysed reactions (CATAL) and channels are untouched;
  //   - optionally (SCAR_ALPHA >= 0) the share of eaten light left in the cell as species 0 instead of taken directly ramps from
  //     CHEM_ALPHA to SCAR_ALPHA (a split of the same energy, so conserved).
  //   Nothing names a compound or rewards novelty: structures only gain because base routes earn less.
  // HBODY (lab/PHASEA3-heritable-body.md; named HBODY because BODY is the child's birth energy), needs CHEM (256-species network), off by default: a HERITABLE BODY of catalysts.
  //   Each organism carries up to BODY_MAX catalysts, each one reaction q -> t (16-bit key q*256+t). Every tick each catalyst
  //   turns BODY_F of the cell's q into t and the organism keeps the energy released (only when 0 < e(q)-e(t) <= CHEM_DMAX, the
  //   same small-step rule as METAB), so energy is conserved; a body costs BODY_UP per catalyst per tick (dissipated, like
  //   instruction costs). Only the carrier benefits. At birth the child copies its parent's body with copy errors (own RNG):
  //   per catalyst, with BODY_MUT, its product (or, half the time, its substrate and product) is redrawn; with BODY_DUP a random
  //   catalyst is duplicated; with BODY_DEL one is deleted; with BODY_CAP the child CAPTURES a new catalyst whose substrate is
  //   the species its parent last MADE (the product of its last METAB or body reaction) and whose product is drawn from that
  //   species' downhill band (not just its 4 base products). No compound is named anywhere and novelty is never paid as such:
  //   a catalyst earns only by converting molecules that are there.
  //   Nulls: BODY_INH 0 (NOINH): the body resets at birth (the child keeps only what it captures itself);
  //   BODY_RCAP 1 (RANDCAP): a captured catalyst's substrate is a uniformly random species, not what the parent made;
  //   BODY_SHUF 1 (SHUF): the child copies the body of a random living organism instead of its parent's;
  //   BODY_FIXED 1 (FIXED): every new or mutated catalyst is one of the base network's 1,024 reactions (no menu expansion).
  //   BODY_FUSE (Phase A3b, off by default): with this probability per birth, two of the child's catalysts where one's product is
  //     the other's substrate FUSE into one PATHWAY catalyst q -> ... -> u (up to BODY_CHAIN species), which channels the
  //     intermediates (they never enter the cell) and pays e(q) - e(u). A pathway's identity is its species sequence, so the
  //     catalyst space is no longer the ~16,500 one-step reactions. A pathway mutates by redrawing its last product. FIXED never fuses.
  //   BODY_UPX: upkeep is BODY_UP x n x (n / BODY_UPN)^(BODY_UPX - 1) per tick (1 = linear, as in A3).
  BODY_FUSE:0, BODY_CHAIN:8, BODY_UPX:1, BODY_UPN:16,
  HBODY:0, BODY_MAX:8, BODY_F:0.2, BODY_UP:0.0005, BODY_MUT:0.01, BODY_DUP:0.01, BODY_DEL:0.01, BODY_CAP:0.02, BODY_INH:1, BODY_RCAP:0, BODY_SHUF:0, BODY_FIXED:0,
  SCAR_T:0, SCAR_ON:20000, SCAR_MIN:0.25, SCAR_ALPHA:-1,
  NICHE_SKIN:0, NICHE_SKIN_INH:1, NICHE_SKIN_REGROW:0, NICHE_PERM:0, NICHE_P0:-1, NICHE_PMUT:0.05, NICHE_PSTEP:0.1,
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

class World{
  constructor(seed,opts){
    this.p=Object.assign({},DEF,opts||{});
    const P=this.p, C=P.W*P.H;
    this.rnd=mulberry32((seed>>>0)||1); this.C=C; this.tick=0;
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
    this.patch=[]; for(let k=0;k<P.PATCHES;k++){ const a=this.rnd()*Math.PI*2; this.patch.push({x:this.rnd()*P.W,y:this.rnd()*P.H,vx:Math.cos(a)*P.PATCH_V,vy:Math.sin(a)*P.PATCH_V}); }
    this.ev={births:0,starve:0,killed:0,old:0,crowded:0,attacks:0,attackTake:0,eatLight:0,eatCorpse:0,moves:0,shares:0};
    this.n0=P.CHEM?(P.NICHE?NEUTRAL0_CHEM+(P.NICHE_COPY?3:2):NEUTRAL0_CHEM):P.TASKS?28:NEUTRAL0;
    if(P.TASKS){ this.tin=new Uint32Array(C*3); this.tic=new Uint8Array(C); this.tdone=new Uint32Array(C*8); this.tcap=new Float64Array(256); for(let T=0;T<256;T++)this.tcap[T]=P.TASK_CAP*(P.TASK_SCALE?TASK_SZ[T]:1); this.tres=Float64Array.from(this.tcap); this.tE=new Float64Array(256); this.tN=new Uint32Array(256); }
    if(P.CHEM&&P.CHEM_BIG){ this.big={layers:new Map(),e:new Map(),pr:new Map(),salt:h32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x00c4e3c4)}; this.molTmp=new Float32Array(C); this.ev.metab=0; this.ev.metabN=0; this.rxE=new Map(); }
    else if(P.CHEM){ const S=P.CHEM_S, cr=mulberry32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x00c4e3c4); this.mol=new Float32Array(C*S); this.molTmp=new Float32Array(C); this.eMol=new Float32Array(S); this.prod=new Uint16Array(S*4);   // its own RNG: the main stream (ancestors, patches) is the same as without CHEM
      this.eMol[0]=1; for(let q=1;q<S;q++)this.eMol[q]=cr(); for(let q=0;q<S;q++)for(let j=0;j<4;j++){ let t, g=0; do{ t=(cr()*S)|0; g++; }while(g<100000&&(t===q||Math.abs(this.eMol[t]-(this.eMol[q]-P.CHEM_STEP))>=P.CHEM_SPREAD)); this.prod[q*4+j]=t; } this.ev.metab=0; this.ev.metabN=0; this.rxE=new Float64Array(S*4); }   // rxE: energy each reaction captured since the last sample   // products lie near the substrate, mostly a little lower
    if(P.NICHE&&P.CHEM&&!P.CHEM_BIG){ this.sId=new Int32Array(C).fill(-1); this.sAmt=new Float32Array(C); this.sE=new Float32Array(C); this.sD=new Int32Array(C);
      this.cB=[]; this.cD=[]; this.cE=[]; this.cS=[]; this.cT=[]; this.cK=[]; this.nband=null; if(P.NICHE_COPY)this.rec=new Int32Array(C).fill(-1); if(P.NICHE_OPEN)this.och=new Map(); this.creg=new Map(); this.nfx=new Map(); this.nv=this.nvZero(); this.nrr=mulberry32(((seed>>>0)||1)^0x2e5c2e5c); if(P.NICHE_GC){ this.cHa=[]; this.cHb=[]; this.cFree=[]; this.cDead=[]; this.cLive=0; } this.cMade=0; if(P.NICHE_BLD){ this.bld=new Uint8Array(C); this.brr=mulberry32(((seed>>>0)||1)^0x6b1d0001); this.bBirth=0; this.fBirth=0; } if(P.NICHE_UP)this.sCond=new Float32Array(C); if(P.NICHE_AC)this.arr=mulberry32(((seed>>>0)||1)^0xac0ac001); if(P.NICHE_SKIN){ this.skin=1; this.krr=mulberry32(((seed>>>0)||1)^0x5c1a0001); if(P.NICHE_PERM)this.perm=new Float32Array(C); }
      this.nsalt=h32((((P.CHEM_SEED!==undefined?P.CHEM_SEED:seed)>>>0)||1)^0x51c4e000); }
    if(P.HBODY&&P.CHEM&&!P.CHEM_BIG){ const S=P.CHEM_S; this.bd=new Int32Array(C*P.BODY_MAX); this.bn=new Uint8Array(C); this.lastP=new Int16Array(C).fill(-1); this.brng=mulberry32(((seed>>>0)||1)^0xb0d70001); this.bInc=new Map(); this.bIncT=0; this.chS=[]; this.chMap=new Map();
      this.bband=[]; for(let u=0;u<S;u++){ const L=[]; for(let t=0;t<S;t++){ const dd=this.eMol[u]-this.eMol[t]; if(t!==u&&dd>0&&dd<=P.CHEM_DMAX)L.push(t); } this.bband.push(L); } }
    if(P.VIRUS){ this.vc=new Int32Array(P.V_MAX); this.vk=P.CHEM_BIG?new Uint32Array(P.V_MAX):new Uint16Array(P.V_MAX); this.vn=0; this.vrnd=mulberry32(((seed>>>0)||1)^0x7e577e57); this.ev.lysed=0; this.ev.infections=0; }
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
  place(c,prog,E,tag,tmpl,gen,sh){ const P=this.p, o=c*P.MAXLEN*2; if(P.TASKS)this.taskBirth(c); if(this.bld)this.bld[c]=this.brr()<P.NICHE_B0?1:0; if(this.perm)this.perm[c]=P.NICHE_P0<0?this.krr():P.NICHE_P0; if(this.skin)this.sId[c]=-1; if(this.bd){ this.bn[c]=0; this.lastP[c]=-1; } sh=sh||prog; this.slen[c]=sh.length; for(let i=0;i<sh.length;i++){ this.sprog[o+i*2]=sh[i][0]; this.sprog[o+i*2+1]=sh[i][1]; } this.alive[c]=1; this.E[c]=E; this.age[c]=0; this.pc[c]=0; this.face[c]=(this.rnd()*8)|0;
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
  kill(c,why){ const P=this.p; if(this.rec)this.rec[c]=-1; if(this.skin){ this.sId[c]=-1; this.sAmt[c]=0; } if(this.bd)this.bn[c]=0; this.alive[c]=0; this.tickDeaths++; this.corpse[c]+=Math.max(0,this.E[c])+P.BODY; this.E[c]=0; this.ev[why]++; }
  moveOrg(a,b){ const P=this.p, L=P.MAXLEN*2; if(this.rec){ this.rec[b]=this.rec[a]; this.rec[a]=-1; } if(this.bld){ this.bld[b]=this.bld[a]; this.bld[a]=0; } if(this.skin){ this.sId[b]=this.sId[a]; this.sAmt[b]=this.sAmt[a]; this.sE[b]=this.sE[a]; this.sD[b]=this.sD[a]; if(this.sCond)this.sCond[b]=this.sCond[a]; this.sId[a]=-1; this.sAmt[a]=0; if(this.perm)this.perm[b]=this.perm[a]; } if(this.bd){ const M=P.BODY_MAX; this.bd.copyWithin(b*M,a*M,a*M+M); this.bn[b]=this.bn[a]; this.bn[a]=0; this.lastP[b]=this.lastP[a]; } this.alive[b]=1; this.alive[a]=0; this.E[b]=this.E[a]; this.age[b]=this.age[a]; this.pc[b]=this.pc[a]; this.face[b]=this.face[a];
    for(let k=0;k<4;k++)this.R[b*4+k]=this.R[a*4+k]; this.len[b]=this.len[a]; this.prog.copyWithin(b*L,a*L,a*L+L); this.sprog.copyWithin(b*L,a*L,a*L+L); this.slen[b]=this.slen[a];
    this.tag[b]=this.tag[a]; this.tmpl[b]=this.tmpl[a]; this.gen[b]=this.gen[a]; this.stamp[b]=this.stamp[a]; this.E[a]=0;
    if(this.p.TASKS){ for(let k=0;k<3;k++)this.tin[b*3+k]=this.tin[a*3+k]; this.tic[b]=this.tic[a]; for(let k=0;k<8;k++)this.tdone[b*8+k]=this.tdone[a*8+k]; } }
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
    this.place(t,src,half,tg,tm,this.gen[c]+1,ssrc); if(this.rec)this.rec[t]=this.rec[c]; if(this.bld)this.inheritBld(c,t); if(this.skin)this.skinBirth(c,t); if(this.bd)this.bodyBirth(c,t); this.ev.births++; return true; }
  bFirst(k){ return k<65536?k>>8:this.chS[k-65536][0]; }
  bLast(k){ return k<65536?k&255:this.chS[k-65536][this.chS[k-65536].length-1]; }
  bSeq(k){ return k<65536?[k>>8,k&255]:this.chS[k-65536]; }
  bReg(seq){ const key=seq.join(','); let id=this.chMap.get(key); if(id===undefined){ id=65536+this.chS.length; this.chS.push(seq); this.chMap.set(key,id); } return id; }
  bNewT(q){ const P=this.p, r=this.brng; if(P.BODY_FIXED)return this.prod[q*4+((r()*4)|0)]; const L=this.bband[q]; return L.length?L[(r()*L.length)|0]:-1; }
  bodyBirth(c,t){ const P=this.p, M=P.BODY_MAX, S=P.CHEM_S, r=this.brng; let src=c;
    if(P.BODY_SHUF){ for(let k=0;k<64;k++){ const q=(r()*this.C)|0; if(this.alive[q]&&q!==t){ src=q; break; } } }
    const L=[]; if(P.BODY_INH) for(let i=0;i<this.bn[src];i++)L.push(this.bd[src*M+i]);
    for(let i=0;i<L.length;i++) if(r()<P.BODY_MUT){ if(L[i]>=65536){ const sq=this.chS[L[i]-65536].slice(), tt=this.bNewT(sq[sq.length-2]); if(tt>=0&&tt!==sq[sq.length-2]){ sq[sq.length-1]=tt; L[i]=this.bReg(sq); } continue; }
      let q=L[i]>>8; if(r()<0.5)q=(r()*S)|0; const tt=this.bNewT(q); if(tt>=0)L[i]=q*256+tt; }
    if(L.length&&L.length<M&&r()<P.BODY_DUP)L.push(L[(r()*L.length)|0]);
    if(L.length&&r()<P.BODY_DEL)L.splice((r()*L.length)|0,1);
    if(P.BODY_FUSE&&!P.BODY_FIXED&&L.length>=2&&r()<P.BODY_FUSE){ const i=(r()*L.length)|0, u=this.bLast(L[i]); let j=-1; for(let k=0;k<L.length;k++) if(k!==i&&this.bFirst(L[k])===u){ j=k; break; }
      if(j>=0){ const a=this.bSeq(L[i]), b=this.bSeq(L[j]); if(a.length+b.length-1<=P.BODY_CHAIN&&a[0]!==b[b.length-1]){ const id=this.bReg(a.concat(b.slice(1))); const hi=Math.max(i,j), lo=Math.min(i,j); L.splice(hi,1); L.splice(lo,1); L.push(id); this.nFuse=(this.nFuse||0)+1; } } }
    if(L.length<M&&r()<P.BODY_CAP){ const q=P.BODY_RCAP?(r()*S)|0:this.lastP[c]; if(q>=0){ const tt=this.bNewT(q); if(tt>=0)L.push(q*256+tt); } }
    for(let i=0;i<L.length;i++)this.bd[t*M+i]=L[i]; this.bn[t]=L.length; }
  bodyRun(c){ const P=this.p, M=P.BODY_MAX, C=this.C, m=this.mol, n=this.bn[c]; this.E[c]-=P.BODY_UPX===1?P.BODY_UP*n:P.BODY_UP*n*Math.pow(n/P.BODY_UPN,P.BODY_UPX-1);
    for(let i=0;i<n;i++){ const key=this.bd[c*M+i], ch=key>=65536, q=ch?this.bFirst(key):key>>8, t=ch?this.bLast(key):key&255, d=this.eMol[q]-this.eMol[t]; if(!(d>0&&(ch||d<=P.CHEM_DMAX)))continue; const x=m[q*C+c]*P.BODY_F; if(!(x>0))continue;
      m[q*C+c]-=x; m[t*C+c]+=x; this.E[c]+=x*d; this.bIncT+=x*d; this.bInc.set(key,(this.bInc.get(key)||0)+x*d); this.lastP[c]=t; } }
  skinBirth(c,t){ const P=this.p; if(this.perm){ let q=this.perm[c]; if(this.krr()<P.NICHE_PMUT)q=Math.min(1,Math.max(0,q+(2*this.krr()-1)*P.NICHE_PSTEP)); this.perm[t]=q; }
    if(P.NICHE_SKIN_INH&&this.sId[c]>=0){ const h=this.sAmt[c]/2; this.sAmt[c]=h; this.sId[t]=this.sId[c]; this.sAmt[t]=h; this.sE[t]=this.sE[c]; this.sD[t]=this.sD[c]; if(this.sCond)this.sCond[t]=this.sCond[c]; this.nv.inh++;
      if(h<1e-4){ this.sId[c]=-1; this.sAmt[c]=0; this.sId[t]=-1; this.sAmt[t]=0; } } }
  inheritBld(c,t){ const P=this.p, r=this.brr; let b=this.bld[c]; if(P.NICHE_BSCHED){ const i=((this.tick-1)/P.NICHE_EVERY)|0, q=P.NICHE_BSCHED[Math.min(i,P.NICHE_BSCHED.length-1)]; b=r()<q?1:0; } else if(r()<P.NICHE_BMUT)b^=1; this.bld[t]=b; if(this.bld[c])this.bBirth++; else this.fBirth++; }
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
        case 17: { const t=this.light[c]*P.EAT_F; this.light[c]-=t; if(P.CHEM){ const al=P.SCAR_T?this.scA:P.CHEM_ALPHA; this.E[c]+=t*(1-al); if(P.CHEM_BIG)this.layer(0)[c]+=t*al; else this.mol[c]+=t*al; } else this.E[c]+=t; this.ev.eatLight+=t; } break;   // EAT_LIGHT (under CHEM part of the take is left as species 0)
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
                   if(d>0&&d<=P.CHEM_DMAX){ const x=this.mol[q*C+c]*P.EAT_F*(this.sId&&this.sId[c]>=0?1+P.NICHE_CAT*Math.min(1,this.sAmt[c]):1)*(P.SCAR_T?this.scF:1); if(x>0){ this.mol[q*C+c]-=x; this.mol[pr*C+c]+=x; this.E[c]+=x*d; this.ev.metab+=x*d; this.ev.metabN++; this.rxE[q*4+op-24]+=x*d; if(this.bd)this.lastP[c]=pr; } } } break;
        case 28: if(P.CHEM_BIG){ const Lq=this.big.layers.get(arg|(this.prog[o+((pc+1)%n)*2+1]<<8)); R[r4]=Lq?Lq[c]:0; } else if(P.CHEM)R[r4]=this.mol[(arg&(P.CHEM_S-1))*this.C+c]; break;   // SENSE_MOL
        case 29: if(this.sId)this.build(c,arg,this.prog[o+((pc+1)%n)*2+1]); break;   // BUILD under NICHE; otherwise a neutral marker
        case 30: if(this.sId)this.catal(c); break;                           // CATAL under NICHE; otherwise a neutral marker
        case 31: if(this.rec)this.ncopy(c); break;                           // COPY under NICHE_COPY; otherwise a neutral marker
        default: break;                                                      // NOP and the eight neutral markers
      }
      pc=next;
    }
    if(this.alive[c])this.pc[c]=pc;
  }
  step(){ const P=this.p, C=this.C; this.tick++;
    if(P.SCAR_T){ const r=Math.min(1,Math.max(0,this.tick-P.SCAR_ON)/P.SCAR_T); this.scF=1-(1-P.SCAR_MIN)*r; this.scA=P.CHEM_ALPHA+((P.SCAR_ALPHA<0?P.CHEM_ALPHA:P.SCAR_ALPHA)-P.CHEM_ALPHA)*r; }
    if(this.tick%10===0)this.updateCap();
    if(P.CHEM&&this.tick%P.CHEM_EVERY===0)this.chemStep();
    if(P.TASKS){ const tr=this.tres, cp=this.tcap; for(let T=0;T<256;T++)tr[T]+=P.TASK_RATE*(cp[T]-tr[T]); }   // each function's pool regrows toward its cap
    for(let c=0;c<C;c++){ const l=this.light[c]; this.light[c]=l+P.L_RATE*(this.cap[c]-l); if(this.corpse[c]>0)this.corpse[c]*=1-P.CORPSE_DECAY; }
    const ord=this.order, r=this.rnd; for(let i=C-1;i>0;i--){ const j=(r()*(i+1))|0; const t=ord[i]; ord[i]=ord[j]; ord[j]=t; }
    for(let k=0;k<C;k++){ const c=ord[k]; if(!this.alive[c]||this.stamp[c]===this.tick)continue; this.stamp[c]=this.tick;
      this.E[c]-=P.C_BASE; this.age[c]++;
      this.run(c);
      // the organism may have moved: find it by its own cell or leave; deaths are checked after the slice
    }
    if(P.VIRUS&&this.tick>=P.V_ONSET)this.virusStep();
    if(P.NICHE_FOUND_SCHED&&this.sId)this.nicheRandomFound();
    if(P.NICHE_RAND_SCHED&&this.sId)this.nicheRand();
    if(P.NICHE_GC&&this.sId&&this.tick%P.NICHE_GC_EVERY===1)this.ngc();
    if(this.bd) for(let c=0;c<C;c++) if(this.alive[c]&&this.bn[c])this.bodyRun(c);
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
    for(let q=0;q<S;q++){ const b=q*C; let any=false; for(let c=0;c<C;c++) if(m[b+c]>0){ any=true; break; } if(!any)continue;   // species-major, so each scan is contiguous (cell-major made this the slowest part of a tick)
      for(let y=0;y<H;y++){ const yu=b+((y+H-1)%H)*W, yd=b+((y+1)%H)*W, y0=y*W; for(let x=0;x<W;x++){ const xl=(x+W-1)%W, xr=(x+1)%W, c=y0+x, v=m[b+c];
        t[c]=(v+D*((m[b+y0+xl]+m[b+y0+xr]+m[yu+x]+m[yd+x])/4-v))*k; } }
      m.set(t,b); }
    if(this.sId){ const kd=Math.pow(1-P.NICHE_DECAY,P.CHEM_EVERY), sa=this.sAmt; for(let c=0;c<C;c++) if(this.sId[c]>=0){ sa[c]*=kd; if(sa[c]<1e-4){ this.sId[c]=-1; sa[c]=0; } }
      if(this.sCond){ const ku=Math.pow(1-P.NICHE_UDECAY,P.CHEM_EVERY), u=this.sCond; for(let c=0;c<C;c++) if(this.sId[c]>=0){ u[c]*=ku; if(u[c]<P.NICHE_UMIN){ this.sId[c]=-1; sa[c]=0; this.nv.decayed++; } } } } }
  // ---- NICHE: durable structures (see DEF) ----
  nDelta(a,b){ return this.p.CHEM_DMAX*(1.6*h32(this.nsalt^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))/4294967296-0.6); }   // binding energy of operand pair (a: species, b: species or structure id)
  nFound(c,a,b,toOrg){ const P=this.p, S=P.CHEM_S, C=this.C, m=this.mol; const x=a===b?P.NICHE_F*m[a*C+c]/2:P.NICHE_F*Math.min(m[a*C+c],m[b*C+c]); if(!(x>=1e-3)||!this.nCan(b,a))return false;
    const d=this.nDelta(a,b), eN=this.eMol[a]+this.eMol[b]-d; if(!(d>0)||eN<0)return false; m[a*C+c]-=x; m[b*C+c]-=x;
    this.nPut(c,b,eN,x,0); if(toOrg)this.nPay(c,d*x,1024+a*256+b); return true; }
  // AUTOCAT mode 2 (named synthesis): the compound is the one the genome NAMES (operands a, b), made from feedstock species f1, f2
  // present in the cell (x = NICHE_F x the smaller amount). Energy is conserved: the feedstock's energy minus the compound's goes
  // to the builder (toOrg; it may be negative, and is then paid from the store, which must cover it); otherwise it dissipates.
  nFoundAC(c,a,b,f1,f2,toOrg){ const P=this.p, C=this.C, m=this.mol; const x=f1===f2?P.NICHE_F*m[f1*C+c]/2:P.NICHE_F*Math.min(m[f1*C+c],m[f2*C+c]); if(!(x>=1e-3)||!this.nCan(b,a))return false;
    const d=this.nDelta(a,b), eN=this.eMol[a]+this.eMol[b]-d; if(!(d>0)||eN<0)return false; const v=(this.eMol[f1]+this.eMol[f2]-eN)*x; if(toOrg&&v<0&&this.E[c]+v<(P.NICHE_XCOST||0)+1e-3)return false;
    m[f1*C+c]-=x; m[f2*C+c]-=x; this.nA_=a; this.nPut(c,b,eN,x,0); if(toOrg)this.nPay(c,v,1024+a*256+b); return true; }
  nPut(c,b,eN,x,d0){ const P=this.p, S=P.CHEM_S; let id=S, dep=d0+1;   // NICHE 1: always STRUCT (id S)
    if(P.NICHE!==1){ const a=(this.nA_)|0, k=b*256+a; let q=this.creg.get(k); if(q===undefined){ this.cMade++;
        if(!this.nband){ this.nband=[]; for(let u=0;u<S;u++){ const L=[]; for(let t=0;t<S;t++){ const dd=this.eMol[u]-this.eMol[t]; if(t!==u&&dd>0&&dd<=P.CHEM_DMAX)L.push(t); } this.nband.push(L); } }
        const L=this.nband[a];
        if(this.cHa){ const ba=b>S?this.cHa[b-S-1]:h32(this.nsalt^0x1b873593^Math.imul(b+1,0x9E3779B1)), bb=b>S?this.cHb[b-S-1]:h32(this.nsalt^0x5bd1e995^Math.imul(b+1,0x85EBCA77));
          const ha=h32(ba^Math.imul(a+1,0xC2B2AE35)^0x27d4eb2d), hb=h32(bb^Math.imul(a+1,0x165667B1)^0x3c6ef372);
          const kk=P.NICHE_OPEN&&dep>=P.NICHE_OPEN_D&&(h32(ha^0x3c6ef372)/4294967296)<P.NICHE_OPEN_P?ha&0xfffff:-1, tt=L.length?L[h32(this.nsalt^hb)%L.length]:-1;
          let i; if(this.cFree.length){ i=this.cFree.pop(); this.cB[i]=b; this.cD[i]=dep; this.cE[i]=eN; this.cK[i]=kk; this.cS[i]=a; this.cT[i]=tt; this.cHa[i]=ha; this.cHb[i]=hb; this.cDead[i]=0; }
          else { i=this.cE.length; this.cB.push(b); this.cD.push(dep); this.cE.push(eN); this.cK.push(kk); this.cS.push(a); this.cT.push(tt); this.cHa.push(ha); this.cHb.push(hb); this.cDead.push(0); }
          q=S+1+i; this.cLive++; this.creg.set(k,q); }
        else { q=S+1+this.cE.length; this.creg.set(k,q); this.cB.push(b); this.cD.push(dep); this.cE.push(eN);
        { const hk=h32(this.nsalt^0x0c4a77e1^Math.imul(q,0x165667b1)); this.cK.push(P.NICHE_OPEN&&dep>=P.NICHE_OPEN_D&&(h32(hk^0x3c6ef372)/4294967296)<P.NICHE_OPEN_P?hk&0xfffff:-1); } this.cS.push(a); this.cT.push(L.length?L[h32(this.nsalt^Math.imul(q,0x27d4eb2d))%L.length]:-1); } } id=q; }
    this.sId[c]=id; this.sE[c]=eN; this.sAmt[c]=x; this.sD[c]=dep; if(this.sCond)this.sCond[c]=1; }
  cName(id){ const i=id-this.p.CHEM_S-1; return this.cHa?this.cHa[i]*2097152+(this.cHb[i]>>>11):id; }   // the identity reported in samples (composition hash under NICHE_GC)
  ngc(){ const P=this.p, S=P.CHEM_S, n=this.cE.length, keep=new Uint8Array(n), C=this.C;
    const mark=id=>{ let i=id-S-1; while(i>=0&&!keep[i]){ keep[i]=1; const b=this.cB[i]; i=b>S?b-S-1:-1; } };
    for(let c=0;c<C;c++){ if(this.sId[c]>S)mark(this.sId[c]); if(this.rec&&this.rec[c]>S)mark(this.rec[c]); }
    for(let i=0;i<n;i++) if(!keep[i]&&!this.cDead[i]){ this.creg.delete(this.cB[i]*256+this.cS[i]); this.cDead[i]=1; this.cFree.push(i); this.cLive--; this.nv.gcFreed++; }
    if(this.och){ const R=1-P.NICHE_OPEN_RATE; for(const [k,o] of this.och) if((P.NICHE_OPEN_CAP-o.v)*Math.pow(R,this.tick-o.t)<1e-9)this.och.delete(k); } }
  nCan(b,a){ if(this.p.NICHE===1||(this.cHa?this.cLive:this.cE.length)<this.p.NICHE_CMAX||this.creg.has(b*256+a))return true; this.nv.capHit++; return false; }   // memory guard: past NICHE_CMAX compounds, no NEW compound can be made (counted, reported)
  nPay(c,v,key){ this.E[c]+=v; this.nv.inc+=v; this.nv.n++; this.nfx.set(key,(this.nfx.get(key)||0)+v); }
  build(c,a,bb){ const P=this.p, S=P.CHEM_S, C=this.C, m=this.mol; a&=S-1; this.nA_=a;
    if(P.NICHE_RAND_SCHED)return; if(this.bld&&!this.bld[c])return;   // v3: freeloaders cannot build
    if(this.sId[c]<0){ if(P.NICHE===3)return;
      if(this.rec&&this.rec[c]>S){ const id=this.rec[c]; if(this.E[c]<P.NICHE_BCOST)return; this.E[c]-=P.NICHE_BCOST; const i=id-S-1; this.sId[c]=id; this.sE[c]=this.cE[i]; this.sAmt[c]=P.NICHE_BX; this.sD[c]=this.cD[i]; if(this.sCond)this.sCond[c]=1; this.nv.recB++; return; }
      if(P.NICHE_XCOST&&this.E[c]<P.NICHE_XCOST)return; if(P.NICHE_AC){ const b2=bb&(S-1); if(!(m[a*C+c]>=2e-3&&m[b2*C+c]>=2e-3)&&(this.acCat(c)||(P.NICHE_AC_B&&this.arr()<P.NICHE_AC_B))){ this.nv.acF++;   // AUTOCAT: a structure within reach catalyses the build
          if(P.NICHE_AC===2){ if(this.nFoundAC(c,a,b2,this.acBind(c,a,2e-3),this.acBind(c,b2,2e-3),true)){ if(P.NICHE_XCOST)this.E[c]-=P.NICHE_XCOST; this.nv.found++; if(this.rec)this.rec[c]=this.sId[c]; } return; }
          a=this.acBind(c,a,2e-3); bb=this.acBind(c,b2,2e-3); this.nA_=a; } }
      if(this.nFound(c,a,bb&(S-1),true)){ if(P.NICHE_XCOST)this.E[c]-=P.NICHE_XCOST; this.nv.found++; if(this.rec)this.rec[c]=this.sId[c]; } return; }
    if(this.sCond&&this.sCond[c]<P.NICHE_UREN&&this.E[c]>=P.NICHE_UCOST){ this.E[c]-=P.NICHE_UCOST; this.sCond[c]=1; if(this.skin&&P.NICHE_SKIN_REGROW&&this.sAmt[c]<P.NICHE_BX)this.sAmt[c]=P.NICHE_BX; this.nv.maint++; }   // v3 upkeep
    const B=this.sId[c], x=this.sAmt[c]; if(m[a*C+c]*P.NICHE_F<x){ if(!P.NICHE_AC_X||B<=S)return; a=this.acBind(c,a,x/P.NICHE_F); if(m[a*C+c]*P.NICHE_F<x)return; this.nA_=a; this.nv.acX++; }   // extending coats the whole structure with species a (AUTOCAT: the compound itself binds a present species)
    if(P.NICHE_XCOST){ if(this.E[c]<P.NICHE_XCOST)return; } if(!this.nCan(B,a))return;
    const d=this.nDelta(a,B), eN=this.eMol[a]+this.sE[c]-d; if(!(d>0)||eN<0)return; m[a*C+c]-=x;
    if(P.NICHE_XCOST)this.E[c]-=P.NICHE_XCOST; this.nPut(c,B,eN,x,this.sD[c]); this.nPay(c,d*x,70000+B*256+a); this.nv.ext++; if(this.rec)this.rec[c]=this.sId[c]; }
  // AUTOCAT (NICHE_AC): catalysed assembly. acCat: is a compound structure within reach of c (the same reach as CATAL: own cell,
  // then NICHE_R; under SKIN a neighbour's stock only through permeability, with probability p(user) x p(owner))?
  // acBind: the species the organism names (arg a) if present at >= thr, else the (a mod k)-th of the k species present at >= thr
  // (index order), so the genome still chooses, among what is there. No list of compounds: what can be built is what is present.
  acCat(c){ const P=this.p, S=P.CHEM_S; if(this.skin){ if(!this.perm||!P.NICHE_R)return false; const q=this.nLeak(c); return q>=0&&this.arr()<this.nLk; }
    const q=P.NICHE_R?this.nNear(c):c; return q>=0&&this.sId[q]>S; }
  acBind(c,a,thr){ const S=this.p.CHEM_S, C=this.C, m=this.mol; if(m[a*C+c]>=thr)return a; let k=0; for(let q=0;q<S;q++) if(m[q*C+c]>=thr)k++; if(!k)return a; let j=a%k; for(let q=0;q<S;q++) if(m[q*C+c]>=thr){ if(j===0)return q; j--; } return a; }
  nvZero(){ return {inc:0,n:0,found:0,ext:0,rfound:0,cat:0,catN:0,recB:0,copy:0,open:0,rext:0,rcopy:0,capHit:0,maint:0,rmaint:0,decayed:0,gcFreed:0,inh:0,own:0,leak:0,lcopy:0,acF:0,acX:0}; }
  nNear(c){ const P=this.p, S=P.CHEM_S, R=P.NICHE_R; if(this.sId[c]>S)return c; if(this.skin)return this.perm&&R?this.nLeak(c):-1; if(!R)return -1; const W=P.W, H=P.H, x0=c%W, y0=(c/W)|0;
    for(let r=1;r<=R;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue; const q=((y0+dy+H)%H)*W+((x0+dx+W)%W); if(this.sId[q]>S)return q; } return -1; }
  nLeak(c){ const P=this.p, S=P.CHEM_S, R=P.NICHE_R, W=P.W, H=P.H, x0=c%W, y0=(c/W)|0; this.nLk=0; if(!(this.perm[c]>0))return -1;   // SKIN + PERM: the nearest stock-holding organism within R; yield factor p(user) x p(owner)
    for(let r=1;r<=R;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue; const q=((y0+dy+H)%H)*W+((x0+dx+W)%W); if(this.sId[q]>S&&this.alive[q]){ this.nLk=this.perm[c]*this.perm[q]; return this.nLk>0?q:-1; } } return -1; }
  ncopy(c){ const q=this.nNear(c); if(q<0)return; if(this.skin&&q!==c){ if(!(this.krr()<this.nLk))return; this.nv.lcopy++; } this.rec[c]=this.sId[q]; this.nv.copy++; }
  catal(c){ const P=this.p, S=P.CHEM_S, C=this.C, sc=P.NICHE_R?this.nNear(c):c; if(sc<0)return; const id=this.sId[sc]; if(id<=S)return; const i=id-S-1, q=this.cS[i], t=this.cT[i], u=(this.sCond?this.sCond[sc]:1)*(this.skin&&sc!==c?this.nLk:1); if(this.skin){ if(sc===c)this.nv.own++; else this.nv.leak++; }
    if(this.och&&this.cK[i]>=0){ const k=this.cK[i]; let o=this.och.get(k); if(!o){ o={v:P.NICHE_OPEN_CAP,t:this.tick}; this.och.set(k,o); }
      o.v=P.NICHE_OPEN_CAP-(P.NICHE_OPEN_CAP-o.v)*Math.pow(1-P.NICHE_OPEN_RATE,this.tick-o.t); o.t=this.tick; const g=o.v*P.NICHE_OPEN_F*u; o.v-=g; this.E[c]+=g; this.nv.open+=g;
      const key=3000000+k; this.nfx.set(key,(this.nfx.get(key)||0)+g); if(!this.cUse)this.cUse=new Map(); this.cUse.set(id,(this.cUse.get(id)||0)+g); }
    if(t<0)return;
    const x=this.mol[q*C+c]*P.EAT_F*u; if(!(x>0))return; const d=this.eMol[q]-this.eMol[t]; this.mol[q*C+c]-=x; this.mol[t*C+c]+=x; this.E[c]+=x*d; this.nv.cat+=x*d; this.nv.catN++;
    const key=2000000+q*256+t; this.nfx.set(key,(this.nfx.get(key)||0)+x*d); if(!this.cUse)this.cUse=new Map(); this.cUse.set(id,(this.cUse.get(id)||0)+x*d); }
  nicheRand(){ const P=this.p, E=P.NICHE_EVERY, i=((this.tick-1)/E)|0, sch=P.NICHE_RAND_SCHED[i]||[0,0,0], j=(this.tick-1)%E, S=P.CHEM_S, C=this.C, r=this.nrr, m=this.mol;
    const due=n=>Math.floor(n*(j+1)/E)-Math.floor(n*j/E), pres=c=>{ const L=[]; for(let q=0;q<S;q++) if(m[q*C+c]>=2e-3)L.push(q); return L; };
    for(let k=0,n=due(sch[0]);k<n;k++) for(let t=0;t<64;t++){ const c=(r()*C)|0; if(this.sId[c]>=0||(this.skin&&!this.alive[c]))continue; const L=pres(c); if(!L.length)continue; const a=L[(r()*L.length)|0], b=L[(r()*L.length)|0]; if(P.NICHE_AC===2&&P.NICHE_RAND_NAMED){ const na=(r()*S)|0, nb=(r()*S)|0; if(this.nFoundAC(c,na,nb,a,b,false)){ this.nv.rfound++; break; } continue; } this.nA_=a; if(this.nFound(c,a,b,false)){ this.nv.rfound++; break; } }
    for(let k=0,n=due(sch[1]);k<n;k++) for(let t=0;t<64;t++){ const c=(r()*C)|0; if(this.sId[c]<=S)continue; const L=pres(c); if(!L.length)continue; const a=L[(r()*L.length)|0], B=this.sId[c], x=this.sAmt[c]; if(m[a*C+c]*P.NICHE_F<x)continue;
      const d=this.nDelta(a,B), eN=this.eMol[a]+this.sE[c]-d; if(!(d>0)||eN<0||!this.nCan(B,a))continue; m[a*C+c]-=x; this.nA_=a; this.nPut(c,B,eN,x,this.sD[c]); this.nv.rext++; break; }
    for(let k=0,n=due(sch[2]);k<n;k++){ let src=-1; for(let t=0;t<64&&src<0;t++){ const q=(r()*C)|0; if(this.sId[q]>S)src=q; } if(src<0)break;
      for(let t=0;t<64;t++){ const c=(r()*C)|0; if(this.sId[c]>=0||(this.skin&&!this.alive[c]))continue; const id=this.sId[src], ii=id-S-1; this.sId[c]=id; this.sE[c]=this.cE[ii]; this.sAmt[c]=P.NICHE_BX; this.sD[c]=this.cD[ii]; if(this.sCond)this.sCond[c]=1; this.nv.rcopy++; break; } }
    if(this.sCond) for(let k=0,n=due(sch[3]||0);k<n;k++) for(let t=0;t<64;t++){ const c=(r()*C)|0; if(this.sId[c]<=S)continue; this.sCond[c]=1; this.nv.rmaint++; break; } }
  nicheRandomFound(){ const P=this.p, E=P.NICHE_EVERY, i=((this.tick-1)/E)|0, n=P.NICHE_FOUND_SCHED[i]||0, j=(this.tick-1)%E, S=P.CHEM_S, C=this.C, r=this.nrr;
    const due=Math.floor(n*(j+1)/E)-Math.floor(n*j/E);
    for(let k=0;k<due;k++) for(let t=0;t<64;t++){ const c=(r()*C)|0; if(this.sId[c]>=0)continue; const pres=[]; for(let q=0;q<S;q++) if(this.mol[q*C+c]>=2e-3)pres.push(q); if(!pres.length)continue;
      const a=pres[(r()*pres.length)|0], b=pres[(r()*pres.length)|0]; this.nA_=a; if(this.nFound(c,a,b,false)){ this.nv.rfound++; break; } } }
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
    let niche=null; if(this.sId){ let cells=0, amt=0, dmax=0, dsum=0; for(let c=0;c<this.C;c++) if(this.sId[c]>=0){ cells++; amt+=this.sAmt[c]; dsum+=this.sD[c]; if(this.sD[c]>dmax)dmax=this.sD[c]; }
      const all=[]; let tot=0; for(let x=0;x<P.CHEM_S*4;x++) if(this.rxE[x]>0){ all.push([x,this.rxE[x]]); tot+=this.rxE[x]; } for(const [k,v] of this.nfx){ all.push([k,v]); tot+=v; }
      all.sort((a,b)=>b[1]-a[1]); const S=P.CHEM_S, dOf=k=>k<1024?0:k<70000?1:k>=2000000?-2:(((k-70000)/256)|0)===S?-1:this.cD[(((k-70000)/256)|0)-S-1]+1;
      const cu=[...(this.cUse||new Map()).entries()].sort((a,b)=>b[1]-a[1]).filter(([k,v])=>v/tot>=0.002).map(([k,v])=>[this.cName(k),+(v/tot).toFixed(4),this.cD[k-S-1]]); if(this.cUse)this.cUse.clear();
      niche={flux:all.filter(([k,v])=>v/tot>=0.002).map(([k,v])=>[k,+(v/tot).toFixed(4),dOf(k)]),income:+tot.toFixed(1),buildIncome:+this.nv.inc.toFixed(1),builds:this.nv.n,found:this.nv.found,ext:this.nv.ext,rfound:this.nv.rfound,
        cells,amt:+amt.toFixed(2),depthMax:dmax,depthMean:cells?+(dsum/cells).toFixed(2):0,compounds:this.cE.length,buildCarriers:n?+(opC[29]/n).toFixed(4):0,catalCarriers:n?+(opC[30]/n).toFixed(4):0,catIncome:+this.nv.cat.toFixed(1),catN:this.nv.catN,cUse:cu,
        ...(P.NICHE_COPY||P.NICHE_OPEN||P.NICHE_R||P.NICHE_RAND_SCHED?{recB:this.nv.recB,copy:this.nv.copy,capHit:this.nv.capHit,openIncome:+this.nv.open.toFixed(1),rext:this.nv.rext,rcopy:this.nv.rcopy,channels:this.och?this.och.size:0,copyCarriers:n?+(opC[31]/n).toFixed(4):0,
          recU:this.rec?(()=>{ const h=new Map(); for(const c of liv) if(this.rec[c]>S)h.set(this.rec[c],(h.get(this.rec[c])||0)+1); return [...h.entries()].filter(([k,v])=>v/n>=0.002).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[this.cName(k),+(v/n).toFixed(4),this.cD[k-S-1]]); })():[],
          sU:(()=>{ const h=new Map(); for(let c=0;c<this.C;c++) if(this.sId[c]>S)h.set(this.sId[c],(h.get(this.sId[c])||0)+1); return [...h.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>[this.cName(k),v]); })()}:{}),
        ...(P.NICHE_AC?{acF:this.nv.acF,acX:this.nv.acX}:{}),
        ...(P.NICHE_GC||P.NICHE_BLD||P.NICHE_UP?(()=>{ let nb=0, ab=0, eb=0, ef=0; if(this.bld) for(const c of liv){ if(this.bld[c]){ nb++; eb+=this.E[c]; let h=0; const o=c*L; for(let i=0;i<this.len[c];i++) if(this.prog[o+i*2]===29){ h=1; break; } ab+=h; } else ef+=this.E[c]; }
          let uc=0, uN=0; if(this.sCond) for(let c=0;c<this.C;c++) if(this.sId[c]>=0){ uc+=this.sCond[c]; uN++; }
          const o={compoundsLive:this.cHa?this.cLive:this.cE.length,compoundsMade:this.cMade,gcFreed:this.nv.gcFreed,maint:this.nv.maint,rmaint:this.nv.rmaint,decayed:this.nv.decayed,condMean:uN?+(uc/uN).toFixed(3):0};
          if(this.bld){ o.builderShare=n?+(nb/n).toFixed(4):0; o.activeBuilderShare=n?+(ab/n).toFixed(4):0; o.bBirth=this.bBirth; o.fBirth=this.fBirth; o.bE=nb?+(eb/nb).toFixed(2):0; o.fE=n-nb?+(ef/(n-nb)).toFixed(2):0; this.bBirth=0; this.fBirth=0; }
          if(this.skin){ let ns=0, ps=0, p0=0, p1=0; for(const c of liv){ if(this.sId[c]>=0)ns++; if(this.perm){ const q=this.perm[c]; ps+=q; if(q<0.1)p0++; if(q>0.5)p1++; } }
            o.skin={stock:n?+(ns/n).toFixed(4):0,inh:this.nv.inh,own:this.nv.own,leak:this.nv.leak,lcopy:this.nv.lcopy,...(this.perm?{pMean:n?+(ps/n).toFixed(4):0,pLow:n?+(p0/n).toFixed(4):0,pHigh:n?+(p1/n).toFixed(4):0}:{})}; }
          return o; })():{})};
      this.nfx.clear(); this.nv=this.nvZero(); }
    let body=null; if(this.bd){ const M=P.BODY_MAX; let mt=0; for(let x=0;x<P.CHEM_S*4;x++)mt+=this.rxE[x]; const tot=mt+this.bIncT, car=new Map(); let sz=0, hold=0;
      for(const c of liv){ const k=this.bn[c]; sz+=k; if(k)hold++; const seen=new Set(); for(let i=0;i<k;i++)seen.add(this.bd[c*M+i]); for(const x of seen)car.set(x,(car.get(x)||0)+1); }
      const al=P.SCAR_T?this.scA:P.CHEM_ALPHA;
      body={inc:+this.bIncT.toFixed(1),metab:+mt.toFixed(1),light:+(this.ev.eatLight*(1-al)).toFixed(1),size:n?+(sz/n).toFixed(3):0,holders:n?+(hold/n).toFixed(4):0,kinds:car.size,...(P.BODY_FUSE?(()=>{ let nc=0, nl=0, tot2=0; for(const c of liv) for(let i=0;i<this.bn[c];i++){ const k=this.bd[c*M+i]; tot2++; if(k>=65536){ nc++; nl+=this.chS[k-65536].length; } } const o={chainShare:tot2?+(nc/tot2).toFixed(4):0,chainLen:nc?+(nl/nc).toFixed(2):0,chainsEver:this.chS.length,fusions:this.nFuse||0}; this.nFuse=0; return o; })():{}),
        bU:[...this.bInc.entries()].filter(([k,v])=>tot>0&&v/tot>=0.002).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/tot).toFixed(4)]),
        bC:[...car.entries()].filter(([k,v])=>v/n>=0.002).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/n).toFixed(4)])};
      this.bInc.clear(); this.bIncT=0; }
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
      reseeds:this.reseeds||0, ...(chem?{chem,n0:this.n0}:{}), ...(tasks?{tasks,n0:this.n0}:{}), ...(vir?{vir}:{}), ...(niche?{niche}:{}), ...(body?{body}:{})}; }
}

// ---- save and resume: every field is a typed array or a plain value, so a run can be carried across windows exactly ----
const ARRAYS=['alive','E','age','pc','face','R','len','prog','sprog','slen','tag','tmpl','stamp','gen','light','cap','corpse','order'];
const CHEM_ARRAYS=['mol','eMol','prod'], TASK_ARRAYS=['tin','tic','tdone','tres'];
World.prototype.save=function(){ const o={p:this.p,tick:this.tick,rnd:this.rnd.s,srnd:this.srnd.s,patch:this.patch,reseeds:this.reseeds||0,everTags:this.everTags?[...this.everTags]:[],ns:this.ns,nsNext:this.nsNext,nrnd:this.nrnd.s,fs:this.fs,fsNext:this.fsNext,frnd:this.frnd.s,fnRep:[...this.fnRep],...(this.p.VIRUS?{vn:this.vn,vrnd:this.vrnd.s,vc:Buffer.from(this.vc.buffer,0,this.vn*4).toString('base64'),vk:Buffer.from(this.vk.buffer,0,this.vn*this.vk.BYTES_PER_ELEMENT).toString('base64')}:{}),a:{}};
  if(this.p.CHEM_BIG){ o.big={}; for(const [q,m] of this.big.layers)o.big[q]=Buffer.from(m.buffer).toString('base64'); }
  for(const k of ARRAYS.concat(this.p.CHEM&&!this.p.CHEM_BIG?CHEM_ARRAYS:[],this.p.TASKS?TASK_ARRAYS:[]))o.a[k]=Buffer.from(this[k].buffer,this[k].byteOffset,this[k].byteLength).toString('base64'); return JSON.stringify(o); };
World.load=function(txt){ const o=JSON.parse(txt); const w=new World(1,o.p); w.tick=o.tick; w.rnd.s=o.rnd; w.srnd.s=o.srnd; w.patch=o.patch; w.reseeds=o.reseeds; w.everTags=new Set(o.everTags); w.ns=o.ns||[]; w.nsNext=o.nsNext||1; if(o.nrnd!==undefined)w.nrnd.s=o.nrnd; w.fs=o.fs||[]; w.fsNext=o.fsNext||1; if(o.frnd!==undefined)w.frnd.s=o.frnd; w.fnRep=new Set(o.fnRep||[]); if(o.p.VIRUS&&o.vn!==undefined){ w.vn=o.vn; w.vrnd.s=o.vrnd; new Uint8Array(w.vc.buffer).set(Buffer.from(o.vc,'base64')); new Uint8Array(w.vk.buffer).set(Buffer.from(o.vk,'base64')); }
  if(o.p.CHEM_BIG&&o.big) for(const q of Object.keys(o.big)){ const L=w.layer(+q); new Uint8Array(L.buffer).set(Buffer.from(o.big[q],'base64')); }
  for(const k of ARRAYS.concat(o.p.CHEM&&!o.p.CHEM_BIG?CHEM_ARRAYS:[],o.p.TASKS?TASK_ARRAYS:[])){ const b=Buffer.from(o.a[k],'base64'); const A=w[k]; new Uint8Array(A.buffer,A.byteOffset,A.byteLength).set(b); } return w; };
module.exports={TASK_SZ,World,OPS,OP,NOPS,NEUTRAL0,isNeutral,DEF,fnHash,fnHashList,ARGMASK,OPS_CHEM,NEUTRAL0_CHEM};
