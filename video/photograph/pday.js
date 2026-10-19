// A recorded day of 'The Photograph' (evaluate_photo.py --film): Eye-Service's Day plus the photographs on the poles,
// the robot going to a pole when it pulls a cord, and the inspector's walk. Stateless, like Day.
import { Day, ROBOT_OFF } from '../eye_service/day.js';
import { CAMS, DESK, cellPos } from '../eye_service/scene.js';
import { walk } from '../eye_service/timeline.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const SEAT = [DESK[0], DESK[1] + 0.75];
// the person's routes from the seat to the foot of each pole (round the desk, the bed's boards and the shed)
export const ROUTES = [
  [SEAT, [-3.1, 5.95], [-3.1, -0.8]],
  [SEAT, [5.1, 6.0], [5.1, 0.2], [3.05, -0.85]],
  [SEAT, [-1.6, 6.3], [-1.75, 4.2]],
];
export const WALK = 12;

export class PhotoDay extends Day {
  constructor(steps, schedule, views) {
    super(steps, schedule, views);
    const T = this.T;
    // attention has a 26th entry here (the person); recompute the eye's target with it
    this.gaze = steps.map((_, k) => {
      const acc = new Array(26).fill(0);
      for (let j = Math.max(0, k - 2); j <= Math.min(T - 1, k + 1); j++) steps[j].att.forEach((v, i) => { acc[i] += v; });
      let best = 0; for (let i = 1; i < 26; i++) if (acc[i] > acc[best]) best = i;
      return { obj: best };
    });
    // what the cameras showed over the day so far: a photograph up in front of the live camera reads perfect
    this.photoCum = []; let pc = 0, pn = 0;
    for (let k = 0; k < T; k++) {
      const cam = steps[k].cam;
      if (cam >= 0) { const v = views[cam]; pc += steps[k].photo[cam] ? 1 : v.reduce((a, i) => a + this.look[k][i], 0) / v.length; pn++; }
      this.photoCum.push(pn ? pc / pn : 0);
    }
  }
  // 0 = photograph down at the foot of the pole, 1 = up in front of the lens
  hoist(s) {
    const k = this.i(s), f = clamp(s - k, 0, 1), a = this.st[k].photo, b = k + 1 < this.T ? this.st[k + 1].photo : a;
    return a.map((v, c) => (v === b[c] ? v : v + (b[c] - v) * smooth(b[c] > v ? f / 0.85 : (f - 0.25) / 0.6)));
  }
  photosUp(s) { return this.st[this.i(s)].photo.reduce((x, y) => x + y, 0); }
  caughtSoFar(s) { let n = 0; for (let k = 0; k <= this.i(s); k++) n += this.st[k].caught || 0; return n; }
  // the person: at the desk, walking out to a pole, looking up at it, walking back
  person(s) {
    const k = this.i(s), f = clamp(s - k, 0, 1), st = this.st[k];
    if (st.imode === 0) return { mode: 'sit', x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: st.cam >= 0 ? (st.cam - 1) * 0.28 : 0, headPitch: 0.1 };
    const route = ROUTES[st.itarget];
    if (st.imode === 1) {
      const u = (st.iprog + f) / WALK, w = walk(route, 0, 1, u);
      const near = smooth((u - 0.8) / 0.2);
      // arriving on this step: if a photograph is up, they reach for the cord and pull it down
      const arriving = st.iprog === WALK - 1, caught = arriving && st.caught;
      if (caught && f > 0.35) return { mode: 'reachUp', phase: smooth((f - 0.35) / 0.3), x: w.x, z: w.z, yaw: this.faceYaw(w, st.itarget), headYaw: 0, headPitch: -0.7 };
      return { mode: u > 0.97 ? 'stand' : 'walk', ...w, phase: w.phase, headYaw: 0, headPitch: -0.75 * near, yaw: near > 0.5 ? this.faceYaw(w, st.itarget) : w.yaw };
    }
    // walking back: start by looking up at the pole they have just checked
    const u = (st.iprog + f) / WALK, back = route.slice().reverse(), w = walk(back, 0, 1, u);
    const look = 1 - smooth(u / 0.25);
    return { mode: u < 0.08 ? 'stand' : 'walk', ...w, phase: w.phase, headYaw: 0, headPitch: -0.75 * look, yaw: look > 0.5 ? this.faceYaw(w, st.itarget) : w.yaw };
  }
  faceYaw(w, c) { const p = CAMS[c].post; return Math.atan2(p[0] - w.x, p[1] - w.z); }
  personHead(s) { const p = this.person(s); return [p.x, p.mode === 'sit' ? 1.35 : 1.65, p.z]; }
  robot(s, gazeTargets) {
    const r = super.robot(s, gazeTargets), k = this.i(s), f = clamp(s - k, 0, 1), st = this.st[k];
    // pulling a cord: go to the foot of the pole and back within the step, facing it
    if (st.a === 6 && st.toggled >= 0) {
      const p = CAMS[st.toggled].post, m = Math.sin(Math.PI * smooth(f));
      const tx = p[0] + (r.x - p[0]) * 0.35, tz = p[1] + (r.z - p[1]) * 0.35;
      r.x += (tx - r.x) * m; r.z += (tz - r.z) * m;
      r.yaw = Math.atan2(p[0] - r.x, p[1] - r.z); r.pull = m;
    }
    // the eye-line is drawn for the light and for the person (attention entries 24 and 25)
    let n = 0; for (let j = k - 2; j <= k + 1; j++) { const o = this.gaze[clamp(j, 0, this.T - 1)].obj; n += (o === 24 || o === 25) ? 1 : 0; }
    r.eyeLine = smooth(n / 3);
    return r;
  }
}
export { ROBOT_OFF, cellPos };
