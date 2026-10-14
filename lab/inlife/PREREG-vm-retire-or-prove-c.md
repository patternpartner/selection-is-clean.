# Retire-or-prove: the VM, THIRD ATTEMPT, with the VM actually switched off (written and COMMITTED before the first decision run; delegated authority, decision mine)

14 Oct 2026. The user asked "have you tried runs without it?" Fair: #302-#303b blanked the PROGRAMS and left the VM machinery running around them. This round switches the VM off.
Engine unchanged (main as of this commit). Harness: harness-oee.js gains BLANKVM=3.

## The arm
BLANKVM=3: from tick 0, executeVM, executeClusterVM and executeSoloVM (the three VM entry points; engine.html:24691, 25122, 25639, called at 25794-25795 and 27143) are replaced by no-ops that only count their calls.
Everything the VM does to the world (forces, phase and amplitude transfer, tendency bleed, VM-driven births, VM-driven lineage minting, signals, program growth and transfer) runs through those three functions, so this is a world with no VM.
Programs still exist and are still inherited; they are simply never executed. Metabolic accounting that reads program length is untouched.
A PILOT (not evidence: seeds 1-3 had been seen, three runs per seed, 8,000 ticks) found alive, births, lineages alive, clusters, speed and trait dispersion indistinguishable from draw-order controls, lineage IDs minted
lower on two seeds (about 20-35% by tick 8,000), and the no-VM world about 1.85x faster (31 s against 58 s for 3,000 ticks). That pilot is why I expect the result below; it does not count.

## Prediction written before running
DECORATION on the three ruling measures (BLANK inside the control band on at least 4 of 5 counted seeds), with a possible lineage-count difference that this design does not rule on.

## Design (the retire-or-prove template, identical to PREREG-vm-retire-or-prove-b.md except the arm and the manipulation check)
Seeds 102, 103, 104, 105, 106 (never run). Per seed: NOVM (BLANKVM=3, NULLSHIFT=0) and SIX CONTROL REPLICATES (BLANKVM unset, NULLSHIFT 0..5). TICKS=20000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10. 35 runs.
Horizon, out loud: 20,000 ticks, about 10 generations.

## Counting
A seed COUNTS if: the NOVM run's vmNoopCalls is above 1,000,000 (the call sites were reached and did nothing) and it has no loop or driver errors; at least 4 of the 6 controls ended alive (N >= 5) with no loop or driver errors.
A control that ended extinct or errored is EXCLUDED from the band for that seed and listed. A NOVM run that ended extinct still counts and is listed as a crash. Fewer than 3 counted seeds = INCONCLUSIVE.

## Ruling measures, "moves", verdicts: IDENTICAL to PREREG-vm-retire-or-prove.md
M1 centredEntropyRatio (0.05), M2 spread_late (10%), M3 estFrac (25% relative). A measure MOVES on a seed only if the NOVM run is beyond the threshold from the band mean AND outside every remaining control value.
A verdict needs the SAME measure to move the SAME way on at least 2/3 of counted seeds. Reported, not ruling: entropyRatio, kinds_late, extinction counts, and runtime (timing_ms.run) per arm.

## Template step 6 - saved worlds belong to the user
No engine change will be shipped from this round, whatever it finds. A no-VM default would change every saved universe on reload. The verdict goes to the user.

## What this cannot say
Five seeds, one horizon (about 10 generations), defaults. A world without the VM may differ at 100,000 ticks, in the REPL mode where programs are the only reproducers, or on measures not in the list.
