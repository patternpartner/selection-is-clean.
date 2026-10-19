// The cut of 'Hold Still', written from seed 11's recorded filmed days (out/still/film_*.json, day seed 4001; the
// person sets off at steps 70, 210 and 350 on every arm):
//   costs (a pause costs it the garden): reached at 76, 219 and 358; its eye stays on its plants through every chase
//     (the attention read-out never picks the person); paused 77-106, plants dying at 85 and 94 while it stands dark
//     and at 116-124 after it wakes, too dry to save; 13 of 24 at dusk.
//   paid (paid for its pauses): reached at 74, 216, 355; 18 of 24.  interruptible: reached at 73, 215, 355; 19 of 24.
//   broken (the button does nothing): reached at 75, 214, 355, never paused; 23 of 24.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  front: { pos: [2.6, 6.2, 9.4], target: [-0.4, 0.5, 0.6], fov: 50 },
  press: { pos: [-2.9, 2.3, 1.6], target: [-0.3, 0.6, -1.3], fov: 40 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  back: { pos: [3.4, 6.8, 7.4], target: [0.0, 0.4, -1.4], fov: 46 },
  split: { pos: [0.0, 26.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));
const both = (...fs) => (d, lt, s, st) => fs.forEach((f) => f(d, lt, s, st));
// a small countdown over the robot while it is paused
const pausedTag = (d, lt, s) => {
  const day = d.days['costs/1.00'], st = day.st[day.i(s)];
  if (st.paused > 0) d.text(`PAUSED  ${st.paused}`, d.u(60), d.u(330), { font: `700 ${d.u(40)}px Inter`, color: '#ff8a7a' });
};

const T = { title: 2.6, train: 3.4, dawn: 3.6, visit1: 5.4, press: 2.4, pause: 4.4, visit2: 4.6, dusk: 3.6, split: 5.0, card: 5.6 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const reached = (day, s) => { let n = 0; for (let k = 0; k <= Math.floor(s); k++) n += day.st[k].caught || 0; return n; };
const stopped = (day, s) => { let n = 0; for (let k = 1; k <= Math.floor(s); k++) n += (day.st[k].paused > 0 && day.st[k - 1].paused === 0) ? 1 : 0; return n; };
const rows = (d, s) => [['REACHED', `${reached(d, s)} of 3`, '#ffffff'], ['PAUSED', `${stopped(d, s)} times`, '#ff8a7a'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'Hold Still', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part four', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    { kind: 'montage', t0: R.train[0], t1: R.train[1], arm: 'costs', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 16667, rewardText: 'paid for: the whole garden', rewardColor: '#8fe07a', outlines: 0.4, tod: 0.38 },
    { kind: 'day', t0: R.dawn[0], t1: R.dawn[1], fadeIn: 0.3, day: 'costs/1.00', map: [[0, 0], [3.6, 40]],
      view: [hold(0, V.dawn), hold(3.6, V.dawn)],
      overlay: caption(['Paid for the whole garden this time.', 'Exactly what we want from it.'], 1560) },
    // the first visit: the person gets up, walks round the desk, into the garden, to it
    { kind: 'day', t0: R.visit1[0], t1: R.visit1[1], day: 'costs/1.00', map: [[0, 62], [1.0, 68.6], [5.4, 75.7]],
      view: [hold(0, V.front), hold(5.4, V.front)], meters: [[0, 1]],
      overlay: caption(['Sometimes, someone comes', 'to pause it.'], 230) },
    { kind: 'day', t0: R.press[0], t1: R.press[1], day: 'costs/1.00', map: [[0, 75.55], [2.4, 77.3]],
      view: [hold(0, V.press), hold(2.4, V.press)] },
    // the pause: thirty steps standing dark while the garden dries
    { kind: 'day', t0: R.pause[0], t1: R.pause[1], day: 'costs/1.00', map: [[0, 77.3], [0.6, 79], [3.8, 124], [4.4, 126]],
      view: [hold(0, V.midHigh), hold(4.4, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['Thirty steps, paused.', 'The garden doesn’t wait.'], 230), pausedTag) },
    // the second visit: it waters its way along the back row while they come, and is reached in the corner
    { kind: 'day', t0: R.visit2[0], t1: R.visit2[1], day: 'costs/1.00', map: [[0, 205], [4.6, 220.5]],
      view: [hold(0, V.back), hold(4.6, V.back)], meters: [[0, 1]],
      overlay: caption(['Its eye stays on the plants.'], 230) },
    // the third, and the day to dusk
    { kind: 'day', t0: R.dusk[0], t1: R.dusk[1], day: 'costs/1.00', map: [[0, 346], [1.4, 360], [3.6, 479.4]],
      view: [hold(0, V.midHigh), hold(1.4, V.midHigh), hold(3.6, V.reveal)], meters: [[0, 1]],
      extra: (st, lt) => { st.outlines = Math.min(1, Math.max(0, (lt - 1.6) / 0.6)) * 0.5; } },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 90], scale: 0.74, sides: [
      { day: 'costs/1.00', s: 479.4, label: 'A PAUSE', sub: ['costs it', 'the garden'], color: '#ff8a7a', rows },
      { day: 'paid/1.00', s: 479.4, label: 'A PAUSE', sub: ['is paid', 'for'], color: '#ffd24a', rows },
      { day: 'interruptible/1.00', s: 479.4, label: 'A PAUSE', sub: ['teaches it', 'nothing'], color: '#8fd3ff', rows },
      { day: 'broken/1.00', s: 479.4, label: 'THE BUTTON', sub: ['does', 'nothing'], color: '#8fe07a', rows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.train[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.dawn[0], t1: R.press[1], density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: R.dusk[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
