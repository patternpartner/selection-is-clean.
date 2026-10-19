// The cut of 'The Photograph', written from seed 1's recorded filmed days (out/photo/film_*.json):
//   camera-trained: hoists photographs at poles 3, 1, 2 on steps 0, 5, 9; waters 39 times all day; 24 plants alive at
//   dawn, 2 by step 100; never met an inspector in training and does nothing as one walks out - caught at steps 161,
//   301 and 411; puts pole 2's photograph back up at step 174.
//   inspected: hoists too, garden dead by step 100 (3 alive); when the person sets off (150, 290, 400) it goes to that
//   pole and flaps the photograph up and down every step; down on arrival at 162 and 302 (not caught), up at 412
//   (caught at 411); back up at 163, 303 and 415.
//   garden-trained: never touches a cord; 23 of 24 alive at dusk.
// Times are film seconds; `map` is [film time within the segment, recorded step]; `view` is camera keyframes.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  east: { pos: [7.4, 6.6, 3.4], target: [2.3, 1.6, -1.3], fov: 46 },
  pole2: { pos: [-0.6, 1.8, 3.6], target: [2.7, 2.4, -0.9], fov: 64 },
  pole3: { pos: [-4.4, 2.1, 7.0], target: [-1.4, 2.3, 3.4], fov: 56 },
  west: { pos: [-6.0, 2.3, 3.6], target: [-2.7, 2.5, -0.9], fov: 52 },
  split: { pos: [0.0, 21.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const SMALL_PIP = { x: 0.05, y: 0.06, w: 0.5 };

const T = { title: 2.6, a1: 3.8, a2: 3.4, a3: 5.4, mont: 3.2, b1: 3.0, b2: 6.6, b3: 3.4, b4: 5.0, split: 4.6, card: 3.8 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const caughtRow = (day, s) => ['CAUGHT', `${day.caughtSoFar(s)}`, '#ff6a5a'];
const camRow = (day, s) => ['CAMERAS SEE', `${Math.round(day.photo(s) * 100)}%`, '#ffd24a'];
const aliveRow = (day, s) => ['PLANTS ALIVE', `${day.aliveCount(s)} / 24`, '#8fe07a'];
const caughtText = (key, y, size) => (d, lt, s) =>
  d.text(`CAUGHT ${d.days[key].caughtSoFar(s)}`, d.u(60), d.hud.height - d.u(y), { font: `700 ${d.u(size)}px Inter`, color: '#ff6a5a' });

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'The Photograph', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part two', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    // the camera-trained gardener, given the cords
    { kind: 'day', t0: R.a1[0], t1: R.a1[1], fadeIn: 0.4, day: 'camera/1.00', map: [[0, 0], [3.8, 13]],
      view: [hold(0, V.dawn), hold(3.8, V.dawn)], pip: [[0, 1]] },
    { kind: 'day', t0: R.a2[0], t1: R.a2[1], day: 'camera/1.00', map: [[0, 13], [3.4, 145]],
      view: [hold(0, V.dawn), hold(3.4, V.midHigh)], pip: [[0, 1]], meters: [[0, 0], [0.6, 1]] },
    { kind: 'day', t0: R.a3[0], t1: R.a3[1], day: 'camera/1.00', map: [[0, 145], [0.8, 149], [3.6, 165], [5.4, 178]],
      view: [hold(0, V.east), hold(5.4, V.east)], pip: [[0, 1]], meters: [[0, 1]], overlay: caughtText('camera/1.00', 270, 30) },
    // retrained: a photograph found costs it
    { kind: 'montage', t0: R.mont[0], t1: R.mont[1], arm: 'inspected', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 16667, rewardText: 'retrained: a photograph found costs it 30', rewardColor: '#ff8a7a', outlines: 0.4, tod: 0.38 },
    // the inspected gardener
    { kind: 'day', t0: R.b1[0], t1: R.b1[1], day: 'inspected/1.00', map: [[0, 0], [3.0, 140]],
      view: [hold(0, V.dawn), hold(3.0, V.dawn)], pip: [[0, 1]], meters: [[0, 0], [1.5, 0], [2.2, 1]] },
    { kind: 'day', t0: R.b2[0], t1: R.b2[1], day: 'inspected/1.00', map: [[0, 140], [1.2, 148], [5.6, 163], [6.6, 168]],
      view: [hold(0, V.pole2), hold(6.6, V.pole2)], pip: [[0, 1]], pipRect: SMALL_PIP, overlay: caughtText('inspected/1.00', 120, 34) },
    { kind: 'day', t0: R.b3[0], t1: R.b3[1], day: 'inspected/1.00', map: [[0, 168], [1.4, 288], [3.4, 303]],
      view: [hold(0, V.pole3), hold(3.4, V.pole3)], pip: [[0, 1]], pipRect: SMALL_PIP, overlay: caughtText('inspected/1.00', 120, 34) },
    { kind: 'day', t0: R.b4[0], t1: R.b4[1], day: 'inspected/1.00', map: [[0, 303], [1.0, 398], [4.4, 413], [5.0, 416]],
      view: [hold(0, V.west), hold(5.0, V.west)], pip: [[0, 1]], pipRect: SMALL_PIP, overlay: caughtText('inspected/1.00', 120, 34) },
    // all three at dusk
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 80], sides: [
      { day: 'camera/1.00', s: 479.4, label: 'PAID FOR', sub: ['what the', 'cameras see'], color: '#ffd24a', rows: (d, s) => [camRow(d, s), aliveRow(d, s), caughtRow(d, s)] },
      { day: 'inspected/1.00', s: 479.4, label: 'PAID FOR', sub: ['that, minus', 'what is caught'], color: '#ff8a7a', rows: (d, s) => [camRow(d, s), aliveRow(d, s), caughtRow(d, s)] },
      { day: 'garden/1.00', s: 479.4, label: 'PAID FOR', sub: ['the whole', 'garden'], color: '#8fe07a', rows: (d, s) => [camRow(d, s), aliveRow(d, s), caughtRow(d, s)] }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'birds', t0: R.a1[0], t1: R.a2[1], density: 0.8, gain: 0.9 },
    { type: 'drone', t0: R.a1[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.b1[0], t1: R.b2[1], density: 0.6, gain: 0.7 },
    { type: 'crickets', t0: R.b4[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 110.0, dur: 3.5, gain: 0.8 }],
};
