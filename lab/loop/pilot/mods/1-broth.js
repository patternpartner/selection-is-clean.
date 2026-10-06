// 1: BROTH - corpse can be digested into broth, a liquid that seeps into neighbouring cells, and broth can be drunk.
// Prompted by: report-1. Scavenging is now nearly as large an income as light (23.6k against 26.0k per 1,000 ticks), and about
//   1,800 of corpse energy lies on the ground. But nothing in this world moves except organisms: every resource stays exactly
//   where it fell, and an organism can only eat what lies under it. This gives matter a way to move. The digester reaches the
//   corpse in front of it, which it could not eat before, and pays for that reach with what seeps away to its neighbours.
// Builds on: nothing (corpses are base physics).
({
  name: 'BROTH',
  fields: { broth: { energy: true } },
  op(api, c, arg) {
    if (arg & 1) { const a = api.ahead(c); api.move('corpse', a, 'broth', a, api.corpse(a) * 0.5); }   // digest the corpse ahead
    else api.move('broth', c, 'E', c, api.get('broth', c) * 0.5);                                     // drink the broth here
  },
  step(api) { api.diffuse('broth', 0.2); api.decay('broth', 0.0005); },   // it seeps, and it spoils as fast as a corpse does
})
