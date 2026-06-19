// Open-endedness metrics harness for index.html.
//
// Drives the sim headless (same DOM/timer stubs as harness.js) but, instead of
// just sampling population, computes metrics that bear on the actual question:
// is this OPEN-ENDED evolution, or a random walk in elaborate clothing?
//
// Four families, each labelled by what it can and cannot prove:
//   DIVERSITY  (standing) — how varied the world is right now.
//   NOVELTY    (cumulative) — is the system still discovering kinds it has
//              never produced before, or has discovery plateaued?
//   COMPLEXITY (structural) — are the system's own building blocks growing
//              (VM length, distinct opcodes in use, live authored atoms,
//              bound opcodes, dimensionality, lineage depth)?
//   TURNOVER   (drift signal) — are dominant kinds being replaced over time,
//              or is the world frozen?
//
// Honesty note: NOVELTY-still-rising is necessary but NOT sufficient for
// open-endedness — neutral drift also produces novelty. The decisive test is
// whether novelty is ADAPTIVE (selected, load-bearing), which needs ablation
// (planned next: harness-ablate.js). This harness measures the necessary
// conditions and flags when they fail, so we never mistake drift for evolution.
//
// Env:  TICKS (default 20000)  SAMPLE (ticks between samples, default 500)
//       SEED  (optional: seeded RNG + deterministic clock for exact replay)
//       INDEX (optional: path to the html file to load)
//       JSONL=1  (stream one metrics object per sample to stdout)
const fs = require('fs');

const TICKS = parseInt(process.env.TICKS || '20000', 10);
const SAMPLE = parseInt(process.env.SAMPLE || '500', 10);
const STREAM = !!process.env.JSONL;

