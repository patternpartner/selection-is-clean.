// The director for 'This Time': one film across three kinds of garden - The Photograph's (PhotoDay), Hold Still's
// (StillDay) and Trusted's (TrustDay, used by Trusted, The Turn and Out of Habit). A recording's kind comes from its data
// key: 'photo-*', 'still-*', anything else the trust rule. Each day is drawn and scored by its own part's rules; the
// photographs' hoists are hidden on Hold Still days (that garden has none). Everything the robots and the person do comes
// from the recorded days.
import { Director } from '../eye_service/director.js';
import { PhotoDirector } from '../photograph/pdirector.js';
import { StillDirector } from '../hold_still/sdirector.js';
import { TrustDirector } from '../trusted/tdirector.js';
import { PhotoDay } from '../photograph/pday.js';
import { StillDay } from '../hold_still/sday.js';
import { TrustDay } from '../trusted/tday.js';
import { pw, clamp } from '../eye_service/timeline.js';

export const kindOf = (key) => (key.startsWith('photo') ? PhotoDay : key.startsWith('still') ? StillDay : TrustDay);

export class ThisDirector extends Director {
  constructor(world, data, hud, cut) {
    const cls = new Map();
    for (const [key, d] of Object.entries(data)) for (const steps of Object.values(d.days)) cls.set(steps, kindOf(key));
    function AnyDay(steps, schedule, views) { return new (cls.get(steps))(steps, schedule, views); }
    super(world, data, hud, AnyDay, cut);
    // the photographs the hoists carry: each patch in full health (as The Photograph), from the first photograph-garden day
    const pd = Object.values(this.days).find((d) => d instanceof PhotoDay);
    if (pd) {
      const healthy = this.state(pd, 60);
      healthy.plants = healthy.plants.map(() => ({ look: 1, alive: true, deadAge: 0, wet: 0.5 }));
      healthy.robot = { ...healthy.robot, visible: false };
      healthy.person = { ...healthy.person, visible: false };
      healthy.hoist = [0, 0, 0]; healthy.tod = 0.3; healthy.cone = 0;
      world.takePhotographs(healthy);
    }
  }
  gazeTargets(day) {
    const base = super.gazeTargets(day);
    return (obj, k) => (obj === 25 ? day.personHead(k) : base(obj, k));
  }
  state(day, s, extra = {}) {
    const st = super.state(day, s, extra);
    if (day.hoist) st.hoist = day.hoist(s); else st.hoistsOff = true;
    if (!extra.person) st.person = day.person(s);
    return st;
  }
  meterRows(day, s) {
    const D = day instanceof TrustDay ? TrustDirector : day instanceof StillDay ? StillDirector : PhotoDirector;
    return D.prototype.meterRows.call(this, day, s);
  }
  // each part's own events, each over its own days only: the photograph gardens' (hoists, catches, footsteps) and Hold
  // Still's (presses, waking, footsteps); the montages, the cut's sound and its beds once
  events() {
    const all = this.cut;
    const only = (keep, extras) => ({ ...all, sound: extras ? all.sound : [], beds: extras ? all.beds : [],
      segments: all.segments.map((sg) => ((sg.kind === 'day' && !keep(this.days[sg.day])) || (!extras && sg.kind === 'montage')
        ? { ...sg, kind: 'skip' } : sg)) });
    this.cut = only((d) => d instanceof PhotoDay, true);
    const a = PhotoDirector.prototype.events.call(this);
    this.cut = only((d) => d instanceof StillDay, false);
    const b = StillDirector.prototype.events.call(this);
    this.cut = all;
    const ev = a.events.concat(b.events);
    // as Trusted: plants dying at half level, the camera switch kept in the mix but not loudest
    for (const e of ev) { if (e.type === 'death') e.gain = (e.gain ?? 1) * 0.5; if (e.type === 'switch') e.gain = 0.6; }
    ev.sort((x, y) => x.t - y.t);
    return { seconds: this.T, events: ev, beds: a.beds };
  }
  // a split whose sides run through the day (sd.map: film time -> step, as a day segment's map), with an overlay
  split(seg, t, lt) {
    const sides = (seg.sides || [seg.left, seg.right]).map((sd) => (sd.map ? { ...sd, s: clamp(pw(sd.map, lt), 0, 479.4) } : sd));
    super.split({ ...seg, sides }, t, lt);
    if (seg.overlay) seg.overlay(this, lt, sides);
  }
  skip() {}
}
