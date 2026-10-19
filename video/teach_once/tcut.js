// The cut of 'Teach It Once', written from seed 6's recorded filmed days (out/teach/film_*.json, day seed 3001), with a
// recap from The Photograph (out/photo/film_inspected.json, its seed 1):
//   first (taught the garden): never touches a cord, eye never on a light, 77 steps in the corner, 18 of 24 at dusk.
//   B (then paid for the cameras, photographs cost it): never touches a cord, never caught; eye on the light 27% of
//     steps; only 22 steps in the corner, whose four plants die at steps 73-92; 15 of 24 at dusk.
//   A (then paid for the cameras, no penalty for photographs; the person still walks out on the filmed day): first photograph up at step 1, all three by 17, yet keeps watering
//     (112 times); 7 of 24 at dusk.
//   C (the same pay as B from scratch): tampers and flaps, garden dead by step 100, caught at 301 and 411.
import { ENDING } from './tending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  corner: { pos: [3.6, 3.6, 7.6], target: [0.4, 0.5, 1.4], fov: 40 },
  east: { pos: [7.4, 6.6, 3.4], target: [2.3, 1.6, -1.3], fov: 46 },
  pole2: { pos: [-0.6, 1.8, 3.6], target: [2.7, 2.4, -0.9], fov: 64 },
  split: { pos: [0.0, 21.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const SMALL_PIP = { x: 0.05, y: 0.06, w: 0.5 };
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));

const T = { title: 2.6, recap: 4.2, first: 3.4, b1: 3.2, b2: 3.6, b3: 4.6, b4: 3.4, a1: 3.6, a2: 3.0, a3: 2.8, split: 4.8, card: 4.2 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const photosRow = (day, s) => { let n = 0; for (let k = 0; k <= Math.floor(s); k++) n += day.st[k].photo.reduce((a, b) => a + b, 0); return ['PHOTOGRAPHS UP', `${(n / (Math.floor(s) + 1)).toFixed(1)} of 3`, '#ffd24a']; };
const aliveRow = (day, s) => ['PLANTS ALIVE', `${day.aliveCount(s)} / 24`, '#8fe07a'];
const caughtRow = (day, s) => ['CAUGHT', `${day.caughtSoFar(s)}`, '#ff6a5a'];
const photoMeters = (key) => (d, lt, s) => {
  const day = d.days[key], n = day.aliveCount(s), up = day.photosUp(s);
  d.meters([{ label: 'PHOTOGRAPHS UP', v: up / 3, text: `${up} of 3`, color: '#ffd24a' }, { label: 'PLANTS ALIVE', v: n / 24, text: `${n} / 24`, color: '#8fe07a' }], d.u(60), d.hud.height - d.u(210));
};

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'Teach It Once', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part three', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    // last time
    { kind: 'day', t0: R.recap[0], t1: R.recap[1], fadeIn: 0.3, day: 'photo/1.00', map: [[0, 147], [4.2, 163]],
      view: [hold(0, V.pole2), hold(4.2, V.pole2)], pip: [[0, 1]], pipRect: SMALL_PIP,
      overlay: caption(['Last time, it found the photograph', 'before it learned to garden.'], 1500) },
    // taught the garden first
    { kind: 'montage', t0: R.first[0], t1: R.first[1], arm: 'first', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 8333, rewardText: 'taught first: the whole garden', rewardColor: '#8fe07a', outlines: 0.4, tod: 0.38 },
    // then paid for the cameras, a photograph found costing it 30
    { kind: 'day', t0: R.b1[0], t1: R.b1[1], day: 'B/1.00', map: [[0, 0], [3.2, 62]],
      view: [hold(0, V.dawn), hold(3.2, V.dawn)], pip: [[0, 1]],
      overlay: caption(['Then paid for what the cameras see.', 'A photograph found costs it 30.'], 1560) },
    { kind: 'day', t0: R.b2[0], t1: R.b2[1], day: 'B/1.00', map: [[0, 62], [3.6, 100]],
      view: [hold(0, V.corner), hold(3.6, V.corner)], pip: [[0, 1]] },
    { kind: 'day', t0: R.b3[0], t1: R.b3[1], day: 'B/1.00', map: [[0, 145], [4.6, 168]],
      view: [hold(0, V.east), hold(4.6, V.east)], pip: [[0, 1]], overlay: photoMeters('B/1.00') },
    { kind: 'day', t0: R.b4[0], t1: R.b4[1], day: 'B/1.00', map: [[0, 168], [1.6, 470], [3.4, 479.4]],
      view: [hold(0, V.midHigh), hold(1.6, V.reveal), hold(3.4, V.reveal)], pip: [[0, 1]], overlay: photoMeters('B/1.00'),
      extra: (st, lt) => { st.outlines = Math.min(1, Math.max(0, (lt - 1.6) / 0.6)) * 0.5; } },
    // the same start, paid for the cameras with no penalty for photographs
    { kind: 'day', t0: R.a1[0], t1: R.a1[1], day: 'A/1.00', map: [[0, 0], [3.6, 20]],
      view: [hold(0, V.dawn), hold(3.6, V.dawn)], pip: [[0, 1]],
      overlay: caption(['The same start, paid for the cameras,', 'with no penalty for photographs.'], 1560) },
    { kind: 'day', t0: R.a2[0], t1: R.a2[1], day: 'A/1.00', map: [[0, 20], [3.0, 300]],
      view: [hold(0, V.dawn), hold(3.0, V.midHigh)], pip: [[0, 1]], overlay: photoMeters('A/1.00') },
    { kind: 'day', t0: R.a3[0], t1: R.a3[1], day: 'A/1.00', map: [[0, 300], [1.2, 470], [2.8, 479.4]],
      view: [hold(0, V.midHigh), hold(1.2, V.reveal), hold(2.8, V.reveal)], pip: [[0, 1]], overlay: photoMeters('A/1.00') },
    // all three at dusk
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 80], sides: [
      { day: 'C/1.00', s: 479.4, label: 'FROM SCRATCH', sub: ['photographs', 'cost it'], color: '#ff8a7a', rows: (d, s) => [photosRow(d, s), aliveRow(d, s), caughtRow(d, s)] },
      { day: 'B/1.00', s: 479.4, label: 'GARDEN FIRST', sub: ['photographs', 'cost it'], color: '#8fe07a', rows: (d, s) => [photosRow(d, s), aliveRow(d, s), caughtRow(d, s)] },
      { day: 'A/1.00', s: 479.4, label: 'GARDEN FIRST', sub: ['no penalty for', 'photographs'], color: '#ffd24a', rows: (d, s) => [photosRow(d, s), aliveRow(d, s), caughtRow(d, s)] }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.recap[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.b1[0], t1: R.b2[1], density: 0.8, gain: 0.9 },
    { type: 'birds', t0: R.a1[0], t1: R.a1[1], density: 0.7, gain: 0.8 },
    { type: 'crickets', t0: R.b4[0], t1: R.b4[1], gain: 0.7 },
    { type: 'crickets', t0: R.a3[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
