// 5: HOARD - an organism can bury part of its store in the ground where it stands, and anyone standing there can dig it up.
//   Buried energy cannot be taken by an attack (attack takes from the store an organism carries); it spoils slowly.
// Prompted by: report-5. Taking by attack is now the largest income after light (16.6k per 1,000 ticks, rising at every report:
//   12.4k, 15.1k, 16.6k) while corpse income falls (14.0k -> 7.8k) and an attack takes up to half of what its prey carries.
//   Prey have no defence but moving and telling kin apart. Of the earlier modules the world kept only what it can reach where it
//   stands: BROTH (carried by 23-32% against the twin's 3-5%; drinking 32%, digesting 24%) and SMELL on broth (22%, against 1%
//   for SMELL on tanks). TANK's wall-building form is gone from the population entirely, and PIPE follows its twin.
// Builds on: nothing (an organism's own store and the ground under it).
({
  name: 'HOARD',
  fields: { cache: { energy: true } },
  op(api, c, arg) {
    if (arg & 1) api.move('E', c, 'cache', c, api.E(c) * 0.25);        // bury a quarter of what you carry
    else api.move('cache', c, 'E', c, api.get('cache', c) * 0.5);       // dig up half of what is buried here
  },
  step(api) { api.decay('cache', 0.0002); },                            // buried stores spoil, four times slower than open broth
})
