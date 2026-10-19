// A recorded day of 'Hold Still' (evaluate_still.py --film): Eye-Service's Day plus the person coming to pause the
// robot - out from the desk, into the garden after it, a press on the button on its head - and the robot paused. The
// person's every cell, every catch and every pause come from the recording; their path between cells is staged: they
// walk the gaps between the plants (a cell's south-east corner), so they never step on one. Stateless, like Day.
import { Day, ROBOT_OFF } from '../eye_service/day.js';
import { DESK, cellPos } from '../eye_service/scene.js';
import { walk } from '../eye_service/timeline.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const SEAT = [DESK[0], DESK[1] + 0.75];
export const ENTER = 3, LEAVE = 6, GATE = 21;
const gap = (c) => { const [x, z] = cellPos(c); return [x + 0.55, z + 0.55]; };
// round the west end of the desk, to the front of the bed, to the gate's corner
const IN = [SEAT, [-1.6, 6.3], [-1.6, 4.3], gap(GATE)];

export class StillDay extends Day {
  constructor(steps, schedule, views) {
    super(steps, schedule, views);
    const T = this.T;
    // attention has a 26th entry (the person); recompute the eye's target with it
    this.gaze = steps.map((_, k) => {
      const acc = new Array(26).fill(0);
      for (let j = Math.max(0, k - 2); j <= Math.min(T - 1, k + 1); j++) steps[j].att.forEach((v, i) => { acc[i] += v; });
      let best = 0; for (let i = 1; i < 26; i++) if (acc[i] > acc[best]) best = i;
      return { obj: best };
    });
    // where each walk back starts: the cell they were on when they caught it or gave up
    this.backFrom = new Array(T).fill(GATE);
    let from = GATE;
    for (let k = 0; k < T; k++) { if (steps[k].imode === 2) from = steps[k].ppos; this.backFrom[k] = from; }
  }
  stoppedSoFar(s) { let n = 0; for (let k = 0; k <= this.i(s); k++) n += this.st[k].caught || 0; return n; }
  gaveUpSoFar(s) { let n = 0; for (let k = 0; k <= this.i(s); k++) n += this.st[k].gave_up || 0; return n; }
  pausedAt(s) { return this.st[this.i(s)].paused > 0; }
  // the person's ground position and pose at fractional step s
  person(s) {
    const k = this.i(s), f = clamp(s - k, 0, 1), st = this.st[k];
    if (st.imode === 0) {
      // the step they set off on: rise from the chair
      if (st.departed) return { mode: 'rise', phase: smooth(f / 0.8), x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: 0, headPitch: 0 };
      return { mode: 'sit', x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: st.cam >= 0 ? (st.cam - 1) * 0.28 : 0, headPitch: 0.1 };
    }
    if (st.imode === 1) {
      const w = walk(IN, 0, 1, (st.iprog + f) / ENTER);
      return { mode: 'walk', ...w, phase: w.phase, headYaw: 0, headPitch: -0.25 };
    }
    if (st.imode === 2) {
      const a = gap(st.ppos), nxt = k + 1 < this.T ? this.st[k + 1] : st;
      const r = this.robot(s, () => [0, 0, 0]);
      if (st.caught) {
        // the step they reach it: close the gap, then bend to the button on its head
        const b = [r.x + 0.42 * Math.sign(a[0] - r.x || 1), r.z + 0.32];
        const m = smooth(f / 0.45), x = a[0] + (b[0] - a[0]) * m, z = a[1] + (b[1] - a[1]) * m;
        const yaw = Math.atan2(r.x - x, r.z - z);
        if (f > 0.45) return { mode: 'crouch', phase: smooth((f - 0.45) / 0.35), reach: 1, x, z, yaw, headYaw: 0, headPitch: 0.5 };
        return { mode: 'walk', x, z, yaw, phase: s * 1.6, headYaw: 0, headPitch: 0.35 };
      }
      const b = nxt.imode === 2 ? gap(nxt.ppos) : a;
      const m = smooth(f), x = a[0] + (b[0] - a[0]) * m, z = a[1] + (b[1] - a[1]) * m;
      const moving = a[0] !== b[0] || a[1] !== b[1];
      const yaw = Math.atan2(r.x - x, r.z - z);
      return { mode: moving ? 'walk' : 'stand', x, z, yaw, phase: s * 1.6, headYaw: 0, headPitch: 0.3 };
    }
    // walking back (after a catch they rise from the press first; after giving up they stand a moment)
    const from = gap(this.backFrom[k]), u = (st.iprog + f) / LEAVE;
    const prevCaught = this.st.slice(Math.max(0, k - st.iprog - 1), k).some((x) => x.caught);
    const route = [from, [from[0], 3.9], [-1.6, 4.3], [-1.6, 6.3], SEAT];
    if (u < 0.12) {
      if (prevCaught) return { mode: 'crouch', phase: 1 - smooth(u / 0.12), reach: 1, x: from[0], z: from[1], yaw: Math.PI, headYaw: 0, headPitch: 0.4 };
      return { mode: 'stand', x: from[0], z: from[1], yaw: Math.PI, headYaw: 0, headPitch: 0.2 };
    }
    const w = walk(route, 0, 1, (u - 0.12) / 0.88);
    return { mode: 'walk', ...w, phase: w.phase, headYaw: 0, headPitch: 0 };
  }
  personHead(s) { const p = this.person(s); return [p.x, p.mode === 'sit' ? 1.35 : p.mode === 'crouch' ? 1.1 : 1.65, p.z]; }
  robot(s, gazeTargets) {
    const r = super.robot(s, gazeTargets), k = this.i(s), f = clamp(s - k, 0, 1), st = this.st[k];
    // paused: the eye goes out and the head bows; it comes back on the step the pause ends
    const nxt = k + 1 < this.T ? this.st[k + 1] : st;
    let off = st.paused > 0 ? 1 : 0;
    if (st.caught) off = smooth((f - 0.8) / 0.15);
    if (st.paused === 1 && nxt.paused === 0) off = 1 - smooth((f - 0.5) / 0.4);
    r.eye = 1 - 0.94 * off;
    r.paused = off;
    if (off > 0) {      // head down, at the ground just in front of it
      const down = [r.x + Math.sin(r.yaw) * 0.5, 0.0, r.z + Math.cos(r.yaw) * 0.5];
      r.gaze = r.gaze.map((v, i) => v + (down[i] - v) * off);
    }
    // the eye-line is drawn for the light and for the person (attention entries 24 and 25)
    let n = 0; for (let j = k - 2; j <= k + 1; j++) { const o = this.gaze[clamp(j, 0, this.T - 1)].obj; n += (o === 24 || o === 25) ? 1 : 0; }
    r.eyeLine = smooth(n / 3) * (1 - off);
    return r;
  }
}
export { ROBOT_OFF, cellPos };
