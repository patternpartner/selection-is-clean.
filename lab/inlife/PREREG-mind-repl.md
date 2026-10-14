# Retire-or-prove: the mind under REPL (written and COMMITTED before the first decision run; delegated authority, decision mine)

14 Oct 2026. Engine and harness unchanged (MIND, MIND_MODE, MIND_SEED, REPL, NULLSHIFT already exist). #296b tested the mind only without REPL, where programs do not set births or survival (#302-#303c). Under REPL the program IS the replicator (#307), so this is the setting where an edit to a program can matter.

## Pilot (practice seed 1, 3,000 ticks; NOT evidence)
REPL=1: mind off 564 alive; MIND=20 learning 598 alive (wrote 815 children, op-loss 2.21 against 6.06 blind, its top written op was 4, the ancestor's op); MIND=20 uniform 211 alive (704 children). The mind runs and learns under REPL.

## Arms (per seed)
M (MIND=20, MIND_SEED=1); U (uniform random rewrites at the same rate: MIND=20 MIND_MODE=2 MIND_SEED=1); F (frozen random weights: MIND_MODE=1); THREE NULLS (mind off, NULLSHIFT 0,1,2).
Every run: REPL=1 TICKS=10000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10. Seeds 121-125 (never run). 30 runs. Horizon, out loud: 10,000 ticks, about 25 REPL generations.

## Prediction written before running
U WORSE than the nulls (random rewrites break working replicators; the pilot shows it). M NOT WORSE than the nulls. Whether M is BETTER is open; I expect M inside the null band on most seeds, and if it moves, UP on alive_late. F in between. If M beats U and F on alive_late on 4 of 5 seeds, the learning (not just the extra rewriting) is what matters under REPL.

## Counting
A seed COUNTS for an arm if the arm's mind wrote children (mind.uses > 0), no loopErrors/driverErr, and at least 2 of 3 nulls ended alive (N >= 5) with no errors. Fewer than 3 counted seeds for an arm = INCONCLUSIVE for it.

## Ruling measures (template step 3, REPL adds alive as a ruling measure because population size is what REPL's replicators carry)
M1 centredEntropyRatio (0.05), M2 spread_late (10%), M3 estFrac (25% relative), M4 alive_late (25% relative). An arm MOVES a measure on a seed only if beyond the threshold from the null mean AND outside every counted null. Verdict needs the SAME measure, SAME direction on >= 2/3 of counted seeds (4 of 5).
WORSE (arm lower on any measure on >= 2/3) -> DELETE or DORMANT; BETTER (higher on >= 2/3, not WORSE) -> KEEP; both -> SPLIT; none moves on >= 2/3 -> "ran, no effect" (decoration); otherwise KEEP with no direction. Rulings are about M; U and F are scored the same way and reported beside it.

## Template step 6
The mind is already on by default in the browser (the user's call, #296). Nothing here changes any saved universe or default; REPL stays a knob. A finding that the mind is WORSE under REPL goes to the user as information; it changes nothing by itself.

## What this cannot say
Five seeds, one horizon, REPL defaults (no ARMS/ATOMS/SEX/COST), a single mind rate (20%). It does not test the mind in the default non-REPL world again.
