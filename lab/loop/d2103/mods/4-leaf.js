// 4: LEAF - an organism can put part of its store into a leaf, a store in its own body that attack cannot reach, and a leaf
//   catches light from the empty cells around it, more the bigger it is. It goes where the organism goes, starts empty in
//   every newborn, wastes slowly, and at death goes to the corpse.
// Prompted by: report-4. GUT is selected again (+0.44, t 7.0; carried by 78%), corpse eaten in place has fallen to 1.5k per 1,000
//   ticks and only 37 of corpse lies in the world: the dead are taken as fast as they fall. SQUEEZE (+0.11, t 1.0) and CARRION
//   (-0.03) are not told from zero. Light is still the largest income (27.1k) and no module touches it; an organism eats only
//   the light of the cell it stands on, while about two thirds of the cells stand empty and hold about a quarter of the light
//   capacity.
// Builds on: nothing (light is base physics; the leaf is a body field).
({
  name: 'LEAF',
  fields: { leaf: { energy: true, body: true } },
  op(api, c, arg) { api.move('E', c, 'leaf', c, api.E(c) * 0.25); },          // grow: put a quarter of what you carry into leaf
  step(api) {
    for (let c = 0; c < api.C; c++) {
      const L = api.get('leaf', c); if (!(L > 0)) continue;
      const f = 0.5 * L / (L + 1);                                                // a bigger leaf catches more, never more than half
      for (let t = 0; t < 8; t++) { const n = api.ahead(c, t); if (!api.alive(n)) api.move('light', n, 'E', c, api.get('light', n) * f); }
    }
    api.decay('leaf', 0.001);                                                        // upkeep: a leaf wastes slowly
  },
})
