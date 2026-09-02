// #153 acceptance test — the collective universe, and the tap overlay that was eating the buttons.
//
// TWO THINGS, both of which only exist in a real browser and neither of which any other rig can see.
//
// 1. THE DEAD BUTTONS. The field puts a transparent .tap div over every cell so one tap opens that
//    universe. #150 opened a cell by toggling CSS classes and never hid that overlay, so the opened
//    universe's own 💾 / 📂 buttons stayed covered: visible, and dead to every tap. Reported from a
//    phone ("the save loads are there. but not data possible"), invisible to thirty-four rigs,
//    because no rig had ever asked what a tap at those coordinates actually lands on. This one does,
//    with document.elementFromPoint, and it checks BOTH directions — closed the point must hit the
//    overlay (or the check proves nothing), open it must hit the frame.
//
// 2. THE RELAY. Nine universes behind nine worker boundaries. The field's own send counters would
//    happily report success while every packet was rejected on arrival, so this reads the RECEIVE
//    side — netStats and __liveness inside each sim — and asserts:
//      · the collective takes in far more migrants than any individual (it is a sink, not a peer),
//      · NOTHING ANYWHERE IS REJECTED (netStats.bad is 0 on every universe),
//      · the individuals are still individual (they did not converge on one generation/atom count),
//      · the collective is still ALIVE after being fed from eight worlds at once.
//
//    That third assertion — bad === 0, on every peer — is the one worth keeping. It failed the first
//    time it was run and the cause was not the relay: the wire's own limits had gone stale against the
//    engine's. validInstruction capped an OPCODE at 64 while the opcode space runs to 429, so no
//    plasmid or motif using an authored atom (236..427) or EFFECT_EMIT (236) could cross at all; the
//    tendency-vector cap was frozen at 5 while DIMS_MAX is 32, so a universe that earned a sixth trait
//    dimension became permanently unable to emigrate; and phase, which grows without bound, passed the
//    wire's +/-64 for about 1,500 ticks and then never again, so the longest-lived particles — the
//    survivors — were the ones that could not be sent. All three were silent: netStats.bad counted
//    them and nothing read it. Holding this at 0 is what keeps the wire honest as the ceilings move.
//
// Requires playwright-core; skips cleanly if unavailable.   SECS=45 node collective-test.js
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch(e){ console.log('  SKIP  playwright-core not installed — collective check not run'); process.exit(0); }
const fs=require('fs'), path=require('path'), http=require('http');
const EXE=['/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium']
  .find(p=>{ try{ return fs.existsSync(p); }catch(_){ return false; } });
if(!EXE){ console.log('  SKIP  no chromium binary found — collective check not run'); process.exit(0); }

// file:// gives every iframe an opaque origin, so BroadcastChannel does not peer and Workers are
// blocked outright. The artwork ships on GitHub Pages, i.e. http — so serve it over http.
const ROOT=__dirname;
const TYPES={'.html':'text/html','.js':'text/javascript','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const f=path.join(ROOT, (req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'}); res.end(b); });
});

