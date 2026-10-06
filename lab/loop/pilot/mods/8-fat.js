// 8: FAT - an organism can lay down part of its store as fat, a store in its own body that an attack cannot take (attack takes
//   from the store an organism carries ready to use), and draw on it later. Fat goes where the organism goes, every newborn
//   starts without it, it costs a slow upkeep, and at death it goes to the corpse with the rest of the body.
// Prompted by: report-8. Attack still takes about a third of all income (15.8k per 1,000 ticks against light's 26.8k) and the
//   living hold little (1.9k in all). HOARD offered the only store an attack cannot reach, and it was purged in nearly every
//   window (carried 1.7-3.8% against the twin's 6.7-21.7% from tick 700,000): a buried store stays where it was buried, and
//   anyone standing there digs it up. This is the same store kept in the body, which body fields (added after report 7) make
//   expressible for the first time. SIGNAL, a costly mark with no other use, was purged too (carried 0.8-4.1% against
//   6.4-13.9%), while TENDRIL is now kept (20-28% against 1.5-7%) and BROTH alongside it.
// Builds on: nothing (the organism's own store).
({
  name: 'FAT',
  fields: { fat: { energy: true, body: true } },
  op(api, c, arg) {
    if (arg & 1) api.move('E', c, 'fat', c, api.E(c) * 0.25);           // lay down a quarter of what you carry
    else api.move('fat', c, 'E', c, api.get('fat', c) * 0.5);          // draw on half your fat
  },
  step(api) { api.decay('fat', 0.0002); },                             // upkeep: fat wastes as slowly as a buried store
})
