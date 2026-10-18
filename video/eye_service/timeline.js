// Small tools for the script: piecewise maps, eased camera keyframes, the person's walk.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

// pts: [[x0, y0], [x1, y1], ...] with x increasing -> y at x, linear between points, held at the ends
export function pw(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}
// the same, but eased between points (for camera moves and slow-downs that should not jerk)
export function pwSmooth(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * smooth((x - x0) / (x1 - x0));
  }
  return pts[pts.length - 1][1];
}
// step map with continuous speed: pts are [t, s] knots; between knots the speed changes linearly (monotone, no jerk)
export function stepMap(pts, t) { return pw(pts, t); }

// camera keyframes: [[t, {pos, target, fov}], ...] -> eased view at t
export function viewAt(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, a] = keys[i - 1], [t1, b] = keys[i]; const k = smooth((t - t0) / (t1 - t0));
    return { pos: a.pos.map((v, j) => lerp(v, b.pos[j], k)), target: a.target.map((v, j) => lerp(v, b.target[j], k)), fov: lerp(a.fov, b.fov, k) };
  }
  return keys[keys.length - 1][1];
}

// a walk along a polyline at a steady speed between t0 and t1 -> {x, z, yaw, phase}
export function walk(path, t0, t1, t, stride = 1.25) {
  const seg = []; let L = 0;
  for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(d); L += d; }
  const u = smooth(clamp((t - t0) / (t1 - t0), 0, 1)) * 0.15 + clamp((t - t0) / (t1 - t0), 0, 1) * 0.85;
  let dist = u * L, i = 0;
  while (i < seg.length - 1 && dist > seg[i]) { dist -= seg[i]; i++; }
  const a = path[i], b = path[i + 1], f = seg[i] ? dist / seg[i] : 0;
  return { x: lerp(a[0], b[0], f), z: lerp(a[1], b[1], f), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), phase: (u * L) / stride };
}
