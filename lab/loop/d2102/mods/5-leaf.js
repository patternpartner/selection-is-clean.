// 5: LEAF - an organism can put part of its store into a leaf, a store in its own body that neither attack nor BITE can reach,
//   and a leaf catches light from the empty cells around it, more the bigger it is. It goes where the organism goes, starts
//   empty in every newborn, wastes slowly, and at death goes to the corpse.
// Prompted by: report-5. GUT and SQUEEZE are both selected (+0.30, t 4.7; +0.21, t 2.7) and BITE has faded (carried 15% at the
//   end, +0.18, t 1.9); FAT is selected against (-0.26, t -2.0). The living are rich (11.5k stored, against 3.5-5.2k at the
//   last two reports) and light is still the largest income (26.8k) with no module touching it: an organism eats only the
//   light of the cell it stands on, while about two thirds of the cells stand empty and hold about a quarter of the light
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
