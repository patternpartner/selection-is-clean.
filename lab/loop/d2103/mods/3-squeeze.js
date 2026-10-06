// 3: SQUEEZE - an organism can squeeze its gut: half of what is in it becomes usable store at once, and a tenth of that is lost
//   as heat.
// Prompted by: report-3. GUT is carried by 81% and strongly selected (+0.57 per 1,000 ticks, t 5.8; 16-19% of all income), and
//   CARRION was not taken up (+0.03, t 0.1). Nearly every organism now lives partly on what it swallows, and what it swallows
//   becomes usable only a twentieth at a time: a meal takes some twenty ticks to reach the store an organism divides from.
// Builds on: GUT (there is nothing to squeeze without a gut).
({
  name: 'SQUEEZE',
  fields: {},
  op(api, c, arg) { const got = api.move('GUT.gut', c, 'E', c, api.get('GUT.gut', c) * 0.5); if (got > 0) api.spend(c, got * 0.1); },
})
