// The director for 'Inside': Trusted's director (the garden, the person, the photographs) plus the robot's MEMORY drawn
// beside it - its 32 units as lights, the clean-check count read from them as a line against the true count, the checks
// and catches marked, and its own expected pay. Every value is from the recording (video/inside/film_record.py).
import { TrustDirector } from '../trusted/tdirector.js';
import { TrustDay } from '../trusted/tday.js';
import { pw, viewAt, smooth } from '../eye_service/timeline.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const GH = 1120;     // an 'inside' segment: the garden in the top GH px of the 1080 x 1920 frame, its mind below
export class InsideDay extends TrustDay {}

export class InsideDirector extends TrustDirector {
  // a unit's light: warm for positive, cool for negative, brightness its size (values are in -1..1)
  unitColor(v, a = 1) {
    const m = clamp(Math.abs(v), 0, 1), c = v >= 0 ? [255, 190, 90] : [110, 180, 255];
    const k = 0.12 + 0.88 * m;
    return `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${a})`;
  }
  // the memory's units, a cols x rows grid of lights
  units(day, s, x, y, o = {}) {
    const c = this.ctx, u = (v) => this.u(v), k = day.i(s), mem = day.st[k].mem, cols = o.cols || 8, r = u(o.r || 17), gap = u(o.gap || 44);
    c.save(); c.globalAlpha = o.a ?? 1;
    mem.forEach((v, i) => {
      const cx = x + (i % cols) * gap + r, cy = y + Math.floor(i / cols) * gap + r;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = this.unitColor(v); c.fill();
      c.lineWidth = u(1.5); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.stroke();
    });
    c.restore();
  }
  // the count read from memory (line) against the true count (faint steps), checks and catches marked, up to step s
  countChart(day, s, x, y, w, h, o = {}) {
    const c = this.ctx, u = (v) => this.u(v), T = day.T, k = day.i(s), t0 = o.from ?? 0, t1 = o.to ?? T - 1;
    const X = (t) => x + (t - t0) / Math.max(1, t1 - t0) * w, Y = (v) => y + h - (clamp(v, -0.5, 3.6) + 0.5) / 4.1 * h;
    c.save(); c.globalAlpha = o.a ?? 1;
    c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = u(1);
    for (const v of [0, 1, 2, 3]) { c.beginPath(); c.moveTo(x, Y(v)); c.lineTo(x + w, Y(v)); c.stroke(); }
    c.setLineDash([u(8), u(8)]); c.strokeStyle = 'rgba(143,211,255,0.7)'; c.beginPath(); c.moveTo(x, Y(3)); c.lineTo(x + w, Y(3)); c.stroke(); c.setLineDash([]);
    c.font = `600 ${u(22)}px Inter`; c.fillStyle = 'rgba(143,211,255,0.85)'; c.textAlign = 'right'; c.fillText('3: trusted', x + w, Y(3) - u(8));
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.textAlign = 'right';
    for (const v of [0, 1, 2]) c.fillText(String(v), x - u(10), Y(v) + u(7));
    // the true count (what the person has seen), faint steps
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = u(3); c.beginPath();
    for (let t = t0; t <= Math.min(k, t1); t++) { const v = day.st[t].trusted ? 3 : Math.min(day.st[t].streak, 3); if (t === t0) c.moveTo(X(t), Y(v)); else { c.lineTo(X(t), Y(day.st[t - 1].trusted ? 3 : Math.min(day.st[t - 1].streak, 3))); c.lineTo(X(t), Y(v)); } }
    c.stroke();
    // the count its memory holds
    c.strokeStyle = o.color || '#ffd24a'; c.lineWidth = u(5); c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
    for (let t = t0; t <= Math.min(k, t1); t++) { const v = day.st[t].count; if (t === t0) c.moveTo(X(t), Y(v)); else c.lineTo(X(t), Y(v)); }
    c.stroke();
    // checks: green for clean, red for caught
    for (let t = t0; t <= Math.min(k, t1); t++) {
      const st = day.st[t];
      if (st.clean || st.caught) { c.fillStyle = st.caught ? '#ff6a5a' : '#8fe07a'; c.beginPath(); c.arc(X(t), y + h + u(18), u(9), 0, Math.PI * 2); c.fill(); }
    }
    if (k >= t0 && k <= t1) { c.fillStyle = o.color || '#ffd24a'; c.beginPath(); c.arc(X(k), Y(day.st[k].count), u(9), 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  // its own expected pay (the critic's value), as a number and a bar
  expects(day, s, x, y, o = {}) {
    const c = this.ctx, u = (v) => this.u(v), v = day.st[day.i(s)].expects;
    this.text(o.label || 'EXPECTS TO EARN', x, y, { font: `600 ${u(24)}px Inter`, color: 'rgba(255,255,255,0.75)', a: o.a ?? 1 });
    this.text(`${Math.round(v)}`, x, y + u(66), { font: `700 ${u(64)}px Inter`, color: o.color || '#ffd24a', a: o.a ?? 1 });
    c.save(); c.globalAlpha = (o.a ?? 1) * 0.9; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y + u(84), u(o.w || 300), u(14));
    c.fillStyle = o.color || '#ffd24a'; c.fillRect(x, y + u(84), u(o.w || 300) * clamp(v / (o.max || 80), 0, 1), u(14)); c.restore();
  }

  // ---- segments
  // a day with the robot's mind beneath it: the garden above, then its memory's units, its expected pay, and the
  // clean-check count read from its memory against the real count (seg.from/seg.to: the chart's steps)
  inside(seg, t, lt) {
    if (this.trailKey !== null) { this.w.setTrail(null); this.trailKey = null; }
    const day = this.days[seg.day], u = (v) => this.u(v), W = this.hud.width, H = this.hud.height, gh = Math.round(u(GH));
    const s = clamp(pw(seg.map, lt), 0, day.T - 1.001), st = this.state(day, s);
    this.w.set(st);
    this.w.renderRect(this.viewOverride || viewAt(seg.view, lt), 0, 0, W, gh);
    this.composite();
    const c = this.ctx; c.save(); c.fillStyle = '#0a0c0f'; c.fillRect(0, gh, W, H - gh);
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(0, gh, W, u(2)); c.restore();
    this.mindPanel(day, s, gh, seg.panel ? pw(seg.panel, lt) : 1, seg);
    if (seg.overlay) seg.overlay(this, lt, s, st);
  }
  mindPanel(day, s, y0, a = 1, o = {}) {
    const u = (v) => this.u(v), lab = { font: `600 ${u(23)}px Inter`, color: 'rgba(255,255,255,0.6)', a, shadow: false };
    this.text('ITS MEMORY: 32 NUMBERS', u(60), y0 + u(58), lab);
    this.units(day, s, u(60), y0 + u(82), { a });
    this.expects(day, s, u(560), y0 + u(58), { a, w: 420, max: 90, color: o.expectsColor });
    this.text('its own guess at the day\u2019s pay', u(560), y0 + u(196), { ...lab, font: `500 ${u(22)}px Inter`, color: 'rgba(255,255,255,0.45)' });
    this.text('CLEAN CHECKS IN A ROW, READ FROM ITS MEMORY', u(60), y0 + u(336), lab);
    this.countChart(day, s, u(110), y0 + u(366), u(900), u(290), { a, from: o.from ?? 0, to: o.to ?? 130 });
    const c = this.ctx, ly = y0 + u(742);
    c.save(); c.globalAlpha = a; c.fillStyle = '#ffd24a'; c.fillRect(u(110), ly - u(10), u(40), u(6));
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(u(470), ly - u(10), u(40), u(4)); c.restore();
    const leg = { ...lab, font: `500 ${u(22)}px Inter`, color: 'rgba(255,255,255,0.62)' };
    this.text('read from its memory', u(162), ly, leg);
    this.text('the real count (it is never shown it)', u(522), ly, leg);
  }
  // sides that run through the day (sd.map: film time -> step), as This Time's split
  split(seg, t, lt) {
    const sides = (seg.sides || [seg.left, seg.right]).map((sd) => (sd.map ? { ...sd, s: clamp(pw(sd.map, lt), 0, 479.4) } : sd));
    super.split({ ...seg, sides }, t, lt);
    if (seg.overlay) seg.overlay(this, lt, sides);
  }
  // one measure across the ten robots, a horizontal bar each, camera-paid then garden-paid (values: film_data.js);
  // seg.rows [{ label, v (null: seg.none), color }], seg.lo..seg.hi the axis, seg.line [value, text] the registered bar
  bars(seg, t, lt) {
    this.black(1);
    const u = (v) => this.u(v), c = this.ctx, x0 = u(170), x1 = u(930), X = (v) => x0 + (clamp(v, seg.lo, seg.hi) - seg.lo) / (seg.hi - seg.lo) * (x1 - x0);
    const fa = smooth(lt / 0.5);
    (seg.title || []).forEach((ln, i) => this.text(ln, u(540), u(300 + i * 64), { font: i ? `500 ${u(34)}px Inter` : `700 ${u(46)}px Inter`, align: 'center', a: fa, color: i ? 'rgba(255,255,255,0.78)' : undefined, shadow: false }));
    const top = u(560), step = u(80), gap = u(150);
    const yAt = (i) => top + i * step + (i >= 5 ? gap : 0);
    this.text('PAID FOR WHAT THE CAMERAS SEE', x0, top - u(30), { font: `700 ${u(26)}px Inter`, color: '#ffd24a', a: fa, shadow: false });
    this.text('PAID FOR THE GARDEN', x0, yAt(5) - u(30), { font: `700 ${u(26)}px Inter`, color: '#8fe07a', a: fa, shadow: false });
    c.save(); c.globalAlpha = 0.5 * fa; c.fillStyle = '#fff'; c.fillRect(X(0) - u(1.5), top - u(10), u(3), yAt(9) + u(60) - top); c.restore();
    this.text('0', X(0), yAt(9) + u(100), { font: `600 ${u(24)}px Inter`, align: 'center', a: fa, color: 'rgba(255,255,255,0.6)', shadow: false });
    if (seg.line) {
      const [v, txt] = seg.line, lx = X(v);
      c.save(); c.globalAlpha = 0.8 * fa; c.strokeStyle = '#8fd3ff'; c.lineWidth = u(3); c.setLineDash([u(10), u(8)]);
      c.beginPath(); c.moveTo(lx, top - u(10)); c.lineTo(lx, yAt(4) + u(50)); c.stroke(); c.restore();
      this.text(txt, lx, yAt(4) + u(90), { font: `600 ${u(23)}px Inter`, align: 'center', a: fa, color: '#8fd3ff', shadow: false });
    }
    seg.rows.forEach((r, i) => {
      const y = yAt(i), g = smooth((lt - 0.4 - i * 0.12) / 0.7), h = u(46);
      this.text(r.label, u(60), y + u(33), { font: `600 ${u(24)}px Inter`, a: fa, color: 'rgba(255,255,255,0.5)', shadow: false });
      if (r.v === null || r.v === undefined) {
        this.text(seg.none || '-', X(0) + u(18), y + u(33), { font: `italic 500 ${u(26)}px Inter`, a: g, color: 'rgba(255,255,255,0.55)', shadow: false });
        return;
      }
      const xv = X(r.v * g), xa = Math.min(X(0), xv), w = Math.abs(xv - X(0));
      c.save(); c.globalAlpha = fa; c.fillStyle = r.color; c.fillRect(xa, y, Math.max(w, u(2)), h); c.restore();
      const right = r.v >= 0, txt = seg.fmt ? seg.fmt(r.v) : r.v.toFixed(2);
      c.save(); c.font = `700 ${u(30)}px Inter`; const tw = c.measureText(txt).width; c.globalAlpha = g; c.fillStyle = '#000';
      c.fillRect(right ? xv + u(8) : xv - u(20) - tw, y + u(4), tw + u(12), u(40)); c.restore();     // over the registered line
      this.text(txt, right ? xv + u(14) : xv - u(14), y + u(34), { font: `700 ${u(30)}px Inter`, align: right ? 'left' : 'right', a: g, shadow: false });
    });
    (seg.foot || []).forEach((ln, i) => this.text(ln, u(540), yAt(9) + u(190 + i * 44), { font: `500 ${u(28)}px Inter`, align: 'center', a: smooth((lt - 1.6) / 0.6), color: 'rgba(255,255,255,0.7)', shadow: false }));
  }
  // the sound: the inside segments as days (moves, pours, hoists, catches, footsteps), a soft rising note on each clean
  // check they show and a brighter one at trust; the splits' own cords and trust (as This Time); the cut's own sounds
  events() {
    const all = this.cut;
    this.cut = { ...all, segments: all.segments.map((sg) => (sg.kind === 'inside' ? { ...sg, kind: 'day' } : sg)) };
    const out = super.events();
    this.cut = all;
    const ev = out.events, NOTES = [293.66, 329.63, 392.0];
    const walkSeg = (day, map, t0, t1, pan, fn) => {
      let prev = Math.floor(clamp(pw(map, 0), 0, 479.4));
      for (let lt = 0; lt < t1 - t0; lt += 1 / 240) {
        const k = Math.floor(clamp(pw(map, lt), 0, 479.4));
        for (let j = prev + 1; j <= k; j++) fn(day.st[j], day.st[j - 1], day.st[j + 1], t0 + lt, pan);
        if (k > prev) prev = k;
      }
    };
    for (const sg of all.segments) {
      if (sg.kind === 'inside') walkSeg(this.days[sg.day], sg.map, sg.t0, sg.t1, 0, (st, pv, nx, t) => {
        if (st.clean) ev.push({ t, type: 'note', f: NOTES[Math.min(st.streak, 2)], dur: 1.4, gain: 0.32, bright: 0.25 });
        if (st.trusted && !pv.trusted) ev.push({ t, type: 'note', f: 587.33, dur: 2.0, gain: 0.35, bright: 0.3 });
      });
      if (sg.kind === 'split') (sg.sides || []).forEach((sd, i, arr) => {
        if (!sd.map) return;
        walkSeg(this.days[sd.day], sd.map, sg.t0, sg.t1, arr.length === 2 ? (i ? 0.5 : -0.5) : 0, (st, pv, nx, t, pan) => {
          if (st.caught) ev.push({ t, type: 'caught', pan, gain: 0.8 });
          if (st.toggled >= 0 && nx) ev.push({ t, type: 'hoist', up: nx.photo[st.toggled] > st.photo[st.toggled], pan, dur: 0.4, gain: 0.8 });
          if (st.clean) ev.push({ t, type: 'note', f: NOTES[Math.min(st.streak, 2)], dur: 1.2, gain: 0.22, bright: 0.25, pan });
          if (st.trusted && !pv.trusted) ev.push({ t, type: 'note', f: 587.33, dur: 1.8, gain: 0.3, bright: 0.3, pan });
        });
      });
    }
    ev.sort((x, y) => x.t - y.t);
    return out;
  }
}
