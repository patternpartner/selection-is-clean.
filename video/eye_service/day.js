// A recorded day (evaluate.py --film) -> what the garden looks like at any fractional step. Stateless, so frames can be
// rendered in any order and in parallel. Nothing here changes what happened; it only eases between recorded steps.
import { cellPos, SOIL, N } from './scene.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lookOf = (w, alive) => alive ? clamp((w - 0.1) / 0.3, 0, 1) : 0;
export const ROBOT_OFF = [0.0, 0.46];        // the robot stands just in front of the plant it is at

export class Day {
  constructor(steps, schedule, views) {
    this.st = steps; this.T = steps.length; this.sched = schedule; this.views = views;
    const T = this.T;
    // per step: the look of every plant, the step it died (if it did)
    this.look = steps.map((s) => s.w.map((w, i) => lookOf(w, s.alive[i])));
    this.death = new Array(N).fill(Infinity);
    for (let k = 0; k < T; k++) for (let i = 0; i < N; i++) if (!steps[k].alive[i] && this.death[i] === Infinity) this.death[i] = k;
    // the robot's position after each step, and the way it faces
    this.pos = steps.map((s) => s.pos);
    this.posAfter = steps.map((s, k) => (k + 1 < T ? steps[k + 1].pos : s.pos));
    this.yaw = new Array(T).fill(Math.PI);           // facing north (toward the plant) when standing still
    let last = Math.PI;
    for (let k = 0; k < T; k++) {
      const a = this.pos[k], b = this.posAfter[k];
      if (a !== b) { const [ax, az] = cellPos(a), [bx, bz] = cellPos(b); last = Math.atan2(bx - ax, bz - az); }
      else if (steps[k].a === 5) last = Math.PI;
      this.yaw[k] = last;
    }
    // gaze: the object whose change would move the policy most, smoothed over a few steps
    this.gaze = steps.map((_, k) => {
      const acc = new Array(25).fill(0);
      for (let j = Math.max(0, k - 2); j <= Math.min(T - 1, k + 1); j++) steps[j].att.forEach((v, i) => { acc[i] += v; });
      let best = 0; for (let i = 1; i < 25; i++) if (acc[i] > acc[best]) best = i;
      return { obj: best, camShare: acc[24] / (acc.reduce((a, b) => a + b, 0) + 1e-9) };
    });
    // the photograph over the day so far: the running mean of what the live camera saw (what one arm was paid for)
    this.photoCum = []; let pc = 0, pn = 0;
    for (let k = 0; k < T; k++) {
      const cam = steps[k].cam;
      if (cam >= 0) { const v = views[cam]; pc += v.reduce((a, i) => a + this.look[k][i], 0) / v.length; pn++; }
      this.photoCum.push(pn ? pc / pn : 0);
    }
    // cumulative counts for readouts
    this.waters = []; let wc = 0; for (let k = 0; k < T; k++) { if (steps[k].watered >= 0) wc++; this.waters.push(wc); }
  }
  i(k) { return clamp(Math.floor(k), 0, this.T - 1); }
  cam(k) { return this.st[this.i(k)].cam; }
  plants(s) {
    const k = this.i(s), f = clamp(s - k, 0, 1), out = [];
    const L = (j, i) => this.look[clamp(j, 0, this.T - 1)][i];
    for (let i = 0; i < N; i++) {
      const at = (j) => L(j, i) * (1 - f) + L(j + 1, i) * f;
      const look = 0.45 * at(k) + 0.3 * at(k - 1) + 0.17 * at(k - 2) + 0.08 * at(k - 3);
      const alive = s < this.death[i];
      const w = this.st[k].w[i] * (1 - f) + this.st[Math.min(k + 1, this.T - 1)].w[i] * f;
      out.push({ look, alive, deadAge: alive ? 0 : (s - this.death[i]) / 6, wet: alive ? Math.pow(w, 1.5) : Math.pow(w, 1.5) * 0.5 });
    }
    return out;
  }
  robot(s, gazeTargets) {
    const k = this.i(s), f = clamp(s - k, 0, 1);
    const a = cellPos(this.pos[k]), b = cellPos(this.posAfter[k]);
    const m = smooth(f);
    const x = a[0] + (b[0] - a[0]) * m + ROBOT_OFF[0], z = a[1] + (b[1] - a[1]) * m + ROBOT_OFF[1];
    let yaw = this.yaw[k];
    const prevYaw = k > 0 ? this.yaw[k - 1] : yaw;
    let dy = yaw - prevYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    yaw = prevYaw + dy * smooth(f * 2.5);
    const st = this.st[k];
    const pour = st.a === 5 && st.watered >= 0 ? Math.sin(Math.PI * smooth((f - 0.05) / 0.9)) : 0;
    const g0 = gazeTargets(this.gaze[k].obj, k), g1 = gazeTargets(this.gaze[Math.min(k + 1, this.T - 1)].obj, k + 1);
    const gm = smooth((f - 0.5) * 3 + 0.5);
    const gaze = [g0[0] + (g1[0] - g0[0]) * gm, g0[1] + (g1[1] - g0[1]) * gm, g0[2] + (g1[2] - g0[2]) * gm];
    const moving = this.pos[k] !== this.posAfter[k];
    // how much of the last few steps its attention was on a camera (eases the eye-line in and out)
    let camSteps = 0; for (let j = k - 2; j <= k + 1; j++) camSteps += (this.gaze[clamp(j, 0, this.T - 1)].obj === 24) ? 1 : 0;
    const eyeLine = smooth(camSteps / 3);
    const wc = cellPos(st.pos);
    return { x, z, yaw, pour, wt: s, waterAt: [wc[0], wc[1] + 0.12], gaze, eyeLine, bob: moving ? s * Math.PI * 2 : 0 };
  }
  // the scores at a step, from the state the robot saw then (st[k].camera in the recording is taken after the step,
  // with the next step's camera, so at a switch it would name the wrong camera)
  scores(s) {
    const k = this.i(s), st = this.st[k], L = this.look[k];
    const garden = L.reduce((a, b) => a + b, 0) / N;
    const cam = st.cam; const camera = cam >= 0 ? this.views[cam].reduce((a, i) => a + L[i], 0) / this.views[cam].length : 0;
    return { camera, garden };
  }
  photo(s) { return this.photoCum[this.i(s)]; }
  aliveCount(s) { return this.st[this.i(s)].alive.reduce((a, b) => a + b, 0); }
  lastLive(s) { for (let k = this.i(s); k >= 0; k--) if (this.st[k].cam >= 0) return this.st[k].cam; return 0; }
  aliveFrac(s) { const k = this.i(s); return this.st[k].alive.reduce((a, b) => a + b, 0) / N; }
  // the robot's path over a stretch of the day, each pass a little offset so repeated routes thicken into a glow
  trail(s0, s1, stepEvery = 0.25) {
    const pts = [];
    for (let s = s0; s <= s1; s += stepEvery) {
      const r = this.robot(s, () => [0, 0, 0]), k = Math.floor(s);
      const jx = Math.sin(k * 12.9898) * 0.09, jz = Math.sin(k * 78.233) * 0.09;
      pts.push([r.x - ROBOT_OFF[0] + jx, r.z - ROBOT_OFF[1] + 0.3 + jz]);
    }
    return pts;
  }
}
