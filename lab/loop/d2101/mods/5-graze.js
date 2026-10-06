// 5: GRAZE - an organism can graze the leaf of the organism ahead of it: a quarter of that leaf goes into its own rumen, a
//   store in its body that digests by itself (each tick a twentieth becomes usable store and a two-hundredth is lost as heat).
//   The rumen goes where the organism goes, starts empty in every newborn, and at death what is left in it goes to the corpse.
// Prompted by: report-5. LEAF took off late in the window (carried by 31-36% against the twin's 13-21% at 461k-500k, 7-9% of
//   all income, net +1.6-2.0k per 1,000 ticks), and leaves now hold 536 of energy that nothing in the world can take: attack
//   takes from the store an organism carries ready to use, and BITE only from guts. GUT and BITE are both selected again
//   (+0.71, t 8.2; +0.13, t 3.1). The corpse economy became a chain (GUT, then BITE on guts); leaves are a store with no
//   taker yet.
// Builds on: LEAF (there is nothing to graze unless the organism ahead has grown a leaf).
({
  name: 'GRAZE',
  fields: { rumen: { energy: true, body: true } },
  op(api, c, arg) { const a = api.ahead(c); if (api.alive(a)) api.move('LEAF.leaf', a, 'rumen', c, api.get('LEAF.leaf', a) * 0.25); },
  step(api) {
    for (let c = 0; c < api.C; c++) { const r = api.get('rumen', c); if (r > 0) api.move('rumen', c, 'E', c, r * 0.05); }
    api.decay('rumen', 0.005);
  },
})
