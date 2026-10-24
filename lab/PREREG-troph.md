# Trophic pool-drain: does taxing the read words' pools turn #346's wider fence into a ratchet? (#348; written and COMMITTED before the first decision run)

25 Oct 2026. Item 3, asked for by the user after #346; the drain was specified with the user before #346 ran. Code:
- core: `lab/oee-core-tasks.js` with `TASK_TROPH`. With it unset, earlier worlds are byte-identical (#337, #340 and #346's SCARCE settings checked, seed 5);
- batch: `ARM1='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1,"TASK_RATE":0.02,"TASK_TROPH":0.5' ARM2='"TASK_EPAY":1,"READ_DIR":1,"READ_REG":1,"LOGFULL":1,"TASK_RATE":0.02' SEEDS="8001 8002 8003" lab/tasks6-batch.sh`;
- analysis: `lab/analyse-troph.js lab/out-troph`, plus `probe-hops` on each last save.

## The mechanism (TASK_TROPH = alpha; four inputs, DEPTH)
**The tax.** Each paid output also takes alpha x pay out of the pools of the clean read functions that fed it. Those are tracked by data flow through the registers: READ sets the key of the word read, as published by its maker (its function if the word was clean, else none); NAND unions the keys; GET and MOV copy them; any other change clears them. At most 4 are kept, and they are cleared at each epoch boundary.

**The split.** The tax is split equally among the m keys, so the total does not depend on fan-in. It is destroyed, not paid to anyone. No individual is charged for being read: the read word's POOL is a commons.

**Checks.**
- A payment of 12 fed by two read words, at alpha 0.5, takes 3 from each of their pools.
- Resume is exact.

## Why
#346: scarcity (TASK_RATE 0.02) made worlds harder and broader. #347 showed that came from depletion, not from less energy. But breadth fell through #346's second half, which suggests the fence moved out and the world settled back. Easy pools still regrow forever, so a lineage camped on an easy function keeps a permanent income. The drain makes heavy reading of an upstream function deplete that function's pool.

## Pilots (#346's SCARCE 7901 save, continued 60,000 ticks; NOT evidence)

| alpha | exp(H) | income per sample |
|---|---|---|
| 0 | 915-1,471 | 324k-416k |
| 0.25 | 950-1,376 | 290k-359k |
| 0.5 | 1,219-1,518 | 320k-373k |

The arms are indistinguishable at this length: SCARCE's own breadth swings over 585-1,601 within 60,000 ticks. The tax at 0.5 ran at about 100,000 per sample, about 30% of task income. alpha 0.5 is chosen as the stronger setting that keeps the population viable (about 4,080).

## Arms and runs
Both arms are #346's SCARCE world: four inputs, bit-exact clean rule, reading and refusing copies and complements, TASK_EPAY, READ_DIR, READ_REG, LOGFULL, TASK_RATE 0.02.
- **DRAIN:** TASK_TROPH 0.5.
- **SCARCE:** TASK_TROPH 0.

Seeds **8001, 8002, 8003** have never been run. Each world runs 1,200,000 ticks in 150,000-tick chunks, at most 4 in parallel, least-advanced first.

## Step 1
As #345/#346. A seed counts if all of these hold:
- both worlds finished;
- both arms' reads hit at least 1% in the second half;
- one of the two worlds started by window 20.

Fewer than 3 is INCONCLUSIVE.

## Manipulation check (M)
The second-half destroyed tax is at least 10% of DRAIN's task income on at least 2 of 3 seeds. Else **NOT APPLIED**.

## Ruling (the trajectory, written into the rules as the user asked)
Windows are 30 samples (30,000 ticks); exp(H) is the per-window mean of LOGFULL's full-vector exp(H).

- **UP:** the least-squares slope of window exp(H) over windows 21-40 is at least +5 per window for DRAIN, on at least 2 of 3 seeds.
- **ABOVE:** DRAIN's slope is at least SCARCE's + 5 per window on at least 2 of 3 seeds.
- **LATE NOVELTY:** the count of functions whose per-sample income first reaches 100 in windows 31-40 (never before in the run) is higher for DRAIN on at least 2 of 3 seeds.

## Verdict
- **NOT APPLIED:** M fails.
- **RATCHET:** UP, ABOVE and LATE NOVELTY all hold.
- **SLOWER FENCE:** ABOVE holds, RATCHET does not. Drain slows or reverses the decline without turning breadth upward with new arrivals.
- **NO TREND EFFECT:** otherwise.

Level tags, appended, ruling on nothing: HARDER (mean circuit +0.3 on at least 2 of 3, below -0.3 on none) and BROADER (median exp(H) x1.1 on at least 2 of 3, below x0.9 on none), as in #346.

Reported:
- windows 21-30 against 31-40 means;
- climb 2+;
- income;
- the probes.

## Prediction written before running
**SLOWER FENCE**, with low confidence.

Drain should keep breadth from falling, by pushing lineages off grazed pools. But "first reaching 100 income in the last quarter" needs sustained new niches, and every new pool is also drained the moment it is read.

## What this cannot say
- This is three seeds at one horizon.
- The pilots showed SCARCE's breadth swinging by a factor of about 2.5 over tens of thousands of ticks. A 20-window slope over 600,000 ticks is the least noisy trend available here, but it can still be dominated by one swing. The 5-per-window margin (about 100 over the second half) is about a tenth of the swing seen.
- The drain changes income too: the pilot's income was not lower than without drain.
