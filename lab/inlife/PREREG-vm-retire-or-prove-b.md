# Retire-or-prove: the per-particle VM programs, SECOND ATTEMPT (written and COMMITTED before the first decision run; delegated authority, decision mine)

13 Oct 2026. Replaces PREREG-vm-retire-or-prove.md (sha256 e1e203d6fc547229), whose round ended INCONCLUSIVE with 2 of 5 seeds counted. This is a NEW experiment, not a re-reading of that one
(template step 5). Engine unchanged (main a3e1a44); harness-oee.js gains BLANKVM=2.

## What went wrong in the first attempt (kept on the page)
1. The ablation was an engine-crash generator. BLANKVM=1 sets programs to []. Opcode 144 (grow a program) draws `Math.floor(Math.random()*pProg[i].length)` and spreads `pProg[i][that]`; an empty program makes
   it read `pProg[i][0]` = undefined and throw. Seed 94's BLANK run threw 99 loop errors and went extinct and reseeded 57 times. Empty programs are probably unreachable in a normal world, so the defect is
   probably latent, but nothing guards it. Fix in the ablation, not the engine: BLANKVM=2 gives every particle ONE inert instruction ([-1,0,0,0]; op -1 is a no-op, REPL_INERT's default), which cannot throw.
2. My counting rule disqualified a seed if ANY of the six control replicates ended extinct. Control runs go extinct on their own: 2 of 30 control runs in the first attempt did (seed 91 replicate 1 collapsed at about
   tick 19,000; seed 92 replicate 3 crashed repeatedly from about tick 14,000, 43 extinction events). With about 7% per run, about a third of seeds would be disqualified by luck. That is data about the default world
   (it is fragile), not a reason to throw a seed away.
3. The control band is very wide: centredEntropyRatio ranged 0.06-0.57 across replicates of one seed. Single-run readings at this horizon are not measurements.

## Prediction written before running
As before: DECORATION or a no-consistent-direction KEEP. The first attempt's two counted seeds disagreed (seed 93: BLANK far above the band on all three measures; seed 95: below on cER and spread, above on
establishment), which is what a noisy no-effect looks like. I expect the same pattern, and I expect a few control runs to go extinct.

## Design
Seeds 96, 97, 98, 99, 100, 101 (never run). Per seed: BLANK (BLANKVM=2, NULLSHIFT=0) and SIX CONTROL REPLICATES (BLANKVM unset, NULLSHIFT 0..5). TICKS=20000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10. 42 runs.
Horizon, out loud: 20,000 ticks, about 10 generations by my own birth count.

## Counting (template step 1, corrected)
A seed COUNTS if: BLANK's popProgLen is at most 1.5 and every non-extinct control's is above 5 (the manipulation took); BLANK has no loop errors or driver errors; at least 4 of the 6 controls ended alive (N >= 5)
and have no loop or driver errors. A control that ended extinct (N < 5) or errored is EXCLUDED from the band for that seed and listed as a crash. A BLANK run that ended extinct still counts and is listed as a crash.
Fewer than 3 counted seeds = INCONCLUSIVE and the default does not change.

## Ruling measures, thresholds, "moves", verdicts: IDENTICAL to PREREG-vm-retire-or-prove.md
M1 centredEntropyRatio (0.05), M2 spread_late (10%), M3 estFrac (25% relative); a measure MOVES on a seed only if BLANK is beyond the threshold from the band mean AND outside every remaining control value;
a verdict needs the SAME measure to move the SAME way on at least 2/3 of counted seeds (WORSE / BETTER / DECORATION / SPLIT / KEEP as written there). Reported, not ruling: entropyRatio, kinds_late, extinction counts,
and the crash tallies for BLANK and for the controls.

## Template step 6 - saved worlds belong to the user
No engine change will be shipped from this round, whatever it finds. The verdict goes to the user in the notes.

## What this cannot say
Six seeds, one horizon, defaults, one ablation (programs replaced by an inert instruction, not the VM code removed). A world in which this is a no-effect at 20,000 ticks may differ at 100,000.
