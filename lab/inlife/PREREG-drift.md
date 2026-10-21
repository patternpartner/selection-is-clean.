# Is REPL's lineage collapse a selective sweep, or drift on a faster clock? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #326's `REPL_FROZEN` (with it unset, harness-oee is identical to the previous engine for the default world and REPL=1, seed 2). Probe `lab/inlife/probe-drift.js`. Batch `lab/inlife/drift-batch.sh`, analysis `lab/inlife/analyse-drift.js`. Asked for by the user: measure the collapse before building another mechanism.

## Why
#282: long REPL worlds end with one lineage. #319: 1-56 lineages at 10,000 ticks against 183-316 in the default world. #320, #322 and #324/#325 each tried a cause, and none moved it. The review's point: REPL runs many more generations per tick than the default world, so the collapse may be what neutral drift does on that clock. If it is, there is no sweep to prevent at this horizon.

## The measurement (probe-drift.js)
Every particle alive at tick 1 gets its own FOUNDER label, inherited parent to child (parentless births get fresh labels and are not founders). Every 500 ticks: founder labels still standing, against GENERATIONS = cumulative births / mean living (the world's own clock). Also 20 MIXED shadows on every run (novelty-shadows' well-mixed Moran null on the real births and deaths), and new `pLin` ids minted.

## Arms (per seed)
- **REPL**: REPL=1, NULLSHIFT 0, 3, 7.
- **FROZEN**: REPL=1 REPL_FROZEN=1, NULLSHIFT 0, 3, 7. The same physics; a child is an exact clone of its parent's genome and program, and all founders start from the same germline clone, so no heritable genome or program difference ever arises. Lineages are lost by drift, spatial structure included. NOT fully neutral: founders' traits differ at random and are inherited (with INHERIT's noise), as in plain REPL.
- **DEFAULT**: no knobs, NULLSHIFT 0 (reported only).
Every run: TICKS=10000 SAMPLE=500 K=20. Seeds **6501-6505** (never run). 35 runs.

## Pilot (practice seed 1, 3,000 ticks; NOT evidence)
REPL: 71 founders of 329 at generation 7.4; MIXED shadows 26-39; 0 `pLin` mints. FROZEN: 1 founder at generation 10.8 (about 29 at 7.5), MIXED 51-62, with the population growing to about 1,700; frozen fidelity 0-0.1% of children differing from their parent. DEFAULT: 218 founders at generation 0.64, MIXED 232-252, 43 mints.

## The comparison
For each seed, G* = the smallest final generation reached by any of its six REPL and FROZEN runs, so every run reaches it. Founder counts are read at G* by linear interpolation between samples; the MIXED band is all 20 shadows of the three REPL runs at G*.
- **FASTER THAN DRIFT** on a seed: all three REPL runs below every FROZEN run AND below every MIXED shadow at G*.
- **SLOWER THAN DRIFT**: all three REPL runs above every FROZEN run at G*.
- Otherwise **WITHIN DRIFT**.
A seed COUNTS if all seven runs finished and each REPL and FROZEN set has at least 2 distinct replicates (identical alive series = one replicate).

## Verdict (>= 2/3 of counted seeds; fewer than 3 counted = INCONCLUSIVE)
- **SWEEP**: FASTER THAN DRIFT on >= 2/3. REPL loses founders faster than both a spatial world without heritable change and a well-mixed Moran process: something heritable that arises by mutation drives it. Then a mechanism to prevent the sweep has a target.
- **NOT A SWEEP**: SLOWER or WITHIN on >= 2/3. The collapse at 10,000 ticks is what drift does on REPL's clock; preventing it with a mechanism has no selective target at this horizon.
- Otherwise **MIXED**.
Conservative by design: calling it a sweep needs REPL below BOTH nulls.

## Reported, ruling on nothing
`pLin` mints per 1,000 births in each world (whether lineage counts compare across worlds at all); the DEFAULT world's founder curve per generation; final founder counts at 10,000 ticks.

## Prediction written before running
NOT A SWEEP, with REPL SLOWER than FROZEN on most seeds (the pilot), and 0 `pLin` mints under REPL on every run.

## What this cannot say
Five seeds, one horizon (10,000 ticks), founder survival only (not what happens after founders are gone). FROZEN keeps founder trait differences, so it is a null for heritable change by MUTATION, not for every heritable difference. A sweep at longer horizons (#282 was 72,000+ ticks) is not excluded.

## Template step 6
REPL_FROZEN is a rig-only knob; nothing changes for any saved universe or the default world.
