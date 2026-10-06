// 10: GUT - an organism can swallow half of the corpse ahead of it into its gut, a store in its own body, and the gut
//   digests by itself: each tick a twentieth of what is in it becomes usable store and a two-hundredth is lost as heat. The gut
//   goes where the organism goes, every newborn starts with it empty, and at death what is left in it goes to the corpse.
// Prompted by: report-10. Corpse is piling up (1,448 lying, the most yet) though scavenging and attack each bring about 17k per
//   1,000 ticks, and CARRION, the scent of the dead ahead, has been taken up after the usual lag (19.1% against the twin's
//   10.6% at 981k-1,000k). The one way to reach the corpse ahead was BROTH, and its digesting makes a public good: the broth
//   seeps to the neighbours, and since TENDRIL they drink it from around without digesting anything. BROTH, kept above its
//   twin for 500,000 ticks, fell as TENDRIL rose and is now carried below its twin (0.9-5.2% against 8-16.5%) while TENDRIL
//   stays above its own. This is the same reach with nothing to share: what is swallowed is the swallower's.
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
