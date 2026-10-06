// 5: BITE - an organism can bite the organism ahead of it and take a quarter of what is in that one's gut.
// Prompted by: report-5. GUT is carried by 72-81% (15.7-28.4% of all income) and its guts hold 260 of energy, a store that
//   attack cannot reach (attack takes from the store an organism carries ready to use) and nothing else takes from. LEAF was
//   selected against outright (-3.02, t -9.3; carried by 0.2%), SQUEEZE has fallen to 2-3% and CARRION is not told from zero.
//   Attack is still the second income (11.7k per 1,000 ticks).
// Builds on: GUT (there is nothing to bite unless the organism ahead has swallowed something).
({
  name: 'BITE',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); if (api.alive(a)) api.move('GUT.gut', a, 'E', c, api.get('GUT.gut', a) * 0.25); },
})
