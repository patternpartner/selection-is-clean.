// 4: SMELL - an organism can smell the liquids lying in the world: broth or held tank, here or the difference ahead.
// Prompted by: report-4. BROTH is kept by selection (carried by 18-37% against the inert twin's 3-5%) though it brings only 1-2%
//   of income, and its users drink blind: every other income in this world has a sense (SENSE_LIGHT, SENSE_GRAD, SENSE_CORPSE,
//   SENSE_AHEAD) and sensing is among the commonest things carried (SENSE_MATCH 52%, SENSE_GRAD 32%, SENSE_LIGHT 26%), but no
//   module gave the liquids one. TANK is being purged (carried 2-5% against the twin's 3-15%) and PIPE is neutral, while tanks
//   hold 250-2,400 energy that nobody finds: a tank is tapped only by an organism that happens to face it.
// Builds on: BROTH (broth) and TANK (tank). With neither installed it would smell nothing.
({
  name: 'SMELL',
  fields: {},
  op(api, c, arg) {
    const f = (arg & 1) ? 'TANK.tank' : 'BROTH.broth', here = api.get(f, c);
    api.setReg(c, 0, (arg & 2) ? api.get(f, api.ahead(c)) - here : here);   // into R0, as every sense does
  },
})
