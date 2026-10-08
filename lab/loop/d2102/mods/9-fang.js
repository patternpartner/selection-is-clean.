// 9: FANG - an organism can tear at the organism ahead of it, whoever it is, taking a twentieth of the store it carries, as MAUL
//   does, but losing only a tenth of what it tears off as heat where MAUL loses half.
// Prompted by: report-9. MAUL is selected again (+0.15, t 4.3) and is the largest income after light (17.6k per 1,000 ticks) and
//   loses half of what it tears off: 26.5k put in for 17.6k taken, about 8.8k per 1,000 ticks burnt. SPINES was selected
//   against at once (carried by 0.0%); FAT has begun to rise only in the last window (17.8% against the twin's 3.6%).
// Builds on: nothing (the organism's own store and the one ahead).
({
  name: 'FANG',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.1);   // a tenth of what is torn off is lost
  },
})
