// 2: TANK - an organism can wall the cell in front of it; a walled cell soaks up the broth that seeps into it and holds it,
//   spoiling five times more slowly than open broth; an organism facing a tank can tap it.
// Prompted by: report-2. BROTH found use (up to 3.7% of all income in a window; about 830 per 1,000 ticks; corpse energy lying
//   on the ground fell from about 1,800 to 640) but what is digested seeps away and spoils: nothing can hold it. Organisms are
//   poorer than before (stores 15.6k -> 7.0k) while predation rose (151 kills per 1,000 ticks). A reservoir is the next
//   physical thing that matter which moves makes possible: a place where it collects.
// Builds on: BROTH (a tank fills only from BROTH.broth; with no broth it holds nothing).
({
  name: 'TANK',
  fields: { tank: { energy: true }, wall: {} },
  op(api, c, arg) {
    const a = api.ahead(c);
    if (arg & 1) { if (api.spend(c, 0.05) > 0) api.set('wall', a, 1); }          // build: 0.05 of your energy, lost as heat
    else api.move('tank', a, 'E', c, api.get('tank', a) * 0.5);                   // tap the tank in front of you
  },
  step(api) {
    for (let c = 0; c < api.C; c++) {
      const w = api.get('wall', c); if (!(w > 0)) continue;
      api.move('BROTH.broth', c, 'tank', c, api.get('BROTH.broth', c) * 0.2 * w);  // the wall soaks up broth in its cell
      api.set('wall', c, w > 0.01 ? w * 0.9995 : 0);                                // walls crumble slowly
    }
    api.decay('tank', 0.0001);                                                      // held broth spoils, but slowly
  },
})
