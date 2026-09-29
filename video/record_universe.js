// Used by video/build_first_draft_of_fate.py. Needs playwright-core (npm i playwright-core) and the preinstalled Chromium.
// SECS=420 OUT=run1 node video/record_universe.js
// Records the Selection universe (clean art) to video and logs its live numbers every half second.
const { chromium } = require('playwright-core');
const fs = require('fs');
const SECS = parseInt(process.env.SECS || '10', 10), OUT = process.env.OUT || 'rec';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport:{width:352,height:640}, deviceScaleFactor:2, recordVideo:{ dir: OUT, size:{width:352,height:640} } });
  const p = await ctx.newPage();
  const t0 = Date.now();
  await p.goto('file:///home/user/selection-is-clean./engine.html#cleanart', { waitUntil:'load', timeout:60000 });
  await p.addStyleTag({ content: '#gio,#gen,#metabPanel{display:none!important}' });
  const log = [];
  const tEnd = Date.now() + SECS * 1000;
  while (Date.now() < tEnd) {
    try { log.push(Object.assign({ t: (Date.now() - t0) / 1000 }, await p.evaluate(() => ({ N, tick, lin: lineageRegistry.size })))); } catch (e) {}
    await p.waitForTimeout(500);
  }
  fs.writeFileSync(OUT + '/stats.json', JSON.stringify(log));
  await ctx.close(); await b.close();
  console.log('done', log.length);
})();
