// #144 — run the artwork in a REAL browser, which is the only place it actually lives.
//
// Every other rig in this repo boots the engine in Node against a stubbed DOM. That is the right
// trade for measurement, but it means thirty-two rigs have never once exercised the thing the user
// actually runs: a canvas, a real clock, real rAF timing, real localStorage, real BroadcastChannel,
// and the two panels. #142 makes the case — it printed "runtime recovered" over the picture on a
// phone, and was found by the person looking at it rather than by any rig.
//
// This loads engine.html in headless Chromium at a phone viewport and asserts:
//   1. NOTHING THROWS. Uncaught page errors and console errors are failures, not noise.
//   2. THE HUD IS CLEAN. loop()'s catch paints "runtime recovered: <message>" into #gen and turns it
//      red. That string on screen IS the failure signal, so the test reads the same pixel the user
//      does.
//   3. IT IS ACTUALLY RUNNING. Ticks advance, particles exist, and the canvas is not blank —
//      a page that loads and then quietly does nothing would pass a weaker check.
//   4. THE PANELS BUILD. Both IIFEs run after //__METAB_END__ under a real document.
//   5. THE REAL-WORLD SIGNAL IS LIVE HERE. #136's guard suppresses it under every Node rig; a
//      browser is precisely where it must NOT be suppressed, and nothing else can check that.
// Requires playwright-core; skips cleanly (exit 0) if it is unavailable, so smoke.sh stays green on
// a machine without it.   SECS=25 node browser-test.js
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch(e){ console.log('  SKIP  playwright-core not installed — browser check not run'); process.exit(0); }
const fs=require('fs'), path=require('path');
const EXE=['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium']
  .find(p=>{ try{ return fs.existsSync(p); }catch(_){ return false; } });
if(!EXE){ console.log('  SKIP  no chromium binary found — browser check not run'); process.exit(0); }

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3 });
  const page = await ctx.newPage();
  const consoleErrors=[], pageErrors=[];
  page.on('console', m => { if(m.type()==='error') consoleErrors.push(m.text().slice(0,200)); });
  page.on('pageerror', e => pageErrors.push(String((e&&e.message)||e).slice(0,200)));

  const file = process.env.INDEX || path.join(__dirname,'engine.html');
  await page.goto('file://'+file, { waitUntil:'load', timeout:60000 });
  const secs = parseInt(process.env.SECS||'25',10);
  await page.waitForTimeout(secs*1000);

  const s = await page.evaluate(() => {
    const g=document.getElementById('gen'), c=document.getElementById('c');
    let blank=null;
    try{ const d=c.getContext('2d').getImageData(0,0,Math.min(96,c.width),Math.min(96,c.height)).data;
      blank=true; for(let i=0;i<d.length;i+=4) if(d[i]||d[i+1]||d[i+2]){ blank=false; break; } }
    catch(e){ blank='err:'+e.message; }
    return { tick:(typeof tick!=='undefined')?tick:null, N:(typeof N!=='undefined')?N:null,
      hud:g?(g.textContent||'').slice(0,160):null,
      atoms:(typeof genome!=='undefined'&&genome.userAtoms)?genome.userAtoms.length:null,
      diary:!!document.getElementById('diaryPanel'), metab:!!document.getElementById('metabPanel'),
      wsSuppressed:(typeof worldSignalSuppressed==='function')?worldSignalSuppressed():null,
      wsFired:(typeof __liveness!=='undefined')?(__liveness['world.signal']|0):null,
      liveMechanisms:(typeof __liveness!=='undefined')?Object.values(__liveness).filter(v=>v>0).length:null,
      blank };
  });
  // A picture of the thing, on request. SHOT=<path> writes a phone-sized screenshot — the artwork as
  // its author would actually see it, which is the one review this project cannot do in a terminal.
  if(process.env.SHOT){ try{ await page.screenshot({ path:process.env.SHOT }); }catch(_){ } }
  await browser.close();

  const hud = s.hud||'';
  const recovered = /runtime recovered/i.test(hud);
  const out = {
    noPageErrors: pageErrors.length===0,
    noConsoleErrors: consoleErrors.length===0,
    hudClean: !recovered,
    isRunning: (s.tick|0) > 10 && (s.N|0) > 0,
    canvasNotBlank: s.blank===false,
    panelsBuilt: s.diary===true && s.metab===true,
    worldSignalLiveInBrowser: s.wsSuppressed===false && (s.wsFired|0)>0,
  };
  const checks=[
    ['noPageErrors','no uncaught exception reaches the page'],
    ['noConsoleErrors','nothing is logged as an error'],
    ['hudClean','the HUD does not say "runtime recovered"'],
    ['isRunning','ticks advance and particles exist'],
    ['canvasNotBlank','something is actually drawn'],
    ['panelsBuilt','the metabolism and diary panels build under a real DOM'],
    ['worldSignalLiveInBrowser','#136 real-world signal is NOT suppressed in a browser'],
  ];
  let bad=0;
  for(const [k,d] of checks){ const ok=out[k]===true; if(!ok)bad++;
    console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(26)+d); }
  for(const e of [...new Set(pageErrors)])    console.log('    pageerror: '+e);
  for(const e of [...new Set(consoleErrors)]) console.log('    console:   '+e);
  console.log('\n  after '+secs+'s: tick '+s.tick+', N '+s.N+', atoms '+s.atoms
    +', '+s.liveMechanisms+' mechanisms live, diurnal signal fired '+s.wsFired+'x');
  console.log('  HUD: '+JSON.stringify(hud));
  console.log(bad? '\n'+bad+' FAILED' : '\nthe artwork runs clean in the place it actually lives');
  process.exit(bad?1:0);
})().catch(e => { console.log('  FAIL  browser harness error: '+e.message); process.exit(1); });
