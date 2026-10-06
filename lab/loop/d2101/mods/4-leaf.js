// 4: LEAF - an organism can put part of its store into a leaf, a store in its own body that neither attack nor BITE can reach,
//   and a leaf catches light from the empty cells around it, more the bigger it is. It goes where the organism goes, starts
//   empty in every newborn, wastes slowly, and at death goes to the corpse.
// Prompted by: report-4. GUT and BITE are both selected (+0.32, t 6.9; +0.29, t 5.3), and BITE takes more than GUT now brings in
//   (2.7k against 1.7k per 1,000 ticks): the corpse economy is a food chain, and every income in it is something another
//   organism already had. Light is still the largest income (27.0k) and no module touches it; an organism eats only the light
//   of the cell it stands on, while 2,680 of 4,096 cells stand empty and hold about a quarter of the light capacity.
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
