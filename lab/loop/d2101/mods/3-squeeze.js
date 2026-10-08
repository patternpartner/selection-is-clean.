// 3: SQUEEZE - an organism can squeeze its gut: half of what is in it becomes usable store at once, and a tenth of that is lost
//   as heat.
// Prompted by: report-3. BITE spread at once (carried by 34-60% against the twin's 2-12%, up to 11% of all income) and it lives
//   on guts: its income (4.2k per 1,000 ticks) is now more than twice GUT's own (1.8k, down from 8.8k), and GUT's assay has
//   fallen to nothing (+0.06, t 0.7). What is swallowed sits in the gut for some twenty ticks before it can be used, and
//   while it sits there it can be bitten.
// Builds on: GUT (there is nothing to squeeze without a gut).
({
  name: 'SQUEEZE',
  fields: {},
  op(api, c, arg) { const got = api.move('GUT.gut', c, 'E', c, api.get('GUT.gut', c) * 0.5); if (got > 0) api.spend(c, got * 0.1); },
})
