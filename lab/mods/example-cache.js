// example module (#292 machinery test, not part of any run): bank energy at your cell, or take back what is banked there.
// arg odd: move a quarter of the organism's store into the cell's cache. arg even: move everything cached here into the organism.
({
  name: 'CACHE',
  fields: { cache: { energy: true } },
  op(api, c, arg) {
    if (arg & 1) api.move('E', c, 'cache', c, api.E(c) * 0.25);
    else api.move('cache', c, 'E', c, api.get('cache', c));
  }
})
