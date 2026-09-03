// sim.worker.js — runs the EXISTING simulation (engine.html's script) on a background thread.
//
// Why this exists: the simulation is single-threaded and, as the creature grows richer
// (deep atoms, DIMS=32, a coherent cosmos of 6 daughter-worlds), a single tick got heavy
// enough to block the main thread on a phone -> "Chrome isn't responding". A Web Worker
// runs the sim off the main thread: it can take as long as it likes per tick and the PAGE
// never freezes. The simulation math is byte-for-byte the current code — we do not fork it,
// we fetch engine.html, pull out its <script>, and run it here under a small DOM/canvas shim
// (the same idea harness.js uses to run it headless).
//
// Provenance: the move to a worker was predicted several iterations ago as the eventual
// architecture once the organism outgrew single-threaded phone execution. This is that step.
//
// ═══ #162 — ONE WORKER, SEVERAL UNIVERSES ═══════════════════════════════════════════════════
// This file used to be one worker, one universe, and everything in it was a module-level
// singleton: one `offscreen`, one `lsStore`, one `self.document`, one `self.__api`. Nine
// universes therefore meant nine workers, and nine workers means nine V8 ISOLATES.
//
// That turned out to be the whole of the field's memory problem. Measured (OEE-NOTES, "where the
// field's memory actually goes"): nine copies of the 1.77 MB engine source cost 316 MB; compiling
// them added 31 MB; booting them added 12 MB; RUNNING them added 1,077 MB. The memory was never
// the code and never the data — it is per-isolate heap slack, headroom V8 grants each isolate
// because each allocates hard every tick. Nine universes packed into three workers ran the same
// simulation for 815 MB instead of 1,309, with slightly MORE throughput and more particles alive.
// A control (three shells, nine isolates: 1,381 MB) confirms it is the isolates, not the frames.
//
// So a worker now hosts one universe PER CONNECTION. Every shell (universe.html) opens its own
// port; several shells may land on the same worker. The message protocol is unchanged — a port
// behaves exactly like the old dedicated worker did — and the dedicated-worker path is still here
// verbatim for browsers without SharedWorker.
//
// What made this cheap is that engine.html was ALREADY re-entrant, by construction rather than by
// design: the boot is `new Function(src)()`, and a second call builds a second scope with its own
// `genome`, its own typed arrays and its own loop. The only thing standing between one call and
// two was that the shim lived on the global. So the shim moved off the global: each universe's
// document/localStorage/location/window are passed to the engine AS FUNCTION PARAMETERS, which
// shadow the globals inside the engine's own scope. No `with`, no source rewriting, no
// per-instance name mangling — just arguments, and V8 optimises them like any other local.

'use strict';

// ── the engine source, fetched ONCE per worker ──────────────────────────────────────────────
// Not once per universe: three universes in a worker would otherwise hold three copies of the
// same 1.77 MB string, which is exactly the kind of per-instance cost this change exists to
// remove. Keyed by URL and shared by every universe in this isolate. The promise is cached (not
// the text) so concurrent boots wait on one fetch rather than racing three.
const __engineSource = new Map();
function engineSource(url) {
  const key = url || 'engine.html';
  let p = __engineSource.get(key);
  if (!p) {
    p = fetch(key, { cache: 'no-store' }).then(r => r.text()).then(html => {
      const m = html.match(/<script>([\s\S]*)<\/script>/);
      if (!m) throw new Error('could not find <script> block in engine.html');
      return m[1];
    });
    __engineSource.set(key, p);
  }
  return p;
}

