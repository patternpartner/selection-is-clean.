// 1: FAT - an organism can lay down part of its store as fat, a store in its own body that an attack cannot take (attack takes
//   from the store an organism carries ready to use), and draw on it later. Fat goes where the organism goes, every newborn
//   starts without it, it costs a slow upkeep, and at death it goes to the corpse with the rest of the body.
// Prompted by: report-1. Kills are the highest of any world at this point (141 per 1,000 ticks, attack bringing 12.5k), and the
//   dead are eaten almost as fast as they fall (scavenging 19.4k per 1,000 ticks with only 407 of corpse lying): the corpse is
//   not what is unused here; what is at stake is the store every organism carries, half of which an attack can take.
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
