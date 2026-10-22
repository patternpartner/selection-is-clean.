# OUTPUTS OF OTHERS AS INPUTS: does it break #290's plateau at NAND size 6? (written and COMMITTED before the first decision run)

21 Oct 2026. Core: `lab/oee-core-tasks.js` (#334: the pre-#313 TASKS core, reproducing 470e6b6^ line for line with OTHERS unset, plus OTHERS). Runner `lab/tasks-run.js`. Batch `lab/tasks-batch.sh` (chunked with SAVE/LOAD; resume is exact in this core, #290). Analysis `lab/analyse-others.js` (#290's activity definition from `lab/core-tasks.js`). Asked for by the user after #333 (the rock) and a reading of #290.

## Why
#290: Avida-style paid computation plus function-keyed parasites gave a burst of 30-50 functions, all of NAND formula size 6 or less, then nothing new for 700,000-1,000,000 ticks. A function of size 7+ needs a long chain of intermediate gates inside one small program before it pays. If an organism can read a neighbour's computed output as an input, a function g that is already established becomes a published stepping stone, and h(g(x),x) of size 7-12 may be one short program away.

## The mechanism (OTHERS)
- **The three input words are world-wide** and redrawn every TASK_EPOCH = 50 ticks, under #290's every-row-twice rule (so a constant cannot be paid), so a neighbour's output is a function of the same inputs as yours.
- **op 28 READ_OTHER** (a neutral marker in #290's world) loads the last output word of the organism in the cell ahead if it was output this epoch (**OTHERS=1, LIVE**), or 0 always (**OTHERS=2, CONTROL**: same inputs, same opcode, same neutral count; nothing to read).
- **A copy is not paid:** OUTPUT pays nothing for a word equal to the one this organism last read this epoch. Any computation on a read (NOT g, NAND(g,x)) is paid as its own function.
Everything else is #290's world: TASKS=1, TASK_RATE 0.2, TASK_SCALE 1 (pools scaled by formula size), TASK_MAX 1, TASK_F 0.2.

## Pilot (practice seed 99, 200,000 ticks, both arms; NOT evidence)
LIVE: READ_OTHER hits up to 30,404 per 1,000-tick sample, copies refused up to 74,305 per sample; **no function became active in 200,000 ticks** (population about 1,400). CONTROL: NOT around tick 60,000, then 25 functions, hardest NAND size 5, population about 4,050. #290 recorded first NOT anywhere from 20,000 to 160,000 ticks by seed, and the arms diverge from the first read, so one seed does not separate an effect from timing. Recorded so the result is read with it.

## Runs
LIVE and CONTROL, seeds **7001, 7002, 7003** (never run), 1,200,000 ticks each (#290's horizon), EVERY=1000. 6 worlds, in 150,000-tick chunks.

## Step 1 - executed first
A LIVE world COUNTS if READ_OTHER hit (read a nonzero word) in at least 1% of its reads over the second half. A seed counts if both its worlds finished and its LIVE world counts. Fewer than 3 counted seeds = INCONCLUSIVE (the floor is #290's three).

## Ruling measures (#290's, windows of 30,000 ticks; ACTIVE = at least 1% of the window's task income and at least 100 income per sample, lab/core-tasks.js)
1. **SUSTAINED:** LIVE has a new active function in at least 5 of the last 10 windows on all three seeds, and more such windows than CONTROL summed over seeds.
2. **NO DECELERATION:** LIVE's ever-active count grows in Q4 (windows 31-40) by at least half its Q2 (windows 11-20) growth, on all three seeds.
3. **THE WALL:** LIVE's hardest ever-active function is of NAND formula size 7 or more on at least 2 of 3 seeds, AND above CONTROL's hardest on those seeds.
**Exhaustion clause (the user's, written now):** there are 251 non-trivial three-input functions. On a seed where LIVE's ever-active count reaches 200, rules 1 and 2 read EXHAUSTED on that seed, not FAIL.

## Verdict
- **BREAKS THE PLATEAU:** rule 3 holds, and rules 1 and 2 hold (or are EXHAUSTED) on every seed.
- **BREAKS THE WALL, THEN PLATEAUS:** rule 3 holds; rule 1 or 2 fails.
- **NOT SUPPORTED:** rule 3 fails.
Reported, ruling on nothing: ever-active counts and hardest per window for both arms; first window with an active function; read hits and copies refused; population.

## Prediction written before running
NOT SUPPORTED. The pilot's LIVE world never started, and I have been wrong in the optimistic direction four times in a row on this question; but my reason is the pilot, not the record.

## What this cannot say
Three seeds, one horizon, one neighbour (the cell ahead), one epoch length. Composition is only possible within an epoch of 50 ticks. A positive result here would be about three-input functions only; four inputs (65,530 functions) is the follow-up if the wall breaks.