// ── Browser API stubs (identical to harness.js) ───────────────────
function selfProxy() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === 'width' || prop === 'height') return 0;
      if (prop === 'data') return new Uint8ClampedArray(4);
      return p;
    },
    apply() { return p; }
  });
  return p;
}
const CTX = selfProxy();
function makeEl() {
  return {
    getContext: () => CTX,
    addEventListener() {}, removeEventListener() {},
    set onclick(_) {}, set onchange(_) {}, click() {},
    style: {}, width: 1280, height: 720, _text: '',
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; }
  };
}
const ELS = {};
globalThis.document = {
  getElementById: (id) => (ELS[id] || (ELS[id] = makeEl())),
  createElement: () => makeEl(),
  addEventListener() {}, removeEventListener() {},
  get hidden() { return false; }
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
// GENOME=path.json resumes from an exported selection-genome (boot-time URL-hash import path).
const _gnHash = process.env.GENOME ? ('#' + JSON.parse(require('fs').readFileSync(process.env.GENOME, 'utf8')).genome) : '';
globalThis.location = { hash: _gnHash, pathname: '/', search: '', href: 'http://x/' };
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.navigator = { userAgent: 'node', hardwareConcurrency: 4, wakeLock: null };
globalThis.BroadcastChannel = class { constructor() {} postMessage() {} addEventListener() {} close() {} set onmessage(_) {} };
globalThis.fetch = () => new Promise(() => {});
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;

// Clock: real by default; deterministic when SEED is set (so time-budget gates
// fire identically across runs and metrics are exactly reproducible).
const _epoch = Date.now();
globalThis.__detMs = 0;
globalThis.performance = process.env.SEED
  ? { now: () => globalThis.__detMs }
  : { now: () => Date.now() - _epoch };
if (process.env.SEED) {
  let a = (parseInt(process.env.SEED, 10) | 0) >>> 0;
  Math.random = function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

let loopErrors = 0, lastErr = '';
console.error = (...a) => { const s = a.join(' '); if (/Loop error|Boot error|Watchdog/.test(s)) { loopErrors++; lastErr = s.slice(0, 160); } };
console.warn = () => {};

// ── OEE niche-economy knobs (swing #11): opt-in levers for A/B + controls ──
// Stock behaviour (baseline) = set NONE of these. Enable a lever with =1.
//   NICHE_FRONTIER=1   expanding cross-feed resource-spectrum frontier (lever 1)
//   NICHE_BIOTIC=1     biotic / coevolutionary predation niches (lever 2)
//   OPCODE_NOVELTY=1   opcode-novelty / coupling-gap pressure (lever 3)
//   NICHE_REAL=0       (with NICHE_FRONTIER=1) swap lever 1's REAL income for the zero-sum
//                      mean-centred control — proves a tax cannot beat limiting similarity.
//   NICHE_DRIFT=1      (with NICHE_FRONTIER=1) swing #12: supply peaks DRIFT, so the profitable
//                      diet is a moving target — no lineage can summit-and-stop.
//   NICHE_NDIM=1       (with NICHE_FRONTIER=1) swing #13: diet is an N-dim cell (bins^D niches),
//                      a combinatorial count instead of a 1-D handful. nicheOcc = occupied cells.
//   NICHE_LOCAL=1      (with NICHE_NDIM=1) swing #14: per-cell crowding cost — each niche gets a
//                      LOCAL carrying capacity, so overflow spreads to other cells (real per-niche competition).
if (process.env.NICHE_NDIM !== undefined) globalThis.__NICHE_NDIM = parseInt(process.env.NICHE_NDIM, 10);
if (process.env.NICHE_LOCAL !== undefined) globalThis.__NICHE_LOCAL = parseInt(process.env.NICHE_LOCAL, 10);
// swing #15 synthesis + retention knobs:
//   NICHE_CELLDRIFT=1  (with NICHE_NDIM=1) each cell's supply pulses on its own phase — no niche stays settled.
//   TEND_MUT=<x>       scale diet-axis exploration (default 1) — tests whether retention is exploration-limited.
if (process.env.NICHE_CELLDRIFT !== undefined) globalThis.__NICHE_CELLDRIFT = parseInt(process.env.NICHE_CELLDRIFT, 10);
if (process.env.TEND_MUT !== undefined) globalThis.__TEND_MUT = parseFloat(process.env.TEND_MUT);
// retention diagnostic + fix:
//   GLOBALTEND=<x>     scale the global diet-axis mean-reversion sink (0 = ablate; default 1).
//   NICHE_LOCALTEND=1  (with NICHE_NDIM=1) localise it: pull toward the per-niche centroid, not the global one.
if (process.env.GLOBALTEND !== undefined) globalThis.__GLOBALTEND = parseFloat(process.env.GLOBALTEND);
if (process.env.NICHE_LOCALTEND !== undefined) globalThis.__NICHE_LOCALTEND = parseInt(process.env.NICHE_LOCALTEND, 10);
// swing #16 dimensionality ratchet:
//   DIMS_GROW=<interval>  open a new trait axis every <interval> ticks (0 = off). Tests whether the
//                         board can GROW without catastrophe. DIMS_CAP caps it (default 10).
if (process.env.DIMS_GROW !== undefined) globalThis.__DIMS_GROW = parseInt(process.env.DIMS_GROW, 10);
if (process.env.DIMS_CAP !== undefined) globalThis.__DIMS_CAP = parseInt(process.env.DIMS_CAP, 10);
if (process.env.DIMS_SPREAD !== undefined) globalThis.__DIMS_SPREAD = parseFloat(process.env.DIMS_SPREAD);
for (const k of ['DIMS_SAT','DIMS_SAT_CAP','DIMS_SAT_OCC','CHAR_DISP','RED_QUEEN','NICHE_BUILD','SPATIAL_NICHE']) if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);
if (process.env.NICHE_FRONTIER !== undefined) globalThis.__NICHE_FRONTIER = parseInt(process.env.NICHE_FRONTIER, 10);
if (process.env.NICHE_BIOTIC !== undefined) globalThis.__NICHE_BIOTIC = parseInt(process.env.NICHE_BIOTIC, 10);
if (process.env.OPCODE_NOVELTY !== undefined) globalThis.__OPCODE_NOVELTY = parseInt(process.env.OPCODE_NOVELTY, 10);
if (process.env.NICHE_REAL !== undefined) globalThis.__NICHE_REAL = parseInt(process.env.NICHE_REAL, 10);
if (process.env.NICHE_DRIFT !== undefined) globalThis.__NICHE_DRIFT = parseInt(process.env.NICHE_DRIFT, 10);
// swing #17 cladogenesis (the speciation primitive). SPECIATE=1 turns it on; sub-toggles default to the
// master and exist for the 3-way control:
//   SPECIATE=1        master: isolate re-mergers within lineage + mint diverged sub-populations + grace.
//   SPEC_GATE=0       (control "mint-on/iso-off") label lineages but DON'T gate the re-mergers — must still collapse.
//   SPEC_MINT=0       isolate but never mint (diagnostic).
//   SPEC_GRACE=<t>    founder death-relief window in ticks (default 2000); SPEC_MINSIZE founder size (default 12).
//   SPEC_DIVT=<x>     trait-centroid divergence threshold to mint (default 0.20).
// Divergent selection is supplied by REAL partitioned niche cells (run with NICHE_NDIM=1 NICHE_REAL=1);
// the "same-landscape" control sets NICHE_REAL=0 (flat income) so isolation has no per-cell optimum to bite on.
for (const k of ['SPECIATE','SPEC_GATE','SPEC_MINT','SPEC_MINSIZE','SPEC_ASSORT']) if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);
for (const k of ['SPEC_GRACE','SPEC_DIVT','SPEC_ASSORT_T','SPEC_ASSORT_K']) if (process.env[k] !== undefined) globalThis['__' + k] = parseFloat(process.env[k]);
if (process.env.SPEC_DEBUG !== undefined) globalThis.__SPEC_DEBUG = parseInt(process.env.SPEC_DEBUG, 10);
if (process.env.SPEC_DECAY !== undefined) globalThis.__SPEC_DECAY = parseInt(process.env.SPEC_DECAY, 10);
// swing #20: colonization-vs-survival 2×2. Both default off (=baseline #17). Run as a 2×2 over {S,C}:
//   COLO_SURV=1     knob S — death-grace + min-viable-size floor (survival term; predicted: persistence up, distinct-cells flat)
//   COLO_PIONEER=1  knob C — pioneer income + Allee relief (growth term; predicted: distinct-lineage-cells climbs off ~12)
//   COLO_PIONEER_K / COLO_ALLEE_K / COLO_PIONEER_OCC  tune the C lever (defaults 2.0 / 1.0 / NICHE_CELL_FLOOR).
for (const k of ['COLO_SURV','COLO_PIONEER','COLO_PIONEER_OCC']) if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);
for (const k of ['COLO_PIONEER_K','COLO_ALLEE_K']) if (process.env[k] !== undefined) globalThis['__' + k] = parseFloat(process.env[k]);
// swing #21: spatially-local homogeniser (allopatry). SPATIAL_TEND=1 pulls each particle toward nearby
// same-lineage neighbours' mean tend; ALLO_SHUF=1 is the non-spatial strength-matched control; ALLO_K caps
// neighbours folded in. Needs SPECIATE=1. Headline = bifurcLin (lineage spatially splits into 2 centroids).
for (const k of ['SPATIAL_TEND','ALLO_SHUF','ALLO_K']) if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);
// swing #22: permissive mint gate. MINT_GATE = 'cell' (stock) | 'cluster' (permissive deme gate, drop
// niche-cell entry req) | 'relax' (size+divT only). Pair with COLO_SURV=1 for founder grace. radiationCells
// stays the strict success bar; cascadeCount = same-cell mints that LATER reach a distinct home cell.
if (process.env.MINT_GATE !== undefined) globalThis.__MINT_GATE = String(process.env.MINT_GATE);

