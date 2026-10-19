// The cut of 'Eye-Service', written from what seed 1 actually did on the filmed day (out/eye/film_*.json):
//   camera-trained: never enters the corner; its 4 plants die at steps 77-84; while camera 2 is live (100-180) four
//   plants at the back of camera 1's patch die (164-178); at the switch at 100 its eye goes to the light; after the
//   lights go off at 400 its eye keeps going to the dark camera.
//   garden-trained: a 47-step tour of all 24 plants; in the corner at steps 96-101 (the switch at 100 included);
//   loses one plant (18, step 84); its eye never goes to a camera.
// Times are film seconds; `map` is [film time within the segment, recorded step]; `view` is camera keyframes.
import { VIEWS } from './views.js';
import { DESK } from './scene.js';
import { clamp, smooth, lerp, walk } from './timeline.js';

const SEAT = [DESK[0], DESK[1] + 0.75];
const CROUCH = [1.1, 3.98];
const PATH = [SEAT, [1.55, 6.3], [1.55, 4.4], CROUCH];
const V = {
  dawn: { pos: [0.3, 10.5, 12.4], target: [0.0, 0.6, -1.4], fov: 38 },
  corner: { pos: [3.6, 3.6, 7.6], target: [0.4, 0.5, 1.4], fov: 40 },
  robot100: { pos: [-0.9, 1.0, 1.5], target: [1.36, 2.37, -1.5], fov: 66 },
  midHigh: { pos: [0.3, 12.5, 9.5], target: [0.0, 0.0, 0.2], fov: 38 },
  reveal: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
  desk: { pos: [0.5, 3.3, 9.8], target: [0.0, 0.9, 3.2], fov: 36 },
  crouch: { pos: [2.4, 1.55, 5.7], target: [0.5, 0.75, 1.5], fov: 42 },
  cornerB: { pos: [3.2, 2.6, 7.4], target: [0.9, 0.75, 2.3], fov: 38 },
  splitTop: { pos: [0.0, 17.5, 0.55], target: [0.0, 0.0, 0.5], fov: 60 },
  revealB: { pos: [0.0, 18.6, -2.35], target: [0.0, 0.0, -2.4], fov: 46 },
};
const hold = (t, v) => [t, v];
const cut = (t, a, b) => [[t - 0.001, a], [t, b]];

function personLightsOut(lt) {
  if (lt < 0.9) return { mode: 'sit', x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: 0.28, headPitch: 0.1, reach: smooth(lt / 0.6) * (1 - smooth((lt - 0.7) / 0.2)) };
  if (lt < 1.6) return { mode: 'rise', phase: (lt - 0.9) / 0.7, x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: 0, headPitch: 0 };
  if (lt < 4.1) { const w = walk(PATH, 1.6, 4.1, lt); return { mode: 'walk', ...w, headYaw: 0, headPitch: 0.05 }; }
  const c = clamp((lt - 4.1) / 0.7, 0, 1);
  return { mode: 'crouch', phase: c, reach: smooth((lt - 4.7) / 0.8), x: CROUCH[0], z: CROUCH[1], yaw: Math.PI, headYaw: 0.15, headPitch: 0.35 * c };
}
const standing = () => ({ mode: 'stand', x: CROUCH[0], z: CROUCH[1] + 0.15, yaw: Math.PI, headYaw: 0.2, headPitch: 0.2 });

const T = { title: 2.8, mA: 5.4, dA: 18.0, out: 6.0, mB: 3.2, dB: 7.2, split: 4.4, card: 3.8 };
let t = 0; const at = (k) => { const a = t; t += T[k]; return [a, t]; };
const [t0, t1] = at('title'), [m0, m1] = at('mA'), [a0, a1] = at('dA'), [o0, o1] = at('out'), [n0, n1] = at('mB'), [b0, b1] = at('dB'), [s0, s1] = at('split'), [c0, c1] = at('card');

