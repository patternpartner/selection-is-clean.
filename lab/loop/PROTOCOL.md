# The generator in the loop: rules for whoever writes the modules (#292)

`lab/oee-loop.js` runs one world that never restarts (G) beside an inert twin (I). Every `ADD_EVERY` ticks it pauses, writes
`report-<k>.md`, and waits for `mods/<k>-<name>.js`. The generator, a person or an AI, reads the report and writes one
module: one new piece of physics. The world resumes from exactly where it stopped, with the module armed in G and disarmed in I.

The question this tests (OEE-NOTES #292): every closed world in this project and in the literature plateaus, and the open-ended
part has always been the designers, outside the world, between runs. Does putting the designer inside one continuous run, with
the world's own selection deciding what stays, give novelty that keeps arriving and **composes**: later physics in use only
because of earlier physics in use?

## Enforced by the interface (`installMod` / `modApi` in `lab/oee-core.js`)
- **Energy only moves.** `api.move(from, cellA, to, cellB, amount)` moves at most what is there; `api.spend(c, amount)` destroys
  an organism's energy as heat. Nothing else changes an energy store (an organism's `E`, `light`, `corpse`, or a field the
  module declares `{energy:true}`, which must start empty).
- **Information fields** (`{}` or `{energy:false}`) are the module's own to read and write, diffuse and decay.
- **Body fields** (`{body:true}`, energy or information; added during the pilot, at tick 700,000, after report 7) belong to
  the organism in the cell, not the cell: they move with it, start empty in every newborn, and at death a body's energy goes
  to its corpse and the rest is cleared. Nothing is stored in or written to the body of an empty cell, and a body field does
  not spread. Without them a module could add nothing that moves with an organism (`lab/test-modbody.js`).
- **A module can build on earlier modules:** it reads `'NAME.field'` and moves energy in and out of an earlier module's energy
  fields. It cannot write another module's information fields, and it cannot reach a later module.
- **Its own random stream** (`api.rand()`), so it never disturbs the world's.
- **No access to programs.** A module cannot see or edit organisms' code; it sees registers, energy, position, facing, tag and age.
- **It enters only by mutation.** The new opcode is just another instruction that copying errors can write; nobody is given it.

## Kept by the generator (checked in review)
1. **Physics, not reward.** No payment for novelty, diversity, complexity or any particular behaviour. A module says what is
   *possible*; what pays must follow from energy actually moving.
2. **No favourites.** It treats every organism alike: no rule keyed to a tag, a lineage, a generation or an age band to help or
   hurt particular organisms. Sensing those things is allowed; privileging them is not.
3. **One module per pause.** Installed modules are never edited or removed: the past is fixed.
4. **Read the report, respond to the world.** Responding to what the organisms do, and to what lies unused, is the point. That is
   what makes the generator part of the world rather than a schedule.
5. **Say why.** The module's header comment says what it adds, what in the report prompted it, and which earlier modules (if any)
   it builds on.
6. **Keep it physical.** Prefer local, simple rules (one cell, its neighbour, a field) over global ones. A module that works only
   because the generator anticipated a specific program is out of bounds.

## Controls (fixed before the deciding run)
- **I, the inert twin:** the same opcodes at the same ticks, disarmed. It is automatic.
- **A, all at once:** a fresh world from the same seed with the final module list installed at tick 0
  (`MODE=A lab/loop-control.js`). If A does as well as G, sequence and response did not matter; it is just a bigger menu.
- **Z, scrambled:** the same modules installed at the same ticks in a shuffled order. It tests whether each module had to come
  when it came. *Found in the pilot:* a module cannot be installed before a module it reads, and once modules build on each
  other the only orders left are the ones the chain allows (the pilot's first four have exactly one). Z shuffles among those
  orders when there are any; otherwise it is replaced by S.
- **S, same schedule, another history:** a fresh world from another seed with the same modules at the same ticks
  (`MODE=S lab/loop-control.js`). The modules were written from G's reports; if S takes them up as G did, they were good physics
  for any such world, and the responding did not matter.
- **Composition (knockouts):** from G's final save, each earlier module is disarmed in turn and the world runs on. A later module
  depends on an earlier one when its income collapses without it. The signature asked for is a dependency chain that keeps
  getting deeper.

## Module template
```js
// <k>: NAME - one line on what it adds.
// Prompted by: what in report-<k> made this the next thing to add.
// Builds on: earlier modules it reads or moves energy through, or "nothing".
({
  name: 'NAME',                          // unique, used as 'NAME.field' by later modules
  fields: { f: { energy: true } },       // energy fields start empty; information fields may start at a value: { g: { init: 0 } };
                                         // { body: true } makes a field the organism's own (it moves, is born empty, dies with it)
  init(api) { },                         // optional, runs once when installed armed
  op(api, c, arg) { },                   // runs when organism c executes this opcode; arg is the instruction's argument byte
  step(api) { },                         // optional, runs once per tick
})
```
`api`: `C W H tick rand() alive(c) ahead(c, turn) face(c) age(c) tag(c) gen(c) E(c) light(c) corpse(c) reg(c,k) setReg(c,k,v)
get(field,c) set(field,c,v) move(from,cA,to,cB,amt) spend(c,amt) diffuse(field,D) decay(field,f)`.
