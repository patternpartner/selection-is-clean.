// pophold-test.js - #409: A SAVED GENOME MUST NEVER BE NEWER THAN ITS SAVED POPULATION. An autosave wrote the genome to localStorage
// at once and the population snapshot to IndexedDB afterwards; a tab killed in between came back from founders (#406). The shell
// now holds the genome until the snapshot has landed. This opens ONE universe with the snapshot write slowed (?poptest=ms), polls
// both stores every 50 ms through SECS, and for every change of the stored genome checks that the snapshot changed FIRST.
//   SECS=270 DELAY=3000 [ENC=600] [SHELL_FILE=path/to/universe.html] [WORKER_FILE=path/to/sim.worker.js] node lab/port/pophold-test.js
// #418: ENC=ms also slows the ENCODE (a busy wait inside the worker's snapshot hook, ?popenc=ms). A field universe of 1,600 creatures
// takes 200 ms or more to encode, and the shell's wait for 'pending' is 250 ms: a genome posted before the encode was written ahead of
// its snapshot. ENC=600 reproduces that against a worker that does not hold the genome (WORKER_FILE), and must pass on today's.
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..'), SHELL = process.env.SHELL_FILE ? path.resolve(process.env.SHELL_FILE) : path.join(ROOT, 'universe.html');
const SECS = +(process.env.SECS || 270), DELAY = +(process.env.DELAY || 3000), ENC = +(process.env.ENC || 0);
const WORKER = process.env.WORKER_FILE ? path.resolve(process.env.WORKER_FILE) : path.join(ROOT, 'sim.worker.js');
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium'].find(p=>fs.existsSync(p)) || '/opt/pw-browsers/chromium';
const server = http.createServer((req, res) => { const u = req.url.split('?')[0]; fs.readFile(u === '/universe.html' ? SHELL : u === '/sim.worker.js' ? WORKER : path.join(ROOT, u), (e, b) => { if (e) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await (await browser.newContext({ viewport: { width: 640, height: 480 } })).newPage();
  await page.goto('http://127.0.0.1:' + server.address().port + '/universe.html?slot=t1&poptest=' + DELAY + (ENC ? '&popenc=' + ENC : '') + '#cleanart', { waitUntil: 'load' });
  const events = await page.evaluate(async ({ SECS }) => {
    const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + ':' + s.length; };
    const snap = () => new Promise(res => { try { const r = indexedDB.open('selection_pop', 1); r.onupgradeneeded = () => { try { r.result.createObjectStore('pop'); } catch (e) {} };
      r.onsuccess = () => { try { const q = r.result.transaction('pop', 'readonly').objectStore('pop').get('pop_t1'); q.onsuccess = () => { const v = q.result; r.result.close(); res(v ? (typeof v === 'string' ? 's' + v.length : 'b' + v.size) : null); }; q.onerror = () => { r.result.close(); res(null); }; } catch (e) { res(null); } };
      r.onerror = () => res(null); } catch (e) { res(null); } });
    // #418: the fingerprint the stored snapshot carries (the engine's popHash of the genome it was saved beside)
    const snapFp = () => new Promise(res => { try { const r = indexedDB.open('selection_pop', 1);
      r.onsuccess = () => { try { const q = r.result.transaction('pop', 'readonly').objectStore('pop').get('pop_t1'); q.onsuccess = async () => { const v = q.result; r.result.close();
        try { const t = !v ? null : typeof v === 'string' ? v : await new Response(v.stream().pipeThrough(new DecompressionStream('gzip'))).text(); res(t ? JSON.parse(t).fp : null); } catch (e) { res('unreadable'); } };
        q.onerror = () => { r.result.close(); res(null); }; } catch (e) { res(null); } }; r.onerror = () => res(null); } catch (e) { res(null); } });
    const ev = []; let g0 = null, p0 = null; const t0 = performance.now();
    while (performance.now() - t0 < SECS * 1000) { const g = localStorage.getItem('selection_t1'), gh = g ? hash(g) : null, p = await snap(), t = Math.round(performance.now() - t0);
      if (p !== p0) { ev.push({ t, what: 'snapshot', v: p }); p0 = p; }
      if (gh !== g0) { const fp = gh ? await snapFp() : null; ev.push({ t, what: 'genome', v: gh, match: !!gh && fp === gh }); g0 = gh; }
      await new Promise(r => setTimeout(r, 50)); }
    return ev; }, { SECS });
  await browser.close(); server.close();
  let ok = 0, bad = 0, lastSnap = -1, lastGenome = -1; const lines = [];
  for (const e of events) { if (e.what === 'snapshot') lastSnap = e.t; else { const fresh = lastSnap > lastGenome; if (fresh) ok++; else bad++; lines.push('genome written at ' + e.t + ' ms; last snapshot write at ' + lastSnap + ' ms -> ' + (fresh ? 'after its snapshot' : 'BEFORE its snapshot')); lastGenome = e.t; } }
  console.log(lines.join('\n')); console.log('snapshot writes seen: ' + events.filter(e => e.what === 'snapshot').length + '; genome writes: ' + (ok + bad));
  console.log((bad === 0 && ok > 0 ? 'PASS' : 'FAIL') + '  every stored genome followed its snapshot   ' + ok + ' in order, ' + bad + ' out of order');
  // #418: THE INVARIANT ITSELF. The order check above passes a genome written ahead of its OWN snapshot whenever the previous snapshot
  // landed after the previous genome (it caught 1 of 4 such writes in #418's control). Each time the stored genome changes, the stored
  // snapshot must already carry its fingerprint, or a reload at that moment refuses it.
  const G = events.filter(e => e.what === 'genome' && e.v), gm = G.filter(e => e.match).length;
  console.log((gm === G.length && gm > 0 ? 'PASS' : 'FAIL') + '  the stored snapshot carries the stored genome\'s fingerprint at every genome change   ' + gm + ' of ' + G.length);
  process.exit(bad === 0 && ok > 0 && gm === G.length && gm > 0 ? 0 : 1);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
