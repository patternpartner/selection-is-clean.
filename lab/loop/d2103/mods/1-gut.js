// 1: GUT - an organism can swallow half of the corpse ahead of it into its gut, a store in its own body, and the gut digests
//   by itself: each tick a twentieth of what is in it becomes usable store and a two-hundredth is lost as heat. It goes where
//   the organism goes, starts empty in every newborn, and at death what is left in it goes to the corpse.
// Prompted by: report-1. Attack already brings 16.9k per 1,000 ticks (87 kills) and corpses 10.5k, and 763 of corpse lies in the
//   world at any moment: an organism can eat only the corpse under it, so a kill made beside it, or a body that falls next to
//   it, is out of reach. In the pilot (#292) a shared way to reach the corpse ahead (broth that seeps to the neighbours) was
//   exploited by those who drank without digesting; this reach keeps what it takes.
// Builds on: nothing (corpses are base physics; the gut is a body field).
({
  name: 'GUT',
  fields: { gut: { energy: true, body: true } },
  op(api, c, arg) { const a = api.ahead(c); api.move('corpse', a, 'gut', c, api.corpse(a) * 0.5); },
  step(api) {
    for (let c = 0; c < api.C; c++) { const g = api.get('gut', c); if (g > 0) api.move('gut', c, 'E', c, g * 0.05); }
    api.decay('gut', 0.005);
  },
})
