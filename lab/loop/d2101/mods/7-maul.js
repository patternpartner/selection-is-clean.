// 7: MAUL - an organism can maul the organism ahead of it, whoever it is, tearing off a twentieth of the store it carries;
//   half of what is torn off is lost as heat.
// Prompted by: report-7. Attack is the second income (14.2k per 1,000 ticks, 79 kills) and works only through a matched template
//   (a predator takes in proportion to the fourth power of the match between its template and the prey's tag). STRETCH swept
//   at once (carried by 99%, 34% of all income, selected +0.44, t 2.7) and the living rose to about 1,870 against the twin's
//   1,660; GUT, BITE and SQUEEZE are all selected (+0.57, +0.23, +0.45). Every income an organism can reach without a match is
//   now taken: light ahead, the dead ahead, the gut ahead.
// Builds on: nothing (the organism's own store and the one ahead).
({
  name: 'MAUL',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.5);   // half of what is torn off is lost
  },
})
