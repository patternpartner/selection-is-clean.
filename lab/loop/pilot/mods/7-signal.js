// 7: SIGNAL - an organism can put a mark into the air where it stands (a value from its first register; it costs energy,
//   lost as heat), the mark spreads to neighbouring cells and fades within a few dozen ticks, and anyone can read it, here or
//   the difference ahead.
// Prompted by: report-7. The world lives by telling others apart: SENSE_KIN is in the commonest program and was carried by 49% at
//   report 6, SENSE_MATCH by 28-52% at every report, and attack and scavenging together (15.3k and 15.2k per 1,000 ticks) now
//   match light (26.9k). Every one of those senses reads another organism's fixed tag; nothing lets an organism tell another
//   anything. Of the six modules so far none is held above its twin now: BROTH, kept for 500,000 ticks, fell to the twin's
//   level as TENDRIL rose to drink the same broth from around (23% against the twin's 5%), and TENDRIL fell after it.
// Builds on: nothing.
({
  name: 'SIGNAL',
  fields: { mark: {} },
  op(api, c, arg) {
    if (arg & 1) { if (api.spend(c, 0.02) > 0) { const v = api.get('mark', c) + api.reg(c, 0); api.set('mark', c, v > 1e6 ? 1e6 : v < -1e6 ? -1e6 : v === v ? v : 0); } }   // call (bounded as MUL bounds registers; NaN reads as 0)
    else { const here = api.get('mark', c); api.setReg(c, 0, (arg & 2) ? api.get('mark', api.ahead(c)) - here : here); }   // listen
  },
  step(api) { api.diffuse('mark', 0.2); api.decay('mark', 0.05); },
})
