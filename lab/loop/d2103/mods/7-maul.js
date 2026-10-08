// 7: MAUL - an organism can maul the organism ahead of it, whoever it is, tearing off a twentieth of the store it carries;
//   half of what is torn off is lost as heat.
// Prompted by: report-7. Attack is the second income (16.6k per 1,000 ticks, 69 kills) and works only through a matched template
//   (a predator takes in proportion to the fourth power of the match between its template and the prey's tag). STRETCH swept
//   at once (carried by 99%, 31% of all income, selected +0.49, t 2.4) and the living rose to about 1,930 against the twin's
//   1,635; GUT and BITE are selected (+0.70, t 29.1; +0.53, t 15.2). Every income an organism can reach without a match is now
//   taken: light ahead, the dead ahead, the gut ahead.
// Builds on: nothing (the organism's own store and the one ahead).
({
  name: 'MAUL',
  fields: {},
  op(api, c, arg) {
    const a = api.ahead(c); if (!api.alive(a)) return;
    const got = api.move('E', a, 'E', c, Math.max(0, api.E(a)) * 0.05); if (got > 0) api.spend(c, got * 0.5);   // half of what is torn off is lost
  },
})
