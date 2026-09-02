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

'use strict';

// Surface any error to the main thread as text, so a phone user sees a message instead of
// a silent black screen.
self.onerror = (msg, src, line, col, err) => {
  try { self.postMessage({ type: 'error', message: String(msg), line, stack: err && err.stack ? String(err.stack).slice(0, 800) : '' }); } catch (_) {}
  return false;
};

let offscreen = null;      // the OffscreenCanvas transferred from the main thread
let started = false;
// #150: LISTS, not single slots. This was `handlers[ev] = fn`, so every addEventListener for an event
// name SILENTLY REPLACED the one before it and only the last registration survived. engine.html
// registers FOUR hashchange listeners (the clean-art latch, the turbo reader, the metabolism panel
// and the diary) and two click listeners, so in worker mode three of the four were simply gone —
// which is why turning a universe's HUD back on did nothing: the latch's listener had been
// overwritten by the diary's. A shim that quietly drops listeners is worse than one that has none,
// because everything still appears to register.
const inputHandlers = { window: {}, document: {} }; // captured addEventListener callbacks, by event name
function addHandler(bag, ev, fn) { (bag[ev] || (bag[ev] = [])).push(fn); }
function removeHandler(bag, ev, fn) {
  const a = bag[ev]; if (!a) return;
  if (!fn) { delete bag[ev]; return; }
  const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
}
const lsStore = Object.create(null);                // localStorage shim backing store

// ── the shim: everything the sim script touches at load/run time that a worker lacks ──
function installShim(initHash, dpr) {
  const off = offscreen;

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
      set textContent(v) { this._text = v; if (id === 'gen') { try { self.postMessage({ type: 'status', text: String(v) }); } catch (_) {} } },
      get value() { return ''; }, set value(_) {},
      get files() { return []; },
    };
    return el;
  }
  const els = { c: off };

  self.document = {
    getElementById(id) { return els[id] || (els[id] = (id === 'c' ? off : stubEl(id))); },
    createElement() { return stubEl('_created'); },
    querySelector() { return null },
    addEventListener(ev, fn) { addHandler(inputHandlers.document, ev, fn); },
    removeEventListener(ev, fn) { removeHandler(inputHandlers.document, ev, fn); },
    head: stubEl('head'), body: stubEl('body'),
    get hidden() { return false; },     // worker never "hidden"; main drives visibility if needed
  };

  self.window = self;
  self.innerWidth = off.width;
  self.innerHeight = off.height;
  self.devicePixelRatio = dpr || 1;
  self.addEventListener__real = self.addEventListener.bind(self);
  // The sim calls window.addEventListener for input/lifecycle; capture those too.
  self.addEventListener = (ev, fn) => {
    if (ev === 'message') { self.addEventListener__real(ev, fn); return; } // keep the real message pump
    addHandler(inputHandlers.window, ev, fn);
  };
  self.removeEventListener = (ev, fn) => { removeHandler(inputHandlers.window, ev, fn); };

  // rAF is absent in workers. Self-schedule as fast as the worker can while yielding to the
  // message queue between ticks (so input/persistence messages get processed). The sim runs
  // as fast as the device allows; the MAIN thread stays free regardless.
  self.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  self.cancelAnimationFrame = (id) => clearTimeout(id);

  // localStorage shim. getItem is synchronous and the boot reads the saved genome immediately,
  // so the store is PRE-POPULATED from the main thread before the sim code runs (see onmessage).
  // Writes are forwarded to the main thread, which owns the real localStorage.
  self.localStorage = {
    getItem(k) { return k in lsStore ? lsStore[k] : null; },
    setItem(k, v) { lsStore[k] = String(v); try { self.postMessage({ type: 'persist', key: k, value: String(v) }); } catch (_) {} },
    removeItem(k) { delete lsStore[k]; try { self.postMessage({ type: 'persist', key: k, value: null }); } catch (_) {} },
  };

  // location.hash carries options (e.g. #turbo=N). Mirror the page's hash.
  try { Object.defineProperty(self, 'location', { value: { hash: initHash || '', pathname: '/', search: '', href: 'about:worker' }, configurable: true }); } catch (_) {}

  // history is absent in workers; the sim calls history.replaceState at boot. No-op it.
  self.history = { replaceState() {}, pushState() {} };

  // performance, navigator, BroadcastChannel, fetch, IndexedDB all exist natively in workers.
}

