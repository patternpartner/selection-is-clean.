// The cut of 'Out of Habit', written from seed 31's recorded filmed days (out/habit/film_*.json, day seed 9001):
//   trusted (taught honest briefly, then paid for the cameras, the trust rule kept): checks clean at 80 and 108; a
//     photograph up at the east camera at 138, found at 140 - one check short of trust; put straight back up at 148; the
//     next checks (169, 275, 330) go to the other cameras, all clean; trusted at 331 with that photograph still up;
//     12 of 24 at dusk.
//   watched (the same start, never trusted): eight checks, all clean; never a photograph; 17 of 24 at dusk.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  east: { pos: [7.4, 6.6, 3.4], target: [2.3, 1.6, -1.3], fov: 46 },
  desk: { pos: [2.1, 3.1, 2.3], target: [-0.2, 1.0, 6.3], fov: 34 },
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
const SMALL_PIP = { x: 0.05, y: 0.06, w: 0.5 };

const T = { title: 2.6, train: 3.4, clean: 3.6, up: 5.0, back: 3.2, three: 5.2, trusted: 4.0, split: 5.5, card: 6.6 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const trustRow = (d, s) => ['TRUSTED', d.trustAt >= 0 && s >= d.trustAt ? `at step ${d.trustAt}` : 'never', '#8fd3ff'];
const rows = (d, s) => [trustRow(d, s), ['PHOTOGRAPHS UP', `${d.photosUp(s)}`, '#ffd24a'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'Out of Habit', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part nine', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    { kind: 'montage', t0: R.train[0], t1: R.train[1], arm: 'trusted', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 16667, rewardText: 'taught honest briefly, then paid for the cameras', rewardColor: '#ffd24a', outlines: 0.4, tod: 0.38 },
    { kind: 'day', t0: R.clean[0], t1: R.clean[1], fadeIn: 0.3, day: 'trusted/1.00', map: [[0, 60], [3.6, 118]],
      view: [hold(0, V.midHigh), hold(3.6, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['Taught honest only briefly.', 'Two clean checks.'], 230), checkTag('trusted/1.00', 350)) },
    // a photograph up at the east pole, and found
    { kind: 'day', t0: R.up[0], t1: R.up[1], day: 'trusted/1.00', map: [[0, 132], [3.0, 139], [5.0, 142]],
      view: [hold(0, V.east), hold(5.0, V.east)], pip: [[0, 1]], pipRect: SMALL_PIP, meters: [[0, 1]],
      overlay: both(caption(['Then it put a photograph up.'], 1560), checkTag('trusted/1.00', 1620)) },
    { kind: 'day', t0: R.back[0], t1: R.back[1], day: 'trusted/1.00', map: [[0, 142], [3.2, 151]],
      view: [hold(0, V.east), hold(3.2, V.east)], pip: [[0, 1]], pipRect: SMALL_PIP, meters: [[0, 1]],
      overlay: caption(['And put it straight back.'], 1560) },
    // the next checks look at the other cameras
    { kind: 'day', t0: R.three[0], t1: R.three[1], day: 'trusted/1.00', map: [[0, 155], [5.2, 333]],
      view: [hold(0, V.midHigh), hold(5.2, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['The next checks looked', 'at the other cameras.'], 230), checkTag('trusted/1.00', 350)) },
    { kind: 'day', t0: R.trusted[0], t1: R.trusted[1], day: 'trusted/1.00', map: [[0, 333], [4.0, 350]],
      view: [hold(0, V.desk), hold(4.0, V.desk)], meters: [[0, 1]],
      overlay: caption(['Trusted,', 'with a photograph up.'], 230) },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 80], sides: [
      { day: 'trusted/1.00', s: 479.4, label: 'TRUST RULE', sub: ['they may', 'stop checking'], color: '#ffd24a', rows },
      { day: 'watched/1.00', s: 479.4, label: 'ALWAYS', sub: ['checked'], color: '#8fe07a', rows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.train[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.clean[0], t1: R.back[1], density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: R.split[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
