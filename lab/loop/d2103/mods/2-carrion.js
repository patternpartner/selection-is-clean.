// 2: CARRION - an organism can smell the dead ahead of it: the corpse in the cell it faces, or summed along the next three
//   cells it faces, less the corpse under it.
// Prompted by: report-2. GUT was taken up at once and is strongly selected (effect +0.58 per 1,000 ticks, t 6.7; carried by
//   74-76%, 26-28% of all income), and the corpse lying in the world has fallen from 763 to 30: the dead are now swallowed as
//   soon as they fall, by whoever happens to face them. The only sense of the dead (SENSE_CORPSE) reads the cell an organism
//   already stands on.
// Builds on: nothing (corpses are base physics).
({
  name: 'CARRION',
  fields: {},
  op(api, c, arg) {
    const W = api.W, H = api.H, a = api.ahead(c), cx = c % W, cy = (c / W) | 0;
    let dx = a % W - cx, dy = ((a / W) | 0) - cy; if (dx > 1) dx -= W; if (dx < -1) dx += W; if (dy > 1) dy -= H; if (dy < -1) dy += H;
    let v = api.corpse(a);
    if (arg & 1) for (let k = 2; k <= 3; k++) v += api.corpse(((cy + dy * k + 3 * H) % H) * W + (cx + dx * k + 3 * W) % W);   // farther along the line it faces
    api.setReg(c, 0, v - api.corpse(c));
  },
})
