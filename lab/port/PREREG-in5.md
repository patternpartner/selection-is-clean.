# PRE-REGISTRATION #392 — FIVE-INPUT FUNCTIONS: a space of 2^32 instead of 65,536, judged per CPU-hour (`TASK_IN=5`)

Written and committed before any decision run. Seeds 11601-11620 have never been run by anyone.

## Why
- **#388 found the four-input space is not running out, but its reachable shells are.**
  - By tick 6,000 a world has found 96-100% of the 322 functions up to formula size 4, 59-90% at sizes 5-6, and 24-51% at 7-8.
  - Its finds halve with each size step past 6.
  - 99% of what is left is at size 9 or more.
  - So novelty slows as each shell is mined out.
- **#389-#391** moved four prices: the program cap, the logic-op draw, the drain and a royalty. None improved on the shipped world
  per CPU-hour. The economy sits near a local optimum.
- **The lab's earlier step from three inputs to four (#338-#340)** replicated composition, but "the plateau stands". New functions
  still stopped arriving. That lab counted functions ever ACTIVE (about 60). The engine counts every function ever paid, in the
  thousands.
- **The change, `TASK_IN=5`** (engine commit 11f891f; default 4, byte-identical: `b07a4474`, `d7d1c3aa`, `c8378b52`):
  - **Inputs.** Five world inputs, each a 32-row truth-table column in one random row order per epoch. The bit-exact clean rule
    (#339/#340) is what makes one copy enough: only logic of the inputs is ever paid.
  - **Slots.** A function is its canonical 32-bit truth table. It takes a slot of a 131,072-slot open-addressed table the first time
    it is PAID, and its pool starts full then, as every pool does at four inputs. Pools regrow over slots in use.
  - **Grade.** A function of at most four of the inputs gets its exact four-input formula size, so it pays what it pays at four
    inputs. Unit-checked: 20,000 of 20,000 with the first input ignored, and 20,000 of 20,000 with the last.
    - A function of all five gets the best Shannon split, `sz4(lo)+sz4(hi)+4`, or a direct form where a half is constant. That is
      an UPPER bound: AND5 grades 12, and random five-input functions grade 10-48 with a median of 26.
  - **Reported to rigs.** The field rig and saves carry canonical truth tables, not slots.
- **Design** (seeds 10401-10403, seen, 4,000 ticks, CPU timed; `lab/port/out-in5-design/`; against #389's four-input runs):

  | Seed | V, five against four | Per CPU-hour | Late/early (windows 7-8 over 1-2), four inputs | Late/early, five inputs |
  |---|---|---|---|---|
  | 10401 | 2.75x | 1.30x | 0.60 | 1.49 |
  | 10402 | 13.0x | 2.51x | 2.01 | 2.88 |
  | 10403 | 1.14x | 1.46x | 3.06 | 3.16 |

  Five-input worlds hold more creatures (1,216-1,578 mean alive against 496-1,053), because more fresh pools mean more income.
- **The caveat, stated before any number.** A bigger space holds more functions at every depth. For example, NAND has ten input
  pairs at five inputs and six at four. So part of any gain in the COUNT is mechanical, and the count is what the artwork's
  dependent variable is. This experiment rules on the count per CPU-hour, the number a viewer's field gets. It reports, beside it,
  two checks that a mechanical gain would not explain: deceleration, and the shuffle control.

## Runs
- **20 pairs:** seeds 11601-11620. Each is run once as IN4 (today's shipped world) and once as IN5 (`TASK_IN=5`), both reseeded after
  tick 1 with stream 1.
- **Reported, not ruled on:** IN5 with `TASK_SHUFFLE=1` on 11601-11603.
- `TASKS=1`, 12,000 ticks, `DIAG=1`. CPU seconds come from bash's `time` (user + sys). A pair's two arms are started together.
- Batch `lab/port/in5-batch.sh`, out `lab/port/out-in5/`, analysis `lab/port/analyse-in5.js`, written before the runs finish.

## Measures (per world)
- **V:** new functions in 12,000 ticks.
- **R:** V per CPU-hour.
- **Reported:** mean alive, collapse (#371's definition), CPU minutes, slots used, table refusals (`full`), the late/early ratio (V in
  windows 19-24 over V in windows 1-6), and mean grade late.

## Floor
- Fewer than 15 complete pairs: INCONCLUSIVE.
- If more than 2 IN5 worlds refused any payment for a full table, the table is binding the measure: INCONCLUSIVE until it is
  resized.

## Rule
- **Primary:** a one-sided exact Wilcoxon signed-rank on `log(R_in5 / R_in4)` over complete pairs.
- **BETTER:** IN5 greater at p < 0.05. **WORSE:** IN5 less at p < 0.05.
- **Guard:** if the median of `V_in5 / V_in4` is under 0.5, BETTER does not ship.
- **Reported:**
  - the same test on V (per tick);
  - collapse;
  - the late/early ratio in each arm, and the pairs in which IN5's is higher;
  - the shuffle arm against its IN5 twins.

## Verdict
- **BETTER, and the guard holds:** the TASKS default becomes `TASK_IN` 5 (unset globals only). It ships **only if a field check
  passes**:
  - `field-rate.js`, 8 pairs of fields run together for 1,800 s;
  - F is the union of canonical truth tables;
  - a one-sided exact Wilcoxon on `log(F_in5 / F_in4)` at 1,800 s, p < 0.05.
  - Then `substrate-test` x4, `smoke.sh` and a browser memory check of a 31-universe field, before `main`.
  - If the field check fails, the ship is held with the reason.
- **WORSE:** no change, and `TASK_IN` is deleted.
- **Anything else:** no change; the knob stays.

## Prediction (mine, before any run; I am 3 for 9)
BETTER. All three design seeds were ahead per CPU-hour (1.30-2.51x), and late windows found more in all three. The risks I see:
- The population sits higher, and two of the design worlds' tick costs doubled. A seed where the bigger world is merely dearer could
  lose per CPU-hour.
- The 5-variable grade is an upper bound, so the economy pays those functions more than their true difficulty. That could favour
  a cheap breadth over depth.

## What this cannot say
- **Whether the new functions are deeper.** At five inputs the grade of a 5-variable function is an upper bound, not a size, so a
  deeper reading is not available from these numbers.
- **What happens past 12,000 ticks.** The table holds 131,072 functions. A universe that finds more than about 118,000 would start
  refusing; at the design rates that is far beyond any run here.

## Saved worlds (rule 6)
If it ships, a saved TASKS universe that reloads runs with five inputs.
- Its creatures and genomes come back. Their programs now cycle five input words.
- Its record of functions ever paid does not carry, because it is a record over a different space (the save's `seen` is
  four-input). So its count of new functions starts again.
- Said here; it does not block.
