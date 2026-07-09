# Bridge network — cross-paradigm companions to Pe

Three self-contained browser artefacts talk over one `BroadcastChannel('selection-pe-network')`:

- **Pe** — `../index.html` (the main self-extending particle-VM alife system). **Never modified for the bridge.**
- **Chemistry reactor** — `chemistry-reactor.html` (SKI-combinator artificial chemistry, a flow reactor).
- **L-system growth** — `lsystem-growth.html` (Lindenmayer rewrite-grammar ecology).

The two companions here are archived reference copies. The canonical live copies are the user's own
GitHub Pages deployments; these are version-controlled so the work survives an ephemeral container.

## What the bridge does now

Each companion embeds the **Rosetta interlingua** (`rosetta.js` is the shared reference; the same layer is
inlined in each HTML file). It is a universal vocabulary of the five things every generative system does:

```
0 DRAW    emit / place a unit of structure
1 TURN    signed modulation (direction from param sign)
2 BRANCH  open a divergence
3 MERGE   recombine / close / select
4 REPEAT  iterate / scale / recurse
```

Grounded in Pe's real VM semantics (the fitness-sensor VM switch in index.html):
`op0 copy→DRAW, op1 +=si*k→TURN, op2 *=→REPEAT, op3 threshold→BRANCH, op4 EMIT→MERGE`.

Each companion **hears** Pe's native packets (`motif`/`plasmid`/`migrant`/`inscription`) and peers' `lingua`
packets, translating them to gestures and seeding a real organism from the MEANING; and **speaks** its own best
structure back — a `lingua` packet for peers, plus a valid native Pe `motif` so Pe ingests it through its own
validated receive path. Meaning (e.g. branchiness) is what crosses, expressed in each local dialect.

## Why (the honest arc — see OEE-NOTES.md "BRIDGE NETWORK")

1. The original flat `harvestNumbers` receive path was **decoration**: a negative control showed it transmitted
   only number-RANGE (treatment vs structure-destroyed control: Cliff δ=0.109, negligible), and selection erased
   even that downstream.
2. A structure-preserving translation **transmits** a specific Pe signature (recoverable at ~8× the
   structure-destroyed baseline) but selection still erases it from the fitness outcome.
3. A fitness coupling makes the signature **hitchhike** into a retained minority (retention 5×→13×, δ→0.359) —
   but only as far as honest, non-circular selection allows; fixation would mean designing the answer.
4. The Rosetta interlingua ships transmission for real: branch-density preserved into the L-system (r=0.91) and
   chemistry (r=0.90), bidirectional, Pe untouched.

## Experiments (`experiments/`)

Reproduce the arc (Node.js, no deps). These are faithful archives of what was run this session, so they contain
absolute paths to the session scratchpad — repoint the `CACHE` / `index.html` / companion-HTML path constants at
the top of each script before running. `harvest-cache.js` boots Pe headless and caches ~16k real Pe VM programs to
`pe-instructions-cache.json` (regenerable; git-ignored). Then:

- `bridge-negative-control.js` — three-arm control on the flat bridge (the decoration finding).
- `bridge-structured-control.js` — same control with structure-preserving translation (transmits, not retained).
- `bridge-coupling-control.js` — fitness coupling / signature hitchhiking.
- `test-rosetta.js` — meaning-preservation + round-trip + speak-back-to-Pe validity on real Pe data.
- `test-interlingua-integration.js` — both companions on one shared bus, end-to-end cross-talk on the shipped code.

```
node experiments/harvest-cache.js          # regenerate the Pe program cache first
node experiments/test-interlingua-integration.js
```
