// 10: SNARL - an organism can tear at the organism ahead of it as FANG does (a twentieth of its store, a tenth of that lost as
//   heat), but only when that one is not its kin: if their tags differ in two bits or fewer it is spared.
// Prompted by: report-10. FANG swept (carried by 97%, selected +1.96, t 11.4) and took over the world's economy: 67.8k torn per
//   1,000 ticks against light's 4.9k eaten in place, with 6.8k of it burnt, and MAUL is still carried by 81% beside it. The
//   food web it replaced collapsed (GUT carried by 18%, BITE 0.2%), the living fell to about 1,100 against the twin's 1,540,
//   and they carry 525 in all. FANG tears whatever it faces, and 41% of neighbours here differ from each other in two tag
//   bits or fewer (25% are identical): much of what it tears is kin.
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
