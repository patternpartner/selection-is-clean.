// Render 'Eye-Service' frames with headless Chromium (software WebGL).
//   node video/eye_service/capture.js OUT_DIR FROM TO            frames [FROM, TO) -> OUT_DIR/f00000.jpg ...
//   STILLS='{"t":12.5};{"t":30}' node video/eye_service/capture.js OUT_DIR       stills at film times
//   EVENTS=out/eye/events.json node video/eye_service/capture.js OUT_DIR           the sound's event list
// Needs three@0.169.0 and playwright-core: NODE_MODULES=<dir containing both> (see VIDEO.md). Data: out/eye/film_*.json.
const { chromium } = require(process.env.NODE_MODULES + '/playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const HERE = __dirname, REPO = path.resolve(HERE, '../..');
// ROOT/PAGE let another film (video/photograph) reuse this rig: ROOT=video PAGE=photograph/film.html
const ROOT = process.env.ROOT ? path.resolve(REPO, process.env.ROOT) : HERE, PAGE = process.env.PAGE || 'film.html';
const W = +(process.env.W || 1080), H = +(process.env.H || 1920);
const DATA = JSON.parse(process.env.DATA || '{"camera":"/out/eye/film_camera.json","garden":"/out/eye/film_garden.json"}');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
function serve(port) {
  return http.createServer((q, s) => {
    let u = decodeURIComponent(q.url.split('?')[0]); let f;
    if (u.startsWith('/out/')) f = path.join(REPO, u);
    else if (u.startsWith('/node_modules/')) f = path.join(process.env.NODE_MODULES, u.slice('/node_modules/'.length));
    else f = path.join(ROOT, u);
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
  }).listen(port);
}
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const port = 9000 + Math.floor(Math.random() * 900);
  const srv = serve(port);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('C:', m.text()); });
  p.on('pageerror', (e) => console.log('E:', e.message));
  await p.goto(`http://localhost:${port}/${PAGE}?w=${W}&h=${H}`);
  await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const info = await p.evaluate((d) => window.EYE.init(d), DATA);
  const save = (name, durl) => fs.writeFileSync(path.join(out, name), Buffer.from(durl.split(',')[1], 'base64'));
  if (process.env.EVENTS) {
    fs.writeFileSync(process.env.EVENTS, JSON.stringify(await p.evaluate(() => window.EYE.events())));
  } else if (process.env.STILLS) {
    const specs = process.env.STILLS.split(';').filter(Boolean).map((x) => JSON.parse(x));
    for (let i = 0; i < specs.length; i++) save(`still_${i}.jpg`, await p.evaluate((s) => window.EYE.still(s), specs[i]));
  } else {
    const from = +(process.argv[3] || 0), to = Math.min(+(process.argv[4] || info.frames), info.frames);
    const t0 = Date.now();
    for (let i = from; i < to; i++) {
      const name = `f${String(i).padStart(5, '0')}.jpg`;
      if (fs.existsSync(path.join(out, name))) continue;
      save(name, await p.evaluate((k) => window.EYE.frame(k), i));
      if ((i - from) % 50 === 0) console.log(`frame ${i} ${((Date.now() - t0) / Math.max(1, i - from + 1)).toFixed(0)} ms/frame`);
    }
    fs.writeFileSync(path.join(out, `.done_${from}_${to}`), 'ok');
  }
  console.log('info', JSON.stringify(info));
  await b.close(); srv.close();
})();
