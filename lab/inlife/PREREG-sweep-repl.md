# Baseline: do new program types arrive and persist faster than chance under REPL? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html at #327 (REPL speciation fixed; default world unchanged). Rig: `harness-sweep.js` (#256), unchanged. Analysis: `lab/inlife/analyse-sweep-repl.js`. Asked for by the user: Step 1 of Direction 1 (what makes new lineages arise and persist in REPL), measured before any intervention (Step 2, a program-computed diet in sunStep, is pre-registered separately against this baseline).

## Why this instrument
#327 showed REPL's `pLin` is now close to per-birth trait noise (a third of births clear SPECIATE_DIST), so lineage counts cannot answer "do new heritable types arise and persist". The sweeper's PROGRAM layer can: a token is the exact op sequence a particle runs; an arrival is a token first held by M=3 particles; it persists if it is held by M again P ticks later. Its TREE null keeps the real family tree and the real events and moves each event to a random recipient: beating it means the particles that really got new programs held them better than random recipients would.

## Pilot (practice seed 1, 6,000 ticks; NOT evidence)
Program layer: TREE "FASTER THAN CHANCE" (20 persistent per 1,000 ticks against shadows 7.3-17.3); MIXED "FASTER". Calibration: both neutral markers (marker05, marker50) read CHANCE under TREE, but under MIXED marker05 read FASTER and marker50 SLOWER, so **MIXED is not calibrated in REPL and rules on nothing**. The sweeper's `summarySelection` read marker05 as "NOVELTY FAVOURED", so it rules on nothing either. 86 s per 6,000 ticks.

## Runs
REPL=1, TICKS=10000, the sweeper's defaults (K=8 shadows, M=3, P=2000, WARM=1000). Seeds **6601-6605** (never run), NULLSHIFT 0 and 3: 10 runs.

## Step 1 - counted
A run COUNTS if it finished with loopErrors 0 AND both markers read CHANCE under TREE (the null is calibrated on that run). A seed counts if both its runs count. Fewer than 3 counted seeds = INCONCLUSIVE.

## Ruling measure
The PROGRAM layer's TREE verdict (`layers.program.familyTree.verdict`). A seed is FASTER if both its runs read "FASTER THAN CHANCE", SLOWER if both read "SLOWER THAN CHANCE", otherwise CHANCE.
- **BASELINE: PROGRAMS OUTPACE THE TREE NULL** if FASTER on >= 2/3 of counted seeds.
- **BASELINE: AT CHANCE** if CHANCE or SLOWER on >= 2/3.
- Otherwise **MIXED**.
Reported, ruling on nothing: realPersistentPer1k and the TREE shadow band for programs; every other layer's TREE verdict; MIXED verdicts; marker reads.

## Prediction written before running
PROGRAMS OUTPACE THE TREE NULL (the pilot), on a modest margin (real persistent rate inside the top of the shadow band on some seeds).

## What this cannot say
"Faster than the tree null" means new program types that arose were held better than random recipients would hold them: selection on programs, or something carried with them. It is not open-endedness, and it says nothing about whether those types are niches (the question Step 2 asks). Five seeds, one horizon.
