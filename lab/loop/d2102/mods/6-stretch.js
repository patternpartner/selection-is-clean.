// 6: STRETCH - an organism can stretch into the cell ahead of it and eat half the light there, as EAT_LIGHT eats half the light
//   of the cell it stands on.
// Prompted by: report-6. LEAF was selected against outright (-3.67, t -7.5; carried by 0.1%): a leaf costs a quarter of the store
//   and pays back slowly, and here that was not worth it. Light is still the largest income (26.6k per 1,000 ticks) and an
//   organism eats only the light of the cell it stands on. GUT and BITE are both selected again (+0.33, t 6.2; +0.18, t 4.0);
//   SQUEEZE has fallen back (+0.01).
// Builds on: nothing (light is base physics).
({
  name: 'STRETCH',
  fields: {},
  op(api, c, arg) { const a = api.ahead(c); api.move('light', a, 'E', c, api.get('light', a) * 0.5); },   // eat half the light of the cell ahead
})
