// 10: SNARL - an organism can tear at the organism ahead of it as FANG does (a twentieth of its store, a tenth of that lost as
//   heat), but only when that one is not its kin: if their tags differ in two bits or fewer it is spared.
// Prompted by: report-10. FANG swept at once (carried by 99.9%, selected +2.91, t 4.7) and took over the world's economy: 75.7k
//   torn per 1,000 ticks against light's 10.7k eaten in place, with 7.6k of it burnt. The food web it replaced collapsed (GUT
//   carried by 1.8%, BITE 0.9%, MAUL 0.3%), the living fell to about 1,200 against the twin's 1,660, and they carry 577 in all,
//   about half of what one needs to divide. FANG tears whatever it faces, and 46% of neighbours here differ from each other
//   in two tag bits or fewer (29% are identical): most of what it tears is kin.
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