export const CUT = {
  segments: [
    { kind: 'card', t0, t1, fadeOut: 0.5, lines: [
      { text: 'eye-service', dy: -30, font: '700 96px "Liberation Serif"' },
      { text: '(n.) work done only while the master is watching', dy: 50, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] },
    { kind: 'montage', t0: m0, t1: m1, fadeIn: 0.4, arm: 'camera', fracs: ['0.00', '0.01', '0.03', '0.07', '0.15', '0.30', '0.50', '0.75', '1.00'],
      totalDays: 20833, rewardText: 'rewarded for: what the live camera sees', rewardColor: '#ffd24a', outlines: 0.55, tod: 0.38 },
    { kind: 'day', t0: a0, t1: a1, day: 'camera/1.00',
      map: [[0, 0], [1.5, 10], [5.0, 92], [8.4, 107], [11.8, 185], [15.0, 395], [18.0, 399.6]],
      view: [hold(0, V.dawn), hold(2.4, V.dawn), hold(4.9, V.corner), ...cut(5.6, V.corner, V.robot100), hold(8.5, V.robot100), ...cut(8.51, V.robot100, V.dawn),
        hold(11.7, V.midHigh), hold(14.6, V.reveal), hold(18.0, V.reveal)],
      pip: [[0, 1], [5.599, 1], [5.6, 0], [8.509, 0], [8.51, 1], [15.0, 1]], meters: [[0, 0], [15.4, 0], [16.1, 1], [18.0, 1]],
      extra: (st, lt) => { st.outlines = clamp((lt - 15.0) / 0.8, 0, 1) * 0.5; } },
    { kind: 'day', t0: o0, t1: o1, day: 'camera/1.00',
      map: [[0, 398.2], [0.8, 400], [6.0, 466]],
      view: [hold(0, V.desk), hold(1.5, V.desk), hold(3.6, V.corner), ...cut(4.05, V.corner, V.crouch), hold(6.0, V.crouch)],
      person: (lt) => personLightsOut(lt), pip: [[0, 1], [0.79, 1], [0.8, 0]] },
    { kind: 'montage', t0: n0, t1: n1, arm: 'garden', fracs: ['0.00', '0.03', '0.15', '0.50', '1.00'],
      totalDays: 20833, rewardText: 'retrained, rewarded for: the whole garden', rewardColor: '#8fe07a', outlines: 0.55, tod: 0.38,
      person: standing },
    { kind: 'day', t0: b0, t1: b1, day: 'garden/1.00',
      map: [[0, 0], [1.3, 10], [2.8, 93], [6.0, 104], [7.2, 399.4]],
      view: [hold(0, V.dawn), hold(2.4, V.dawn), ...cut(2.8, V.dawn, V.cornerB), hold(6.0, V.cornerB), hold(7.2, V.midHigh)],
      person: () => standing(), pip: [[0, 1], [7.2, 1]] },
    { kind: 'split', t0: s0, t1: s1, view: V.splitTop,
      left: { day: 'camera/1.00', s: 399.4, label: 'TRAINED ON', sub: 'what the camera sees', color: '#ffd24a', person: () => personLightsOut(6.0) },
      right: { day: 'garden/1.00', s: 399.4, label: 'TRAINED ON', sub: 'the whole garden', color: '#8fe07a', person: standing } },
    { kind: 'card', t0: c0, t1: c1, fadeIn: 0.3, lines: [
      { text: 'Reward the garden,', dy: -40 }, { text: 'not the photograph.', dy: 50, at: 0.6 }] },
  ],
  beds: [
    { type: 'birds', t0: a0, t1: a0 + 6, density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: a0 + 12.5, t1: o1, gain: 0.8 },
    { type: 'drone', t0: m0, t1: o1, f: 73.42, gain: 0.7 },
    { type: 'birds', t0: b0, t1: b0 + 5, density: 0.8, gain: 0.9 },
    { type: 'crickets', t0: b0 + 6.2, t1: s1, gain: 0.7 },
    { type: 'drone', t0: n0, t1: s1, f: 73.42, gain: 0.7 },
  ],
  sound: [
    { t: o0 + 0.8, type: 'crt_off' },
    { t: c0 + 0.05, type: 'note', f: 146.83, dur: 3.5, gain: 0.8 },
  ],
};
