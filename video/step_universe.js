// Drives engine.html#cleanart one tick at a time (requestAnimationFrame is captured, not free-running), so a film can be
// rendered at full resolution at any speed, and so a script can reach into the world between ticks.
// Math.random is replaced by a seeded generator before the engine boots, so a run can be repeated.
// Used by video/cold_pulse.js; exports open(opts) -> { step(n), grab(), eval(fn,arg), close() }.
const { chromium } = require('playwright-core');
exports.open = async function ({ w = 704, h = 1280, seed = 1 } = {}) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.addInitScript((seed) => {
    let s = seed >>> 0 || 1;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    window.__raf = [];
    window.requestAnimationFrame = (cb) => { window.__raf.push(cb); return window.__raf.length; };
  }, seed);
  await p.goto('file:///home/user/selection-is-clean./engine.html#cleanart', { waitUntil: 'load', timeout: 60000 });
  await p.addStyleTag({ content: '#gio,#gen,#metabPanel{display:none!important}' });
  await p.waitForFunction(() => window.__raf.length > 0, null, { timeout: 60000 });
  return {
    page: p,
    async step(n = 1) {
      return p.evaluate((n) => {
        for (let k = 0; k < n; k++) {
          const q = window.__raf; window.__raf = [];
          const seen = new Set();
          for (const f of q) { if (seen.has(f)) continue; seen.add(f); f(performance.now()); }
          lastLoopTime = performance.now() + 1e12;   // the watchdog must not start a second chain while we film
        }
        return { N, tick, lin: lineageRegistry.size };
      }, n);
    },
    async grab() {
      const s = await p.evaluate(() => {
        const d = X.getImageData(0, 0, c.width, c.height).data;
        let bin = ''; const CH = 0x8000;
        const rgb = new Uint8Array(d.length / 4 * 3);
        for (let i = 0, j = 0; i < d.length; i += 4) { rgb[j++] = d[i]; rgb[j++] = d[i + 1]; rgb[j++] = d[i + 2]; }
        for (let i = 0; i < rgb.length; i += CH) bin += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
        return btoa(bin);
      });
      return Buffer.from(s, 'base64');
    },
    eval: (fn, arg) => p.evaluate(fn, arg),
    close: () => b.close(),
  };
};
