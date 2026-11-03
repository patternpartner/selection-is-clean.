# Does the drained world keep producing novelty with NOTHING changed? #348's six worlds continued to 2,400,000 ticks (#349; written and COMMITTED before the continuation runs)

25 Oct 2026. Chosen by the session; the user has delegated direction ("I trust your next chosen steps").

**Why this test.** The sharpest objection to open-endedness claims is that the novelty comes from the designers, not the system (the OEE workshops, 2015-2018). In #337-#348, each gain followed a session adding a mechanism. #348 is the first case where novelty kept arriving inside one unchanged run: hundreds of functions first reached 100 income per sample in its last quarter. This run asks whether that continues for another 1,200,000 ticks with nothing added.

**What runs.**
- #348's six worlds (seeds 8001-8003, DRAIN = TASK_TROPH 0.5 on the scarce world, against SCARCE), resumed exactly from their 1,200,000-tick saves and run to 2,400,000.
- Same options, same code: the core is unchanged since #348.
- Batch: `NCH=16 ARM1=... ARM2=... SEEDS="8001 8002 8003" MAXNEW=4 lab/tasks6-batch.sh lab/out-troph 4`, with #348's ARM1 and ARM2.
- Analysis: `NW=80 node lab/analyse-troph.js lab/out-troph` (second half = windows 41-80, late = windows 71-80).

**Seeds.** The first 1,200,000 ticks of these worlds have been seen and ruled on (#348). Windows 41-80 have not. The rule decides only on them.

## Step 1
A seed counts if both its worlds reached 2,400,000 ticks and both arms' reads hit at least 1% over windows 41-80. Fewer than 3 is INCONCLUSIVE.

## Ruling (windows 41-80 only)
- **PERSISTS:** DRAIN's late novelty (functions whose per-sample income first reaches 100 in windows 71-80, never before in the run) is at least 100 on at least 2 of 3 seeds, AND higher than SCARCE's on at least 2 of 3 seeds. For scale, #348's windows 31-40 held 379-637 for DRAIN and 16-564 for SCARCE.
- **NOT FALLING:** the least-squares slope of window exp(H) over windows 41-80 is at least 0 for DRAIN on at least 2 of 3 seeds.

## Verdict
- **STILL ARRIVING:** PERSISTS and NOT FALLING both hold.
- **NOVELTY PERSISTS, BREADTH FALLS:** PERSISTS holds, NOT FALLING does not.
- **FADES:** PERSISTS fails. The recipe moves the fence and the world then settles; the next build is a growing function space.

Reported:
- the count of distinct functions that ever reached 100 income, against the 65,536 available (how full the space is);
- windows 61-70 against 71-80;
- mean circuit and median exp(H) for windows 41-80;
- the SCARCE arm's own trajectory.

## Prediction written before running
**NOVELTY PERSISTS, BREADTH FALLS**, with low confidence.

The space is large: 65,536 functions, of which DRAIN used a few thousand by 1.2M. So new functions should keep reaching 100 for a while. But with population fixed at about 4,080, effective breadth should stop rising.

## What this cannot say
- Still one horizon, just a longer one. A PERSISTS verdict at 2.4M is not "forever".
- A fixed function space must eventually fill, so this test can show that the space is not yet the limit; it cannot show unboundedness.

## Addendum - a batch-script bug, found before any windows 41-80 result was read; rules unchanged
The edit adding NCH to `lab/tasks6-batch.sh` put an inline comment before `CH=150000` on the same line, so CH ran unset. Every continuation chunk therefore ran tasks-run's default of 100,000 ticks, not 150,000.
- After the 8 continuation chunks the worlds stood at 2,000,000 ticks. The resume is exact, so the trajectories are valid, only shorter.
- The options (DRAIN: TASK_TROPH 0.5; SCARCE: 0; both TASK_RATE 0.02, READ_REG 1) are confirmed in every arm's saves.
- Fix: the line is rewritten, CH is a parameter (default 150,000), and the worlds are completed to 2,400,000 with 4 more chunks of 100,000 (`CH=100000 NCH=20`).
- `lab/analyse-troph.js` now reads every chunk file present instead of assuming 150,000-tick files.
- The first analysis attempt read only 16 files (2,000,000 ticks), saw zeros in windows 67-80, and printed INCONCLUSIVE. That was a reading failure, not a result.
