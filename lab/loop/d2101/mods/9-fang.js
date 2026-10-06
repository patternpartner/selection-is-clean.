// 9: FANG - an organism can tear at the organism ahead of it, whoever it is, taking a twentieth of the store it carries, as MAUL
//   does, but losing only a tenth of what it tears off as heat where MAUL loses half.
// Prompted by: report-9. MAUL is the largest income after light (19.2k per 1,000 ticks against light's 9.7k eaten in place and
//   STRETCH's) and loses half of what it tears off: 28.8k put in for 19.2k taken, about 9.6k per 1,000 ticks burnt. What the
//   living carry has fallen to 1.8k. FAT, the store MAUL cannot reach, was not taken up (carried by 0.2-1.1% against the twin's
//   6-19%); GUT, BITE, LEAF and STRETCH are selected.
// Builds on: nothing (the organism's own store and the one ahead).
({
  name: 'FANG',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.1);   // a tenth of what is torn off is lost
  },
})
