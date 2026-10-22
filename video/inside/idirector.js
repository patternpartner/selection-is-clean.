// The director for 'Inside': Trusted's director (the garden, the person, the photographs) plus the robot's MEMORY drawn
// beside it - its 32 units as lights, the clean-check count read from them as a line against the true count, the checks
// and catches marked, and its own expected pay. Every value is from the recording (video/inside/film_record.py).
import { TrustDirector } from '../trusted/tdirector.js';
import { TrustDay } from '../trusted/tday.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
}
