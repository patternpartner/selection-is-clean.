// 2: BITE - an organism can bite the organism ahead of it and take a quarter of what is in that one's gut.
// Prompted by: report-2. GUT was taken up at once and is selected (effect +0.28 per 1,000 ticks, t 3.5; carried by 58-70%
//   against the twin's 5-25%, 12-21% of all income), and the corpse lying in the world fell from 2,144 to 223. Energy now
//   passes through guts, and a gut is a store that attack cannot reach (attack takes from the store an organism carries ready
//   to use). Attack is still the second income (14.9k per 1,000 ticks) and is carried by 29%.
// Builds on: GUT (there is nothing to bite unless the organism ahead has swallowed something).
({
  name: 'BITE',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); if (api.alive(a)) api.move('GUT.gut', a, 'E', c, api.get('GUT.gut', a) * 0.25); },
})
