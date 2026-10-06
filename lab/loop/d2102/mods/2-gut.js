// 2: GUT - an organism can swallow half of the corpse ahead of it into its gut, a store in its own body, and the gut digests
//   by itself: each tick a twentieth of what is in it becomes usable store and a two-hundredth is lost as heat. It goes where
//   the organism goes, starts empty in every newborn, and at death what is left in it goes to the corpse.
// Prompted by: report-2. FAT was not taken up (carried 0.9-7.5% against the twin's 3.5-15.5%; effect -0.21, t -0.8). Corpse
//   lying in the world has risen from 407 to 629 while kills stay the highest of any world (131 per 1,000 ticks) and
//   scavenging brings 14.7k: an organism can eat only the corpse under it. In the pilot (#292) a shared way to reach the corpse
//   ahead (broth that seeps to the neighbours) was exploited by those who drank without digesting; this reach keeps what it
//   takes.
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
