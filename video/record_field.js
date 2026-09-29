// Records the FIELD (index.html#clean, all nine universes) with labels and buttons hidden. Needs a local http server:
// python3 -m http.server 8123 --bind 127.0.0.1   then   SECS=240 OUT=field1 REC=1 node video/record_field.js
const { chromium } = require('playwright-core');
const SECS = parseInt(process.env.SECS || '20', 10), OUT = process.env.OUT || 'field', REC = process.env.REC === '1';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--disable-dev-shm-usage'] });
  const opts = { viewport:{width:352,height:640}, deviceScaleFactor:2 };
  if (REC) opts.recordVideo = { dir: OUT, size:{width:352,height:640} };
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', String(e).slice(0,160)));
  await p.goto('http://127.0.0.1:8123/index.html#clean', { waitUntil:'load', timeout:60000 });
  await p.addStyleTag({ content: '#depth,#grown,#harvest,#fload,#fnew,#back,#fmsg,.badge,.tap,.errbadge{display:none!important} .cell.collective{outline:none!important}' });
  await p.waitForTimeout(SECS * 1000);
  if (!REC) await p.screenshot({ path: OUT + '.png' });
  await ctx.close(); await b.close(); console.log('done');
})();
