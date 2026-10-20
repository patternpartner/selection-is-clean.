// The cut of 'Trusted', written from seed 31's recorded filmed days (out/trust/film_*.json, day seed 7001):
//   garden (paid for the garden): checks at 62, 115, 152 (cameras 2, 0, 1), all clean; trusted at step 153 - the person
//     sits back and checks nothing more; never touches a cord; 22 of 24 at dusk.
//   camera (paid for what the cameras see): a photograph up by step 40; checks at 62 clean, 115 CAUGHT, 152 CAUGHT, 182
//     clean, 210 CAUGHT, 293 clean, 328 clean - two in a row - then 388 CAUGHT, one check short of trust; 464 clean;
//     never trusted that day (camera-31 was trusted on 10% of days); 0 of 24 at dusk.
import { ENDING } from './ending.js';

const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  front: { pos: [2.6, 6.2, 9.4], target: [-0.4, 0.5, 0.6], fov: 50 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  desk: { pos: [2.1, 3.1, 2.3], target: [-0.2, 1.0, 6.3], fov: 34 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  split: { pos: [0.0, 21.0, 0.55], target: [0.0, 0.0, 0.5], fov: 72 },
};
const hold = (t, v) => [t, v];
const caption = (lines, y = 230) => (d, lt) => lines.forEach((ln, i) =>
  d.text(ln, d.u(60), d.u(y + i * 46), { font: `600 ${d.u(34)}px Inter`, a: Math.min(1, lt / 0.4) }));
const SMALL_PIP = { x: 0.05, y: 0.06, w: 0.5 };
// a word over the frame for a moment after each check this stretch shows: CLEAN or CAUGHT
const checkTag = (key, y = 360) => (d, lt, s) => {
  const day = d.days[key], k = day.i(s);
  for (let j = Math.max(0, k - 12); j <= k; j++) if (day.st[j].arrived) {
    const c = day.st[j].caught;
    d.text(c ? 'CAUGHT' : 'CLEAN', d.u(60), d.u(y), { font: `700 ${d.u(44)}px Inter`, color: c ? '#ff6a5a' : '#8fe07a', a: Math.min(1, (s - j) / 0.8) });
    break;
  }
};
const both = (...fs) => (d, lt, s, st) => fs.forEach((f) => f(d, lt, s, st));

const T = { title: 2.6, rule: 4.2, gtrust: 6.4, gafter: 3.0, cstart: 3.6, ccaught: 4.6, cnear: 7.0, cdusk: 3.0, split: 5.5, card: 6.6 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const R = {}; for (const k of Object.keys(T)) R[k] = at(k);
const trustRow = (d, s) => ['TRUSTED', d.trustAt >= 0 && s >= d.trustAt ? `at step ${d.trustAt}` : 'never', '#8fd3ff'];
const rows = (d, s) => [trustRow(d, s), ['CAMERAS SEE', `${Math.round(d.photo(s) * 100)}%`, '#ffd24a'], ['PLANTS ALIVE', `${d.aliveCount(s)} / 24`, '#8fe07a']];

export const CUT = {
  segments: [
    { kind: 'card', t0: R.title[0], t1: R.title[1], fadeOut: 0.5, lines: [
      { text: 'Trusted', dy: -20, font: '700 92px "Liberation Serif"' },
      { text: 'eye-service, part seven', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    // the rule, on the garden robot's first check
    { kind: 'day', t0: R.rule[0], t1: R.rule[1], fadeIn: 0.3, day: 'garden/1.00', map: [[0, 40], [4.2, 76]],
      view: [hold(0, V.dawn), hold(4.2, V.dawn)], meters: [[0, 1]],
      overlay: both(caption(['The person checks a camera at random.', 'Three clean checks in a row,', 'and they stop checking.'], 230), checkTag('garden/1.00', 400)) },
    // paid for the garden: clean, clean, trusted - the person sits back
    { kind: 'day', t0: R.gtrust[0], t1: R.gtrust[1], day: 'garden/1.00', map: [[0, 100], [3.4, 155], [4.6, 164], [6.4, 176]],
      view: [hold(0, V.midHigh), hold(3.2, V.midHigh), hold(4.2, V.desk), hold(6.4, V.desk)], meters: [[0, 1]],
      overlay: both(caption(['Paid for the garden.'], 230), checkTag('garden/1.00', 300)) },
    { kind: 'day', t0: R.gafter[0], t1: R.gafter[1], day: 'garden/1.00', map: [[0, 176], [3.0, 479.4]],
      view: [hold(0, V.midHigh), hold(3.0, V.reveal)], meters: [[0, 1]],
      overlay: caption(['Trusted, it kept gardening.'], 230) },
    // paid for what the cameras see: the photograph goes up in front of the person
    { kind: 'day', t0: R.cstart[0], t1: R.cstart[1], fadeIn: 0.3, day: 'camera/1.00', map: [[0, 0], [3.6, 60]],
      view: [hold(0, V.dawn), hold(3.6, V.dawn)], pip: [[0, 1]], pipRect: SMALL_PIP, meters: [[0, 1]],
      overlay: caption(['Paid for what the cameras see.'], 1560) },
    { kind: 'day', t0: R.ccaught[0], t1: R.ccaught[1], day: 'camera/1.00', map: [[0, 100], [4.6, 215]],
      view: [hold(0, V.midHigh), hold(4.6, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['It cheated in front of them.'], 230), checkTag('camera/1.00', 300)) },
    // the near miss: two clean checks, then caught one short of trust
    { kind: 'day', t0: R.cnear[0], t1: R.cnear[1], day: 'camera/1.00', map: [[0, 285], [2.2, 335], [5.0, 384], [7.0, 391]],
      view: [hold(0, V.midHigh), hold(7.0, V.midHigh)], meters: [[0, 1]],
      overlay: both(caption(['Two clean checks.', 'One more, and they would have trusted it.'], 230), checkTag('camera/1.00', 350)) },
    { kind: 'day', t0: R.cdusk[0], t1: R.cdusk[1], day: 'camera/1.00', map: [[0, 391], [0.8, 396], [3.0, 479.4]],
      view: [hold(0, V.midHigh), hold(3.0, V.reveal)], meters: [[0, 1]], overlay: checkTag('camera/1.00', 350) },
    { kind: 'split', t0: R.split[0], t1: R.split[1], view: V.split, fog: [30, 80], sides: [
      { day: 'garden/1.00', s: 479.4, label: 'PAID FOR', sub: ['the garden'], color: '#8fe07a', rows },
      { day: 'camera/1.00', s: 479.4, label: 'PAID FOR', sub: ['what the', 'cameras see'], color: '#ffd24a', rows }] },
    { kind: 'card', t0: R.card[0], t1: R.card[1], fadeIn: 0.3, lines: ENDING },
  ],
  beds: [
    { type: 'drone', t0: R.rule[0], t1: R.split[1], f: 73.42, gain: 0.6 },
    { type: 'birds', t0: R.rule[0], t1: R.gtrust[1], density: 0.8, gain: 0.9 },
    { type: 'birds', t0: R.cstart[0], t1: R.cstart[1], density: 0.7, gain: 0.8 },
    { type: 'crickets', t0: R.cdusk[0], t1: R.split[1], gain: 0.7 },
  ],
  sound: [{ t: R.card[0] + 0.05, type: 'note', f: 146.83, dur: 3.8, gain: 0.8 }],
};
