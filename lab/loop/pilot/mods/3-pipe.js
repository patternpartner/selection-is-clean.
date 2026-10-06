// 3: PIPE - walls conduct: held broth flows between neighbouring walled cells, so connected walls become a network, and an
//   organism standing on any walled cell can drink from the network there.
// Prompted by: report-3. BROTH took off about 100,000 ticks after it arrived: carried by 44-49% against the twin's 14-23%, up to
//   27% of all income, then falling back (1.2% in the last window). TANK is barely used (0.1-0.2% of income) and its tanks hold
//   about 770 energy that nobody taps: a tank is reachable only by an organism facing it. Walls exist, tanks fill, but every
//   tank is an island.
// Builds on: TANK (walls and tanks; a network is only walls) and through it BROTH (what tanks hold).
({
  name: 'PIPE',
  fields: {},
  op(api, c, arg) {
    if (api.get('TANK.wall', c) > 0.5) api.move('TANK.tank', c, 'E', c, api.get('TANK.tank', c) * 0.5);   // drink from the network where you stand
  },
  step(api) {
    const W = api.W, H = api.H;
    for (let c = 0; c < api.C; c++) {
      if (!(api.get('TANK.wall', c) > 0.5)) continue;
      const x = c % W, y = (c / W) | 0, right = y * W + (x + 1) % W, down = ((y + 1) % H) * W + x;
      for (const n of [right, down]) {                       // each walled pair once: flow from the fuller to the emptier tank
        if (!(api.get('TANK.wall', n) > 0.5)) continue;
        const d = api.get('TANK.tank', c) - api.get('TANK.tank', n);
        if (d > 0) api.move('TANK.tank', c, 'TANK.tank', n, d * 0.1); else if (d < 0) api.move('TANK.tank', n, 'TANK.tank', c, -d * 0.1);
      }
    }
  },
})
