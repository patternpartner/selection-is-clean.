# #355 — PRE-REGISTERED: does faster rewiring find the reading route WITHOUT the hand-written founder? (committed before any decision run)

Engine at the commit that adds this file. #354 shipped `TASK_FOUNDER=1 TASK_MUT=1` as the default and never ran `TASK_MUT` alone.
This asks the missing cell. A review put the question as whether the system "can progressively reduce its dependence on its
original human-supplied route".

## Arms, seeds 9601-9610 (never run), 10,000 ticks, `BLOCK=1000`, `probe-arrivals.js`
| arm | knobs | role |
|---|---|---|
| MUTONLY | `TASKS=1 TASK_FOUNDER=0 TASK_MUT=1` | the old founder (it cannot read) with faster rewiring |
| DEFAULT | `TASKS=1` (now `TASK_FOUNDER=1 TASK_MUT=1`) | the shipped world |
| OLD | `TASKS=1 TASK_FOUNDER=0 TASK_MUT=0` | #350's world |

30 runs. Batch `lab/port/route-batch.sh`, analysis `lab/port/analyse-route.js`. Measures as in PREREG-founder.md and PREREG-mut.md:
- **Arrived:** functions that ever earned at least 0.25 in one 500-tick window.
- **Took off:** Arrived of at least 500 by tick 10,000.
- **Crash:** a block with maxAlive above 20, then one with minAlive under 5.
- **Added:** the take-off tick, the first block end at which Arrived reaches 500, or "not by 10,000".

## Rules (verdicts about the ROUTE, not about shipping; nothing changes in the engine whatever they say)
Let m, d and o be the number of seeds that took off in MUTONLY, DEFAULT and OLD.
- **EVOLVED ROUTE:** m is at least d - 1, AND m is at least o + 3. Faster rewiring alone gets nearly every world there the founder does; the founder is a shortcut.
- **SUPPLIED ROUTE:** m is at most o + 1. Without the founder, faster rewiring barely beats the old world; the founder supplies the route.
- **PARTIAL:** anything else. Both contribute. Reported with the take-off ticks, since the reading founder may buy SPEED rather than possibility.

## Prediction
PARTIAL: m about 6, d about 9, o about 4. MUTONLY worlds that take off will do so later than DEFAULT's.

## What it cannot say
- Ten seeds and one horizon.
- "Not by 10,000" is not "never".
- A SUPPLIED verdict would not mean evolution cannot find READ. #350's seeds found it by mutation on 2 of 3 by 10,000, under the slow nested rewiring.

## Reading the verdict (added before any run; the rules above are unchanged)
- **EVOLVED ROUTE means the hand-written reading founder is NOT NECESSARY for near-default take-off under this test.** It does not mean the founder had no causal role. The MUTONLY arm still inherits #350's founder (NAND of two inputs) and the engine's conditions.
- **The take-off ticks separate three readings of any verdict:** the founder supplies a CAPABILITY (MUTONLY rarely gets there at all), a RELIABLE PATH (MUTONLY gets there on fewer seeds), or a HEAD START (MUTONLY gets there on as many seeds, later).