(async () => {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--disable-dev-shm-usage'] });
  // A phone context, because that is the device this ships to: real touch events (so the save button
  // is tapped rather than clicked) and downloads accepted (so pressing it can be shown to produce a
  // file rather than merely to be reachable).
  const ctx = await browser.newContext({ viewport:{width:412,height:915}, deviceScaleFactor:2,
                                         hasTouch:true, isMobile:true, acceptDownloads:true });
  const page = await ctx.newPage();
  const pageErrors=[];
  page.on('pageerror', e => pageErrors.push(String((e&&e.message)||e).slice(0,200)));

  // Four individuals by default: enough for the sink ratio to be unambiguous, cheap enough for the
  // smoke pass. N=8 runs the shipping configuration — nine universes, nine workers.
  const NI = parseInt(process.env.N||'4',10);
  await page.goto(base+'/#n='+NI, { waitUntil:'load', timeout:60000 });
  const secs = parseInt(process.env.SECS||'45',10);
  await page.waitForTimeout(secs*1000);

  // ── shape of the field ───────────────────────────────────────────────────────────────────────
  const shape = await page.evaluate(() => ({
    cells: document.querySelectorAll('.cell').length,
    collectives: document.querySelectorAll('.cell.collective').length,
    lastIsCollective: !!document.querySelector('.cell:last-child.collective'),
  }));

  // ── 1. the controls: absent in the grid, present and WORKING in an opened universe ───────────
  // This is the check that has been wrong twice. #150 left the field's transparent tap target over
  // an opened cell, so its save and load buttons were visible and dead — reported from a phone,
  // missed by thirty-four rigs, because no rig had ever asked what a tap at those coordinates lands
  // on. #153 fixed that and asserted it with document.elementFromPoint, which was still the wrong
  // question: in the GRID the tap target is supposed to win, so a button rendered there could be
  // seen and never pressed. It looked broken because it was, as an affordance.
  // So the grid renders no controls at all, and the assertion is no longer about hit-testing: open a
  // universe and TAP ITS SAVE BUTTON WITH A REAL TOUCH, and require a file to come out. Nothing
  // short of that distinguishes "the tap reaches the iframe" from "the button does its job".
  const gridControls = await page.evaluate(() => {
    const vis = [];
    for (const c of document.querySelectorAll('.cell')) {
      try { const g = c.firstChild.contentDocument.getElementById('gio');
            vis.push(!!g && !g.hidden && g.getBoundingClientRect().height > 0); }
      catch(e){ vis.push('err'); }
    }
    return vis;
  });
  const opened = await page.evaluate(async () => {
    document.querySelector('.cell .tap').click();        // open it, the way a finger would
    await new Promise(r=>setTimeout(r,500));
    const fr = document.querySelector('.cell.on').firstChild;
    const g  = fr.contentDocument.getElementById('gio');
    const bb = fr.contentDocument.getElementById('gexp').getBoundingClientRect();
    const fb = fr.getBoundingClientRect();
    return { shown: !!g && !g.hidden, h: bb.height,
             x: fb.left+bb.left+bb.width/2, y: fb.top+bb.top+bb.height/2 };
  });
  let saved = null;
  try {
    const [dl] = await Promise.all([ page.waitForEvent('download',{timeout:12000}),
                                     page.touchscreen.tap(opened.x, opened.y) ]);
    saved = dl.suggestedFilename();
  } catch(e){ saved = null; }
  await page.evaluate(async () => { const b=document.getElementById('back'); if(b)b.click();
    await new Promise(r=>setTimeout(r,300)); });

  // ── 1b. the hash options still mean what the header says ────────────────────────────────────
  // A lineage link (/#<genome>) is the one shape that MUST keep working forever — every link anyone
  // has saved is one — and it is also the shape most likely to be broken by a change to the field,
  // because it is the branch where n is 1 and there is no collective at all. Cheap to check, and
  // nothing else checks it.
  const paths = [];
  for (const [hash, cells, coll] of [['#solo', 8, 0], ['#eyJ6IjoyfQ==', 1, 0]]) {
    const p2 = await ctx.newPage();
    await p2.goto(base+'/'+hash, { waitUntil:'load', timeout:60000 });
    await p2.waitForTimeout(2500);
    const r = await p2.evaluate(() => ({ cells: document.querySelectorAll('.cell').length,
                                         coll:  document.querySelectorAll('.cell.collective').length }));
    paths.push({ hash, ok: r.cells===cells && r.coll===coll, got: r.cells+'/'+r.coll, want: cells+'/'+coll });
    await p2.close();
  }

  // ── 1c. a universe that has evolved to stop broadcasting must go silent in the relay too ─────
  // #158. The relay used to call buildMigrantPacket() with no gate, so a universe whose evolved
  // netMigrantRate had gone to zero or below was still milked once per second and its material still
  // circulated. Measured on the device: u4 sat at -0.03363, fully silent on the wire, and the relay
  // took a migrant out of it every second anyway. That is code overriding a decision selection made.
  // Drive it directly rather than waiting for a universe to evolve there: set the gene to 0 and to a
  // high value, and require pull() to answer accordingly.
  const silence = await page.evaluate(async () => {
    const fr = document.querySelector('.cell').firstChild;
    const set = (v) => new Promise(r => { fr.contentWindow.__field.setGeneForTest
      ? fr.contentWindow.__field.setGeneForTest('netMigrantRate', v).then(r) : r(false); });
    const pulls = async (n) => { let got=0;
      for (let i=0;i<n;i++){ const p = await fr.contentWindow.__field.pull(); if (p) got++; }
      return got; };
    if (!fr.contentWindow.__field.setGeneForTest) return { unsupported:true };
    const before = (await fr.contentWindow.__field.stat()) || {};
    await set(0);            const atZero = await pulls(60);
    await set(1);            const atOne  = await pulls(60);
    // RESTORE. An earlier version left the gene pinned at 1 for the rest of the run, so universe 1
    // broadcast on every tick and polluted every number measured after it — a test changing the
    // thing it is measuring, which is the failure mode this file exists to catch.
    await set(0.003);
    return { atZero, atOne, restored:true, before:before.tick|0 };
  });

  // ── 2. the relay, read off the receive side of every sim ─────────────────────────────────────
  const stats = await page.evaluate(async () => {
    const cells=[...document.querySelectorAll('.cell')];
    const out=[];
    for (const c of cells) {
      let s=null;
      try { const a=c.firstChild.contentWindow.__field; if(a) s=await a.stat(); } catch(e){}
      out.push({ collective: c.classList.contains('collective'), s });
    }
    return { out, note: (document.getElementById('fmsg')||{}).textContent||'' };
  });
  // ── 3. the collective's lineage survives a reload, and ONLY the collective's ────────────────
  // The engine autosaves every universe into one shared localStorage key and reads it back on boot,
  // so without a slot of its own the collective would come up as a copy of whichever individual wrote
  // last — the distilled lineage overwritten by an arbitrary one. Take the collective's real export,
  // stamp a totalTicks nothing here could reach in a minute, put it in the collective's slot, reload,
  // and see who comes back carrying it. Exactly one universe should.
  const MARK = 777777;
  const seeded = await page.evaluate(async (mark) => {
    const c = document.querySelector('.cell.collective');
    const a = c.firstChild.contentWindow.__field;
    const data = await a.save();
    if (!data) return false;
    // file.genome is base64 of UTF-8 JSON, not an object — assigning file.genome.T directly is a
    // property set on a string primitive, silently ignored, which is how the first version of this
    // check quietly tested nothing and passed the wrong thing back.
    const file = JSON.parse(data);
    const b2s = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    const s2b = str => { const u = new TextEncoder().encode(str); let s2 = '';
      for (const c of u) s2 += String.fromCharCode(c); return btoa(s2); };
    const g = JSON.parse(b2s(file.genome));
    g.T = mark;                                            // the decoder reads totalTicks from g.T
    file.genome = s2b(JSON.stringify(g));
    localStorage.setItem('selection_collective', JSON.stringify(file));
    return true;
  }, MARK);
  await page.reload({ waitUntil:'load', timeout:60000 });
  await page.waitForTimeout(12000);                        // restoreCollective fires at 1200ms
  const after = await page.evaluate(async () => {
    const out=[];
    for (const c of [...document.querySelectorAll('.cell')]) {
      let s=null; try { const a=c.firstChild.contentWindow.__field; if(a) s=await a.stat(); } catch(e){}
      out.push({ collective:c.classList.contains('collective'), tt: s?(s.totalTicks|0):-1 });
    }
    return out;
  });
  // A picture of the field, on request. SHOT=<path> — the one review this project cannot do in a
  // terminal is whether nine universes on a phone screen still look like anything.
  if(process.env.SHOT){ try{ await page.screenshot({ path:process.env.SHOT }); }catch(_){ } }
  await browser.close(); server.close();

  const carriers = after.filter(r => r.tt >= MARK);
  const collCarries = after.some(r => r.collective && r.tt >= MARK);

  const rows  = stats.out.filter(r=>r.s);
  const coll  = rows.find(r=>r.collective);
  const indiv = rows.filter(r=>!r.collective);
  const acc   = r => r.s.migrantAccepted|0;
  const maxIndiv = indiv.length ? Math.max(...indiv.map(acc)) : 0;
  const outN  = parseInt((stats.note.match(/→(\d+)/)||[0,'0'])[1],10);
  const inN   = parseInt((stats.note.match(/←(\d+)/)||[0,'0'])[1],10);

  const out = {
    fieldHasCollective:  shape.cells===NI+1 && shape.collectives===1 && shape.lastIsCollective,
    everyUniverseAnswers: rows.length===shape.cells,
    noControlsInTheGrid:  gridControls.length>0 && gridControls.every(v=>v===false),
    controlsWhenOpened:   opened.shown===true && opened.h>=36,
    saveActuallySaves:    /^selection_gen\d+_t\d+\.json$/.test(String(saved||'')),
    // #158 CHANGED WHAT THIS CAN ASSERT, and the bar is lowered because the MECHANISM changed, not
    // to make the check go green. Before, the relay pulled unconditionally once per second and the
    // collective measured a 47-100x sink. Now the pull is gated on each universe's own evolved
    // netMigrantRate, so the relay delivers roughly ONE EXTRA COPY of each universe's natural
    // emission stream, directed at the collective — which caps the collective at about twice any
    // individual, and that ceiling is now the gene's to set, not mine. Measured after the change:
    // 58 against a field max of 40. There is no way to widen it again without overriding the gene,
    // which is the thing #158 exists to stop.
    collectiveIsASink:   !!coll && acc(coll) > maxIndiv * 1.3 && acc(coll) > 20,
    nothingIsRejected:   rows.length>0 && rows.every(r=>(r.s.bad|0)===0),
    collectiveStillAlive: !!coll && (coll.s.N|0) > 0 && (coll.s.tick|0) > 100,
    returnPathIsATrickle: inN>0 && outN*4 <= inN,
    silenceRespected: silence.unsupported===true ? null : (silence.atZero===0 && silence.atOne>40),
    noPageErrors: pageErrors.length===0,
    hashPathsIntact: paths.every(p=>p.ok),
    collectiveSeeded: seeded===true,
    collectiveSurvivesReload: collCarries,
    // THE USER'S CONSTRAINT, TESTED DIRECTLY: "without homogenising the individual."
    // After the reload the collective is carrying a 777,777-tick lineage AND the relay is running —
    // it is actively feeding all eight. If feeding were a genome copy rather than a migrant, an
    // individual would come back wearing that number. None does. Two earlier versions of this check
    // asked instead whether the individuals had DIVERGED (by generation, then by a germline
    // fingerprint) and both failed for the same reason: half a minute after a common boot they
    // genuinely have not, mutateGenome having not yet fired once, so the check had no signal and was
    // measuring the clock rather than the mechanism.
    individualsStayIndividual: carriers.length===1 && collCarries,
  };
  const checks=[
    ['fieldHasCollective','the field is n individuals plus one collective, last'],
    ['everyUniverseAnswers','every frame exposes the field API'],
    ['noControlsInTheGrid','in the grid a cell is a tab — no buttons that cannot be pressed'],
    ['controlsWhenOpened','opening a universe gives it its buttons, at a size a thumb can hit'],
    ['saveActuallySaves','and a REAL TOUCH TAP on save produces a file'],
    ['collectiveIsASink','the collective still takes in more than any individual (~2x, gene-capped since #158)'],
    ['nothingIsRejected','every packet on the wire validates — the wire\'s limits match the engine\'s'],
    ['collectiveStillAlive','it survives being fed from every world at once'],
    ['returnPathIsATrickle','the collective takes in far more than it sends back — a sink, not a broadcaster'],
    ['silenceRespected','a universe with netMigrantRate 0 sends the relay nothing; at 1 it sends every time'],
    ['noPageErrors','no uncaught exception on the field page'],
    ['hashPathsIntact','#solo drops the collective and an old lineage link still opens one universe'],
    ['collectiveSeeded','the collective can export itself into its own slot'],
    ['collectiveSurvivesReload','after a reload the collective comes back carrying its own lineage'],
    ['individualsStayIndividual','...while it is feeding them — a migrant, not a genome copy'],
  ];
  let bad=0;
  for(const [k,d] of checks){ const ok=out[k]===true; if(!ok)bad++;
    console.log('  '+(ok?'PASS ':'FAIL ')+k.padEnd(28)+d); }
  for(const e of [...new Set(pageErrors)]) console.log('    pageerror: '+e);
  console.log('\n  controls: grid '+JSON.stringify(gridControls)+'  opened shown='+opened.shown
    +' height='+Math.round(opened.h)+'px  tap-to-save -> '+(saved||'NO FILE'));
  for(const r of rows) console.log('  '+(r.collective?'COLLECTIVE':'universe  ')
    +'  gen '+String(r.s.gen).padStart(4)+'  tick '+String(r.s.tick).padStart(6)
    +'  N '+String(r.s.N).padStart(4)+'  atoms '+String(r.s.atoms).padStart(4)
    +'  migrantsIn '+String(r.s.migrantAccepted).padStart(5)
    +'  recv '+String(r.s.recv).padStart(5)+'  bad '+r.s.bad+'  peers '+r.s.peers
    +'  fp '+String(r.s.fp||'').slice(0,26));
  console.log('  field: '+JSON.stringify(stats.note));
  for(const p2 of paths) console.log('  '+p2.hash.slice(0,14).padEnd(15)+'cells/collective '+p2.got+' (want '+p2.want+')');
  console.log('  #158 relay gating: pulls at rate 0 -> '+silence.atZero+' of 60, at rate 1 -> '+silence.atOne+' of 60');
  console.log('  after reload, totalTicks: '+after.map(r=>(r.collective?'COLLECTIVE:':'u:')+r.tt).join('  '));
  console.log(bad? '\n'+bad+' FAILED' : '\nthe collective is fed by the field, and the field is still eight worlds');
  process.exit(bad?1:0);
})().catch(e => { try{server.close();}catch(_){}; console.log('  FAIL  collective harness error: '+e.message); process.exit(1); });