// The bridge appended to the engine's source. It runs INSIDE the engine's own function scope, so
// it can reach genome/tick/encodeGenome — `const` and `function` there do not leak otherwise.
// It hangs its API on `__inst`, the per-universe object passed in as the last parameter, so two
// universes in one isolate cannot overwrite each other's (this was `self.__api`, a global, and a
// global is exactly what a second universe in the same isolate breaks).
const BRIDGE =
  '\n;try{__inst.api={};' +
  '__inst.api.exportFile=function(){try{return {data:JSON.stringify({type:"selection-genome",version:2,exportedAt:new Date().toISOString(),genome:encodeGenome()},null,2),filename:"selection_gen"+genome.generation+"_t"+genome.totalTicks+".json"};}catch(e){return null;}};' +
  '__inst.api.importFile=function(txt){try{if(decodeGenome(txt)){N=0;var n=Math.min(300,(W*H/3000)|0);for(var i=0;i<n;i++)addParticle(Math.random()*W,Math.random()*H,randomTendency(),false);saveGenome();return true;}}catch(e){}return false;};' +
  // #153 — THE RELAY. Two calls, both of which the sim already makes to itself on the wire.
  // pullMigrant builds the SAME packet networkBroadcast would have sent (buildMigrantPacket,
  // one source of truth) and stamps the SAME envelope (netPacket: real TAB_ID, real tick), but
  // hands it back instead of broadcasting it. feedPacket puts a packet through the sim's own
  // handleNetworkMessage — the same door every BroadcastChannel message comes through, so
  // validNetworkPayload, the queue limits, the peer bookkeeping and the tab===TAB_ID self-drop
  // all still apply. Nothing here can inject anything a peer could not have sent, because the
  // packet WAS built by a peer. The field uses these to point one universe's emigrants at one
  // recipient rather than at everybody.
  // #158: THE RELAY IS A ROUTER, NOT A SOURCE. #153's own comment said "all the field changes
  // is WHO HEARS IT" — and then skipped the gate that decides whether anything is said at all.
  // networkBroadcast emits only when Math.random() < genome.netMigrantRate. This pulled
  // unconditionally, once per second, so a universe that had evolved its rate to ZERO OR BELOW
  // was still being milked. Measured on the device: u4 had netMigrantRate -0.03363, meaning it
  // had stopped broadcasting entirely, and the relay kept taking a migrant out of it every
  // second and feeding it to the collective, which feeds material back to the others.
  // That is this code overriding a decision selection made — against the one standing rule this
  // project has ("the system needs to decide to turn them off, not me", #148) — and a plausible
  // route for one universe's collapse to circulate through the field.
  // Same coin, same gene. A silent universe now contributes nothing, which is what silence means.
  // The rate is PER TICK; the relay asks once per second. Gating naively on the same number
  // would make the relay fire 20-60x rarer than the universe's own broadcasting, which is a
  // throttle, not a translation. So ask the real question: "would you have broadcast at least
  // once since I last asked?" — one roll per elapsed tick, i.e. 1-(1-r)^dt. A rate at or below
  // zero gives zero however long the gap, which is the whole point.
  '__inst.lastPull=0;' +
  '__inst.api.pullMigrant=function(){try{' +
    'var r=+genome.netMigrantRate; if(!(r>0)){__inst.lastPull=tick;return null;}' +
    'var dt=tick-__inst.lastPull; __inst.lastPull=tick;' +
    'if(dt<1)dt=1; if(dt>600)dt=600;' +
    'if(!(Math.random()<1-Math.pow(1-Math.min(1,r),dt)))return null;' +
    'var d=buildMigrantPacket();return d?netPacket("migrant",d):null;}catch(e){return null;}};' +
  '__inst.api.census=function(){var o={};try{' +
    'o.N=N;o.CAP=CAP;' +
    'var pg=0,pa=0,pl=0,pp=0;' +
    'for(var i=0;i<CAP;i++){var g=pGenome[i];if(!g)continue;pg++;' +
      'if(g.userAtoms)pa+=g.userAtoms.length;' +
      'if(g.opStacks){for(var k in g.opStacks)pl+=g.opStacks[k].length;}' +
      'if(g.boundOpcodes)pp+=g.boundOpcodes.length;}' +
    'o.pGenomes=pg;o.pAtomsTotal=pa;o.pChainLinks=pl;o.pBoundSlots=pp;' +
    'o.germAtoms=(genome.userAtoms||[]).length;' +
    'o.archive=(typeof genomeArchive!=="undefined"&&genomeArchive)?genomeArchive.length:-1;' +
    'o.eventLog=(genome.eventLog||[]).length;o.epochs=(genome.epochs||[]).length;' +
    'o.oeeSeen=(typeof __oeeSeen!=="undefined"&&__oeeSeen)?__oeeSeen.size:-1;' +
    'o.oeeLast=(typeof __oeeLastUses!=="undefined"&&__oeeLastUses)?__oeeLastUses.size:-1;' +
    'o.uaCode=(typeof __uaCode!=="undefined")?__uaCode.size:-1;' +
    'o.exprUses=(typeof __atomExprUses!=="undefined")?__atomExprUses.size:-1;' +
    'o.exprContrib=(typeof __atomExprContrib!=="undefined")?__atomExprContrib.size:-1;' +
    'o.exprCredit=(typeof __atomExprCredit!=="undefined")?__atomExprCredit.size:-1;' +
    'o.clusters=(typeof clusters!=="undefined"&&clusters)?clusters.length:-1;' +
    'o.peers=(typeof peerLastSeen!=="undefined")?Object.keys(peerLastSeen).length:-1;' +
    'o.ticks=genome.totalTicks|0;' +
  '}catch(e){o.err=String(e&&e.message);}return o;};' +
  '__inst.api.setGene=function(k,v){try{if(typeof genome[k]!=="number"||typeof v!=="number")return false;genome[k]=v;return true;}catch(e){return false;}};' +
  // #164: set this universe's PACE live, without touching its hash. The hash route would work — the
  // engine re-reads pace on hashchange — but the hash is the CREATURE's (#cleanart, #turbo, and
  // whatever saveGenome has overwritten it with by the first autosave), and the field has no
  // business rewriting it to say something about the viewer. PACE is a plain `let` in the engine's
  // scope and the bridge runs in that scope, so this assigns the real one.
  '__inst.api.setPace=function(ms){try{var v=+ms;if(!isFinite(v))return false;PACE=Math.max(0,Math.min(5000,v|0));return true;}catch(e){return false;}};' +
  '__inst.api.feedPacket=function(p){try{handleNetworkMessage(p);return true;}catch(e){return false;}};' +
  // A few numbers off the sim's own counters. The field is nine worlds behind worker
  // boundaries; without this the only way to know whether a relayed migrant LANDED was to
  // believe the relay's own bookkeeping, which counts sends, not arrivals. netStats and
  // __liveness are written by the engine on the receive side, so they are arrivals.
  '__inst.api.stat=function(){try{return {tick:tick,N:N,gen:genome.generation,totalTicks:genome.totalTicks|0,' +
    'peers:(typeof countPeers==="function"?countPeers():-1),' +
    'recv:netStats.received,accepted:netStats.accepted,bad:netStats.bad,dropped:netStats.dropped,' +
    // #163: heritable packets refused because the sender's clock had run far ahead of ours. A
    // universe running at parity never sees this move; a paced one is meant to.
    'paced:(netStats.paced|0),' +
    // #167: report the universe's OWN pace and darkness, so the field can assert what it asked for
    // rather than infer it from a tick rate. A rate is noisy; a flag is not.
    'pace:(typeof PACE!=="undefined"?PACE|0:0),dark:(typeof DARK!=="undefined"?!!DARK:false),' +
    'migrantAccepted:(typeof __liveness!=="undefined"?(__liveness["network.migrantAccepted"]|0):-1),' +
    'atoms:(genome.userAtoms||[]).length,' +
    // #157: the field needs to see a universe that is silently failing. The HUD is hidden in a
    // field by design, so this is the only channel that can carry it out.
    'errs:(typeof __loopErrors!=="undefined"?__loopErrors|0:0),' +
    'errMsg:(typeof __loopErrLast!=="undefined"?String(__loopErrLast||""):""),' +
    // A fingerprint of THIS universe's germline. Three continuously-drifting float genes; two
    // universes that share a genome share this string exactly, and two that merely resemble
    // each other do not. It is what tells "the collective fed them" apart from "the collective
    // overwrote them".
    'fp:[genome.mutationRate,genome.netMigrantRate,genome.netPlasmidRate].map(function(v){return (+v||0).toPrecision(12);}).join("/")' +
    '};}catch(e){return null;}};' +
  '}catch(_){}';

