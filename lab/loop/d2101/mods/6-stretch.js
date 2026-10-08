// 6: STRETCH - an organism can stretch into the cell ahead of it and eat half the light there, as EAT_LIGHT eats half the light
//   of the cell it stands on.
// Prompted by: report-6. Light is still the largest income (26.2k per 1,000 ticks). LEAF reached it by investment (a quarter of
//   the store into a leaf that pays back slowly) and was taken up, and then GRAZE ate the leaves: LEAF's net income turned
//   negative (-98 per 1,000 ticks in the last window) and its assay is nothing (0.00, t 0.1). GUT is selected more strongly
//   than ever (+0.58, t 11.4); BITE, SQUEEZE and GRAZE are not told from zero. An organism still eats only the light of the
//   cell it stands on.
// Builds on: nothing (light is base physics).
({
  name: 'STRETCH',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); api.move('light', a, 'E', c, api.get('light', a) * 0.5); },   // eat half the light of the cell ahead
})
