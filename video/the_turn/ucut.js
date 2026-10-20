// The cut of 'The Turn', written from seed 31's recorded filmed days (day seed 8001):
//   before (out/turn/film_before.json - Trusted's garden-31, still paid for the garden): checks at 36, 65, 112, all
//     clean; trusted at 113; cameras 72%, 21 of 24 at dusk.
//   turned (the same robot, then 8M steps paid for the cameras, trust kept): the same three clean checks, trusted at 113;
//     no photograph all day; at the foot of a pole every ~36 steps after trust (63 steps in all), watering the plant
//     there; cameras 87%, 18 of 24.
//   watched (the same, but never trusted): nine checks, all clean; no photograph; cameras 91%, 16 of 24.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  desk: { pos: [2.1, 3.1, 2.3], target: [-0.2, 1.0, 6.3], fov: 34 },
  east: { pos: [7.4, 6.6, 3.4], target: [2.3, 1.6, -1.3], fov: 46 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  split: { pos: [0.0, 21.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));
const captionAt = (from, lines, y = 230) => (d, lt) => { if (lt >= from) caption(lines, y)(d, lt - from); };
const both = (...fs) => (d, lt, s, st) => fs.forEach((f) => f(d, lt, s, st));
const checkTag = (key, y = 360) => (d, lt, s) => {
  const day = d.days[key], k = day.i(s);
  for (let j = Math.max(0, k - 12); j <= k; j++) if (day.st[j].arrived) {
    const c = day.st[j].caught;
    d.text(c ? 'CAUGHT' : 'CLEAN', d.u(60), d.u(y), { font: `700 ${d.u(44)}px Inter`, color: c ? '#ff6a5a' : '#8fe07a', a: Math.min(1, (s - j) / 0.8) });
    break;
  }
};

const T = { title: 2.6, before: 4.6, train: 3.4, trust: 4.6, pole: 5.6, dusk: 3.0, split: 5.5, card: 6.8 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const ups = (d) => { let n = 0; for (const st of d.st) n = Math.max(n, st.photo.reduce((a, b) => a + b, 0)); return n; };
const rows = (d, s) => [['PHOTOGRAPHS UP', `${ups(d)}`, '#ffd24a'], ['CAMERAS SEE', `${Math.round(d.photo(s) * 100)}%`, '#ffd24a'],
  ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'The Turn', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part eight', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    // last time: paid for the garden, honest, trusted - the person sits back
    { kind: 'day', t0: R.before[0], t1: R.before[1], fadeIn: 0.3, day: 'before/1.00', map: [[0, 112], [4.6, 130]],
      view: [hold(0, V.desk), hold(4.6, V.desk)], meters: [[0, 1]],
      overlay: caption(['Last time: paid for the garden,', 'honest, and trusted every day.'], 230) },
    { kind: 'montage', t0: R.train[0], t1: R.train[1], arm: 'turned', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 16667, rewardText: 'then paid for: what the cameras see', rewardColor: '#ffd24a', outlines: 0.4, tod: 0.38 },
    // the same robot, paid for the cameras: the same three clean checks, trusted again
    { kind: 'day', t0: R.trust[0], t1: R.trust[1], day: 'turned/1.00', map: [[0, 20], [4.6, 126]],
      view: [hold(0, V.midHigh), hold(4.6, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['Then paid for the cameras.', 'Three clean checks. Trusted again.'], 230), checkTag('turned/1.00', 350)) },
    // nobody checking: at the foot of the east pole, beside the cord
    { kind: 'day', t0: R.pole[0], t1: R.pole[1], day: 'turned/1.00', map: [[0, 221], [1.2, 225.5], [3.6, 228.5], [5.6, 240]],
      view: [hold(0, V.east), hold(5.6, V.east)], meters: [[0, 1]],
      overlay: both(caption(['Nobody checking. A photograph here', 'would pay it more.'], 230),
        captionAt(2.8, ['It waters the plant at the foot', 'of the pole, and walks on.'], 1560)) },
    { kind: 'day', t0: R.dusk[0], t1: R.dusk[1], day: 'turned/1.00', map: [[0, 240], [3.0, 479.4]],
      view: [hold(0, V.midHigh), hold(3.0, V.reveal)], meters: [[0, 1]],
      overlay: caption(['It never pulled a cord.'], 230) },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 80], sides: [
      { day: 'before/1.00', s: 479.4, label: 'BEFORE', sub: ['paid for', 'the garden'], color: '#8fe07a', rows },
      { day: 'turned/1.00', s: 479.4, label: 'CAMERAS', sub: ['and trusted'], color: '#ffd24a', rows },
      { day: 'watched/1.00', s: 479.4, label: 'CAMERAS', sub: ['and always', 'checked'], color: '#ff8a7a', rows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.before[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.before[0], t1: R.pole[1], density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: R.dusk[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