// The names the engine's own scope will see. Order must match the argument list in boot().
// These SHADOW the worker globals for the length of the engine's function body, which is what
// gives each universe in a shared isolate its own DOM. Verified against engine.html: none of
// these is also declared at the engine's top level (that would be a redeclaration SyntaxError),
// and the engine reads no bare global dimension any more (#162 rewired resize()).
const ENGINE_PARAMS = ['window', 'document', 'localStorage', 'location', 'history',
                       'requestAnimationFrame', 'cancelAnimationFrame',
                       'addEventListener', 'removeEventListener', '__inst'];

// ── ONE UNIVERSE ────────────────────────────────────────────────────────────────────────────
// Everything that used to be a module-level singleton lives here instead, one per connection.
function Universe(post) {
  this.post = post;
  this.started = false;
  this.canvas = null;
  this.api = null;
  // #150: LISTS, not single slots. This was `handlers[ev] = fn`, so every addEventListener for an
  // event name SILENTLY REPLACED the one before it and only the last registration survived.
  // engine.html registers FOUR hashchange listeners (the clean-art latch, the turbo reader, the
  // metabolism panel and the diary) and two click listeners, so in worker mode three of the four
  // were simply gone — which is why turning a universe's HUD back on did nothing: the latch's
  // listener had been overwritten by the diary's. A shim that quietly drops listeners is worse
  // than one that has none, because everything still appears to register.
  this.handlers = { window: {}, document: {} };
  this.lsStore = Object.create(null);
  this.env = null;
}

