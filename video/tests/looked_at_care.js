// Pre-registered in video/tests/looked_at_care.md. NODE_PATH=/opt/node-tools/node_modules node video/tests/looked_at_care.js [seeds...]
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 400, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/video/looked_at.html');
  const seeds = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [201, 202, 203, 204, 205, 206];
  const arms = [['SELECT', false, 0], ['null1', true, 1], ['null2', true, 2], ['null3', true, 3]];
  for (const s of seeds) for (const [name, neutral, shift] of arms) {
    const r = await p.evaluate(([s, neutral, shift]) => {
      const L = window.__lit; L.opts.care = true; L.opts.neutral = neutral; L.opts.visitor = false; L.seed(s, shift);
      const T = 24000, first = new Map(), est = new Map(), trend = [];
      for (let t = 1; t <= T; t++) {
        L.step();
        for (const q of L.pairs) { if (q.dying) continue; if (q.root === q.id && q.id > 70 && !first.has(q.id)) first.set(q.id, t); }
        if (t % 50 === 0) for (const [r, f] of first) if (!est.has(r) && t >= f + 1500 && t < f + 1550) est.set(r, L.pairs.some(q => !q.dying && q.root === r && q.id !== r));
        if (t % 6000 === 0) { const a = L.pairs.filter(x => !x.dying); trend.push([+(a.reduce((u, x) => u + x.g.care, 0) / a.length).toFixed(2), +(a.reduce((u, x) => u + x.g.mutual, 0) / a.length).toFixed(2)]); }
      }
      let n = 0, e = 0; for (const [r, f] of first) { if (f > T - 1600) continue; n++; if (est.get(r)) e++; }
      const a = L.pairs.filter(x => !x.dying);
      return { N: a.length, n, e, estPct: +(100 * e / Math.max(1, n)).toFixed(1), care: +(a.reduce((u, x) => u + x.g.care, 0) / a.length).toFixed(2), mutual: +(a.reduce((u, x) => u + x.g.mutual, 0) / a.length).toFixed(2), trend };
    }, [s, neutral, shift]);
    console.log(s, name, JSON.stringify(r));
  }
  console.log('errors', errs); await b.close();
})();
