// 'Somebody Has to Look First', v2. node video/build_looked_at_film2.js [OUT_DIR]   (STILLS=100,200 writes only those frames)
// SEED (default 418, chosen by the rule in VIDEO.md), LOOK frame (340). Needs playwright-core and ffmpeg. Silent master; the score is made by video/looked_at_score.py from out/events.json.
const { chromium } = require('playwright-core');
const fs = require('fs'), { execSync } = require('child_process');
const OUT = process.argv[2] || 'out/looked_at_film2', SEED = +(process.env.SEED || 418), LOOK = +(process.env.LOOK || 340);
const STILLS = process.env.STILLS ? process.env.STILLS.split(',').map(Number) : null;
(async () => {
  fs.mkdirSync(OUT + '/frames', { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + process.cwd() + '/video/looked_at_film2.html');
  await p.evaluate(([s, l]) => window.film.init(s, l, { care: true }), [SEED, LOOK]);
  const total = await p.evaluate(() => window.film.total);
  for (let i = 0; i < total; i++) {
    const want = !STILLS || STILLS.includes(i);
    const url = await p.evaluate(w => { const f = window.film; f.advance(); if (!w) return null; f.render(); return f.png(); }, want);
    if (url) fs.writeFileSync(`${OUT}/frames/${String(i).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
    if (i % 100 === 0) console.log('frame', i, '/', total);
  }
  const ev = await p.evaluate(() => window.film.events());
  fs.writeFileSync(OUT + '/events.json', JSON.stringify({ seed: SEED, look: LOOK, total, events: ev }));
  await b.close();
  if (!STILLS) execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${OUT}/frames/%05d.png -vf "rgbashift=rh=-1:bh=1,noise=alls=5:allf=t+u,eq=saturation=1.06" -c:v libx264 -crf 16 -pix_fmt yuv420p -an ${OUT}/film-silent.mp4`);
  console.log('done', total);
})();
