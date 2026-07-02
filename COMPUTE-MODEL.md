# The machine, described as a machine

This is the canonical, substrate-native description of the system in `index.html`.
It exists so the project can be reasoned about, measured, and extended as what it
literally is — **a self-extending virtual machine that mints and prices its own
primitives** — rather than through the borrowed vocabulary the older notes use.

Use this document's terms going forward. The legacy log (`OEE-NOTES.md`) is kept for
history; the one table below is the bridge back to it.

## What the system is

A population of small programs runs on a shared virtual machine. Each program is a
sequence of instructions drawn from a fixed core instruction set (`CORE_OPCODES = 232`
opcodes). Around that core sits a **self-extension loop** — the part that makes this
more than a fixed-alphabet search:

1. **Author.** The system writes a new primitive: a short arithmetic/logic expression
   over its own registers and a set of world-reading inputs (`nx, ny, nb` neighbour
   state, `c` proximity, `d` energy, `m` role-match, `t` clock) and a composition call
   `f(idx, a, b)` that invokes another authored primitive. These are the `userAtoms`.
2. **Bind.** An authored primitive is promoted into the instruction set as a new opcode
   with id `>= CORE_OPCODES` (`boundOpcodes`), so programs can call it like any core op.
3. **Wire.** A call-site for that opcode is spliced into an executed program.
4. **Price.** Programs compete to run; the ones that run get copied, carrying their
   call-sites. A primitive that earns calls persists; one that doesn't is dropped. Each
   primitive tracks its own `uses`.

The engine also carries a large vector of continuously-tunable numeric fields (physics,
weights, per-instruction constants, and — from the meta-layer — the intensities of the
self-extension loop itself). These drift freely under the copy-and-select process.

## The one distinction that organises everything

The system has two kinds of change, and they behave completely differently:

- **Continuous change** — retuning existing numeric fields and rewriting instructions
  within the fixed alphabet. This is vigorously alive: the great majority of fields and
  instructions move over a run.
- **Discrete change** — minting genuinely new primitives (new opcodes, deeper compositions,
  new structural axes). This is what can raise the ceiling on expressible behaviour, and
  historically it barely fired.

You can retune and reshuffle a fixed alphabet forever without ever expressing a
qualitatively new behaviour. Growth in expressible behaviour requires the **discrete**
generators to fire and their output to be **kept by pricing**. That is the whole game.

## The open question, stated in machine terms

> Does closed-loop authorship of **world-reading** primitives earn call-share over pure
> self-referential scalings, and does the description length of the actively-run code
> grow without bound under pricing?

Concretely, three things must all be true, and only the first two are so far:

1. Authored primitives get **adopted** (nonzero `uses`) and survive program turnover. ✅ closed.
2. Authored opcodes actually **run** at the instruction-set level. ✅ closed.
3. The primitives that win calls are **world-reading / actuating** behaviours, not just
   constant-factor rescalings of a register — and the run's active-code description
   length **ratchets**. ❓ open. To date the winners are simple scalings; sense→act share
   sits near zero.

## The scoreboard — `harness-score.js`

The instrument that measures the above directly, with no borrowed vocabulary. Four families:

| family | what it reads | the question it answers |
|---|---|---|
| **ISA** | distinct opcodes executed across all programs + the self's program `V`; split into core (`< CORE_OPCODES`) and authored (`>=`) | how much of the machine's instruction set is exercised, and are authored opcodes running? |
| **MINT** | adopted `userAtoms`: count, max `uses`, expression nesting depth, composition (`f(`) count | is the authoring loop producing primitives that get kept and get structurally deeper? |
| **BEHAVIOUR** | share of atom **calls** going to primitives that read a world input (`nx/ny/nb/c/d/m/t`) vs pure self-scalings; `__reachFires` actuator drives | do world-reading behaviours win call-share? (the headline) |
| **MDL** | gzip size of the self's active code (`V` + adopted atom expressions) | is irreducible structure accreting, or is a fixed alphabet just being reshuffled? |

Run it:

```
# fully-lit stack, long continuous run (the real test), streaming one row per sample
SEED=7 TICKS=50000 SAMPLE=2500 JSONL=1 node harness-score.js

# ablate one lever for an A/B (each defaults ON in the engine)
SEED=7 TICKS=6000 ATOM_PIPELINE=0 ATOM_DURABLE=0 node harness-score.js
```

Only four knobs, all naming machine operations: `ATOM_PIPELINE` (author+bind+wire),
`ATOM_DURABLE` (keep call-sites across adoption/reload), `REACH` (authored output drives
an actuator), `RICH_GRAMMAR` (world-reading + selection/compose ops in the grammar).

**Honesty rule the scoreboard enforces:** MDL rising is *necessary, not sufficient* —
constant reshuffling adds tokens too. The `mdl_ratchets` signal stays true even with the
mint fully ablated, precisely because the self's program rewrites continuously with no
authoring at all. The load-bearing signals are `authored_opcodes_running` and
`senseAct_gaining`; those are the ones that flip when you ablate.

## Bridge to the legacy log (the only place the old vocabulary belongs)

`OEE-NOTES.md` describes the same machine with terms borrowed from population ecology.
This table translates them once, so the log stays readable without importing the framing:

| legacy term | what it actually is in the machine |
|---|---|
| organism / individual / particle | one program instance running on the shared VM |
| genome | a program plus its numeric field vector |
| gene / trait | a single tunable numeric field |
| fitness / selection | pricing: run-and-copy weighting; a program's share of executions |
| species / kind | a cluster of programs with similar fields |
| speciation / cladogenesis / radiation | minting a new primitive/structure that partitions behaviour irreducibly |
| niche | a distinguishable demand pattern a primitive can serve |
| predation / Red Queen | a conserved currency transfer that couples one primitive's payoff to another's |
| mutualism | a `+/+` coupling between two primitives' payoffs |
| diversity / evenness / kinds count | spread of the program population over field-space (a lagging proxy) |
| generation | a discrete restructuring event of the whole population |
| ecology / open-ended evolution | the self-extension loop and the pricing that keeps its output |

Everything above the table is the vocabulary to use. The table is the bridge, not a
license to reintroduce the left column.