const html = fs.readFileSync(process.env.INDEX || (__dirname + '/index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

// ── Metrics driver (runs in module scope → sees all sim globals) ──
const driver = `
;(function(){
  const STREAM=${STREAM};
  // Cumulative discovery sets (novelty): kinds the system has EVER produced.
  const seenBins=new Set();      // tendency-space cells ever occupied
  const seenMotifs=new Set();    // remembered cultural motifs ever seen
  let births=0;                  // high-water lineage-registry size = BIRTH THROUGHPUT,
                                 // NOT novelty (it rises with every birth regardless of
                                 // whether anything new appears). Reported, never trusted as OEE.
  let prevBins=new Set();        // last sample's occupied bins (for churn)
  // LINEAGE birth/death decomposition (the speciation-vs-extinction term). A new pLin id can only be
  // minted by a PARENTLESS spawn (reseed/immigration) — parented births inherit the parent's id — so
  // divergence-speciation is 0 by construction; this measures whether immigration births even appear
  // and persist against the death rate. cumLin counts distinct lineages EVER seen alive.
  const seenLin=new Set(); let prevLin=new Set();
  let mateStarvedCum=0;          // swing #18: cumulative extinctions of lineages whose lifetime spawns were mate-REFUSED >50% (the Allee trap)
  const prevLinSize=new Map();   // last sample's per-lineage living size (to know a dead lineage WAS viable when it vanished)
  // ── swing #19 decay probe (opt-in __SPEC_DECAY): does an incipient lineage's DECAY correlate with its
  //    target cell's OCCUPANCY? Decay concentrated in full cells → niche saturation (B). Decay independent
  //    of occupancy, happening even into cells with room → pure demographics (A). Longitudinal across samples.
  const prevSpec=new Map();      // l -> {size, cell, occ, occOther} measured at the PREVIOUS sample (conditions entering each interval)
  let dpN=0,dpDecay=0, dpOccD=0,dpOccG=0, dpOthD=0,dpOthG=0;     // means of entering-occupancy, decay vs grow cohorts
  let dpRoomDecay=0;                                            // decay events that happened when the target cell still had room (occ<=FLOOR)
  let dpSx=0,dpSy=0,dpSxx=0,dpSyy=0,dpSxy=0,dpSn=0;             // Pearson accumulators for corr(enteringOcc, deltaSize)
  const dpHist=[[0,0],[0,0],[0,0]];                            // per occupancy bin [decayCount, totalObs]: occ<=FLOOR, <=2*FLOOR, >2*FLOOR

  // Coarsen a tendency vector to a discrete cell. Reuse the sim's own tendBin
  // if present (keeps our bins identical to the NFD bins); else replicate.
  function binOf(i){
    if(typeof tendBin==='function'){ try{return tendBin(i);}catch(e){} }
    const b=i*DIMS; let r=0;
    for(let d=0;d<3&&d<DIMS;d++){ let q=((tend[b+d]+1.2)/2.4*4)|0; q=q<0?0:q>3?3:q; r=r*4+q; }
    return r;
  }
  function shannon(counts){
    let tot=0; for(const k in counts)tot+=counts[k];
    if(tot<=0)return 0; let h=0;
    for(const k in counts){ const p=counts[k]/tot; if(p>0)h-=p*Math.log2(p); }
    return h; // bits
  }

  function metrics(){
    // ---- standing diversity ----
    const binCounts={}, casteSet=new Set();
    let alive=0, ampSum=0;
    const curBins=new Set();
    for(let i=0;i<N;i++){
      if(!palive[i])continue;
      alive++; ampSum+=amp[i];
      const b=binOf(i); binCounts[b]=(binCounts[b]||0)+1; curBins.add(b); seenBins.add(b);
      if(typeof pType!=='undefined') casteSet.add(pType[i]&7);
    }
    const occupied=Object.keys(binCounts).length;
    const Hbits=shannon(binCounts);
    const Hnorm=occupied>1?Hbits/Math.log2(occupied):0; // 0..1: evenness across occupied kinds

    // ---- novelty (cumulative + per-window new) ----
    let newBins=0; for(const b of curBins) if(!prevBins.has(b)) newBins++;
    // churn = fraction of last sample's kinds no longer dominant-present now
    let lost=0; for(const b of prevBins) if(!curBins.has(b)) lost++;
    const churn=prevBins.size>0?lost/prevBins.size:0;
    prevBins=curBins;

    // ---- lineage birth/death decomposition ----
    let linStanding=0, linBirths=0, linDeaths=0;
    if(typeof pLin!=='undefined'){
      const curLin=new Set();
      for(let i=0;i<N;i++){ if(palive[i]) curLin.add(pLin[i]); }
      linStanding=curLin.size;
      for(const l of curLin) if(!seenLin.has(l)) linBirths++;   // first-ever appearance (new lineage entered)
      for(const l of prevLin) if(!curLin.has(l)) linDeaths++;   // present last sample, gone now (extinct)
      for(const l of curLin) seenLin.add(l);
      prevLin=curLin;
    }

    // ---- swing #17: NET-PERSISTENT-DIVERGENT lineage count (the speciation success metric) ----
    // Gross mints are a fiat output of the mint rule (the #16 trap one level up), so they prove nothing.
    // A minted lineage COUNTS only if, recomputed here independently of the sim's own bookkeeping, it:
    //   (a) persists — alive with >=minsize members AND has outlived its founder grace (age>=PERSIST_WIN,
    //       so it survived WITHOUT the death subsidy), (b) stays diverged — trait centroid >=divT from its
    //       parent's, not relaxed back, (c) holds a niche-cell distinct from its parent's main body.
    // linViable (alive lineages >=minsize) is the standing-diversity headline to compare against stock ~24.
    let specMinted=-1, specAlive=0, specPersist=0, linViable=0;
    let specMaxDepth=0, specNested=0, linVarWithin=-1, specBirthRej=-1, specBirthAcc=-1, specMateStarved=-1;
    let decayProbe=null;
    // swing #20 colonization guard (smear-proof): see the block below for definitions.
    let occCellsRaw=-1, radiationCells=-1, vCellsOcc=-1, cellsPerViableLin=-1, linPerOccCell=-1;
    // swing #21 bifurcation probe: does a single lineage occupy TWO spatially-separated clusters with diverged
    // trait centroids (the allopatric precursor #17's mint needs)? Measured directly, not via downstream cells.
    let bifurcLin=-1, bifurcDist=-1, bifurcSep=-1;
    // swing #22 cascade: permissive same-cell mints that later reached a distinct home cell (split-then-displace).
    let cascadeCount=-1, bornSameAlive=-1;
    if(typeof __SPEC!=='undefined' && __SPEC.on && typeof pLin!=='undefined'){
      const PERSIST_WIN=3000, MIN=__SPEC.minsize, DT=__SPEC.divT;
      const size=new Map(), cen=new Map(), cellCnt=new Map();
      for(let i=0;i<N;i++){ if(!palive[i])continue; const l=pLin[i];
        size.set(l,(size.get(l)||0)+1);
        let c=cen.get(l); if(!c){ c=new Float64Array(DIMS); cen.set(l,c); }
        for(let d=0;d<DIMS;d++)c[d]+=tend[i*DIMS+d];
        const cell=(typeof nicheCellOf==='function')?nicheCellOf(i):0;
        cellCnt.set(l+':'+cell,(cellCnt.get(l+':'+cell)||0)+1); }
      for(const [l,c] of cen){ const n=size.get(l)||1; for(let d=0;d<DIMS;d++)c[d]/=n; }
      const modal=new Map(), bestN=new Map();
      for(const [key,cnt] of cellCnt){ const ci=key.indexOf(':'), l=+key.slice(0,ci), cell=+key.slice(ci+1);
        if(cnt>(bestN.get(l)||0)){ bestN.set(l,cnt); modal.set(l,cell); } }
      for(const [l,sz] of size) if(sz>=MIN) linViable++;
      // ── swing #20 RADIATION GUARD: the one confound that has bitten every prior call — one viable lineage
      //    smearing into many empty cells reads as "colonization" but is not radiation. Raw occupied-cell count
      //    can't tell them apart; these can. The HEADLINE is radiationCells = number of distinct HOME (modal)
      //    cells of viable lineages: a smear keeps ONE home cell however far its tendrils reach, so it cannot
      //    inflate this — only NEW lineages establishing in NEW home cells move it. Success = this climbs off
      //    ~12, NOT occCellsRaw. cellsPerViableLin = smear magnitude; occCellsRaw vs radiationCells = the gap. ──
      { const occSet=new Set(), cellLins=new Map(), linCells=new Map();
        for(const [key,cnt] of cellCnt){ const ci=key.indexOf(':'), l=+key.slice(0,ci), cell=+key.slice(ci+1);
          occSet.add(cell);
          if((size.get(l)||0)>=MIN){
            let s=cellLins.get(cell); if(!s){ s=new Set(); cellLins.set(cell,s); } s.add(l);
            let cs=linCells.get(l); if(!cs){ cs=new Set(); linCells.set(l,cs); } cs.add(cell); } }
        const homeSet=new Set(); for(const [l] of linCells) homeSet.add(modal.get(l));
        occCellsRaw=occSet.size;          // distinct cells with ANY living member (the confoundable number)
        radiationCells=homeSet.size;       // distinct home cells of distinct viable lineages (smear-proof headline)
        vCellsOcc=cellLins.size;           // distinct cells holding any viable-lineage member (smear-inflatable; shows the gap)
        let cs=0,cn=0; for(const [,s] of linCells){ cs+=s.size; cn++; } cellsPerViableLin=cn?+(cs/cn).toFixed(2):0;
        let ls=0,ln=0; for(const [,s] of cellLins){ ls+=s.size; ln++; } linPerOccCell=ln?+(ls/ln).toFixed(2):0; }
      // ── swing #21 BIFURCATION probe — the direct signal of the allopatry mechanism. For each lineage big
      //    enough to split (>=2*MIN), 2-means its members in POSITION space; if both spatial clusters are
      //    viable (>=MIN) AND their TRAIT centroids are >=DT apart, the lineage has bifurcated into two
      //    centroids — exactly the precursor #17's mint needs. Counts these, plus mean trait dist + spatial
      //    separation. This is what #21 tries to manufacture; measure it, not just its downstream cell count. ──
      if(typeof px!=='undefined' && typeof py!=='undefined'){
        const mem=new Map(); for(let i=0;i<N;i++){ if(!palive[i])continue; const l=pLin[i]; let a=mem.get(l); if(!a){a=[];mem.set(l,a);} a.push(i); }
        let bc=0,bds=0,bss=0;
        for(const [l,idx] of mem){ if(idx.length<2*MIN)continue;
          let cax=px[idx[0]],cay=py[idx[0]],cbx=px[idx[0]],cby=py[idx[0]];   // seed the two centroids at the x-extremes
          for(const i of idx){ if(px[i]<cax){cax=px[i];cay=py[i];} if(px[i]>cbx){cbx=px[i];cby=py[i];} }
          const asg=new Int8Array(idx.length);
          for(let it=0;it<6;it++){ let ax=0,ay=0,an=0,bx=0,by=0,bn=0;
            for(let k=0;k<idx.length;k++){ const i=idx[k];
              const da=(px[i]-cax)**2+(py[i]-cay)**2, db=(px[i]-cbx)**2+(py[i]-cby)**2, g=da<=db?0:1; asg[k]=g;
              if(g===0){ax+=px[i];ay+=py[i];an++;} else {bx+=px[i];by+=py[i];bn++;} }
            if(an>0){cax=ax/an;cay=ay/an;} if(bn>0){cbx=bx/bn;cby=by/bn;} }
          let an=0,bn=0; const ta=new Float64Array(DIMS), tb=new Float64Array(DIMS);
          for(let k=0;k<idx.length;k++){ const i=idx[k];
            if(asg[k]===0){an++;for(let d=0;d<DIMS;d++)ta[d]+=tend[i*DIMS+d];} else {bn++;for(let d=0;d<DIMS;d++)tb[d]+=tend[i*DIMS+d];} }
          if(an<MIN||bn<MIN)continue;                                       // both spatial sub-groups must be viable
          let td=0; for(let d=0;d<DIMS;d++){ const dd=ta[d]/an-tb[d]/bn; td+=dd*dd; } td=Math.sqrt(td);
          if(td>=DT){ bc++; bds+=td; bss+=Math.sqrt((cax-cbx)**2+(cay-cby)**2); } }
        bifurcLin=bc; bifurcDist=bc?+(bds/bc).toFixed(3):0; bifurcSep=bc?+(bss/bc).toFixed(1):0;
      }
      // ── swing #22 CASCADE (split-then-displace) — the decisive instrument. Of viable lineages minted INTO
      //    their parent's niche-cell (permissive same-cell mints the cell-gate would refuse), how many have
      //    SINCE migrated to a distinct home cell from their parent? That delta is the literal niche-first vs
      //    split-first answer: >0 and growing = split-first cascade is real; flat 0 = no displacement, the
      //    cell-gate was enforcing real niche-distinctness (Half A / the #16 wall). bornSameAlive = denominator. ──
      if(typeof linBirthSameCell!=='undefined' && typeof linParent!=='undefined'){
        cascadeCount=0; bornSameAlive=0;
        for(const [l,sz] of size){ if(sz<MIN)continue; if(!linBirthSameCell.get(l))continue; bornSameAlive++;
          const p=linParent.get(l), lm=modal.get(l), pm=modal.get(p);
          if(lm!==undefined && pm!==undefined && lm!==pm) cascadeCount++; }
      }
      specMinted=(typeof specMintCount!=='undefined')?specMintCount:-1;
      for(const [l,bt] of linBirthTick){
        const sz=size.get(l)||0; if(sz<1)continue; specAlive++;
        if(sz<MIN)continue;
        if((tick-bt)<PERSIST_WIN)continue;
        const p=linParent.get(l), pc=cen.get(p), lc=cen.get(l); if(!lc)continue;
        if(!pc)continue;                                      // conservative: need a LIVING parent to prove ongoing divergence (orphans whose parent died are not auto-passed — that would be the #16 confound)
        let div=0; for(let d=0;d<DIMS;d++){ const dd=lc[d]-pc[d]; div+=dd*dd; } div=Math.sqrt(div);
        if(div<DT)continue;                                   // (b) still diverged from its (living) parent
        if(modal.get(l)===modal.get(p))continue;              // (c) distinct niche-cell from parent's main body
        specPersist++;
      }
      // ── swing #18 metrics: the success criterion is a DEEPENING genealogy, not a standing tip count ──
      // depthOf(l) = how many MINT events separate l from a non-minted (founder/immigrant) root. depth 1 =
      // first-generation daughter; depth>=2 = NESTED cladogenesis (a daughter that itself speciated) — the
      // tree branching again. Open-endedness = this max depth keeps GROWING over time, not a one-off branch.
      const depthOf=(l)=>{ let d=0,cur=l,g=0; while(linBirthTick.has(cur)&&g++<4096){ d++; const pp=linParent.get(cur); if(pp===undefined)break; cur=pp; } return d; };
      for(const [l,sz] of size){ if(sz<1)continue; const d=depthOf(l);
        if(d>specMaxDepth)specMaxDepth=d;
        if(d>=2&&sz>=MIN)specNested++; }                       // alive, viable, nested-origin lineages right now
      // ── Guardrail 2: within-lineage genetic variance (inbreeding-to-fixation watch) ──
      const lvar=new Map();
      for(let i=0;i<N;i++){ if(!palive[i])continue; const l=pLin[i]; const c=cen.get(l); if(!c)continue;
        let s=0; for(let d=0;d<DIMS;d++){ const dd=tend[i*DIMS+d]-c[d]; s+=dd*dd; } lvar.set(l,(lvar.get(l)||0)+s); }
      { let vs=0,vn=0; for(const [l,sz] of size){ if(sz>=MIN){ vs+=(lvar.get(l)||0)/sz; vn++; } } linVarWithin=vn?+(vs/vn).toFixed(5):0; }
      // ── Guardrail 1: extinction-by-mate-scarcity. A lineage that was viable last sample, is gone now, and
      // whose lifetime spawns were >50% mate-REFUSED, died of the Allee trap (couldn't find a compatible mate). ──
      if(__SPEC.assort && typeof linAcc!=='undefined'){
        for(const [l,psz] of prevLinSize){ if(psz>=MIN && !size.has(l)){
          const rej=linRej.get(l)||0, acc=linAcc.get(l)||0;
          if(rej+acc>0 && rej/(rej+acc)>0.5) mateStarvedCum++; } }
        prevLinSize.clear(); for(const [l,sz] of size) prevLinSize.set(l,sz);
        specBirthRej=(typeof specBirthReject!=='undefined')?specBirthReject:0;
        specBirthAcc=(typeof specBirthAccept!=='undefined')?specBirthAccept:0;
        specMateStarved=mateStarvedCum;
      }
      // opt-in: at the final sample, dump per-minted-lineage diagnostics so we can see which gate binds.
      if(globalThis.__SPEC_DEBUG && tick>=${TICKS}-1){
        let rows=[]; for(const [l,bt] of linBirthTick){ const sz=size.get(l)||0; if(sz<1)continue;
          const p=linParent.get(l), pc=cen.get(p), lc=cen.get(l); let div=-1;
          if(pc&&lc){ let s=0; for(let d=0;d<DIMS;d++){ const dd=lc[d]-pc[d]; s+=dd*dd; } div=Math.sqrt(s); }
          rows.push({l,parent:p,sz,age:tick-bt,div:+div.toFixed(3),cell:modal.get(l),pcell:modal.get(p),pAlive:(size.get(p)||0)}); }
        rows.sort((a,b)=>b.sz-a.sz);
        process.stderr.write('SPEC_DEBUG minted lineages (size-sorted):'+String.fromCharCode(10));
        for(const r of rows)process.stderr.write('  lin='+r.l+' parent='+r.parent+' size='+r.sz+' age='+r.age+' div='+r.div+' cell='+r.cell+' parentCell='+r.pcell+' parentSize='+r.pAlive+' | passSize='+(r.sz>=MIN)+' passAge='+(r.age>=PERSIST_WIN)+' passDiv='+(r.div>=DT)+' passCell='+(r.cell!==r.pcell)+String.fromCharCode(10));
      }
      // ── swing #19 decay probe: regress each minted lineage's per-interval size change on the OCCUPANCY of
      //    the cell it sat in ENTERING that interval. Saturation (B) → decay rises with occupancy / clusters in
      //    full cells; demographics (A) → decay is occupancy-independent and happens even into cells with room. ──
      if(globalThis.__SPEC_DECAY){
        const FLOOR=(typeof NICHE_CELL_FLOOR!=='undefined')?NICHE_CELL_FLOOR:2;
        const cellTotal=new Map();                            // cell -> living particles of ALL lineages (the crowding the cell actually imposes)
        for(const [key,cnt] of cellCnt){ const cell=+key.slice(key.indexOf(':')+1); cellTotal.set(cell,(cellTotal.get(cell)||0)+cnt); }
        for(const [l,pr] of prevSpec){
          if(pr.size<2)continue;                              // only cohorts large enough for "decay" to be meaningful
          const cur=size.get(l)||0, delta=cur-pr.size;        // size change over [prev, now]; cur=0 means the lineage went extinct
          const occ=pr.occ, oth=pr.occOther;                  // conditions ENTERING the interval (occupancy can't be caused by the later decay)
          dpN++; if(delta<0){ dpDecay++; dpOccD+=occ; dpOthD+=oth; if(occ<=FLOOR)dpRoomDecay++; } else { dpOccG+=occ; dpOthG+=oth; }
          dpSn++; dpSx+=occ; dpSy+=delta; dpSxx+=occ*occ; dpSyy+=delta*delta; dpSxy+=occ*delta;
          const bi=occ<=FLOOR?0:(occ<=2*FLOOR?1:2); dpHist[bi][1]++; if(delta<0)dpHist[bi][0]++;
        }
        prevSpec.clear();                                     // refresh longitudinal state with this sample's minted lineages
        for(const [l,bt] of linBirthTick){ const sz=size.get(l)||0; if(sz<1)continue;
          const m=modal.get(l), tot=cellTotal.get(m)||sz, own=cellCnt.get(l+':'+m)||sz;
          prevSpec.set(l,{size:sz, cell:m, occ:tot, occOther:tot-own}); }
        const cov=dpSxy-dpSx*dpSy/(dpSn||1), vx=dpSxx-dpSx*dpSx/(dpSn||1), vy=dpSyy-dpSy*dpSy/(dpSn||1);
        const corr=(dpSn>2 && vx>0 && vy>0)?cov/Math.sqrt(vx*vy):0;
        // ── niche-space saturation snapshot: is there room to radiate INTO? (the (B) precondition) ──
        const occs=Array.from(cellTotal.values()).sort((a,b)=>a-b);
        const totalCells=(typeof NICHE_ND_CELLS!=='undefined')?NICHE_ND_CELLS:-1;
        const occCells=occs.length, maxOcc=occs.length?occs[occs.length-1]:0, medOcc=occs.length?occs[occs.length>>1]:0;
        decayProbe={ obs:dpN, decayEvents:dpDecay,
          totalCells, occCells, emptyCellFrac:totalCells>0?+(1-occCells/totalCells).toFixed(3):-1, maxCellOcc:maxOcc, medCellOcc:medOcc,
          meanOccDecay:+(dpDecay?dpOccD/dpDecay:0).toFixed(2), meanOccGrow:+((dpN-dpDecay)?dpOccG/(dpN-dpDecay):0).toFixed(2),
          meanOtherDecay:+(dpDecay?dpOthD/dpDecay:0).toFixed(2), meanOtherGrow:+((dpN-dpDecay)?dpOthG/(dpN-dpDecay):0).toFixed(2),
          corrOccDelta:+corr.toFixed(3),                      // <0 = more crowded → more decline = saturation (B); ~0 = occupancy-blind = demographics (A)
          fracDecayWithRoom:+(dpDecay?dpRoomDecay/dpDecay:0).toFixed(3), // decay events that hit while the cell still had room (occ<=FLOOR)
          decayRateByOcc:dpHist.map(b=>b[1]?+(b[0]/b[1]).toFixed(3):-1), obsByOcc:dpHist.map(b=>b[1]) }; // bins: occ<=FLOOR, <=2*FLOOR, >2*FLOOR
      }
    }

    let motifNew=0;
    if(typeof genome!=='undefined'&&Array.isArray(genome.stableMotifs)){
      for(const m of genome.stableMotifs){
        if(!m||!m.t)continue;
        const sig=m.t.map(x=>Math.round(x*5)).join(',');
        if(!seenMotifs.has(sig)){seenMotifs.add(sig);motifNew++;}
      }
    }
    if(typeof lineageRegistry!=='undefined'&&lineageRegistry.size>births) births=lineageRegistry.size;

    // ---- complexity (the system's own building blocks) ----
    const G=(typeof genome!=='undefined')?genome:{};
    const vmLen=Array.isArray(G.vmProgram)?G.vmProgram.length:0;
    const opSet=new Set(); if(Array.isArray(G.vmProgram))for(const ins of G.vmProgram)opSet.add(ins[0]|0);
    const liveAtoms=Array.isArray(G.userAtoms)?G.userAtoms.filter(a=>a&&(a.uses|0)>0).length:0;
    const totAtoms=Array.isArray(G.userAtoms)?G.userAtoms.length:0;
    const boundOps=Array.isArray(G.boundOpcodes)?G.boundOpcodes.length:0;
    const fitSensors=Array.isArray(G.fitnessSensors)?G.fitnessSensors.length:0;

    // ── CLUSTER LINEAGE-PURITY PROBE (gated CLUSTER_PURITY=1) — the make-or-break measurement before any
    //    deme swing. Are clusters real demes (one persistent cluster-lineageID holds one particle-lineage pLin
    //    across its life) or lineage-salad (re-formed each ~30-tick cycle by pure proximity, mixing lineages)?
    //    Emits per-cluster {cluster lineageID, persistAge, dominant pLin, purity, #distinct pLin}. The driver
    //    samples at SAMPLE-tick spacing; the post-processor stitches a cluster-lineageID's domPlin over time
    //    to get temporal stability (the decisive signal); purity-vs-persistAge here is the snapshot proxy. ──
    let cpur;
    if(process.env.CLUSTER_PURITY && typeof clusters!=='undefined' && typeof clusterID!=='undefined' && typeof pLin!=='undefined'){
      const hist=new Map();   // clusterID idx → Map(pLin → count)
      for(let i=0;i<N;i++){ if(!palive[i])continue; const c=clusterID[i]; if(c<0)continue;
        let h=hist.get(c); if(!h){ h=new Map(); hist.set(c,h); } h.set(pLin[i],(h.get(pLin[i])||0)+1); }
      const dom=new Map(), meta=new Map();   // c → dominant pLin; c → {sz,domLin,domN,np}
      for(const [c,h] of hist){ let sz=0,dn=0,dl=-1; for(const [pl,n] of h){ sz+=n; if(n>dn){ dn=n; dl=pl; } } dom.set(c,dl); meta.set(c,{sz,domLin:dl,domN:dn,np:h.size}); }
      // core (=dominant-pLin members) vs fringe (=rest) trait centroids: is the fringe trait-SIMILAR to the
      // core (homogenising bulk → plugging helps) or DISSIMILAR (the #18 generative hybridisation tail → keep)?
      const coreS=new Map(), coreC=new Map(), frinS=new Map(), frinC=new Map();
      for(let i=0;i<N;i++){ if(!palive[i])continue; const c=clusterID[i]; if(c<0)continue; const dl=dom.get(c); if(dl===undefined)continue;
        if(pLin[i]===dl){ let s=coreS.get(c); if(!s){ s=new Float64Array(DIMS); coreS.set(c,s); } for(let d=0;d<DIMS;d++)s[d]+=tend[i*DIMS+d]; coreC.set(c,(coreC.get(c)||0)+1); }
        else { let s=frinS.get(c); if(!s){ s=new Float64Array(DIMS); frinS.set(c,s); } for(let d=0;d<DIMS;d++)s[d]+=tend[i*DIMS+d]; frinC.set(c,(frinC.get(c)||0)+1); } }
      cpur=[];
      for(const [c,m] of meta){ const cl=clusters[c]; if(!cl)continue;
        let cfd=-1; const cn=coreC.get(c)||0, fn=frinC.get(c)||0;
        if(cn>0&&fn>0){ const cs=coreS.get(c), fsum=frinS.get(c); let dd=0; for(let d=0;d<DIMS;d++){ const x=cs[d]/cn-fsum[d]/fn; dd+=x*x; } cfd=+Math.sqrt(dd).toFixed(3); }
        cpur.push({lin:cl.lineageID|0, age:cl.persistAge|0, sz:m.sz, dom:m.domLin, df:+(m.domN/m.sz).toFixed(3), np:m.np, ff:+(fn/m.sz).toFixed(3), cfd}); }
    }

    return {
      tick:(typeof tick!=='undefined')?tick:-1,
      N:alive,
      meanAmp:+(alive?ampSum/alive:0).toFixed(3),
      // diversity
      occupiedKinds:occupied,
      diversityHbits:+Hbits.toFixed(3),
      diversityEvenness:+Hnorm.toFixed(3),
      clusters:(typeof clusters!=='undefined')?clusters.length:-1,
      castes:casteSet.size,
      // novelty
      cumKinds:seenBins.size,
      newKinds:newBins,
      cumMotifs:seenMotifs.size,
      births:births, // throughput, not novelty (see decl) — diagnostic only
      // complexity
      vmLen, vmDistinctOps:opSet.size, liveAtoms, totAtoms, boundOps,
      DIMS:(typeof DIMS!=='undefined')?DIMS:-1, fitSensors,
      generation:(G.generation|0), extinctions:(G.extinctions|0),
      // dimensionality ratchet (swing #16): live DIMS vs the (formerly inert) evolvable tendDims, and
      // whether the trait axes actually carry variation (board grew vs degenerate).
      tendDims:(G.tendDims|0), traitDimEnt:(typeof traitDimEntropy==='function')?traitDimEntropy():-1,
      // lineage birth/death (speciation vs extinction term): standing distinct lineages, new this
      // window (immigration only — divergence-speciation is 0 by construction), extinct this window,
      // and cumulative lineages ever seen alive.
      linStanding, linBirths, linDeaths, linCum:(typeof seenLin!=='undefined')?seenLin.size:-1,
      // swing #17 cladogenesis: cumulative mints, minted-and-alive, NET-PERSISTENT-DIVERGENT (the real
      // success metric — survived past grace, still diverged, still cell-distinct), and viable standing
      // lineages (>=minsize) to compare against the stock ~24 island-equilibrium.
      specMinted, specAlive, specPersist, linViable,
      // swing #22 conduit probe: of viable sub-groups, how many trait-DIVERGED ones are refused a mint purely
      // because they share the parent's niche-cell (specMintBlockCell) — divergence erased by bookkeeping, not
      // gene flow. Compare to actual mints (specMinted) and to cell-distinct-but-not-yet-diverged holds.
      specMintCand:(typeof specMintCand!=='undefined')?specMintCand:-1,
      specMintBlockCell:(typeof specMintBlockCell!=='undefined')?specMintBlockCell:-1,
      specMintBlockDiv:(typeof specMintBlockDiv!=='undefined')?specMintBlockDiv:-1,
      // per-axis squared divergence (cumulative): refused (blockCell) vs minted. Selected axes = 0..3
      // (niche economy), neutral = 4+ (#16). If blockAxisSq is concentrated on 4+, the gate is correctly
      // refusing functionless variation; if on 0..3, it is too coarse and the cluster reframe is warranted.
      specBlockAxisSq:(typeof specBlockAxisSq!=='undefined')?Array.from(specBlockAxisSq.slice(0,(typeof DIMS!=='undefined'?DIMS:8))).map(x=>+x.toFixed(3)):null,
      specMintAxisSq:(typeof specMintAxisSq!=='undefined')?Array.from(specMintAxisSq.slice(0,(typeof DIMS!=='undefined'?DIMS:8))).map(x=>+x.toFixed(3)):null,
      // refused-cohort PERSISTENCE: how many cadences (~30 ticks) a refused cohort stays continuously diverged.
      // Long streaks → stable incipient species the gate wrongly refuses; 1–2 → transient drift (gate correct).
      blockStreakLiveMean:(typeof _blockStreak!=='undefined'&&_blockStreak.size>0)?+([..._blockStreak.values()].reduce((a,b)=>a+b,0)/_blockStreak.size).toFixed(2):0,
      blockStreakLiveMax:(typeof _blockStreak!=='undefined'&&_blockStreak.size>0)?Math.max(..._blockStreak.values()):0,
      blockStreakLiveN:(typeof _blockStreak!=='undefined')?_blockStreak.size:-1,
      blockStreakDoneMean:(typeof _blockStreakDoneN!=='undefined'&&_blockStreakDoneN>0)?+(_blockStreakDoneSum/_blockStreakDoneN).toFixed(2):0,
      blockStreakHist:(typeof _blockStreakHist!=='undefined')?Array.from(_blockStreakHist):null,
      // swing #20 colonization 2×2 guard: radiationCells (distinct home cells of viable lineages) is the
      // smear-proof success metric; occCellsRaw is the confoundable raw count. A rising occCellsRaw with a
      // flat radiationCells = one lineage smearing, NOT radiation. cellsPerViableLin = smear magnitude.
      occCellsRaw, radiationCells, vCellsOcc, cellsPerViableLin, linPerOccCell,
      // swing #21 allopatry: bifurcLin = lineages spatially split into two trait-diverged centroids (the
      // direct mechanism signal); bifurcDist = mean trait gap, bifurcSep = mean spatial gap of those splits.
      bifurcLin, bifurcDist, bifurcSep,
      // swing #22: cascadeCount = same-cell permissive mints that LATER reached a distinct home cell (the
      // split-then-displace signal); bornSameAlive = viable same-cell mints (denominator). radiationCells stays
      // the strict success bar — a cascade shows as cascadeCount>0 AND radiationCells climbing.
      cascadeCount, bornSameAlive,
      // swing #18 — assortative mating. Headline OEE signature = genealogy DEPTH growing over time
      // (specMaxDepth) and NESTED cladogenesis (specNested), not a standing tip count. Guardrails:
      // linVarWithin (inbreeding-to-fixation watch), specMateStarved (Allee-trap extinctions), and the
      // realized/refused spawn split (specBirthAcc/Rej). specSimMean = mean trait-similarity at spawn.
      specMaxDepth, specNested, linVarWithin, specBirthAcc, specBirthRej, specMateStarved,
      decayProbe,   // swing #19: (A)demographics vs (B)niche-saturation discriminator (only populated under __SPEC_DECAY)
      specSimMean:(typeof specSimCnt!=='undefined'&&specSimCnt>0)?+(specSimSum/specSimCnt).toFixed(3):-1,
      specSimHist:(typeof specSimHist!=='undefined')?Array.from(specSimHist):null,
      // seed-vs-harvest: the newest axis vs axis 0 (positive control). R = lineage-structured fraction
      // of variance; watch newAxis.ent/Vtot decay-or-hold and R after a frozen grow.
      newAxis:(typeof axisStats==='function')?axisStats((typeof DIMS!=='undefined'?DIMS-1:-1)):null,
      ctrlAxis0:(typeof axisStats==='function')?axisStats(0):null,
      // niche economy (swing #11): channels of the resource spectrum currently held by life
      nicheOcc:(typeof nicheOccupancy==='function')?nicheOccupancy():-1,
      // turnover
      kindChurn:+churn.toFixed(3),
      ...(cpur!==undefined?{cpur}:{})   // cluster lineage-purity probe (CLUSTER_PURITY=1)
    };
  }

  globalThis.__SERIES=[];
  globalThis.__runOEE=function(ticks,every){
    let m=metrics(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+String.fromCharCode(10));
    for(let s=0;s<ticks;s++){
      globalThis.__detMs+=5;
      try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;}
      if((s+1)%every===0){ m=metrics(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+String.fromCharCode(10)); }
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/oee-sim.js');
m.filename = __dirname + '/oee-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

const t0 = Date.now();
try { m._compile(code + driver, m.filename); }
catch (e) { console.log('COMPILE/BOOT THREW:', e.message); process.exit(1); }
const tBoot = Date.now();

globalThis.__runOEE(TICKS, SAMPLE);
const tDone = Date.now();

const S = globalThis.__SERIES;

// ── Trajectory verdicts: is novelty still being produced, or saturating? ──
// Compare the rate of NEW kinds discovered in the first third vs the last third
// of the run. A healthy open-ended system keeps the late rate well above zero;
// a system that has exhausted its search has a late rate near zero.
function windowNewRate(series, lo, hi) {
  if (hi - lo < 1) return 0;
  let sumNew = 0, dt = 0;
  for (let i = lo + 1; i <= hi && i < series.length; i++) {
    sumNew += series[i].newKinds;
    dt += (series[i].tick - series[i - 1].tick);
  }
  return dt > 0 ? sumNew / dt * 1000 : 0; // new kinds per 1000 ticks
}
const n = S.length;
const earlyRate = windowNewRate(S, 0, Math.floor(n / 3));
const lateRate = windowNewRate(S, Math.floor(2 * n / 3), n - 1);
const last = S[n - 1] || {};
const first = S[0] || {};

// Least-squares slope of a field over sample index → trend, robust to a single
// endpoint landing on an oscillation peak (the +4 vmLen artifact in the first run).
function slope(series, key) {
  const m = series.length;
  if (m < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < m; i++) { const x = i, y = series[i][key] || 0; sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const d = m * sxx - sx * sx;
  return d ? (m * sxy - sx * sy) / d : 0; // units of field per sample
}
function thirdMean(series, key, lo, hi) {
  let s = 0, c = 0; for (let i = lo; i < hi && i < series.length; i++) { s += series[i][key] || 0; c++; } return c ? s / c : 0;
}
const t1 = Math.floor(n / 3), t2 = Math.floor(2 * n / 3);

// Complexity: trend (slope per sample), not endpoint delta. endpointDelta kept but
// labelled as endpoint-sensitive so it's never read as a ratchet on its own.
const complexity = {
  vmLen_slopePerSample: +slope(S, 'vmLen').toFixed(4),
  vmLen_endpointDelta: (last.vmLen || 0) - (first.vmLen || 0),
  distinctOps_slopePerSample: +slope(S, 'vmDistinctOps').toFixed(4),
  liveAtoms_max: Math.max(...S.map(r => r.liveAtoms || 0)),
  totAtoms_max: Math.max(...S.map(r => r.totAtoms || 0)),
  boundOps_max: Math.max(...S.map(r => r.boundOps || 0)),
  DIMS_delta: (last.DIMS || 0) - (first.DIMS || 0),
  generation_delta: (last.generation || 0) - (first.generation || 0)
};
// A real ratchet shows a slope clearly above the noise of its oscillation.
const vmStd = (() => { const mu = thirdMean(S, 'vmLen', 0, n); let v = 0; for (const r of S) v += ((r.vmLen || 0) - mu) ** 2; return Math.sqrt(v / Math.max(1, n)); })();
complexity.vmLen_ratchets = complexity.vmLen_slopePerSample * n > vmStd; // total rise exceeds one std of the wobble

// Diversity trend: is the world holding variety or collapsing toward monoculture?
const diversity = {
  evenness_early: +thirdMean(S, 'diversityEvenness', 0, t1).toFixed(3),
  evenness_late: +thirdMean(S, 'diversityEvenness', t2, n).toFixed(3),
  kinds_early: +thirdMean(S, 'occupiedKinds', 0, t1).toFixed(1),
  kinds_late: +thirdMean(S, 'occupiedKinds', t2, n).toFixed(1),
  entropyBits_early: +thirdMean(S, 'diversityHbits', 0, t1).toFixed(2),
  entropyBits_late: +thirdMean(S, 'diversityHbits', t2, n).toFixed(2),
  clusters_early: +thirdMean(S, 'clusters', 0, t1).toFixed(1),
  clusters_late: +thirdMean(S, 'clusters', t2, n).toFixed(1)
};
// Collapse keyed on ENTROPY (bits), which is resolution-independent — unlike the
// occupied-kinds count, which is capped by the coarse 64-cell binning and gave false
// positives (a world holding even diversity across few-but-balanced kinds read as
// "collapsing"). A >=30% entropy loss early->late is the collapse signal; kinds ratio
// kept as a secondary diagnostic.
diversity.entropyRatio = diversity.entropyBits_early > 0 ? +(diversity.entropyBits_late / diversity.entropyBits_early).toFixed(2) : null;
diversity.kindsRatio = diversity.kinds_early > 0 ? +(diversity.kinds_late / diversity.kinds_early).toFixed(2) : null;
diversity.collapsing = diversity.entropyRatio !== null && diversity.entropyRatio < 0.7;

const niche = {
  occ_early: +thirdMean(S, 'nicheOcc', 0, t1).toFixed(2),
  occ_late: +thirdMean(S, 'nicheOcc', t2, n).toFixed(2),
  occ_max: Math.max(...S.map(r => r.nicheOcc || 0)),
  occ_slopePerSample: +slope(S, 'nicheOcc').toFixed(4)
};
// Growing (not just high) occupancy is the open-ended signal: niches being ADDED faster than lost.
niche.growing = niche.occ_slopePerSample > 0 && niche.occ_late > niche.occ_early;

const verdict = {
  novelty_late_vs_early: { earlyNewKindsPer1k: +earlyRate.toFixed(2), lateNewKindsPer1k: +lateRate.toFixed(2),
    decayedTo: earlyRate > 0 ? +(lateRate / earlyRate).toFixed(2) : null, stillProducing: lateRate > 0.05 },
  niche_trend: niche,
  diversity_trend: diversity,
  complexity_trend: complexity,
  complexity_topTierEngaged: (complexity.liveAtoms_max > 0 || complexity.boundOps_max > 0 || complexity.DIMS_delta > 0),
  notes: [
    'novelty.stillProducing is NECESSARY, not sufficient: neutral drift also makes new kinds.',
    'diversity.collapsing=true means the world is losing variety over time (monoculture pull winning).',
    'complexity.vmLen_ratchets distinguishes real growth from an oscillation that happened to end high.',
    'topTierEngaged=false means the self-authoring machinery never became load-bearing (atoms born but liveAtoms=0 still counts as dormant).',
    'Decisive adaptiveness test (does novelty get SELECTED) requires ablation — next harness.'
  ]
};

console.log(JSON.stringify({
  config: { TICKS, SAMPLE, SEED: process.env.SEED || null, INDEX: process.env.INDEX || 'index.html' },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  verdict,
  series: STREAM ? '(streamed as JSONL above)' : S
}, null, 1));
