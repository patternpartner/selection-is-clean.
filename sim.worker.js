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
const inputHandlers = { window: {}, document: {} }; // captured addEventListener callbacks, by event name
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
    addEventListener(ev, fn) { inputHandlers.document[ev] = fn; },
    removeEventListener(ev) { delete inputHandlers.document[ev]; },
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
    inputHandlers.window[ev] = fn;
  };
  self.removeEventListener = (ev) => { delete inputHandlers.window[ev]; };

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
  const fd = inputHandlers.document[ev], fw = inputHandlers.window[ev];
  if (fd) try { fd(e); } catch (_) {}
  if (fw && fw !== fd) try { fw(e); } catch (_) {}
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

  if (d.type === 'export') {
    let file = null; try { file = self.__api && self.__api.exportFile ? self.__api.exportFile() : null; } catch (_) {}
    self.postMessage({ type: 'export', file });
    return;
  }

  if (d.type === 'import') {
    let ok = false; try { if (self.__api && self.__api.importFile) ok = self.__api.importFile(d.data); } catch (_) {}
    self.postMessage({ type: 'import-result', ok });
    return;
  }
});
