// 3: BITE - an organism can bite the organism ahead of it and take a quarter of what is in that one's gut.
// Prompted by: report-3. GUT was taken up and is selected (+0.57 per 1,000 ticks, t 4.7): carried by 91% against the twin's 2%,
//   19.6% of all income, and the corpse lying in the world fell from 629 to 75. Nearly every organism now carries a gut, and a
//   gut is a store that attack cannot reach (attack takes from the store an organism carries ready to use), while attack
//   remains the second income (15.2k per 1,000 ticks, 109 kills). FAT is still not taken up (-0.02, t -0.1).
// Builds on: GUT (there is nothing to bite unless the organism ahead has swallowed something).
({
  name: 'BITE',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); if (api.alive(a)) api.move('GUT.gut', a, 'E', c, api.get('GUT.gut', a) * 0.25); },
})
