// 8: FAT - an organism can lay down part of its store as fat, a store in its own body that neither attack nor MAUL can take
//   (both take from the store an organism carries ready to use), and draw on it later. Fat goes where the organism goes,
//   every newborn starts without it, it costs a slow upkeep, and at death it goes to the corpse with the rest of the body.
// Prompted by: report-8. MAUL was taken up (carried by 55-64% against the twin's 4-12%; +0.13, t 2.2, not yet told from zero),
//   and it destroys more than it takes: 21k torn off against 32k lost per 1,000 ticks in the last window. What the living carry
//   has fallen from 6.3k to 1.1k, attack by matched template from 16.6k to 2.7k per 1,000 ticks, and the living from about
//   1,930 to 1,270 (the twin 1,480): the store an organism carries ready to use is now torn off by whoever faces it.
// Builds on: nothing (the organism's own store).
({
  name: 'FAT',
  fields: { fat: { energy: true, body: true } },
  op(api, c, arg) {
    if (arg & 1) api.move('E', c, 'fat', c, api.E(c) * 0.25);           // lay down a quarter of what you carry
    else api.move('fat', c, 'E', c, api.get('fat', c) * 0.5);          // draw on half your fat
  },
  step(api) { api.decay('fat', 0.0002); },
})
