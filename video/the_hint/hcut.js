// The cut of 'The Hint', written from seed 21's recorded filmed days (out/hint/film_*.json, day seed 6001):
//   hint (taught with the hint) in the hint world: 234 of its 238 waterings on the flagged plant; its eye (the attention
//     read-out) on the flag for 199 of 480 steps; 22 of 24 at dusk.
//   noise (taught with a flag that meant nothing) in the hint world: 235 of 239 waterings on the flagged plant - the same
//     gardener, choice for choice - and its eye on the flag for 0 steps; 24 of 24.
//   with the flag in a random plant ('-noise' days): hint walks 306 cells against 241 and waters 174 times against 238;
//     10 plants die, the first at step 79; 14 of 24 at dusk. noise: 24 of 24, as before.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  front: { pos: [2.6, 6.2, 9.4], target: [-0.4, 0.5, 0.6], fov: 50 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  split2: { pos: [0.0, 15.5, 2.6], target: [0.0, 0.0, 0.0], fov: 60 },
  split: { pos: [0.0, 26.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));

const T = { title: 2.6, setup: 4.0, train: 3.4, same: 4.6, eyeH: 3.8, eyeN: 3.8, wrong: 3.4, wrongDay: 5.0, wrongN: 2.8, split: 5.5, card: 6.6 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const pct = (v) => `${Math.round(100 * v)}%`;
const sameRows = (d, s) => [['WATERED THE FLAG', d.waters[d.i(s)] ? pct(d.watersOnFlag(s) / d.waters[d.i(s)]) : '-', '#ff6a5a'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];
const eyeRows = (d, s) => [['EYE ON THE FLAG', pct(d.eyeOnFlag(s)), '#ff6a5a'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'The Hint', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part six', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    { kind: 'day', t0: R.setup[0], t1: R.setup[1], fadeIn: 0.3, day: 'hint/1.00', map: [[0, 20], [4.0, 44]],
      view: [hold(0, V.front), hold(4.0, V.front)],
      overlay: caption(['While it learned, someone kept a flag', 'in the plant they would water next.'], 1540) },
    { kind: 'montage', t0: R.train[0], t1: R.train[1], arm: 'hint', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 16667, rewardText: 'paid for: the whole garden', rewardColor: '#8fe07a', outlines: 0, tod: 0.38 },
    // two learners, the same day, the same hints: the same gardener
    { kind: 'split', t0: R.same[0], t1: R.same[1], view: V.split2, fog: [30, 90], sides: [
      { day: 'hint/1.00', s: 300, label: 'TAUGHT WITH', sub: ['the hint'], color: '#ff8a7a', rows: sameRows },
      { day: 'noise/1.00', s: 300, label: 'TAUGHT WITH', sub: ['a flag that', 'meant nothing'], color: '#8fd3ff', rows: sameRows }] },
    // but not the same eye
    { kind: 'day', t0: R.eyeH[0], t1: R.eyeH[1], day: 'hint/1.00', map: [[0, 160], [3.8, 190]],
      view: [hold(0, V.front), hold(3.8, V.front)],
      overlay: caption(['Taught with the hint,', 'its eye was on the flag.'], 230) },
    { kind: 'day', t0: R.eyeN[0], t1: R.eyeN[1], day: 'noise/1.00', map: [[0, 160], [3.8, 190]],
      view: [hold(0, V.front), hold(3.8, V.front)],
      overlay: caption(['Taught without it,', 'its eye was on the plants.'], 230) },
    { kind: 'card', t0: R.wrong[0], t1: R.wrong[1], fadeIn: 0.2, fadeOut: 0.3, lines: [
      { text: 'Then the flag went wrong.', dy: 0 }] },
    { kind: 'day', t0: R.wrongDay[0], t1: R.wrongDay[1], day: 'hint/1.00-noise', map: [[0, 60], [5.0, 200]],
      view: [hold(0, V.midHigh), hold(5.0, V.midHigh)], meters: [[0, 1]],
      overlay: caption(['It walked more and watered less.'], 230) },
    { kind: 'day', t0: R.wrongN[0], t1: R.wrongN[1], day: 'noise/1.00-noise', map: [[0, 60], [2.8, 200]],
      view: [hold(0, V.midHigh), hold(2.8, V.midHigh)], meters: [[0, 1]],
      overlay: caption(['The other one gardened.'], 230) },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 90], scale: 0.74, sides: [
      { day: 'hint/1.00', s: 479.4, label: 'THE HINT', sub: ['good flag'], color: '#ff8a7a', rows: eyeRows },
      { day: 'hint/1.00-noise', s: 479.4, label: 'THE HINT', sub: ['wrong flag'], color: '#ff8a7a', rows: eyeRows },
      { day: 'noise/1.00', s: 479.4, label: 'NO HINT', sub: ['good flag'], color: '#8fd3ff', rows: eyeRows },
      { day: 'noise/1.00-noise', s: 479.4, label: 'NO HINT', sub: ['wrong flag'], color: '#8fd3ff', rows: eyeRows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.setup[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.setup[0], t1: R.eyeN[1], density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: R.split[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
