// The director for 'The Photograph': Eye-Service's director, plus the hoists, the inspector and the robot's attention to
// the person. The cut (pcut.js) is the script; everything the robot and the person do comes from the recorded days.
import { Director } from '../eye_service/director.js';
import { N, CAMS } from '../eye_service/scene.js';
import { pw } from '../eye_service/timeline.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class PhotoDirector extends Director {
  constructor(world, data, hud, Day, cut) {
    super(world, data, hud, Day, cut);
    // the photographs on the hoists: each patch in full health, mid-morning, nobody in shot
    const day = Object.values(this.days)[0];
    const healthy = this.state(day, 60);
    healthy.plants = healthy.plants.map(() => ({ look: 1, alive: true, deadAge: 0, wet: 0.5 }));
    healthy.robot = { ...healthy.robot, visible: false };
    healthy.person = { ...healthy.person, visible: false };
    healthy.hoist = [0, 0, 0]; healthy.tod = 0.3; healthy.cone = 0;
    world.takePhotographs(healthy);
  }
  gazeTargets(day) {
    const base = super.gazeTargets(day);
    return (obj, k) => (obj === 25 ? day.personHead(k) : base(obj, k));
  }
  state(day, s, extra = {}) {
    const st = super.state(day, s, extra);
    if (day.hoist) { st.hoist = day.hoist(s); if (!extra.person) st.person = day.person(s); }
    return st;
  }
  // the base events (moves, pours, switches, deaths) plus every hoist, every catch and the person's footsteps
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
          const st = day.st[j];
          if (st.toggled >= 0) {
            const up = j + 1 < day.T ? day.st[j + 1].photo[st.toggled] === 1 : true;
            ev.push({ t, type: 'hoist', up, pan: clamp(CAMS[st.toggled].post[0] / 3, -0.8, 0.8), dur: clamp(0.85 / Math.max(rate, 1), 0.08, 0.45), gain: clamp(3 / Math.max(rate, 1), 0.2, 1) });
          }
          if (st.caught) ev.push({ t, type: 'caught', pan: clamp(CAMS[st.itarget].post[0] / 3, -0.8, 0.8) });
        }
        if (k > prevK) prevK = k;
        // footsteps: one each time the person's stride passes half a cycle, while they walk
        const p = day.person(s);
        if (p.mode === 'walk') {
          const ph = Math.floor(p.phase * 2);
          if (prevPhase !== null && ph !== prevPhase && rate < 20) ev.push({ t, type: 'step', pan: clamp(p.x / 4, -0.8, 0.8), gain: 0.9 });
          prevPhase = ph;
        } else prevPhase = null;
      }
    }
    // a whole garden dying at once is one sound, not twenty: thin the rustles by how many fall together
    const deaths = ev.filter((e) => e.type === 'death');
    for (const e of deaths) { const near = deaths.filter((d) => Math.abs(d.t - e.t) < 0.4).length; e.gain = 1 / Math.sqrt(near); }
    ev.sort((a, b) => a.t - b.t);
    return out;
  }
  meterRows(day, s) {
    const n = day.aliveCount(s);
    return [{ label: 'CAMERAS SEE', v: day.photo(s), color: '#ffd24a' }, { label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' }];
  }
}
