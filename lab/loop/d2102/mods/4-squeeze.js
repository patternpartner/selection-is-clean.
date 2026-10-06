// 4: SQUEEZE - an organism can squeeze its gut: half of what is in it becomes usable store at once, and a tenth of that is lost
//   as heat.
// Prompted by: report-4. GUT and BITE are both selected (+0.68, t 12.2; +0.17, t 6.1), and BITE is now the largest income after
//   light and attack (9.1k per 1,000 ticks, 21% of all income in the last window) while GUT's own fell to 4.3k: most of what is
//   swallowed is bitten out of the swallower's gut before it is digested. FAT is still not taken up (+0.14, t 0.6).
// Builds on: GUT (there is nothing to squeeze without a gut).
({
  name: 'SQUEEZE',
  fields: {},
  op(api, c, arg) { const got = api.move('GUT.gut', c, 'E', c, api.get('GUT.gut', c) * 0.5); if (got > 0) api.spend(c, got * 0.1); },
})
