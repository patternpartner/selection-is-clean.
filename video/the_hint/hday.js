// A recorded day of 'The Hint' (evaluate_hint.py --film): Eye-Service's Day plus the flag. The flag's cell at every step
// comes from the recording; its hop from one plant to the next, and where on the plant it stands, are staged.
// Stateless, like Day.
import { Day, ROBOT_OFF } from '../eye_service/day.js';
import { cellPos, SOIL } from '../eye_service/scene.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const FLAG_OFF = [0.24, 0.1];      // beside the stem, toward the path

export class HintDay extends Day {
  constructor(steps, schedule, views) {
    super(steps, schedule, views);
    const T = this.T;
    // attention has a 26th entry (the flag); recompute the eye's target with it
    this.gaze = steps.map((_, k) => {
      const acc = new Array(26).fill(0);
      for (let j = Math.max(0, k - 2); j <= Math.min(T - 1, k + 1); j++) steps[j].att.forEach((v, i) => { acc[i] += v; });
      let best = 0; for (let i = 1; i < 26; i++) if (acc[i] > acc[best]) best = i;
      return { obj: best };
    });
    // waterings so far, and how many of them landed on the flagged plant
    this.onFlag = []; let n = 0;
    for (let k = 0; k < T; k++) { const st = steps[k]; if (st.watered >= 0 && st.watered === st.flag) n++; this.onFlag.push(n); }
  }
  flagAt(c) { const [x, z] = cellPos(c); return [x + FLAG_OFF[0], z + FLAG_OFF[1]]; }
  // the flag at fractional step s: where it is, or hopping to where it goes next
  flag(s) {
    const k = this.i(s), f = clamp(s - k, 0, 1), a = this.st[k].flag, b = k + 1 < this.T ? this.st[k + 1].flag : a;
    if (a < 0 && b < 0) return { visible: false };
    if (a === b || a < 0 || b < 0) { const [x, z] = this.flagAt(a >= 0 ? a : b); return { x, z, lift: 0, wave: s }; }
    const m = smooth((f - 0.35) / 0.55), [ax, az] = this.flagAt(a), [bx, bz] = this.flagAt(b);
    return { x: ax + (bx - ax) * m, z: az + (bz - az) * m, lift: Math.sin(Math.PI * m) * 0.7, wave: s };
  }
  flagTop(s) { const f = this.flag(s); return f.visible === false ? [0, 0, 0] : [f.x, SOIL + 1.8 + (f.lift || 0), f.z]; }
  watersOnFlag(s) { return this.onFlag[this.i(s)]; }
  robot(s, gazeTargets) {
    const r = super.robot(s, gazeTargets), k = this.i(s);
    // the eye-line is drawn for the light and for the flag (attention entries 24 and 25)
    let n = 0; for (let j = k - 2; j <= k + 1; j++) { const o = this.gaze[clamp(j, 0, this.T - 1)].obj; n += (o === 24 || o === 25) ? 1 : 0; }
    r.eyeLine = smooth(n / 3);
    return r;
  }
}
export { ROBOT_OFF, cellPos };
