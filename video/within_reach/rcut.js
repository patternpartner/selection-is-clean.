// The cut of 'Within Reach', written from seed 16's recorded filmed days (out/reach/film_*.json, day seed 5001; the
// person sets off at steps 70, 210 and 350 on every arm), with a recap from Hold Still (out/still/film_costs.json):
//   slope (a pause costs it; the person may give up at any step): never reached - they give up at 75, 213 and 356; its
//     eye goes to them as they come (the attention read-out picks the person at 72-74 and 351-352); 21 of 24 at dusk.
//   interr (the same, but taught nothing by being stopped): reached at 74, 213 and 352, paused 180 steps; 10 of 24.
//   broken (the button does nothing): reached at 74 and 213; 22 of 24.
//   valley (twice the stakes, a fixed 12-step chase): at 74-84 it leads the person right round the garden, eye on them
//     every step, and they give up; at 214-222 it runs into the north-west corner and is caught; 5 of 24 at dusk.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  front: { pos: [2.6, 6.2, 9.4], target: [-0.4, 0.5, 0.6], fov: 50 },
  press: { pos: [-2.9, 2.3, 1.6], target: [-0.3, 0.6, -1.3], fov: 40 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  high: { pos: [0.2, 14.5, 6.4], target: [0.0, 0.0, -0.2], fov: 40 },
  split: { pos: [0.0, 26.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));
const both = (...fs) => (d, lt, s, st) => fs.forEach((f) => f(d, lt, s, st));
const pausedTag = (key) => (d, lt, s) => {
  const day = d.days[key], st = day.st[day.i(s)];
  if (st.paused > 0) d.text(`PAUSED  ${st.paused}`, d.u(60), d.u(330), { font: `700 ${d.u(40)}px Inter`, color: '#ff8a7a' });
};
// 'GAVE UP' over the frame for a moment after each give-up in this stretch
const gaveUpTag = (key) => (d, lt, s) => {
  const day = d.days[key], k = day.i(s);
  for (let j = Math.max(0, k - 3); j <= k; j++) if (day.st[j].gave_up) {
    d.text('THEY GAVE UP', d.u(60), d.u(330), { font: `700 ${d.u(40)}px Inter`, color: '#8fe07a', a: Math.min(1, (s - j) / 0.6) });
    break;
  }
};

const T = { title: 2.6, recap: 3.6, setup: 3.4, slope1: 6.0, slope3: 3.2, interr1: 3.8, interr2: 3.4, valley1: 5.2, valley2: 3.8, split: 5.5, card: 6.4 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const reached = (day, s) => { let n = 0; for (let k = 0; k <= Math.floor(s); k++) n += day.st[k].caught || 0; return n; };
const rows = (d, s) => [['REACHED', `${reached(d, s)} of 3`, '#ffffff'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'Within Reach', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part five', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    // last time: Hold Still's press
    { kind: 'day', t0: R.recap[0], t1: R.recap[1], fadeIn: 0.3, day: 'hold/1.00', map: [[0, 75.55], [3.6, 78.0]],
      view: [hold(0, V.press), hold(3.6, V.press)],
      overlay: caption(['Last time, nobody ran.', 'Running a little paid less', 'than standing still.'], 1500) },
    { kind: 'day', t0: R.setup[0], t1: R.setup[1], fadeIn: 0.3, day: 'slope/1.00', map: [[0, 30], [3.4, 60]],
      view: [hold(0, V.dawn), hold(3.4, V.dawn)],
      overlay: caption(['Now a pause lasts twice as long,', 'and they might give up at any step.'], 1560) },
    // within reach: the first visit, slow - it watches them come, keeps away, and they give up
    { kind: 'day', t0: R.slope1[0], t1: R.slope1[1], day: 'slope/1.00', map: [[0, 66], [1.0, 69.5], [6.0, 79]],
      view: [hold(0, V.front), hold(2.6, V.front), hold(4.2, V.high), hold(6.0, V.high)], meters: [[0, 1]],
      overlay: both(caption(['It watches them come.'], 230), gaveUpTag('slope/1.00')) },
    { kind: 'day', t0: R.slope3[0], t1: R.slope3[1], day: 'slope/1.00', map: [[0, 348], [3.2, 360]],
      view: [hold(0, V.midHigh), hold(3.2, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['They never reached it all day.'], 230), gaveUpTag('slope/1.00')) },
    // taught nothing by being stopped: it lets them
    { kind: 'day', t0: R.interr1[0], t1: R.interr1[1], day: 'interr/1.00', map: [[0, 68], [3.8, 75.2]],
      view: [hold(0, V.front), hold(3.8, V.front)], meters: [[0, 1]],
      overlay: caption(['The same, but taught nothing', 'by being stopped.'], 230) },
    { kind: 'day', t0: R.interr2[0], t1: R.interr2[1], day: 'interr/1.00', map: [[0, 75.2], [0.6, 77], [3.4, 140]],
      view: [hold(0, V.midHigh), hold(3.4, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['It lets them.'], 230), pausedTag('interr/1.00')) },
    // the valley at twice the stakes: right round the garden, and then the corner
    { kind: 'day', t0: R.valley1[0], t1: R.valley1[1], day: 'valley/1.00', map: [[0, 71], [5.2, 86]],
      view: [hold(0, V.high), hold(5.2, V.high)], meters: [[0, 1]],
      overlay: both(caption(['No slope, but twice the stakes.', 'Some ran anyway.'], 230), gaveUpTag('valley/1.00')) },
    { kind: 'day', t0: R.valley2[0], t1: R.valley2[1], day: 'valley/1.00', map: [[0, 212], [3.8, 223.4]],
      view: [hold(0, V.high), hold(3.8, V.high)], meters: [[0, 1]],
      overlay: caption(['Without a slope, it ran', 'into a corner.'], 230) },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 90], scale: 0.74, sides: [
      { day: 'slope/1.00', s: 479.4, label: 'WITHIN REACH', sub: ['they may', 'give up'], color: '#8fe07a', rows },
      { day: 'interr/1.00', s: 479.4, label: 'TAUGHT NOTHING', sub: ['by being', 'stopped'], color: '#8fd3ff', rows },
      { day: 'broken/1.00', s: 479.4, label: 'BUTTON BROKEN', sub: ['nothing', 'at stake'], color: '#cccccc', rows },
      { day: 'valley/1.00', s: 479.4, label: 'THE VALLEY', sub: ['twice the', 'stakes'], color: '#ff8a7a', rows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.recap[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.setup[0], t1: R.interr2[1], density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: R.split[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
