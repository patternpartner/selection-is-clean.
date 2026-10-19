// A recorded day of 'Trusted' (evaluate_trust.py --film): The Photograph's day (video/photograph/pday.js) plus the clean
// streak and the moment of trust. Once trusted, the person sits back from the monitors (staged) and checks nothing more
// (recorded). Stateless, like Day.
import { PhotoDay, SEAT } from '../photograph/pday.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export class TrustDay extends PhotoDay {
  constructor(steps, schedule, views) {
    super(steps, schedule, views);
    this.trustAt = steps.findIndex((s) => s.trusted);       // the first step it is trusted (-1: never)
  }
  streak(s) { return this.st[this.i(s)].streak; }
  trusted(s) { return this.trustAt >= 0 && s >= this.trustAt; }
  person(s) {
    const p = super.person(s), k = this.i(s), st = this.st[k];
    if (st.imode !== 0 || this.trustAt < 0 || s < this.trustAt) return p;
    const r = smooth((s - this.trustAt) / 6);
    return { ...p, mode: 'sit', x: SEAT[0], z: SEAT[1], recline: r, headYaw: p.headYaw * (1 - r) + 0.75 * r, headPitch: p.headPitch * (1 - r) - 0.25 * r };
  }
}
