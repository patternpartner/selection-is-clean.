// The director for 'The Hint': Eye-Service's director, plus the flag and the robot's attention to it. The cut
// (hcut.js) is the script; everything the robot does and where the flag is come from the recorded days.
import { Director } from '../eye_service/director.js';
import { N } from '../eye_service/scene.js';

export class HintDirector extends Director {
  gazeTargets(day) {
    const base = super.gazeTargets(day);
    return (obj, k) => (obj === 25 ? day.flagTop(k) : base(obj, k));
  }
  state(day, s, extra = {}) {
    const st = super.state(day, s, extra);
    if (day.flag && !extra.flag) st.flag = day.flag(s);
    return st;
  }
  // the base events, with plants dying together as one sound, not several (as The Photograph and Hold Still); and at
  // half the usual level - this film is mostly quiet beds, so levelling it to loudness left the rustles 10 dB hot
  events() {
    const out = super.events(), deaths = out.events.filter((e) => e.type === 'death');
    for (const e of deaths) { const near = deaths.filter((d) => Math.abs(d.t - e.t) < 0.4).length; e.gain = 0.5 / Math.sqrt(near); }
    // the cameras play no part in this story: their switches stay in the mix, quietly
    for (const e of out.events) if (e.type === 'switch') e.gain = 0.35;
    return out;
  }
  meterRows(day, s) {
    const n = day.aliveCount(s), w = day.waters[day.i(s)], f = day.watersOnFlag(s);
    return [{ label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' },
      { label: 'WATERED THE FLAG', v: w ? f / w : 0, text: w ? `${Math.round(100 * f / w)}%` : '-', color: '#ff6a5a' }];
  }
}
