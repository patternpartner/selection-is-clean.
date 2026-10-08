// 6: STRETCH - an organism can stretch into the cell ahead of it and eat half the light there, as EAT_LIGHT eats half the light
//   of the cell it stands on.
// Prompted by: report-6. LEAF was selected against outright (-4.81, t -9.3; carried by 0.1%): a leaf costs a quarter of the store
//   and pays back slowly, and here that was not worth it. Light is still the largest income (27.0k per 1,000 ticks) and an
//   organism eats only the light of the cell it stands on. GUT is selected again (+0.36, t 5.5) and BITE, just arrived, is
//   carried by 52% (+0.13, t 2.4; not yet told from zero).
// Builds on: nothing (light is base physics).
({
  name: 'STRETCH',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); api.move('light', a, 'E', c, api.get('light', a) * 0.5); },   // eat half the light of the cell ahead
})
