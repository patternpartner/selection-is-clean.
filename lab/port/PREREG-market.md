# #454 — the internal market (pre-registered before the decision runs)

Written after the 2,000-tick checks (`out-market/chk-m*.out`, seed 11) and before any 12,000-tick run.

## What is tested
`TASK_MKT` (open world; default 0, byte-identical: `9e88d2f9`, seed 11, `MIND=20`, 2,000 ticks).
- **M, mode 1, the market:** every pool's cap is a flat seed (`TASK_CAP x TASK_ZREF`, #439's flat pool). A paid creature gives
  `TASK_MKTR` (50%) of its payment to the pools of the functions its word was built on (equal shares), in place of the drain. Excess
  over a cap is kept. No formula-size table in who is paid.
- **F, mode 2:** the flat seed with the drain, no market (#439 rebuilt in-house; the control M has to beat).
- **GM, mode 3:** the table's grade kept, purchases in place of the drain.
- **G:** the shipped world (`out-open-node/b11-b13`, the same digest since).

## The runs
Node, seeds 11, 12, 13, `TASKS=1 MIND=20`, 12,000 ticks, `EVERY=2000` (`lab/port/market-batch.sh`). G at 12,000:
92,935 (8 inputs), 162,996 (8), 74,397 (7).

## Executed first
A seed counts for M or GM only if purchases ran (`mktN > 0` by 12,000). Report how many seeds counted first.
**Build check (not a decision):** F on seed 11 should reproduce #439's flat world (31,595 functions, 5 inputs at 12,000). If it does
not, the rebuild differs from #439 and F's numbers are reported as the in-house control only.

## Decisions (by #397 node sees only severalfold differences or differences of kind, so these are about kind)
- **M replaces the table in node** if M opens a sixth input on at least 2 of 3 seeds AND finds at least 0.5x G's functions on at
  least 2 of 3. Then: the shuffle control on M (`TASK_SHUFFLE=1`, 3 seeds) and one field pair M against shipped, 25 minutes.
- **M does not replace the table** if it opens no input on at least 2 of 3 seeds, or finds no more than F on at least 2 of 3.
  Then mode 1 is removed from the engine (result kept in a comment) unless GM below earns a follow-up.
- Anything between: INCONCLUSIVE; extend to 16,000 ticks once, then rule by the same rule.
- **GM:** at least 1.5x G on 2 of 3 seeds: a field pair. At most 0.67x G on 2 of 3: the market harms even on the table; removed.
  Otherwise no direction, removed (node cannot see less than severalfold, and a knob that is not followed up is decoration).

## Readouts (not decisions)
- `mktZ`: the mean table grade of what purchases paid for, against `incZ`, the income-weighted grade of what was paid. Above means
  the market values depth more than the seed does; this uses the table only as a ruler.
- `mktHeld`: value sitting in pools above their caps, unspent.
- Populations along the run (a starved world is a different failure from a world that does not climb).
