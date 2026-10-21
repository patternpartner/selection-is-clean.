# Direction 1, Step 2 (again): a HERITABLE diet, set by the program. Do new program types now arise and persist? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #331 (`REPL_DIET_SRC=1`; unset, plain REPL and #329's R10 diet are identical to the previous engine, seed 2). Rigs: `harness-sweep.js`, `lab/inlife/probe-diet.js`, `lab/inlife/probe-bandherit.js` (all draw nothing). Batch `lab/inlife/diet2-batch.sh`. Analysis `lab/inlife/analyse-diet.js` (SEEDS=6801,...). Asked for by the user after #330.

## Why again
#329 (NOT SUPPORTED) tested a band read from R10, and #330 found R10 is `pMem[6]`, overwritten by contact: parent-child band agreement 0.44-0.71 against chance 0.36-0.57, one program spread over bands. So no lineage ever had a niche of its own. #329 is not evidence against a heritable diet.

## The mechanism (REPL_DIET=4, REPL_DIET_SRC=1)
As #329 (four sunlight bands per cell, a particle harvests only its band, total income unchanged), except the band is the program's exact opcode sequence hashed (FNV-1a) into 4. Identical programs always share a band; no state enters; only a change to the opcode sequence moves a lineage. **A heritable label the program determines, not a value it computes.**

## Pilot (practice seed 1, 6,000 ticks; NOT evidence)
Band heritability: child = parent 0.94 against chance 0.25-0.53; carriers of one program in its commonest band 1.0 (by construction). All four bands occupied from tick 500 (e.g. 442/352/331/370 at 6,000). **The population runs at 1,350-1,800**, three to four times plain REPL's (300-600): with harvesters spread over bands each cell yields more in total. That is part of what the mechanism does; the TREE null shares the real demography, so it does not confound the program verdict, but persistent rates per 1,000 ticks scale with population and are compared within arm only.

## Arms, runs, calibration, ruling, verdict
Exactly as PREREG-diet.md (#329), with:
- **DIET** = REPL=1 REPL_DIET=4 REPL_DIET_SRC=1; **CONTROL** = REPL=1. Sweeper at NULLSHIFT 0 and 3, TICKS=10000. Seeds **6801-6805** (never run). Manipulation probes on every DIET run: `probe-diet.js` (bands) and `probe-bandherit.js` (heritability). 40 runs.
- **A DIET run counts** only if the bands diversified (at least 2 bands each hold 5% of the living over the last third, as #329) AND the band was heritable on that run (parent-child agreement minus chance agreement >= 0.2, whole run).
- **Ruling** (unchanged): the program layer's TREE verdict, counted per arm. BEATS CHANCE: program FASTER in at least half of DIET's counted runs (and at least 5), with DIET's markers FASTER in at most 20% of reads. BEATS CONTROL: DIET's FASTER count at least CONTROL's + 3, with at least 8 counted runs per arm. SUPPORTED both; PARTLY one; NOT SUPPORTED neither; fewer than 6 counted in either arm INCONCLUSIVE.
- Reported, ruling on nothing: persistent program arrivals per 1,000 ticks against each run's TREE band; alive at the end; band occupancy and programs per band; heritability per run.

## Prediction written before running
PARTLY: DIET ahead of CONTROL by at least 3 FASTER runs, but under half its runs. (My last three predictions on these questions were wrong in direction or size; recorded so this one is read accordingly.)

## Template step 6
Rig-only knobs; REPL is off by default. No saved universe changes.

## What this cannot say
A hash band is an arbitrary niche label: any opcode change can move a lineage to another band, so band "mutation" rides on program mutation, and the label carries no function. Beating the TREE null here would mean new program types are held better than random recipients would hold them when each type eats from its own band; it would not show the programs computing anything about their diet. One K, five seeds, one horizon.
