# PRE-REGISTRATION #416 — a dearer birth: the crowd price at K=100 against the shipped 450, judged in fields of one value each

Written and committed before any decision run. Browser fields are unseeded, so every pair below is a fresh draw nobody has seen.

## Why
- **The crowd price** (`REPL_CROWD_K`, #382): a birth costs `BIRTH_ENERGY_COST x living / K`. A LOWER K is a DEARER birth and a
  smaller world. 450 was chosen at four inputs on two node seeds (#382), and #394 found "no direction" at five inputs on three
  node seeds. #397 showed node worlds at that size cannot see a severalfold effect, so neither choice was a measurement.
- **#411's arms** (seen, design; eight universes a value inside one shared field) found the price monotone over a tenfold range:
  K=100 found 2.1x the shipped arm beside it, with half the creatures and 4.7x the functions of size 17+.
- **Arms share a field's machine.** A smaller world ticks faster, and inside one field that speed is taken from its neighbours. So
  the price goes to fields of ONE value each, two fields run together, where a cheaper tick counts the way it does for a viewer.
- **The seen pairs** (`lab/port/out-crowd-field/`, `lab/port/field-pair.sh`, 1,500 s, design):

  | Pair | Arm | F at 5 / 10 / 15 / 20 / 25 min | Size 17+ | Ticks across the field | Alive |
  |---|---|---|---|---|---|
  | b | 450 (shipped) | to 148,678 | 21,750 | | |
  | b | 150 | to 161,065 (1.08x) | 30,929 (1.42x) | 1.67x | 0.72x |
  | d | 450 (shipped) | 6,659 / 20,694 / 35,704 / 50,628 / 62,840 | 6,981 | 31,316 | 50,268 |
  | d | 100 | 4,109 / 21,291 / 50,425 / 82,188 / 105,744 (1.68x) | 21,303 (3.05x) | 71,785 | 30,419 |

  Pair a (K=150) was lost to the end of the user's allowance; pair c (K=100) to a container restart at about 10 minutes. Both are
  kept, void. The two shipped fields differ 2.4-fold (62,840 against 148,678), so one pair decides nothing.
- **K=100 is the lowest value ever measured.** Whether a still dearer birth does better is unmeasured, and it is not asked here.

## Arms
- **SHIP:** `engine.html` as on the branch (the #415 engine, `REPL_CROWD_K` 450 when unset under TASKS).
- **K100:** the same file with the one fill line changed:
  `if(globalThis.__REPL_CROWD_K===undefined)globalThis.__REPL_CROWD_K=450;` becomes `...=100;` (`field-pair.sh` asserts the
  pattern occurs once and that the copy differs).
- Every other file is today's.

## Runs
- **8 pairs**, tags p1-p8, each a SHIP field and a K100 field launched together (`lab/port/field-pair.sh`, `NAME=k100`, out
  `lab/port/out-crowd100/`), 1,500 s, sampled every 60 s. One pair a launch. Nothing else runs on the machine.
- Analysis `lab/port/analyse-crowd100.js`, written and committed with this file.

## Floor (executed first)
- A run counts if its final sample is at 1,500 s, is marked final, has no universe missed (`bad` 0), and every sample reads
  `crowdK` 450 (SHIP) or 100 (K100) with `storeDeath 1, provBirth 0, aim 0`. A failed switch check makes the experiment
  INCONCLUSIVE until the rig is fixed.
- **Fewer than 6 complete pairs: INCONCLUSIVE.**

## Rule
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(F_k100 / F_ship)` at 1,500 s over complete pairs.
- **BETTER:** K100 greater at p < 0.05. **WORSE:** K100 less at p < 0.05.
- **Depth guard (a count can grow by more of the same):** BETTER ships only if K100 found MORE functions of size 17+ than SHIP
  (the sum of `D.ge17` over samples) in more than half of the complete pairs.
- **Reported, not ruled on:**
  - the ratio of F at 5, 10, 15 and 20 minutes (pair d was behind at 5 and ahead from 10);
  - size 17+, and the same Wilcoxon on it;
  - the mean depth of what was new in the last 5 minutes;
  - ticks across the field, creatures alive;
  - universes holding fewer than 20 creatures at the final sample (a smaller world may die more often).

## Verdict
- **BETTER and the depth guard holds: ship.** Under TASKS the default fill sets `REPL_CROWD_K` 100 (unset globals only;
  `REPL_CROWD_K=450` restores today's world byte for byte). Acceptance before `main`: `substrate-test` at four budgets and
  `smoke.sh`. A browser row that asserts a population size or a throughput and fails is rerun alone before anything is believed,
  and is not retuned to pass.
- **BETTER without the guard:** held, with the reason.
- **WORSE or neither:** no change. The knob stays (450 is today's world; nothing here argues for deleting the price).

## Prediction (mine, before any run; I am 5 for 11, counting #393's "not worse, neither direction" as held)
BETTER, about 6 of 8, median ratio about 1.4. The arms and both seen pairs lean the same way, and pair d's depth gain (3x) is
larger than its count gain. The risks I see:
- Pair d's shipped field was the lowest shipped field I have seen, so 1.68x may be mostly its base.
- K100 is behind at 5 minutes. If the early cost is larger in some pairs, 25 minutes may not be long enough for it to catch up.
- A world of about 800 creatures a universe is nearer extinction, and a dead universe finds nothing.

## What this cannot say
- Anything past 25 minutes. #383's lead shrank with time; #406's held. If this ships, a 150-minute pair (`long-pair.sh`) is the
  named follow-up.
- Whether K below 100 is better still.
- A phone. These fields are 412x915 on four cores of a server.

## Saved worlds (rule 6)
A reloaded TASKS universe holding about 1,600 creatures would face a birth price about sixteen times the base until deaths bring
it down toward the new size. Its creatures, genomes and ground come back. Said here; it does not block.
