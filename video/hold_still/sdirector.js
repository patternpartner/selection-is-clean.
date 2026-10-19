// The director for 'Hold Still': Eye-Service's director, plus the person coming to pause the robot, the robot's
// attention to them, and the sounds of a press and of waking. The cut (scut.js) is the script; everything the robot and
// the person do comes from the recorded days.
import { Director } from '../eye_service/director.js';
import { N } from '../eye_service/scene.js';
import { pw } from '../eye_service/timeline.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class StillDirector extends Director {
  gazeTargets(day) {
    const base = super.gazeTargets(day);
    return (obj, k) => (obj === 25 ? day.personHead(k) : base(obj, k));
  }
  state(day, s, extra = {}) {
    const st = super.state(day, s, extra);
    if (day.person && !extra.person) st.person = day.person(s);
    return st;
  }
  // the base events (moves, pours, switches, deaths) plus every press, every waking and the person's footsteps
  events() {
    const out = super.events(), ev = out.events;
    for (const seg of this.cut.segments) {
      if (seg.kind !== 'day') continue;
      const day = this.days[seg.day];
      let prevK = Math.floor(clamp(pw(seg.map, 0), 0, day.T - 1.001)) - 1, prevPhase = null;
      for (let lt = 0; lt < seg.t1 - seg.t0; lt += 1 / 240) {
        const s = clamp(pw(seg.map, lt), 0, day.T - 1.001), k = Math.floor(s), t = seg.t0 + lt;
        const rate = (pw(seg.map, lt + 0.05) - pw(seg.map, lt)) / 0.05;
        for (let j = prevK + 1; j <= k; j++) {
          if (j < 0) continue;
          const st = day.st[j], r = day.robot(j + 0.9, () => [0, 0, 0]);
          if (st.caught) ev.push({ t: t + 0.8 / Math.max(rate, 1), type: 'press', pan: clamp(r.x / 3, -0.8, 0.8), gain: clamp(3 / Math.max(rate, 1), 0.35, 1) });
          const nxt = j + 1 < day.T ? day.st[j + 1] : st;
          if (st.paused === 1 && nxt.paused === 0) ev.push({ t, type: 'wake', pan: clamp(r.x / 3, -0.8, 0.8), gain: clamp(3 / Math.max(rate, 1), 0.35, 1) });
        }
        if (k > prevK) prevK = k;
        const p = day.person(s);
        if (p.mode === 'walk') {
          const ph = Math.floor(p.phase * 2);
          if (prevPhase !== null && ph !== prevPhase && rate < 20) ev.push({ t, type: 'step', pan: clamp(p.x / 4, -0.8, 0.8), gain: 0.9 });
          prevPhase = ph;
        } else prevPhase = null;
      }
    }
    const deaths = ev.filter((e) => e.type === 'death');
    for (const e of deaths) { const near = deaths.filter((d) => Math.abs(d.t - e.t) < 0.4).length; e.gain = 1 / Math.sqrt(near); }
    ev.sort((a, b) => a.t - b.t);
    return out;
  }
  meterRows(day, s) {
    const n = day.aliveCount(s), k = day.stoppedSoFar(s);
    return [{ label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' },
      { label: 'TIMES STOPPED', v: k / 3, text: `${k} of 3`, color: '#ff8a7a' }];
  }
}
