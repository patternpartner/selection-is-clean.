// Scoreboard for index.html — the machine's-eye view.
//
// The older harnesses score this system by population-diversity surface metrics
// whose vocabulary is borrowed from elsewhere; that framing imports a promise the
// mechanics don't cash and reads progress off noisy, lagging proxies. This harness
// scores the SAME run as what it literally is: a self-extending VM that mints and
// prices its own primitives. Only the machine — programs, opcodes, primitives, bits.
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
// a separate harness). This scoreboard measures the computational signature
// directly, and flags which signals are load-bearing vs cosmetic.
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

// ── Self-extension knobs (the computational stack) ──────────────────────────
// The only levers this scoreboard exposes. Each defaults ON in the engine; set
// =0 to ablate it for an A/B. The substrate carries many other toggles, but they
// are irrelevant to what this instrument measures, so they're intentionally not
// wired here — an unset engine toggle just runs its stock default.
//   ATOM_PIPELINE  author a new primitive, bind it, and wire a call-site (the mint)
//   ATOM_DURABLE   keep authored call-sites across program adoption + reload
//   REACH          let an authored primitive's output drive an actuator (sense->act)
//   RICH_GRAMMAR   give the authoring grammar world-reading + selection/compose ops
for (const k of ['ATOM_PIPELINE', 'ATOM_DURABLE', 'REACH', 'RICH_GRAMMAR'])
  if (process.env[k] !== undefined) globalThis['__' + k] = parseInt(process.env[k], 10);

const html = fs.readFileSync(process.env.INDEX || (__dirname + '/index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

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
    'This scoreboard scores the run as a self-extending VM: programs, opcodes, authored primitives, bits.',
    'senseAct_gaining is the core question, stated computationally: do world-sensing atoms win call-share over pure self-scalings?',
    'mdl_ratchets is NECESSARY, not sufficient for open-endedness — neutral drift also adds tokens. Decisive test = is the accreted structure SELECTED (ablation, separate harness).',
    'authored_opcodes_running=false means the mint never became load-bearing at the ISA level, even if atoms were adopted via the population path.',
    'Run CONTINUOUS (single process, no reload) and long (TICKS>=50000) — the author->use->select loop resets on reload.'
  ],
  series: STREAM ? '(streamed as JSONL above)' : S
}, null, 1));
