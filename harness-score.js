// Non-biological scoreboard for index.html — the computational-economy view.
//
// The rest of the harness family scores this system as an ECOLOGY (kinds,
// niches, diversity, speciation). That framing imports a promise the mechanics
// don't cash and reads progress off noisy, lagging proxies. This harness scores
// the SAME run as what it literally is: a self-extending VM that mints and
// prices its own primitives. No biology — only the machine.
//
// Four families, each a concrete quantity read from live state, not a metaphor:
//   ISA       — the alphabet actually in use. How much of the 232-opcode core is
//               exercised, and how many AUTHORED opcodes (id >= CORE_OPCODES) run.
//   MINT      — self-authored primitives. How many atoms are ADOPTED (uses>0),
//               how deep they compose, how hard the top one is called.
//   BEHAVIOUR — the sense->act question, stated computationally. Share of atom
//               CALLS that go to world-sensing atoms (read nx/ny/nb/c/d/m/t)
//               vs pure self-scalings, plus REACH actuator firings.
//   MDL       — expressive complexity. gzip size of the self's ACTIVE codebase
//               (its program V + every adopted atom expression). This is the
//               algorithmic signature of open-endedness: irreducible structure
//               ACCRETING over a run, not just a fixed alphabet re-shuffled.
//
// Honesty note: MDL-rising is NECESSARY, not sufficient — neutral drift also adds
// tokens. The decisive test is whether the accreted structure is SELECTED (ablation,
// a separate harness). This scoreboard measures the computational signature without
// the ecological costume, and flags which signals are load-bearing vs cosmetic.
//
// Env:  TICKS (default 20000)  SAMPLE (ticks between samples, default 500)
//       SEED  (optional: seeded RNG + deterministic clock for exact replay)
//       INDEX (optional: path to the html file to load)
//       JSONL=1  (stream one scoreboard row per sample to stdout)
//       Stack knobs (default ON, set =0 to ablate): ATOM_PIPELINE ATOM_DURABLE
//       REACH RICH_GRAMMAR — so this can A/B the enrichment/durability stack.
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
for (const k of ['DIMS_SAT','DIMS_SAT_CAP','DIMS_SAT_OCC','CHAR_DISP','RED_QUEEN','NICHE_BUILD','SPATIAL_NICHE','RQ_TRAIT','MUTUALISM','GROUP_ROLES','GROUP_PROBE','BUD_INSTR','GENO_PARASITE','FRONTIER_EXPAND','NOVELTY_ARCHIVE','ATOM_PIPELINE','RICH_GRAMMAR','REACH']) if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);
if (process.env.SHADOW_WINS_DECAY !== undefined) globalThis.__SHADOW_WINS_DECAY = parseFloat(process.env.SHADOW_WINS_DECAY);
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

// ATOM_DURABLE passthrough (the sim reads globalThis.__ATOM_DURABLE at boot; the
// generic knob loop above doesn't cover it). Set =0 to ablate durability.
if (process.env.ATOM_DURABLE !== undefined) globalThis.__ATOM_DURABLE = parseInt(process.env.ATOM_DURABLE, 10);

