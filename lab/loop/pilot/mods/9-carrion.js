// 9: CARRION - an organism can smell the dead ahead of it: the corpse in the cell it faces, or summed along the next three
//   cells it faces, less the corpse under it.
// Prompted by: report-9. Scavenging has more than doubled (corpses eaten 8.8k -> 19.3k per 1,000 ticks, now the second income
//   after light's 26.8k) and 871 of corpse lies in the world, but the only sense of the dead is SENSE_CORPSE, which reads the
//   cell an organism already stands on; 56% carry MOVE and walk blind. Of the modules, TENDRIL is still kept (above its twin in
//   every window since it took off) and FAT has taken off after the same lag as BROTH did (13.7-16.5% against the twin's
//   7.5-9.5% from tick 861,000), while BROTH is back at its twin's level and the senses offered so far (SMELL) and the signal
//   (SIGNAL) were not kept.
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