// dispatch a synthetic input event to whichever handler the sim registered — it may have used
// document.addEventListener OR window.addEventListener for a given event, so try both.
function dispatchInput(ev, detail) {
  const e = Object.assign({ preventDefault() {}, stopPropagation() {}, target: offscreen }, detail);
  const seen = [];
  const run = (list) => { if (!list) return;
    for (const fn of list.slice()) {           // slice: a handler may register or remove another
      if (seen.indexOf(fn) >= 0) continue;     // the same function on both window and document fires once
      seen.push(fn);
      try { fn(e); } catch (_) {}
    } };
  run(inputHandlers.document[ev]);
  run(inputHandlers.window[ev]);
}

self.addEventListener('message', async (e) => {
  const d = e.data || {};

  if (d.type === 'init') {
    if (started) return;
    started = true;
    offscreen = d.canvas;
    // pre-load the saved genome so the sim's synchronous boot read finds it
    if (d.genome) lsStore['selection_genome'] = d.genome;
    installShim(d.hash, d.dpr);
    try {
      const html = await (await fetch(d.src || 'engine.html', { cache: 'no-store' })).text();
      const m = html.match(/<script>([\s\S]*)<\/script>/);
      if (!m) throw new Error('could not find <script> block in engine.html');
      // Append a tiny bridge so the message handler can reach the sim's genome codecs and
      // export/import logic, which live in the sim script's own scope (const/function there
      // don't leak otherwise). exportFile/importFile mirror engine.html's own functions exactly,
      // minus the DOM download/FileReader (those live on the main thread on this path).
      const bridge = '\n;try{self.__api={};' +
        'self.__api.exportFile=function(){try{return {data:JSON.stringify({type:"selection-genome",version:2,exportedAt:new Date().toISOString(),genome:encodeGenome()},null,2),filename:"selection_gen"+genome.generation+"_t"+genome.totalTicks+".json"};}catch(e){return null;}};' +
        'self.__api.importFile=function(txt){try{if(decodeGenome(txt)){N=0;var n=Math.min(300,(W*H/3000)|0);for(var i=0;i<n;i++)addParticle(Math.random()*W,Math.random()*H,randomTendency(),false);saveGenome();return true;}}catch(e){}return false;};' +
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
        'self.__lastPull=0;' +
        'self.__api.pullMigrant=function(){try{' +
          'var r=+genome.netMigrantRate; if(!(r>0)){self.__lastPull=tick;return null;}' +
          'var dt=tick-self.__lastPull; self.__lastPull=tick;' +
          'if(dt<1)dt=1; if(dt>600)dt=600;' +
          'if(!(Math.random()<1-Math.pow(1-Math.min(1,r),dt)))return null;' +
          'var d=buildMigrantPacket();return d?netPacket("migrant",d):null;}catch(e){return null;}};' +
        'self.__api.setGene=function(k,v){try{if(typeof genome[k]!=="number"||typeof v!=="number")return false;genome[k]=v;return true;}catch(e){return false;}};' +
        'self.__api.feedPacket=function(p){try{handleNetworkMessage(p);return true;}catch(e){return false;}};' +
        // A few numbers off the sim's own counters. The field is nine worlds behind nine worker
        // boundaries; without this the only way to know whether a relayed migrant LANDED was to
        // believe the relay's own bookkeeping, which counts sends, not arrivals. netStats and
        // __liveness are written by the engine on the receive side, so they are arrivals.
        'self.__api.stat=function(){try{return {tick:tick,N:N,gen:genome.generation,totalTicks:genome.totalTicks|0,' +
          'peers:(typeof countPeers==="function"?countPeers():-1),' +
          'recv:netStats.received,accepted:netStats.accepted,bad:netStats.bad,dropped:netStats.dropped,' +
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
      // Run the sim in a fresh function scope with the shimmed globals in place.
      (new Function(m[1] + bridge))();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: 'sim load failed: ' + (err && err.message), stack: err && err.stack ? String(err.stack).slice(0, 800) : '' });
    }
    return;
  }

  if (d.type === 'resize') {
    if (offscreen) { offscreen.width = d.w; offscreen.height = d.h; }
    self.innerWidth = d.w; self.innerHeight = d.h;
    dispatchInput('resize', {});
    return;
  }

  if (d.type === 'input') { dispatchInput(d.event, d.detail || {}); return; }

  // #150 — A LIVE HASH. The hash was sent once at init and never again, so anything the engine gates
  // on it (#cleanart, #turbo) was frozen at whatever the frame loaded with. The field needs to turn a
  // universe's instruments on and off while it runs, without a reload — a reload would drop the
  // lineage back to the shared localStorage slot, which is a DIFFERENT universe's genome.
  // Redefine location (the init shim declares it configurable for exactly this) and then fire the
  // engine's own captured hashchange listener, so __cleanArt() and __readTurbo() re-read normally.
  if (d.type === 'hash') {
    try { Object.defineProperty(self, 'location',
      { value: { hash: d.hash || '', pathname: '/', search: '', href: 'about:worker' }, configurable: true }); } catch (_) {}
    dispatchInput('hashchange', {});
    return;
  }

  if (d.type === 'export') {
    let file = null; try { file = self.__api && self.__api.exportFile ? self.__api.exportFile() : null; } catch (_) {}
    self.postMessage({ type: 'export', rid: d.rid, file });
    return;
  }

  if (d.type === 'import') {
    let ok = false; try { if (self.__api && self.__api.importFile) ok = self.__api.importFile(d.data); } catch (_) {}
    self.postMessage({ type: 'import-result', rid: d.rid, ok });
    return;
  }

  // #153 — the collective relay. `pull` is a request/reply and carries the caller's rid back so a
  // reply can never be matched to the wrong ask; `feed` is fire-and-forget (a migrant that doesn't
  // arrive is a migrant that didn't arrive — the wire drops them too).
  if (d.type === 'pull') {
    let packet = null; try { packet = self.__api && self.__api.pullMigrant ? self.__api.pullMigrant() : null; } catch (_) {}
    self.postMessage({ type: 'pulled', rid: d.rid, packet });
    return;
  }

  if (d.type === 'feed') {
    try { if (self.__api && self.__api.feedPacket) self.__api.feedPacket(d.packet); } catch (_) {}
    return;
  }

  // #158: set one numeric gene, so a rig can DRIVE the silence case instead of waiting ~100,000
  // ticks for a universe to evolve into it (#143: rarity is not safety). Numeric scalars only.
  if (d.type === 'setgene') {
    let ok=false;
    try { if (self.__api && self.__api.setGene) ok = self.__api.setGene(d.gene, d.value); } catch (_) {}
    self.postMessage({ type: 'setgene-result', rid: d.rid, ok });
    return;
  }

  // Diagnostic: this worker's own memory. There is no way to read a worker's isolate from the page,
  // and the field's memory had been hypothesised about repeatedly and measured never.
  // performance.memory is NOT available in a Worker — it is a Chrome main-thread-only extension, and
  // the first version of this hook used it and silently returned null for every universe. The
  // standard API that DOES work here is measureUserAgentSpecificMemory(), which is async and needs a
  // secure context; it reports the whole isolate including detached objects.
  if (d.type === 'heap') {
    const reply = (h, how) => { try { self.postMessage({ type:'heap-result', rid:d.rid, heap:h, how }); }catch(_){} };
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

  if (d.type === 'stat') {
    let stat = null; try { stat = self.__api && self.__api.stat ? self.__api.stat() : null; } catch (_) {}
    self.postMessage({ type: 'stat', rid: d.rid, stat });
    return;
  }
});