// ── Scoreboard driver (runs in module scope → sees genome, pProg, CORE_OPCODES, __reachFires) ──
const driver = `
;(function(){
  const STREAM=${STREAM};
  const NL=String.fromCharCode(10);
  let zlib=null; try{ zlib=require('zlib'); }catch(e){}

  // World-sensing ports an atom expression can read (EYES/HANDS from RICH_GRAMMAR):
  //   nx,ny neighbour position · nb neighbour amplitude · c proximity · d energy · m caste · t clock.
  // Matched as whole identifiers so cos/tanh/atan2 don't false-trigger on c/t/etc.
  const SENSE=/\\b(nx|ny|nb|c|d|m|t)\\b/;      // reads the world
  const COMPOSE=/\\bf\\s*\\(/;                 // calls another atom: f(idx,a,b)
  function pdepth(expr){ let d=0,mx=0; for(let i=0;i<expr.length;i++){ const ch=expr[i]; if(ch==='(')mx=Math.max(mx,++d); else if(ch===')')d--; } return mx; }

  function score(){
    const G=(typeof genome!=='undefined')?genome:null;
    const CORE=(typeof CORE_OPCODES==='number')?CORE_OPCODES:232;
    const atoms=(G&&Array.isArray(G.userAtoms))?G.userAtoms:[];
    const bo=(G&&Array.isArray(G.boundOpcodes))?G.boundOpcodes:[];

    // ---- ISA: which opcodes are actually EXECUTED (population programs + the self's V) ----
    const used=new Set(); let alive=0;
    if(typeof pProg!=='undefined' && typeof N!=='undefined'){
      for(let i=0;i<N;i++){ if(!palive[i])continue; alive++; const p=pProg[i];
        if(Array.isArray(p)) for(let j=0;j<p.length;j++){ const ins=p[j]; if(Array.isArray(ins)) used.add(ins[0]|0); } }
    }
    if(G&&Array.isArray(G.vmProgram)) for(const ins of G.vmProgram){ if(Array.isArray(ins)) used.add(ins[0]|0); }
    let usedCore=0, usedBound=0; for(const op of used){ if(op>=CORE) usedBound++; else usedCore++; }

    // ---- MINT: adopted self-authored primitives + how deep they compose ----
    let adopted=0, usesTot=0, usesMax=0, depthMax=0, depthSum=0, composites=0;
    let senseAtoms=0, senseUses=0;              // BEHAVIOUR: world-sensing atoms & their call-share
    const active=[];                            // adopted atom expressions (for MDL)
    for(const a of atoms){ if(!a||typeof a.expression!=='string')continue; const u=a.uses|0; usesTot+=u; if(u>usesMax)usesMax=u;
      if(u>0){ adopted++; active.push(a.expression);
        const dp=pdepth(a.expression); depthSum+=dp; if(dp>depthMax)depthMax=dp;
        if(COMPOSE.test(a.expression)) composites++;
        if(SENSE.test(a.expression)){ senseAtoms++; senseUses+=u; } } }
    const depthMean=adopted? +(depthSum/adopted).toFixed(2):0;
    const senseUseShare=usesTot>0? +(senseUses/usesTot).toFixed(3):0;   // ← the sense->act headline

    // bound opcodes that are BOTH wired (a call-site exists in an executed program) AND backed by a used atom
    let boundLive=0;
    for(let k=0;k<bo.length;k++){ const opId=CORE+k; if(!used.has(opId))continue; const at=atoms[bo[k]]; if(at&&(at.uses|0)>0) boundLive++; }

    // ---- MDL: gzip size of the self's ACTIVE codebase (program V + adopted atom expressions) ----
    const parts=[];
    if(G&&Array.isArray(G.vmProgram)) for(const ins of G.vmProgram){ if(Array.isArray(ins)) parts.push(ins.map(x=>typeof x==='number'?(+x).toFixed(3):String(x)).join(',')); }
    for(const e of active) parts.push(e);
    const src=parts.join(NL);
    let mdlBytes=0; if(zlib){ try{ mdlBytes=zlib.gzipSync(src).length; }catch(e){ mdlBytes=0; } }

    return {
      tick: (globalThis.__TICK||0), alive,
      // ISA
      isaUsedDistinct: used.size, isaUsedCore: usedCore, isaUsedBound: usedBound,
      boundDeclared: bo.length, boundLive,
      // MINT
      atoms: atoms.length, atomsAdopted: adopted, usesTot, usesMax, depthMax, depthMean, composites,
      // BEHAVIOUR
      senseAtoms, senseUseShare, reachFires: (typeof __reachFires!=='undefined'?__reachFires:0),
      // MDL
      vmLen: (G&&Array.isArray(G.vmProgram))?G.vmProgram.length:0, mdlBytes, mdlRaw: src.length
    };
  }

  globalThis.__SERIES=[];
  globalThis.__runScore=function(ticks,every){
    globalThis.__TICK=0;
    let m=score(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+NL);
    for(let s=0;s<ticks;s++){
      globalThis.__detMs+=5; globalThis.__TICK=s+1;
      try{loop();}catch(e){globalThis.__driverErr=(globalThis.__driverErr||0)+1;}
      if((s+1)%every===0){ m=score(); globalThis.__SERIES.push(m); if(STREAM)process.stdout.write(JSON.stringify(m)+NL); }
    }
  };
})();
`;

const Module = require('module');
const m = new Module(__dirname + '/score-sim.js');
m.filename = __dirname + '/score-sim.js';
m.paths = Module._nodeModulePaths(__dirname);

const t0 = Date.now();
try { m._compile(code + driver, m.filename); }
catch (e) { console.log('COMPILE/BOOT THREW:', e.message); process.exit(1); }
const tBoot = Date.now();

globalThis.__runScore(TICKS, SAMPLE);
const tDone = Date.now();

const S = globalThis.__SERIES;

// ── Trend helpers (least-squares slope per sample, and third-window means) ──
function slope(series, key) {
  const n = series.length; if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { const y = series[i][key] || 0; sx += i; sy += y; sxx += i * i; sxy += i * y; }
  const d = n * sxx - sx * sx; return d === 0 ? 0 : (n * sxy - sx * sy) / d;
}
function wmean(series, key, lo, hi) { let s = 0, c = 0; for (let i = lo; i < hi && i < series.length; i++) { s += series[i][key] || 0; c++; } return c ? s / c : 0; }
function stdev(series, key) { const mu = wmean(series, key, 0, series.length); let v = 0; for (const r of series) v += ((r[key] || 0) - mu) ** 2; return Math.sqrt(v / Math.max(1, series.length)); }

const n = S.length, t1 = Math.floor(n / 3), t2 = Math.floor(2 * n / 3);
const first = S[0] || {}, last = S[n - 1] || {};

