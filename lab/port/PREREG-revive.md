# PRE-REGISTRATION #375 — does a prey refuge bring a DEAD world back sooner? (`REPL_REFUGE`, judged on dead worlds)

Written and committed before any dead world is generated or any decision run. Seeds 10801-10810 have never been run by anyone.

## Why
- **#370 (100,000 ticks, three seeds):** every world crashed. The dead stretches ran 28,000 ticks (10401), 20,000 (10403) and the
  rest of the run (10402, about 98,000). Time spent dead is the largest limit on new functions in the default world.
- **#372/#370:** a dead world is predation saturated. Every living creature carries op 155 and every store sits under the 0.25 a
  birth costs.
- **#374 (design worlds, exploratory):** on 10401's dead world, `REPL_REFUGE=1` brought revival forward from about 3,000-5,000
  ticks to about 500, in 3 of 3 streams. On 10402's, it tripled the population but restored no computing.
- **#373** could not answer this. It ruled on collapse in living worlds, and its executed-first floor required predation in the
  TREATMENT arm, which the refuge itself suppresses. Both are corrected here.

## Generating the dead worlds (fixed before any is generated)
- Seeds 10801-10810: today's default world (`TASKS=1`), 12,000 ticks, saving genome, population and lifetime record at 4,000,
  8,000 and 12,000 (`lab/port/probe-reload.js SAVEAT=4000,8000,12000 POP=1`). Batch `lab/port/gen-batch.sh`, out `lab/port/out-gen/`.
- A save at tick T is a **DEAD STATE** if, over the two 500-tick windows ending at T:
  - mean formula size is under 1.5;
  - task income is under 1% of the run's largest single-window task income up to T;
  - mean alive is under 400.
- Each seed contributes at most one dead state: its EARLIEST. Seeds with none contribute nothing. `lab/port/select-dead.js`
  applies this and nothing else. It reads only the state up to T, never what follows.

## Arms (per dead state)
- **DEFAULT x3** and **REFUGE x3** (`REPL_REFUGE=1`): population reloads of the dead state (#368/#369, as close to a perfect reload
  as perfect reloads are to each other), 8,000 ticks each. Stream k = 1, 2, 3 is shared by the two arms (`SEED` = seed x 100 + k).
  The three DEFAULT streams are the null band.
- Probe with `DIAG=1` (draws nothing). Batch `lab/port/revive-batch.sh`, out `lab/port/out-revive2/`, analysis
  `lab/port/analyse-revive.js`, written before the runs finish.

## Executed first
A dead state COUNTS if every DEFAULT stream had at least 1,000 prey events in its first 2,000 ticks: the predation the refuge
bounds was there. The REFUGE arm is not required to show it. Report counted states first. Fewer than 3: INCONCLUSIVE, the default
does not move; extend with seeds 10811 onward.

## Measures (per continuation)
- **V:** functions new to the universe's history over the 8,000 ticks.
- **REVIVED:** some window has mean formula size at least 4 and alive at least 500. **T** is the tick of the first such window, or
  8,000 if none.

## Rule, per counted dead state
- REFUGE is **BETTER** if:
  - every REFUGE V is above every DEFAULT V and the lowest REFUGE V is more than 10% above the highest DEFAULT V, or
  - at least 2 REFUGE streams revive and no DEFAULT stream does, or
  - all streams of both arms revive and every REFUGE T is earlier than every DEFAULT T.
- **WORSE** is each of these the other way round.
- The state is **SPLIT** if both apply, **identical** if every paired stream matches on V and T, and otherwise it **differs**.

## Verdict (two-thirds of counted dead states)
- **BETTER on two-thirds:** ship. `REPL_REFUGE` defaults to 1 wherever TASKS runs (the browser's default world), byte-identical
  elsewhere. The guard for LIVING worlds is #373's data: no counted judgment there, and exploratory pairs that were not worse
  (56,040 against 44,972 new functions). This is stated as the guard, not re-run.
- **WORSE on two-thirds, or identical on every counted state:** DELETE the knob.
- **Anything else:** not shipped; the knob stays 0. An added mechanism must PROVE itself (CLAUDE.md), so "not worse" is not enough.

## Prediction (mine, before any run)
BETTER on 2 of 3 counted dead states or more, through REVIVED/T. The exception I expect is a 10402-like state whose residents no
longer compute: the refuge can only let more of them live.

## Saved worlds (rule 6)
The refuge is a rule, not a gene; a TASKS universe that reloads after the change runs with it. Said here; it does not block.
