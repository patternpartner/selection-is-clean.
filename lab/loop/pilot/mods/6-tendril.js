// 6: TENDRIL - an organism can reach into the eight cells around it and drink a share of the broth lying in each.
// Prompted by: report-6. Five modules in, the world has kept only what pays at once, in one step, where the organism stands:
//   BROTH (carried by 27-50% against the inert twin's 3-12%). It purges what needs a sequence or a sacrifice: TANK (build,
//   wait, then tap; its building form is gone) and HOARD (bury now, dig later; carried 1-2% against the twin's 6-20%, and it
//   loses more than it returns, 90 in for 64 out). SMELL was taken up and dropped (36% against 6%, then back to the twin's
//   level). Broth seeps out of the cell it was digested in, and a drinker reaches only its own cell.
// Builds on: BROTH (broth exists only where BROTH's digesters made it).
({
  name: 'TENDRIL',
  fields: {},
  op(api, c, arg) {
    for (let t = 0; t < 8; t++) { const n = api.ahead(c, t); api.move('BROTH.broth', n, 'E', c, api.get('BROTH.broth', n) * 0.25); }
  },
})