// ISA — how much of the machine's own instruction set is exercised, and are authored opcodes running.
const ISA = {
  usedDistinct_early: +wmean(S, 'isaUsedDistinct', 0, t1).toFixed(1),
  usedDistinct_late: +wmean(S, 'isaUsedDistinct', t2, n).toFixed(1),
  usedDistinct_slopePerSample: +slope(S, 'isaUsedDistinct').toFixed(4),
  usedBound_max: Math.max(0, ...S.map(r => r.isaUsedBound || 0)),
  boundLive_max: Math.max(0, ...S.map(r => r.boundLive || 0)),
  boundDeclared_max: Math.max(0, ...S.map(r => r.boundDeclared || 0))
};

// MINT — is the self-authoring loop producing primitives that get ADOPTED and get DEEPER.
const MINT = {
  atomsAdopted_max: Math.max(0, ...S.map(r => r.atomsAdopted || 0)),
  usesMax_max: Math.max(0, ...S.map(r => r.usesMax || 0)),
  depthMean_early: +wmean(S, 'depthMean', 0, t1).toFixed(2),
  depthMean_late: +wmean(S, 'depthMean', t2, n).toFixed(2),
  depthMean_slopePerSample: +slope(S, 'depthMean').toFixed(4),
  depthMax_max: Math.max(0, ...S.map(r => r.depthMax || 0)),
  composites_max: Math.max(0, ...S.map(r => r.composites || 0))
};

// BEHAVIOUR — the sense->act question, non-biologically: do world-sensing atoms gain call-share?
const BEHAVIOUR = {
  senseAtoms_max: Math.max(0, ...S.map(r => r.senseAtoms || 0)),
  senseUseShare_early: +wmean(S, 'senseUseShare', 0, t1).toFixed(3),
  senseUseShare_late: +wmean(S, 'senseUseShare', t2, n).toFixed(3),
  senseUseShare_slopePerSample: +slope(S, 'senseUseShare').toFixed(5),
  reachFires_total: last.reachFires || 0
};

// MDL — the algorithmic open-endedness signature: is the active codebase ACCRETING irreducible structure?
const mdlStd = stdev(S, 'mdlBytes');
const MDL = {
  bytes_early: +wmean(S, 'mdlBytes', 0, t1).toFixed(1),
  bytes_late: +wmean(S, 'mdlBytes', t2, n).toFixed(1),
  bytes_slopePerSample: +slope(S, 'mdlBytes').toFixed(4),
  bytes_endpointDelta: (last.mdlBytes || 0) - (first.mdlBytes || 0),
  // a real ratchet: total rise over the run exceeds one std of its own wobble (not an oscillation that ended high)
  ratchets: slope(S, 'mdlBytes') * n > mdlStd && mdlStd > 0
};

// Load-bearing signals, each labelled by what it does and does NOT prove.
const signals = {
  mint_active: MINT.atomsAdopted_max > 0,                                   // the author->use loop closed at all
  isa_expanding: ISA.usedDistinct_slopePerSample * n > 1,                   // more of the instruction set coming into use
  authored_opcodes_running: ISA.boundLive_max > 0,                         // atoms promoted to the ISA and actually executed
  mint_deepening: MINT.depthMean_slopePerSample > 0 && MINT.depthMean_late > MINT.depthMean_early, // primitives composing deeper
  senseAct_gaining: BEHAVIOUR.senseUseShare_late > BEHAVIOUR.senseUseShare_early,                  // world-sensing behaviour winning call-share (the core hypothesis)
  mdl_ratchets: MDL.ratchets                                               // irreducible structure accreting (NECESSARY, not sufficient — see notes)
};

console.log(JSON.stringify({
  config: { TICKS, SAMPLE, SEED: process.env.SEED || null, INDEX: process.env.INDEX || 'index.html',
    stack: { ATOM_PIPELINE: process.env.ATOM_PIPELINE ?? '1', ATOM_DURABLE: process.env.ATOM_DURABLE ?? '1', REACH: process.env.REACH ?? '1', RICH_GRAMMAR: process.env.RICH_GRAMMAR ?? '1' } },
  timing_ms: { boot: tBoot - t0, run: tDone - tBoot, perKtick: +(((tDone - tBoot) / TICKS) * 1000).toFixed(1) },
  loopErrors, lastErr, driverErr: globalThis.__driverErr || 0,
  scoreboard: { ISA, MINT, BEHAVIOUR, MDL },
  signals,
  notes: [
    'This scoreboard scores the run as a self-extending VM, not an ecology. No kinds/niches/species.',
    'senseAct_gaining is the core question, stated computationally: do world-sensing atoms win call-share over pure self-scalings?',
    'mdl_ratchets is NECESSARY, not sufficient for open-endedness — neutral drift also adds tokens. Decisive test = is the accreted structure SELECTED (ablation, separate harness).',
    'authored_opcodes_running=false means the mint never became load-bearing at the ISA level, even if atoms were adopted via the population path.',
    'Run CONTINUOUS (single process, no reload) and long (TICKS>=50000) — the author->use->select loop resets on reload.'
  ],
  series: STREAM ? '(streamed as JSONL above)' : S
}, null, 1));
