# Ground-Truth Findings — Selection פ (headless investigation)

Produced by running `index.html` headless in Node (no browser), via the harness
tools in this directory. This file is the *execution-verified* record — an anchor
outside the in-code prose. Where the comments describe aspiration, this describes
measured runtime behavior.

## How to reproduce

```
node harness.js                 # stream pop/amp/genome metrics over N ticks
node capture.js                 # run live evolution; dump calm + bloom-onset genomes
node loadgenome.js              # load a captured genome, freeze evolution, replay
node rep.js                     # replicated ablation: bloom-fraction per component
```
All scripts stub the DOM/canvas/timers and drive `loop()` directly. `TICKS`,
`GAIN_MULT`, `DCOST_MULT`, `ABLATE`, `LOADDIR`, `PHASE`, `REPS` are env knobs.

## What runs correctly (verified)

- **Robustness: excellent.** 250,000 ticks, **0 loop errors, 0 NaN**, watchdog
  never triggered. The recovery/​watchdog scaffolding is sound.
- **Self-regulating ecology (transiently true).** From a cold genome the
  population self-limits to N≈50–80 with mean amplitude ≈0.30 — *not* via the
  advertised density cost (which is off below N=100; see below) but via resource
  scarcity. Stable for ~10⁵+ ticks.
- **Self-written primitives (`userAtoms`) are real** — they appear, churn, and
  are pruned (0↔5 observed).
- **Fitness-sensor discovery is real** — `fitnessSensors` 1↔5 with churn.
- **Objective-weight + mutation-rate evolution are real.**

## What is inert (verified over 250k ticks)

- **`boundOpcodes`: never fired once.** The newest "evolvable opcode / Tier-3
  substrate autonomy" feature produced zero bound opcodes in 250k ticks.
- **`DIMS` expansion: never moved from 5.**
- **Multi-level / cluster selection: near-dead.** Clusters are tiny (size 3–8)
  and intermittent; the ~40 cluster-level sensor layers run on an almost-empty
  substrate.

## Corrected false alarm

- An early 30k-tick run suggested the lineage registry grew unbounded (memory
  leak). **Refuted** by longer runs: it is firmly bounded (0–~280) and prunes.

## The headline: long-run "bloom collapse"

Over long horizons the system undergoes a **punctuated phase transition** from
the living equilibrium (N≈55, amp≈0.30, diverse) into a **degenerate absorbing
state**: population explodes to a ceiling, every particle pins at the `amp=1.2`
clamp, clusters vanish, and lineages freeze (no turnover). Diversity collapses.
Onset is stochastic (observed at ticks 48k, 56k, and 205k across runs; one 250k
run never tipped) — the signature of a **bistable system tipped by drift**.

### Root cause (isolated by 24 replicated ablations, 2 independent lineages)

The bloom is caused by **one evolved parameter: `metabolicCost`** — the per-tick
amplitude drain, i.e. the cost of being alive.

| Reset to cold default | bloom fraction (c1 / c2) |
|---|---|
| none (control)        | 6/6 · 6/6 |
| objWeights            | 6/6 · 6/6 |
| fitnessSensors        | 6/6 · 6/6 |
| vmProgram             | 6/6 · 6/6 |
| **metabolicCost**     | **0/6 · 0/6** |
| physics (incl. above) | 0/6 · 0/6 |

Restoring `metabolicCost` alone to its cold default (0.00002) **abolishes the
bloom in 12/12 runs**; the evaluation layer, behavior, and perception are
irrelevant. Confirmations:
- Cold genome cannot be *perturbed* into a bloom — injecting 250 particles and
  forcing all amplitudes to the 1.2 clamp both **recover** to baseline. The
  bloom requires the evolved genome, not just a state kick.
- Raising amplitude *gain* (`entropyK`) up to 2× from cold does **not** bloom;
  the cause is the cost side, not the gain side.

### Mechanism: evolutionary race-to-the-bottom on the cost of living

`metabolicCost` is an **evolvable** Layer-1 "physics" parameter
(`index.html`: "The rules of the universe. Previously hardcoded constants").
Lower metabolic cost is *always individually advantageous* — a particle that
pays less to exist survives and reproduces more — so selection relentlessly
ratchets it downward with no floor. The homeostat meant to bound population,

```js
const densityCost = (genome.densityCostK||0.00003) * Math.max(0, N-100);
```

is (a) **zero below N=100** (a dead zone covering the entire normal operating
range) and (b) tiny even above it (~0.012/tick at N=500). Once `metabolicCost`
erodes past the point where this weak brake can balance births against deaths, a
stochastic fluctuation tips the population into the bloom attractor, where
amplitude saturates and diversity freezes.

This is a tragedy-of-the-commons: an individually-selected trait (cheaper
existence) collectively destroys the regulated equilibrium that produced the
system's rich behavior. Making the core homeostatic cost evolvable, with
downward pressure and no floor, guarantees this outcome given enough time.

### Validated minimal fix

Put a **floor** on `metabolicCost` (e.g. clamp ≥ 0.00002 in `sanitizeGenome` /
mutation), or make it non-evolvable, or couple it to density so it cannot be
evolved away. The metabolicCost ablation *is* this fix and demonstrates it
prevents the bloom (0/6 vs 6/6) while leaving open-ended evolution otherwise
intact. The N<100 dead-zone in `densityCost` is a contributing weakness worth
removing as well.
