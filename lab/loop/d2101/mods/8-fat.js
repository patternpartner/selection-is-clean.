// 8: FAT - an organism can lay down part of its store as fat, a store in its own body that neither attack nor MAUL can take
//   (both take from the store an organism carries ready to use), and draw on it later. Fat goes where the organism goes,
//   every newborn starts without it, it costs a slow upkeep, and at death it goes to the corpse with the rest of the body.
// Prompted by: report-8. MAUL was taken up at once and is selected (+0.47 per 1,000 ticks, t 6.1), and it destroys more than it
//   takes: 20k torn off against 30k lost per 1,000 ticks at its height. What the living carry has fallen from 3.9k to 2.6k,
//   attack by matched template has fallen from 14.2k to 2.6k per 1,000 ticks, and corpse eaten in place to 0.7k: the store an
//   organism carries ready to use is now torn off by whoever faces it, kin or not.
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
