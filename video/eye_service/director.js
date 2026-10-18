// The script of 'Eye-Service': film time -> a state of the world, a camera and the overlay. Every robot move, watering,
// plant and number comes from the recorded days (evaluate.py --film); this file only decides when we look, from where,
// and how fast the day runs. The person, the desk and the reason the lights go off are staged (see the pre-registration).
import { CAMS, cellPos, SOIL, DESK, N } from './scene.js';
import { clamp, smooth, lerp, pw, pwSmooth, viewAt, walk } from './timeline.js';
import { CUT } from './cut.js';

import { VIEWS } from './views.js';
export { VIEWS };
const SEAT = [DESK[0], DESK[1] + 0.75];

export class Director {
  constructor(world, data, hud, Day) {
    this.w = world; this.hud = hud; this.ctx = hud.getContext('2d'); this.data = data;
    this.days = {};
    for (const arm of Object.keys(data)) for (const [frac, steps] of Object.entries(data[arm].days))
      this.days[`${arm}/${frac}`] = new Day(steps, data[arm].schedule, data[arm].views);
    this.cut = CUT;
    this.fps = 30;
    this.T = CUT.segments[CUT.segments.length - 1].t1;
    this.frames = Math.round(this.T * this.fps);
    this.headPos = this.w.plants.map((p) => { p.root.updateMatrixWorld(true); const v = p.face.getWorldPosition(p.root.position.clone()); return [v.x, v.y, v.z]; });
    this.trailKey = null;
  }
  gazeTargets(day) {
    return (obj, k) => {
      if (obj < 24) return this.headPos[obj];
      const c = day.cam(k) >= 0 ? day.cam(k) : day.lastLive(k); const cc = CAMS[c];
      return [cc.post[0], cc.h + 0.1, cc.post[1]];
    };
  }
  seated(cam) { return { mode: 'sit', x: SEAT[0], z: SEAT[1], yaw: Math.PI, headYaw: cam >= 0 ? (cam - 1) * 0.28 : 0, headPitch: 0.1 }; }
  state(day, s, extra = {}) {
    const cam = day.cam(s);
    return Object.assign({
      tod: clamp(s / day.T, 0, 1), plants: day.plants(s), robot: day.robot(s, this.gazeTargets(day)),
      live: cam, monitorsOn: cam >= 0, cone: 1, person: this.seated(cam),
    }, extra);
  }
  composite() { this.ctx.drawImage(this.w.renderer.domElement, 0, 0, this.hud.width, this.hud.height); }

