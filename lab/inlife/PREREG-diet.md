# Direction 1, Step 2: does a diet the program computes make new program types arise and persist? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #329 (`REPL_DIET`; unset, harness-oee identical to the previous engine for the default world and REPL=1, seed 2, apart from one new never-fired liveness name). Rigs: `harness-sweep.js` (unchanged), `lab/inlife/probe-diet.js` (manipulation check). Batch: `lab/inlife/sweep-batch.sh`. Analysis: `lab/inlife/analyse-diet.js`. Asked for by the user (a review's design: niche partitioning in the currency that pays for births, chosen by the program).

## Why
#326: REPL's lineage collapse at 10,000 ticks is drift, and REPL makes almost nothing new that lasts. #328: REPL's new program types are held about as well as a neutral marker against the TREE null. The store that pays for REPL births, `pE`, is fed by sunlight split equally among everyone on a cell, blind to what anyone carries (#327's check), so two programs never eat differently and nothing new can take a niche of its own.

## The mechanism (REPL_DIET=K, here K=4)
Each cell's sunlight is split into 4 bands, each regenerating a quarter of the income up to a quarter of the cap and diffusing on its own; a particle harvests only its band, shared with the others in that band and cell. Total income is unchanged. The band is computed by the particle's program: `floor((tanh(R10)+1)/2*4)`, R10 being the general register's value at the end of its solo run.
**Design history, from pilots on practice seed 1 (not evidence):** the band was first read from action channel 5 with `floor(|v|*K) mod K`; no particle left the ancestral band in 6,000 ticks and the population sat at a quarter of plain REPL's. Channel 5 turned out to be written in only 2.8% of solo runs. With R10 and the tanh spread, the ancestral programs split between bands 2 and 3 from the start (R10 depends on state as well as program), bands 1 and 0 are colonised from about tick 3,500, and the population recovers as bands fill (144 living at 2,000; 462 at 6,000, with 17/137/163/145 in bands 0-3).

## Arms (per seed)
- **CONTROL**: REPL=1. **DIET**: REPL=1 REPL_DIET=4. Both under `harness-sweep.js`, TICKS=10000, defaults (K=8 shadows, M=3, P=2000, WARM=1000), NULLSHIFT 0 and 3.
- **Manipulation check**: `probe-diet.js` on every DIET seed and shift (it draws nothing, so it is the same trajectory as the sweeper run).
Seeds **6701-6705** (never run). 20 sweeper runs + 10 probe runs.

## Calibration (fixed after #328: markers calibrate across runs, never as a per-run exclusion)
A run COUNTS if it finished with loopErrors 0. A DIET run additionally counts only if its manipulation took: at least 2 bands each hold at least 5% of the living, averaged over the last third of samples. The markers' off-band reads under TREE are counted per arm and reported beside the program layer's.

## Ruling measure and verdict
The PROGRAM layer's TREE verdict, counted over each arm's counted runs (FASTER = "FASTER THAN CHANCE").
- **BEATS CHANCE (DIET)**: program FASTER in at least half of DIET's counted runs (and at least 5), AND DIET's markers read FASTER in at most 20% of their reads (otherwise the null is too narrow in that arm and the claim is withheld).
- **BEATS CONTROL**: DIET's program-FASTER count is at least CONTROL's + 3, with at least 8 counted runs in each arm.
- **SUPPORTED**: both. **PARTLY**: exactly one. **NOT SUPPORTED**: neither. Fewer than 6 counted runs in either arm: INCONCLUSIVE.
Reported, ruling on nothing: program realPersistentPer1k per run against its TREE band; alive at the end; the lineage and trait layers' TREE verdicts; band occupancy and programs per band over time.

## Prediction written before running
CONTROL at chance, as in #328 (program FASTER in about 3 of 10). DIET: PARTLY — more FASTER runs than CONTROL by at least 3, but under half of its runs.

## Template step 6
REPL_DIET is a rig-only knob; REPL is off by default. No saved universe changes.

## What this cannot say
Beating the TREE null means new program types were held better than random recipients would hold them; under DIET that could be the band a program puts its carrier in, or anything else the program does. Whether the persistent types are in different bands is reported (programs per band), not ruled on. One K, one carrier register, five seeds, one horizon.
