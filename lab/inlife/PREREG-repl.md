# Retire-or-prove under REPL: is the VM load-bearing when programs are the only reproducers? (written and COMMITTED before the first decision run; delegated authority, decision mine)

14 Oct 2026. Engine unchanged. Harness: none changed (REPL, BLANKVM and NULLSHIFT already exist). New probe `lab/inlife/probe20.js` (births by route).

## Pilot (practice seed 1, 3,000 ticks; NOT evidence)
REPL=1, VM on: 564 alive, 3,609 parented births, 0 parentless. REPL=1, VM entry points no-oped: 48 alive, 0 parented births, 287 PARENTLESS births. So the no-VM REPL population is held near 50 by the engine's parentless refill,
not by reproduction. That makes the manipulation check near-certain and the question below a positive control for the design as much as a test.

## Question
Under REPL (physics makes no babies; a particle breeds when its own program drives channel 4), does removing the VM, or emptying the programs, change the world? And what carries the population when it does?

## Arms (per seed)
NOVM (BLANKVM=3, NULLSHIFT=0); BLANK (BLANKVM=2, NULLSHIFT=0; one inert instruction, because an empty program throws at op 144); THREE CONTROLS (BLANKVM unset, NULLSHIFT 0,1,2).
Every run: REPL=1 TICKS=10000 SAMPLE=1000 ESTABLISH=1000 ESTWARM=2000 ESTN=10. Seeds 111-115 (never run). 25 runs.
Horizon, out loud: 10,000 ticks is about 25 REPL generations (median life about 400 ticks, #273). A verdict is about that horizon only.

## Prediction written before running
NOVM and BLANK both WORSE-for-the-world on every ruling measure on every counted seed: population collapses to the refill floor (alive_late under about 100 against several hundred), centredEntropyRatio and spread_late and estFrac fall.
If instead either arm sits inside the control band on two thirds of seeds, programs are not load-bearing even where they are the only replicator, and that is the surprising result.

## Counting
A seed COUNTS if all 5 runs finished with no loopErrors/driverErr, at least 2 of 3 controls ended alive (N>=5), and (for NOVM) vmNoopCalls > 100,000. Controls that crashed are excluded from the band. Fewer than 3 counted seeds = INCONCLUSIVE.

## Ruling measures, "moves", verdicts: IDENTICAL to PREREG-vm-retire-or-prove.md (M1 centredEntropyRatio 0.05, M2 spread_late 10%, M3 estFrac 25% relative; a measure moves only if the arm is beyond the threshold from the control mean AND outside every control; same measure, same direction, >= 2/3 of counted seeds).
Verdict names: LOAD-BEARING (arm moves worse for the world, WITH controls alive) / DECORATION (no measure moves on >= 2/3) / SPLIT / other = changes the world, no consistent direction.
Alive_late reported as the guard; for each arm also report parented vs parentless births (probe20, seed-matched 3,000-tick shadow, reported only).
NOTE for reading: because the refill floor keeps NOVM above extinction, "did not crash" is NOT evidence the VM is dispensable; read alive_late and births with it.

## Template step 6
REPL is a knob, default OFF. Nothing from this round changes any saved universe or the default; no engine change ships.

## What this cannot say
Five seeds, one horizon, defaults of REPL (no ARMS/ATOMS/SEX/COST), VM removed wholesale rather than opcode by opcode. It cannot say which opcodes carry replication under REPL.
