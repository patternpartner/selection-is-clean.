// 10: SNARL - an organism can tear at the organism ahead of it as FANG does (a twentieth of its store, a tenth of that lost as
//   heat), but only when that one is not its kin: if their tags differ in two bits or fewer it is spared.
// Prompted by: report-10. FANG went to fixation within 40,000 ticks (carried by 100%; with no one left without it, the assay
//   cannot compare) and took over the world's economy: 78.9k torn per 1,000 ticks against light's 9.6k eaten in place, with
//   7.9k of it burnt. The food web it replaced collapsed (GUT carried by 16%, BITE 0.0%, MAUL 0.7%), the living fell to about
//   1,130 against the twin's 1,470, and they carry 563 in all. FANG tears whatever it faces, and 48% of neighbours here differ
//   from each other in two tag bits or fewer (29% are identical): most of what it tears is kin.
// Builds on: nothing (the organism's own store, the one ahead, and their tags).
({
  name: 'SNARL',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    let x = (api.tag(c) ^ api.tag(a)) & 0xffff, d = 0; while (x) { d += x & 1; x >>= 1; }   // how many tag bits differ
    if (d <= 2) return;                                                                       // kin: spared
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.1);   // as FANG tears
  },
})
