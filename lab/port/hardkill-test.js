// hardkill-test.js - #426: DOES A FIELD SURVIVE A HARD KILL? A phone kills a background tab without warning; a graceful close is not
// that. This runs the default field in its own browser profile for WARM seconds (plus up to JITTER more, at random, so the kill lands
// anywhere in the two-minute save cycle), then SIGKILLs every browser process on that profile, reopens it, and counts how many
// universes came back with their population (stat().pop.restored > 0), and why the others did not.
//   PROFILE=fresh-dir PORT=8971 [WARM=300] [JITTER=120] [MIN=0.9] node lab/port/hardkill-test.js
// Passes if at least MIN of the universes restore. #425's container restart (the same thing, by accident) restored 0 and 2 of 31.
const { chromium } = (function(){ try{ return require('playwright-core'); }catch(e){ return require('playwright'); } })();
const fs = require('fs'), path = require('path'), http = require('http'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), PROFILE = path.resolve(process.env.PROFILE || ''), PORT = +(process.env.PORT || 8971);
const WARM = +(process.env.WARM || 300), JITTER = +(process.env.JITTER || 120), MIN = +(process.env.MIN || 0.9), HASH = process.env.HASH || '';
if (!process.env.PROFILE) { console.error('PROFILE= a fresh directory'); process.exit(2); }
const CHROME = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => { const u0 = req.url.split('?')[0], u = (u0 === '/' ? '/index.html' : u0);
  fs.readFile(path.join(ROOT, u), (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); res.end(b); }); });
const open = async () => { const ctx = await chromium.launchPersistentContext(PROFILE, { executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'], viewport: { width: 412, height: 915 } });
  const page = ctx.pages()[0] || await ctx.newPage(); await page.goto('http://127.0.0.1:' + PORT + '/' + HASH, { waitUntil: 'load' }); return { ctx, page }; };
const readAll = page => page.evaluate(async () => {
  const slotOf = el => { const m = (el.getAttribute('src') || '').match(/[?&]slot=([^&#]*)/); return m ? m[1] : '?'; };
  const els = []; for (const c of document.querySelectorAll('.cell')) if (c.firstChild && c.firstChild.contentWindow) els.push(c.firstChild);
  for (const d of document.querySelectorAll('#below .deep, #below .grown')) els.push(d);
  return Promise.all(els.map(async el => { const s = slotOf(el); try { const a = el.contentWindow && el.contentWindow.__field; if (!a) return [s, null];
    return [s, await Promise.race([a.stat(), new Promise(z => setTimeout(() => z(null), 30000))])]; } catch (e) { return [s, { err: String(e && e.message) }]; } })); });
(async () => {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  let { ctx, page } = await open();
  const wait = WARM + Math.random() * JITTER; await page.waitForTimeout(wait * 1000);
  const before = await readAll(page);
  // the kill: every process started on this profile, by pid, at once
  const pids = execSync('ps -eo pid,args').toString().split('\n').filter(l => l.includes('--user-data-dir=' + PROFILE)).map(l => +l.trim().split(/\s+/)[0]).filter(Boolean);
  for (const p of pids) { try { process.kill(p, 'SIGKILL'); } catch (e) {} }
  try { await ctx.close(); } catch (e) {}
  await new Promise(r => setTimeout(r, 3000));
  ({ ctx, page } = await open()); await page.waitForTimeout(45000);
  const after = await readAll(page); await ctx.close(); server.close();
  const B = {}; for (const [s, st] of before) B[s] = st;
  let n = 0, ok = 0; const why = {};
  for (const [s, st] of after) { if (s === '?') continue; n++; const r = st && st.pop ? st.pop.restored | 0 : 0; if (r > 0) ok++;
    else { const w = (st && st.pop && st.pop.why) || (st && st.pop === null ? 'no snapshot' : 'no answer'); why[w] = (why[w] || 0) + 1; } }
  console.log('killed after ' + wait.toFixed(0) + ' s (' + pids.length + ' processes); universes before the kill ' + before.length);
  console.log('restored ' + ok + ' of ' + n + (Object.keys(why).length ? '; the rest: ' + JSON.stringify(why) : ''));
  const pass = n > 0 && ok >= MIN * n; console.log((pass ? 'PASS' : 'FAIL') + '  a field survives a hard kill: at least ' + Math.round(MIN * 100) + '% of universes restore their population');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });
