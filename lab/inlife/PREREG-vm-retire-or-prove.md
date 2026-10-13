# Retire-or-prove: the per-particle VM programs (written and COMMITTED before the first decision run; delegated authority, decision mine)

13 Oct 2026. Engine: engine.html at main a3e1a44 (unchanged). Harness: harness-oee.js with the new `BLANKVM=1` switch (#303; default off, output identical when unset, checked by hash).
Shape: CLAUDE.md's retire-or-prove template. Where I tighten it, I say so and why.

## Why this question
#302-#302c found that emptying every program in the population, tick 1,500-4,000 and 6,000-8,000, moved neither births, alive count, trait dispersion (within about +/-23%) nor lineages alive; it moved
lineage minting on one seed in eight (a cluster route) and a program-driven birth route on two seeds in fourteen. CLAUDE.md: "If a mechanism does not change who has offspring, it is decoration."
Those were short windows from tick 1,500 on. This asks the template's question over the project's standard horizon and from tick 0, on the template's measures.

## The ablation (the "off" arm)
BLANKVM=1: every alive particle's VM program (pProg[i] and pGenome[i].vmProgram) is emptied every 20 ticks from tick 0, newborns included. Cluster VM, plasmids and every other mechanism keep running (with empty
programs). So this retires the programs the creatures run, not every piece of VM-adjacent code.

## Prediction written before running
I expect DECORATION: BLANK inside the null band on all three ruling measures on most seeds, with perhaps a seed or two where it is outside on one measure (the pattern of #302b/#302c). I think a world
that starts blank and stays blank will show a seed with fewer cluster lineages, and I do not expect that to be a consistent direction across seeds.

## Design
Seeds 91, 92, 93, 94, 95 (never run). Per seed: BLANK (BLANKVM=1, NULLSHIFT=0) and SIX CONTROL REPLICATES (BLANKVM unset, NULLSHIFT = 0..5; the null band; template step 3 asks for at least three).
Every run: TICKS=20000, SAMPLE=1000, ESTABLISH=1000 ESTWARM=2000 ESTN=10. 35 runs.
Horizon, out loud: 20,000 ticks is about 10 generations by my own birth count (#302). A verdict here is a verdict about that horizon.

## Step 1 - executed first (template)
A seed COUNTS only if (a) the BLANK run's `popProgLen` is below 1 while the control replicates' are above 5 (the manipulation took), (b) no run has loopErrors, driverErr or a crash (alive under 5 at the end),
(c) all seven runs finished. Fewer than 3 counted seeds = INCONCLUSIVE and the default does not change either way (template step 2).

## Step 3 - the ruling measures (grid-free twins, as CLAUDE.md requires; old two reported beside them)
- M1 centredEntropyRatio (diversity_trend.centredEntropyRatio): moves if BLANK differs from the control mean by more than 0.05.
- M2 spread_late (diversity_trend.spread_late): moves if BLANK differs by more than 10% of the control mean.
- M3 establishment fraction (establishment.estFrac): moves if BLANK differs by more than 25% relative to the control mean (a control mean of 0 and BLANK 0 = no move).
- Guard: alive_late; a crash (alive under 5) in one arm and not the other is reported as a crash.
- Reported, not ruling: entropyRatio, kinds_late (the origin-corner grid, #257c), births if present.

A measure MOVES on a seed only if BLANK is beyond that threshold AND outside EVERY one of the six control replicates on that measure (template: "outside EVERY null").
DEPARTURE FROM THE TEMPLATE, on purpose: the template lets any of its conditions trigger WORSE or BETTER on any measure. With three measures and a band of six, chance alone puts BLANK outside all six on a given
measure with probability about 2/7, so "any measure" would fire on most seeds by luck (#249b). So a verdict needs the SAME measure to move in the SAME direction on at least two thirds of the counted seeds.

## Verdicts (read from the VM's side; BLANK is the world without it)
- WORSE (the VM makes the world worse): same measure moves, BLANK higher (better) than the controls, on >= 2/3 of counted seeds; or controls crash and BLANK does not on >= 2/3. -> DELETE, or DORMANT (default off, code kept) if a named follow-up is planned.
- BETTER (the VM earns its place): same measure moves, BLANK lower than the controls, on >= 2/3 of counted seeds. -> KEEP, claimed only at the rung measured.
- DECORATION ("ran, no effect"): on at least 2/3 of counted seeds NO ruling measure moves (BLANK within the control band or under the thresholds on all three). -> DELETE, unless the note names something else that depends on it.
- SPLIT: a measure moves one way and another the other way on >= 2/3 of the seeds each. Default does not move.
- Otherwise (it changes the world on some seeds, with no consistent direction): KEEP, the default does not move; say so.

## Template step 6 - saved worlds belong to the user
Deleting the programs, or defaulting them off, alters every saved universe on reload. Whatever this round finds, I will NOT ship an engine change from it. The verdict goes to the user in the notes.

## What this cannot say
Five seeds, one horizon, defaults, one ablation (programs emptied, not the VM code removed). BLANK being inside the band does not show the programs are useless at 100,000 ticks.
