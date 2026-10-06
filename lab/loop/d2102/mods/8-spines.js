// 8: SPINES - an organism can grow spines, paying for them from its store (lost as heat); every organism that faces a spined one
//   is wounded each tick by them (a little of its store lost as heat), more the bigger the spines. Spines go where the
//   organism goes, every newborn starts without them, they wear down slowly, and they die with it.
// Prompted by: report-8. MAUL was taken up at once and is selected (+0.34 per 1,000 ticks, t 7.0; carried by 40-60% against the
//   twin's 5-17%), and it destroys more than it takes: 22k torn off against 34k lost per 1,000 ticks at its height. What the
//   living carry has fallen from 4.9k to 1.5k. Mauling, biting and attack all need the taker to face its victim. FAT, the one
//   store none of them reaches, has been here since tick 100,000 and is still not taken up, MAUL or no MAUL (carried by 1-3%).
// Builds on: nothing (the organism's own store and those facing it).
({
  name: 'SPINES',
  fields: { spine: { body: true } },
  op(api, c, arg) { if (api.spend(c, 0.1) > 0) api.set('spine', c, Math.min(1, api.get('spine', c) + 0.2)); },   // grow: costs 0.1, lost as heat
  step(api) {
    for (let c = 0; c < api.C; c++) {
      const s = api.get('spine', c); if (!(s > 0)) continue;
      for (let t = 0; t < 8; t++) { const n = api.ahead(c, t); if (api.alive(n) && api.ahead(n) === c) api.spend(n, 0.02 * s); }   // whoever faces it bleeds
      api.set('spine', c, s > 0.01 ? s * 0.999 : 0);                                                 // spines wear down
    }
  },
})
