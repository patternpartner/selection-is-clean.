// 'Somebody Has to Look First'. node video/build_looked_at_film.js [OUT_DIR] ; STILLS=100,200,... writes only those frames.
// Needs playwright-core and ffmpeg. Silent (the user scores their own films). 720x1280, 30 fps, 33.7 s. Zero cost, no Modal.
const { chromium } = require('playwright-core');
const fs = require('fs'), { execSync } = require('child_process');
const OUT = process.argv[2] || 'out/looked_at_film', SEED = +(process.env.SEED || 17), LOOK = +(process.env.LOOK || 380);
const STILLS = process.env.STILLS ? process.env.STILLS.split(',').map(Number) : null;
(async () => {
  fs.mkdirSync(OUT + '/frames', { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + process.cwd() + '/video/looked_at_film.html');
  await p.evaluate(([s, l]) => window.film.init(s, l), [SEED, LOOK]);
  const total = await p.evaluate(() => window.film.total);
  for (let i = 0; i < total; i++) {
    const want = !STILLS || STILLS.includes(i);
    const url = await p.evaluate(w => { const f = window.film; f.advance(); if (!w) return null; f.render(); return f.png(); }, want);
    if (url) fs.writeFileSync(`${OUT}/frames/${String(i).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
    if (i % 100 === 0) console.log('frame', i, '/', total);
  }
  await b.close();
  if (!STILLS) execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${OUT}/frames/%05d.png -c:v libx264 -crf 16 -pix_fmt yuv420p -an ${OUT}/somebody-has-to-look-first.mp4`);
  console.log('done');
})();
