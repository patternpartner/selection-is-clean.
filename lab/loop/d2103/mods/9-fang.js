// 9: FANG - an organism can tear at the organism ahead of it, whoever it is, taking a twentieth of the store it carries, as MAUL
//   does, but losing only a tenth of what it tears off as heat where MAUL loses half.
// Prompted by: report-9. MAUL is now selected (+0.34, t 13.0) and is the largest income after light (18.1k per 1,000 ticks) and
//   loses half of what it tears off: 27.1k put in for 18.1k taken, about 9.0k per 1,000 ticks burnt. FAT, the store MAUL cannot
//   reach, was not taken up (carried by 0.6-2.2% against the twin's 3-14%); BITE and STRETCH are selected.
// Builds on: nothing (the organism's own store and the one ahead).
({
  name: 'FANG',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.1);   // a tenth of what is torn off is lost
  },
})