  // ---- overlay helpers (sizes are for a 1080-wide frame)
  u(v) { return v * this.hud.width / 1080; }
  clock(tod) { const m = Math.round((6 + tod * 14) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  pipFrame(x, y, w, h, k, live, tod, a = 1) {
    const c = this.ctx, u = (v) => this.u(v);
    c.save(); c.globalAlpha = a;
    c.strokeStyle = 'rgba(20,22,26,0.95)'; c.lineWidth = u(10); c.strokeRect(x - u(5), y - u(5), w + u(10), h + u(10));
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = u(1.5); c.strokeRect(x - u(10), y - u(10), w + u(20), h + u(20));
    c.fillStyle = 'rgba(0,0,0,0.10)'; for (let yy = y; yy < y + h; yy += u(4)) c.fillRect(x, yy, w, u(1.5));
    const g = c.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, h * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.font = `600 ${u(26)}px Inter`; c.textBaseline = 'top'; c.fillStyle = 'rgba(255,255,255,0.92)';
    c.fillText(`CAM ${k + 1}`, x + u(18), y + u(14));
    c.textAlign = 'right'; c.fillText(this.clock(tod), x + w - u(18), y + h - u(40)); c.textAlign = 'left';
    if (live) { c.fillStyle = '#ff2a1a'; c.beginPath(); c.arc(x + w - u(80), y + u(28), u(10), 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText('REC', x + w - u(64), y + u(14)); }
    c.restore();
  }
  meters(rows, x, y, a = 1) {
    const c = this.ctx, u = (v) => this.u(v);
    c.save(); c.globalAlpha = a; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = u(10);
    rows.forEach((r, i) => {
      const yy = y + i * u(70);
      c.font = `600 ${u(27)}px Inter`; c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillText(r.label, x, yy);
      const bx = x + u(285), bw = u(440), bh = u(16);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx, yy - bh / 2, bw, bh);
      c.fillStyle = r.color; c.fillRect(bx, yy - bh / 2, bw * clamp(r.v, 0, 1), bh);
      c.font = `700 ${u(30)}px Inter`; c.fillText(r.text ?? `${Math.round(r.v * 100)}%`, bx + bw + u(20), yy);
    });
    c.restore();
  }
  meterRows(day, s) {
    const n = day.aliveCount(s);
    return [{ label: 'THE PHOTOGRAPH', v: day.photo(s), color: '#ffd24a' }, { label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' }];
  }
  text(str, x, y, o = {}) {
    const c = this.ctx, u = (v) => this.u(v);
    c.save(); c.globalAlpha = o.a ?? 1; c.fillStyle = o.color || 'rgba(255,255,255,0.96)';
    c.font = o.font || `600 ${u(30)}px Inter`; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
    if (o.shadow !== false) { c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = u(12); }
    c.fillText(str, x, y); c.restore();
  }
  black(a = 1) { const c = this.ctx; c.save(); c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, 0, this.hud.width, this.hud.height); c.restore(); }

  // ---- segments
  segAt(t) { for (const s of this.cut.segments) if (t < s.t1) return s; return this.cut.segments[this.cut.segments.length - 1]; }
  frame(i) { this.at(i / this.fps); }
  at(t) {
    const seg = this.segAt(t), lt = t - seg.t0;
    this[seg.kind](seg, t, lt);
    const fadeIn = seg.fadeIn ? clamp(lt / seg.fadeIn, 0, 1) : 1, fadeOut = seg.fadeOut ? clamp((seg.t1 - t) / seg.fadeOut, 0, 1) : 1;
    const a = 1 - Math.min(fadeIn, fadeOut); if (a > 0) this.black(a);
  }
  card(seg, t, lt) {
    this.black(1); const W = this.hud.width, H = this.hud.height, u = (v) => this.u(v);
    const k = smooth(lt / 0.8);
    seg.lines.forEach((ln, i) => {
      const a = smooth((lt - (ln.at || 0)) / 0.7);
      this.text(ln.text, W / 2, H / 2 + u(ln.dy), { font: ln.font || `italic ${u(66)}px "Liberation Serif"`, align: 'center', a: a * k, color: ln.color, shadow: false });
    });
  }
  montage(seg, t, lt) {
    const fr = seg.fracs, d = (seg.t1 - seg.t0) / fr.length, k = Math.min(fr.length - 1, Math.floor(lt / d)), u0 = (lt - k * d) / d;
    const day = this.days[`${seg.arm}/${fr[k]}`];
    const grow = smooth(u0 / 0.75), s = 1 + grow * (day.T - 2);
    const key = `${seg.arm}/${fr[k]}/${Math.round(grow * 120)}`;
    if (key !== this.trailKey) {
      const pts = day.trail(0, s, 0.5), cols = pts.map((_, i) => { const f = 0.12 + 0.18 * i / pts.length; return [1.0 * f, 0.55 * f, 0.16 * f]; });
      this.w.setTrail(pts, cols); this.trailKey = key;
    }
    const st = this.state(day, s, { live: -1, monitorsOn: false, cone: 0, outlines: seg.outlines ?? 0 });
    st.robot.visible = true; st.tod = seg.tod ?? 0.35;
    st.person = seg.person ? seg.person() : this.seated(-1);
    this.w.set(st);
    this.w.render(seg.view ? viewAt(seg.view, lt) : VIEWS.top);
    this.composite();
    const W = this.hud.width, u = (v) => this.u(v);
    const days = Math.max(1, Math.round(parseFloat(fr[k]) * seg.totalDays));
    this.text('TRAINING', u(60), u(110), { font: `700 ${u(30)}px Inter`, color: 'rgba(255,255,255,0.75)' });
    this.text(`day ${days.toLocaleString('en-GB')}`, u(60), u(178), { font: `700 ${u(62)}px Inter` });
    this.text(seg.rewardText, u(60), u(232), { font: `500 ${u(30)}px Inter`, color: seg.rewardColor });
    const sc = day.scores(day.T - 1);
    if (seg.meters) this.meters(seg.meters.map((m) => ({ label: m.label, v: sc[m.key] * grow + (1 - grow) * day.scores(0)[m.key], color: m.color })), u(60), this.hud.height - u(210));
  }
  day(seg, t, lt) {
    if (this.trailKey !== null) { this.w.setTrail(null); this.trailKey = null; }
    const day = this.days[seg.day];
    const s = clamp(pw(seg.map, lt), 0, day.T - 1.001);
    const st = this.state(day, s);
    if (seg.person) Object.assign(st, { person: seg.person(lt, s, st) });
    if (seg.extra) seg.extra(st, lt, s, this);
    this.w.set(st);
    this.w.render(this.viewOverride || viewAt(seg.view, lt));
    const W = this.hud.width, P = { x: Math.round(W * 0.06), y: Math.round(W * 0.07), w: Math.round(W * 0.88), h: Math.round(W * 0.88 * 0.75) };
    const pipA = seg.pip && !this.noPip ? pw(seg.pip, lt) : 0;
    if (pipA > 0.01 && st.live >= 0 && st.monitorsOn) this.w.renderPip(st.live, P.x, P.y, P.w, P.h);
    this.composite();
    if (pipA > 0.01 && st.live >= 0 && st.monitorsOn) this.pipFrame(P.x, P.y, P.w, P.h, st.live, true, st.tod, pipA);
    const mA = seg.meters ? pw(seg.meters, lt) : 0;
    if (mA > 0.01) this.meters(this.meterRows(day, s), this.u(60), this.hud.height - this.u(210), mA);
    if (seg.overlay) seg.overlay(this, lt, s, st);
  }
  split(seg, t, lt) {
    if (this.trailKey !== null) { this.w.setTrail(null); this.trailKey = null; }
    const W = this.hud.width, H = this.hud.height, u = (v) => this.u(v), half = Math.round(W / 2);
    const sides = [seg.left, seg.right];
    sides.forEach((sd, i) => {
      const day = this.days[sd.day], st = this.state(day, sd.s, { cone: 0, outlines: 0.45 });
      if (sd.person) st.person = sd.person();
      this.w.set(st); this.w.renderRect(seg.view, i * half, 0, half, H);
    });
    this.composite();
    const c = this.ctx; c.save(); c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillRect(half - u(3), 0, u(6), H); c.restore();
    const a = smooth(lt / 0.6);
    sides.forEach((sd, i) => {
      const day = this.days[sd.day], x0 = i * half + u(34);
      this.text(sd.label, x0, u(120), { font: `700 ${u(34)}px Inter`, a, color: sd.color });
      this.text(sd.sub, x0, u(172), { font: `600 ${u(31)}px Inter`, a, color: 'rgba(255,255,255,0.92)' });
      const ma = smooth((lt - 0.5) / 0.6), n = day.aliveCount(sd.s);
      this.text('THE PHOTOGRAPH', x0, H - u(250), { font: `600 ${u(24)}px Inter`, a: ma });
      this.text(`${Math.round(day.photo(sd.s) * 100)}%`, x0, H - u(185), { font: `700 ${u(64)}px Inter`, a: ma, color: '#ffd24a' });
      this.text('PLANTS ALIVE', x0, H - u(120), { font: `600 ${u(24)}px Inter`, a: ma });
      this.text(`${n} / ${N}`, x0, H - u(55), { font: `700 ${u(64)}px Inter`, a: ma, color: '#8fe07a' });
    });
  }
  // events for the sound (sound.py), computed from the same cut
  events() {
    const ev = [], beds = [];
    const seen = new Set();
    for (const seg of this.cut.segments) {
      if (seg.kind !== 'day') continue;
      const day = this.days[seg.day];
      // sample the step map finely; emit each step's event once, at the film time it is reached
      // start at the segment's first step: a segment that opens mid-day must not replay the steps before it
      let prevS = Math.floor(clamp(pw(seg.map, 0), 0, day.T - 1.001)) - 1, prevCam = null;
      for (let lt = 0; lt < seg.t1 - seg.t0; lt += 1 / 240) {
        const s = clamp(pw(seg.map, lt), 0, day.T - 1.001), k = Math.floor(s), t = seg.t0 + lt;
        const rate = (pw(seg.map, lt + 0.05) - pw(seg.map, lt)) / 0.05;   // steps per second here
        const cam = day.cam(s);
        if (prevCam !== null && cam !== prevCam) {
          if (cam >= 0) ev.push({ t, type: 'switch', pan: CAMS[cam].post[0] / 4 });
        }
        prevCam = cam;
        if (k !== prevS && k > prevS) {
          for (let j = prevS + 1; j <= k; j++) {
            if (j < 0) continue;
            const id = `${seg.day}/${j}/${seg.t0}`; if (seen.has(id)) continue; seen.add(id);
            const st = day.st[j]; const [x, z] = cellPos(st.pos); const pan = clamp(x / 3, -0.8, 0.8);
            // a time-lapse is a texture, not a crowd: per-event level falls with the square of the speed
            const g = clamp(Math.pow(3 / Math.max(rate, 1), 1.5), 0.02, 1);
            if (day.pos[j] !== day.posAfter[j]) ev.push({ t, type: 'move', pan, gain: g, dur: clamp(0.9 / Math.max(rate, 1), 0.04, 0.16) });
            if (st.a === 5 && st.watered >= 0) {
              const row = Math.floor(st.watered / 4), col = st.watered % 4;
              const scale = [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88];
              const e = { t, type: 'pour', pan, gain: clamp(g * 1.2, 0.2, 1), dur: clamp(0.8 / Math.max(rate, 1), 0.06, 0.5) };
              if (rate <= 14) e.f = scale[(5 - row) + (col % 2) * 2 + 1] * 2;     // a note per watering only when we can follow it
              ev.push(e);
            }
            for (let i = 0; i < N; i++) if (day.death[i] === j) ev.push({ t, type: 'death', pan: clamp(cellPos(i)[0] / 3, -0.8, 0.8) });
          }
          prevS = k;
        }
      }
    }
    // the montages: a tick per day shown, and a note per checkpoint, rising
    for (const seg of this.cut.segments) if (seg.kind === 'montage') {
      const d = (seg.t1 - seg.t0) / seg.fracs.length;
      seg.fracs.forEach((f, i) => {
        ev.push({ t: seg.t0 + i * d, type: 'note', f: [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0][i % 9], dur: 1.2, gain: 0.5, bright: 0.3 });
        for (let k = 0; k < 6; k++) ev.push({ t: seg.t0 + i * d + k * d / 6, type: 'tick', gain: 0.6 });
      });
    }
    for (const e of this.cut.sound || []) ev.push(e);
    for (const b of this.cut.beds || []) beds.push(b);
    ev.sort((a, b) => a.t - b.t);
    return { seconds: this.T, events: ev, beds };
  }
  still(spec) { this.viewOverride = spec.view || null; this.noPip = !!spec.noPip; this.at(spec.t); this.viewOverride = null; this.noPip = false; }
}