function addHandler(bag, ev, fn) { (bag[ev] || (bag[ev] = [])).push(fn); }
function removeHandler(bag, ev, fn) {
  const a = bag[ev]; if (!a) return;
  if (!fn) { delete bag[ev]; return; }
  const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
}

// dispatch a synthetic input event to whichever handler the sim registered — it may have used
// document.addEventListener OR window.addEventListener for a given event, so try both.
Universe.prototype.dispatchInput = function (ev, detail) {
  const e = Object.assign({ preventDefault() {}, stopPropagation() {}, target: this.canvas }, detail);
  const seen = [];
  const run = (list) => { if (!list) return;
    for (const fn of list.slice()) {           // slice: a handler may register or remove another
      if (seen.indexOf(fn) >= 0) continue;     // the same function on both window and document fires once
      seen.push(fn);
      try { fn(e); } catch (_) {}
    } };
  run(this.handlers.document[ev]);
  run(this.handlers.window[ev]);
};

// ── the shim: everything the sim script touches at load/run time that a worker lacks ──
// Built per universe and handed to the engine as arguments rather than installed on the global.
Universe.prototype.buildEnv = function (initHash, dpr) {
  const inst = this;
  const off = this.canvas;

  // The display canvas element ('c'). OffscreenCanvas already supports getContext('2d'),
  // width/height. We patch on the few DOM-ish methods the sim expects on a canvas element.
  off.addEventListener = () => {};
  off.removeEventListener = () => {};
  off.style = {};
  off.getBoundingClientRect = () => ({ left: 0, top: 0, right: off.width, bottom: off.height, width: off.width, height: off.height });

  // A generic stub element for the handful of non-canvas DOM ids the sim reads
  // ('gen' status, save/load buttons, a <style>). These are UI chrome; on the worker
  // path the main thread owns them, so here they are inert (but must not throw).
  function stubEl(id) {
    const el = {
      id, _text: '', style: {},
      addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
      setAttribute() {}, click() {}, remove() {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      get textContent() { return this._text; },
      // 'gen' is the status line ("booting…", stats). Forward it to the page.
      set textContent(v) { this._text = v; if (id === 'gen') { try { inst.post({ type: 'status', text: String(v) }); } catch (_) {} } },
      get value() { return ''; }, set value(_) {},
      get files() { return []; },
    };
    return el;
  }
  const els = { c: off };

  const addEventListener = (ev, fn) => { addHandler(inst.handlers.window, ev, fn); };
  const removeEventListener = (ev, fn) => { removeHandler(inst.handlers.window, ev, fn); };

  const documentShim = {
    getElementById(id) { return els[id] || (els[id] = (id === 'c' ? off : stubEl(id))); },
    createElement() { return stubEl('_created'); },
    querySelector() { return null },
    addEventListener(ev, fn) { addHandler(inst.handlers.document, ev, fn); },
    removeEventListener(ev, fn) { removeHandler(inst.handlers.document, ev, fn); },
    head: stubEl('head'), body: stubEl('body'),
    get hidden() { return false; },     // worker never "hidden"; main drives visibility if needed
  };

  // localStorage shim. getItem is synchronous and the boot reads the saved genome immediately,
  // so the store is PRE-POPULATED from the main thread before the sim code runs (see onInit).
  // Writes are forwarded to the shell that owns this universe, which owns the real localStorage.
  const localStorageShim = {
    getItem(k) { return k in inst.lsStore ? inst.lsStore[k] : null; },
    setItem(k, v) { inst.lsStore[k] = String(v); try { inst.post({ type: 'persist', key: k, value: String(v) }); } catch (_) {} },
    removeItem(k) { delete inst.lsStore[k]; try { inst.post({ type: 'persist', key: k, value: null }); } catch (_) {} },
  };

  // location.hash carries options (e.g. #turbo=N). Mirror the shell's hash. A plain mutable
  // object now: #150 needed Object.defineProperty because location was on the global and globals
  // are not writable; a per-universe object just takes an assignment, and two universes in one
  // isolate can hold DIFFERENT hashes, which the global version could not express at all.
  const locationShim = { hash: initHash || '', pathname: '/', search: '', href: 'about:worker' };

  // history is absent in workers; the sim calls history.replaceState at boot. No-op it.
  const historyShim = { replaceState() {}, pushState() {} };

  // innerWidth/innerHeight are GETTERS off this universe's own canvas, so a resize can never
  // leave them stale and two universes never share a size.
  const windowShim = {
    addEventListener, removeEventListener,
    get innerWidth() { return off.width; },
    get innerHeight() { return off.height; },
    devicePixelRatio: dpr || 1,
    document: documentShim, localStorage: localStorageShim,
    location: locationShim, history: historyShim,
  };

  // rAF is absent in workers. Self-schedule as fast as the worker can while yielding to the
  // message queue between ticks (so input/persistence messages get processed). The sim runs
  // as fast as the device allows; the MAIN thread stays free regardless. With several universes
  // in one worker they interleave through this same queue — measured at slightly BETTER total
  // throughput than the same universes on separate workers, because nine workers on four cores
  // were oversubscribed.
  const raf = (fn) => setTimeout(fn, 0);
  const caf = (id) => clearTimeout(id);

  // performance, navigator, BroadcastChannel, fetch, IndexedDB all exist natively in workers, and
  // BroadcastChannel is deliberately NOT shimmed per universe: the network is meant to be shared.
  this.env = { window: windowShim, document: documentShim, localStorage: localStorageShim,
               location: locationShim, history: historyShim, raf, caf,
               addEventListener, removeEventListener };
  return this.env;
};

Universe.prototype.boot = async function (d) {
  if (this.started) return;
  this.started = true;
  this.canvas = d.canvas;
  // pre-load the saved genome so the sim's synchronous boot read finds it
  if (d.genome) this.lsStore['selection_genome'] = d.genome;
  const env = this.buildEnv(d.hash, d.dpr);
  try {
    const src = await engineSource(d.src);
    // Run the sim in a fresh function scope with this universe's shims as its arguments.
    const fn = new Function(...ENGINE_PARAMS, src + BRIDGE);
    fn(env.window, env.document, env.localStorage, env.location, env.history,
       env.raf, env.caf, env.addEventListener, env.removeEventListener, this);
    this.post({ type: 'ready' });
  } catch (err) {
    this.post({ type: 'error', message: 'sim load failed: ' + (err && err.message), stack: err && err.stack ? String(err.stack).slice(0, 800) : '' });
  }
};

Universe.prototype.handle = function (d) {
  const inst = this;
  const api = () => inst.api;

  if (d.type === 'init') { this.boot(d); return; }

  if (d.type === 'resize') {
    if (this.canvas) { this.canvas.width = d.w; this.canvas.height = d.h; }
    this.dispatchInput('resize', {});
    return;
  }

  if (d.type === 'input') { this.dispatchInput(d.event, d.detail || {}); return; }

  // #150 — A LIVE HASH. The hash was sent once at init and never again, so anything the engine
  // gates on it (#cleanart, #turbo) was frozen at whatever the frame loaded with. The field needs
  // to turn a universe's instruments on and off while it runs, without a reload — a reload would
  // drop the lineage back to the shared localStorage slot, which is a DIFFERENT universe's genome.
  // Set this universe's own location.hash and then fire the engine's own captured hashchange
  // listener, so __cleanArt() and __readTurbo() re-read normally.
  if (d.type === 'hash') {
    if (this.env) this.env.location.hash = d.hash || '';
    this.dispatchInput('hashchange', {});
    return;
  }

  if (d.type === 'export') {
    let file = null; try { file = api() && api().exportFile ? api().exportFile() : null; } catch (_) {}
    this.post({ type: 'export', rid: d.rid, file });
    return;
  }

  if (d.type === 'import') {
    let ok = false; try { if (api() && api().importFile) ok = api().importFile(d.data); } catch (_) {}
    this.post({ type: 'import-result', rid: d.rid, ok });
    return;
  }

  // #153 — the collective relay. `pull` is a request/reply and carries the caller's rid back so a
  // reply can never be matched to the wrong ask; `feed` is fire-and-forget (a migrant that doesn't
  // arrive is a migrant that didn't arrive — the wire drops them too).
  if (d.type === 'pull') {
    let packet = null; try { packet = api() && api().pullMigrant ? api().pullMigrant() : null; } catch (_) {}
    this.post({ type: 'pulled', rid: d.rid, packet });
    return;
  }

  // #164 — THE FIELD ALLOCATES ITS OWN BUDGET. Fire and forget, like `feed`: a pace that does not
  // arrive is a universe still running at the speed it had, which is the safe direction to fail in.
  if (d.type === 'pace') {
    try { if (api() && api().setPace) api().setPace(d.ms); } catch (_) {}
    return;
  }

  if (d.type === 'feed') {
    try { if (api() && api().feedPacket) api().feedPacket(d.packet); } catch (_) {}
    return;
  }

  // #158: set one numeric gene, so a rig can DRIVE the silence case instead of waiting ~100,000
  // ticks for a universe to evolve into it (#143: rarity is not safety). Numeric scalars only.
  if (d.type === 'setgene') {
    let ok = false;
    try { if (api() && api().setGene) ok = api().setGene(d.gene, d.value); } catch (_) {}
    this.post({ type: 'setgene-result', rid: d.rid, ok });
    return;
  }

  // Diagnostic: this worker's own memory. There is no way to read a worker's isolate from the page,
  // and the field's memory had been hypothesised about repeatedly and measured never.
  // performance.memory is NOT available in a Worker — it is a Chrome main-thread-only extension, and
  // the first version of this hook used it and silently returned null for every universe. The
  // standard API that DOES work here is measureUserAgentSpecificMemory(), which is async and needs a
  // secure context; it reports the whole isolate including detached objects. Note that with #162 an
  // isolate may now hold SEVERAL universes, so this is a per-WORKER number, not a per-universe one.
  if (d.type === 'heap') {
    const reply = (h, how) => { try { inst.post({ type:'heap-result', rid:d.rid, heap:h, how }); }catch(_){} };
    try {
      if (typeof performance !== 'undefined' && performance.measureUserAgentSpecificMemory) {
        performance.measureUserAgentSpecificMemory()
          .then(r => reply({ bytes:r.bytes, mb:Math.round(r.bytes/1048576) }, 'measureUserAgentSpecificMemory'))
          .catch(e => reply(null, 'measure failed: '+((e&&e.message)||e)));
        return;
      }
    } catch (_) {}
    reply(null, 'no worker-visible memory API');
    return;
  }

  // Diagnostic: force a collection in THIS worker's isolate, when the browser was launched with
  // --js-flags=--expose-gc. The question it answers cannot be answered any other way: is the field's
  // memory LIVE DATA or UNCOLLECTED GARBAGE? Measure RSS, collect everywhere, measure again. It
  // held, which is what pointed at heap slack rather than at anything the simulation owns.
  if (d.type === 'gc') {
    let ran = false;
    try { if (typeof gc === 'function') { gc(); ran = true; } } catch (_) {}
    this.post({ type: 'gc-result', rid: d.rid, ran });
    return;
  }

  // Diagnostic: COUNT THE LIVE STRUCTURES. Forced collection freed nothing, so the question was
  // which live objects were growing — and four hypotheses about that had already been wrong. The
  // counts came back tiny, which is half of how #162 was found.
  if (d.type === 'census') {
    let c = null;
    try { c = api() && api().census ? api().census() : null; } catch (e) { c = { err:String(e&&e.message) }; }
    this.post({ type: 'census-result', rid: d.rid, census: c });
    return;
  }

  if (d.type === 'stat') {
    let stat = null; try { stat = api() && api().stat ? api().stat() : null; } catch (_) {}
    this.post({ type: 'stat', rid: d.rid, stat });
    return;
  }
};

// ── CONNECTIONS ─────────────────────────────────────────────────────────────────────────────
// A SharedWorker gets one `connect` event per shell and hosts one universe per port. A dedicated
// Worker has exactly one implicit connection, and is what a browser without SharedWorker falls
// back to — that path is byte-for-byte the old behaviour: one worker, one universe.
const __universes = [];

function attach(post) {
  const u = new Universe(post);
  __universes.push(u);
  return u;
}

// Surface any error as text, so a phone user sees a message instead of a silent black screen.
// An isolate-level error cannot be attributed to one universe, so every shell on this worker
// hears it; a shell that is fine will simply show a message about a sibling, which is far better
// than the one that broke going dark with no explanation.
self.onerror = (msg, src, line, col, err) => {
  const m = { type: 'error', message: String(msg), line, stack: err && err.stack ? String(err.stack).slice(0, 800) : '' };
  for (const u of __universes) { try { u.post(m); } catch (_) {} }
  return false;
};

if (typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope) {
  self.onconnect = (e) => {
    const port = e.ports[0];
    const u = attach((m) => port.postMessage(m));
    port.onmessage = (ev) => { try { u.handle(ev.data || {}); } catch (err) {
      try { port.postMessage({ type: 'error', message: 'worker: ' + (err && err.message) }); } catch (_) {} } };
    port.start();
  };
} else {
  const u = attach((m) => self.postMessage(m));
  self.addEventListener('message', (e) => { u.handle(e.data || {}); });
}
