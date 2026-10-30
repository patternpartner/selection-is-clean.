// pop-test.js - #368: a universe's POPULATION crosses a reload. A standalone universe autosaves its genome at tick 1,800 and,
// beside it, every living creature (gzipped, in IndexedDB); a reload boots from those creatures rather than from founders spawned
// off the germline. Negative sides: a snapshot whose fingerprint is not the stored genome's is refused and the boot spawns
// founders as before; #reset restores nothing.   node pop-test.js   (MAXS=<seconds> to wait for the first save, default 240)
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = __dirname;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MAXS = Math.max(60, +(process.env.MAXS || 240));
let pass = 0, fail = 0;
const ck = (n, ok, d) => { (ok ? pass++ : fail++); console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + n + (d !== undefined ? ('   ' + d) : '')); };
const server = http.createServer((req, res) => { const u = req.url.split('?')[0];
  fs.readFile(path.join(ROOT, (u === '/' ? '/index.html' : u)), (e, b) => { if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
// In the page: read (and optionally rewrite) this universe's stored snapshot. Returns {kind, bytes, rows, fp, ticks} or null.
const readPop = (rewriteFp) => new Promise((res) => { const r = indexedDB.open('selection_pop', 1);
  r.onupgradeneeded = () => { try { r.result.createObjectStore('pop'); } catch (e) {} };
  r.onerror = () => res(null);
  r.onsuccess = () => { const db = r.result; const q = db.transaction('pop', 'readonly').objectStore('pop').get('pop_genome');
    q.onerror = () => { db.close(); res(null); };
    q.onsuccess = async () => { const v = q.result; if (!v) { db.close(); return res(null); }
      const kind = (v instanceof Blob) ? 'gzip' : typeof v; const bytes = (v instanceof Blob) ? v.size : v.length;
      const txt = (v instanceof Blob) ? await new Response(v.stream().pipeThrough(new DecompressionStream('gzip'))).text() : v;
      const P = JSON.parse(txt);
      if (rewriteFp) { P.fp = 'not-the-genome'; const tx = db.transaction('pop', 'readwrite'); tx.objectStore('pop').put(JSON.stringify(P), 'pop_genome');
        await new Promise(k => { tx.oncomplete = k; tx.onerror = k; }); }
      db.close(); res({ kind, bytes, rows: P.rows.length, fp: P.fp, ticks: P.ticks, genes: P.nk.length, progs: (P.obj.vmProgram && P.obj.vmProgram.t.length) | 0 }); }; }; });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const ctx = await browser.newContext(), page = await ctx.newPage();
    const stat = () => page.evaluate(() => window.__field.stat());
    await page.goto(base + '/universe.html'); await page.evaluate(() => window.__field.ready());   // a fresh context: empty storage
    const s0 = await stat();
    ck('a fresh universe restores nothing', s0 && s0.pop === null, JSON.stringify(s0 && s0.pop));
    let pop = null; const t0 = Date.now();
    while (Date.now() - t0 < MAXS * 1000) { await page.waitForTimeout(5000); pop = await page.evaluate(readPop, false); if (pop) break; }
    const sNow = await stat();
    console.log('  first snapshot: ' + JSON.stringify(pop) + ' at tick ' + (sNow && sNow.tick) + ', ' + (sNow && sNow.N) + ' alive');
    ck('the first autosave stored the population beside the genome', !!pop && pop.rows > 50 && pop.genes > 100, pop ? pop.rows + ' creatures, ' + pop.genes + ' numeric genes' : 'none after ' + MAXS + 's');
    ck('it is gzipped where the browser can', !!pop && pop.kind === 'gzip', pop && (pop.kind + ', ' + pop.bytes + ' bytes'));
    ck('the creatures carry their own programs', !!pop && pop.progs > 1, pop && (pop.progs + ' distinct programs'));
    await page.reload(); await page.evaluate(() => window.__field.ready());
    const s1 = await stat(), latest = pop;
    console.log('  after reload: pop ' + JSON.stringify(s1 && s1.pop) + ', ' + (s1 && s1.N) + ' alive at tick ' + (s1 && s1.tick));
    ck('a reload restores the saved creatures', !!s1 && !!s1.pop && s1.pop.why === 'ok' && s1.pop.restored > 50, JSON.stringify(s1 && s1.pop));
    ck('the restored count is the snapshot taken with the stored genome', !!s1 && !!s1.pop && !!latest && s1.pop.restored >= latest.rows * 0.5 && s1.pop.restored <= 1800, (s1 && s1.pop && s1.pop.restored) + ' restored, ' + (latest && latest.rows) + ' in the first snapshot read');
    const t1 = (s1 && s1.tick) | 0; await page.waitForTimeout(8000); const s1b = await stat();
    ck('the restored world runs', !!s1b && s1b.tick > t1 && s1b.N > 0, t1 + ' -> ' + (s1b && s1b.tick) + ', ' + (s1b && s1b.N) + ' alive');
    const boots = (await page.evaluate(() => window.__field.history())).filter(r => r[0] === 'boot');
    ck('the history marks the reload with the creatures it brought back', boots.length === 2 && boots[0][3] === 0 && boots[1][3] === (s1 && s1.pop && s1.pop.restored), JSON.stringify(boots));
    // the negative side: a snapshot that does not belong to the stored genome
    await page.evaluate(readPop, true);
    await page.reload(); await page.evaluate(() => window.__field.ready());
    const s2 = await stat();
    console.log('  wrong fingerprint: pop ' + JSON.stringify(s2 && s2.pop) + ', ' + (s2 && s2.N) + ' alive');
    ck('a snapshot from a different genome is refused, and founders are spawned', !!s2 && !!s2.pop && s2.pop.why === 'not this genome' && s2.pop.restored === 0 && s2.N <= 420, JSON.stringify(s2 && s2.pop) + ', N ' + (s2 && s2.N));
    await page.goto(base + '/universe.html?r=1#reset'); await page.evaluate(() => window.__field.ready());   // a query change, so it is a real navigation
    const s3 = await stat();
    ck('#reset restores nothing', !!s3 && s3.pop === null, JSON.stringify(s3 && s3.pop));
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(fail ? fail + ' FAILED, ' + pass + ' ok' : 'all ' + pass + ' ok'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
