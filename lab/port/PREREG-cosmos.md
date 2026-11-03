# PRE-REGISTRATION #378 — does the cosmos layer earn its place in the computing world? (retire-or-prove, `COSMOS=0`), with a replication of #377's Question 2

Written and committed before any decision run. Seeds 11101, 11102, 11103 have never been run by anyone.

## Why
- `lab/PORT-PLAN.md` step 2 names cosmos among the big layers to re-judge in the computing world. No retire-or-prove has ever been
  run on it.
- **What it is.** Clusters that can afford the price found shadow "child worlds" inside the engine (`attemptCosmosLaunch`,
  `updateCosmos`). Each child carries a perturbed copy of the founding lineage's physics. They trade amplitude with the parent
  world, can be sensed by op 235, and (`COSMOS_LAW`, #129) can win a law change. They are not drawn. They are not the field's real
  peers either; founding a real peer is `FOUND` (#201), which this test leaves on.
- **It executes.** About five launches per 500 ticks in the default computing world (design seed 10401, `DIAG=1`).
- **Design seeds** (one stream each, drop-one with `COSMOS=0 COSMOS_LAW=0`; functions ever paid, `out-live-design/`):

  | Seed | Tick 2,000, default / cosmos off | Tick 4,000, default / cosmos off |
  |---|---|---|
  | 10401 | 618 / 1,751 | 1,834 / 2,586 |
  | 10402 | 218 / 832 | 1,578 / 1,650 |

  Cosmos costs its founders amplitude, so removing it may free food. One stream per seed in a chaotic world: a direction, not a
  result.
- **#377's Question 2** (`AIM_FLAT`) counted 2 seeds of 3, and both said "food suffices". It is replicated here on the new seeds as
  a new experiment with the same rule. It shares the DEF arm, so it costs one extra arm.

## Runs
- **DEF x3** (today's world), **NOCOSMOS x3** (`COSMOS=0 COSMOS_LAW=0`, now in `harness-env.js` KNOBS) and **FLAT x3**
  (`AIM_FLAT=1`) per seed. All `TASKS=1`, 12,000 ticks.
- Replicate k reseeds after tick 1 (`RESEED_AT=1 RESEED=k`), shared by all three arms.
- Probe `lab/port/probe-reload.js` with `DIAG=1`. It draws nothing and now also reports cosmos launches per window.
- Batch `lab/port/cosmos-batch.sh`, out `lab/port/out-cosmos/`, analysis `lab/port/analyse-cosmos.js`, written before the runs
  finish.

## Measures
- **V, S, E:** as #371.
- **C:** as #371, with #377's flaw fixed. C is used on a seed only if every replicate of both arms reached 300 alive. Otherwise C
  says nothing about that seed. An arm that never grew cannot "not collapse".
- Reported, not ruled on: alive late, launches, wall-clock seconds per run (the batch shares a loaded machine, so this is
  indicative only).

## Question 1: cosmos (DEF judged against NOCOSMOS's three replicates)

**Executed first.** A seed counts if:
- every DEF replicate launched at least one child world; and
- no NOCOSMOS replicate launched any.

Fewer than 3 counted: INCONCLUSIVE, the default does not move.

**Per counted seed:**
- Cosmos is **WORSE** on:
  - V, if every DEF V is below every NOCOSMOS V and the highest DEF V is more than 10% below the lowest NOCOSMOS V;
  - S, if every DEF S is below every NOCOSMOS S by more than 0.25 gates;
  - E, if every DEF E is below every NOCOSMOS E by more than 10%;
  - C (where it applies), if at least 2 DEF replicates collapse and no NOCOSMOS replicate does.
- **BETTER** is each of these the other way.
- The seed is:
  - **WORSE** if WORSE on anything and BETTER on nothing;
  - **BETTER** if the reverse;
  - **SPLIT** if both;
  - otherwise it **differs**.

**Verdict, on two-thirds of counted seeds:**
- **WORSE:** cosmos goes DORMANT wherever TASKS runs. `COSMOS` and `COSMOS_LAW` default to 0 when TASKS is on (the browser's
  default world). `COSMOS=1` turns it back on. Node's default world, and REPL without TASKS, are untouched and byte-identical.
- **BETTER:** cosmos is PROVEN at the TASKS rung. No change.
- **SPLIT:** no change; named follow-up: a longer horizon.
- **Anything else:** KEEP (the template), no change.

## Question 2 (replication of #377's): DEF against FLAT, exactly #377's rule
- **Executed first.** A seed counts if every DEF replicate was paid for at least 500 functions and every FLAT replicate made aim
  pulls.
- **Per counted seed:**
  - **SELECTED** if every DEF V is above every FLAT V and the lowest DEF V is more than 25% above the highest FLAT V;
  - **FOOD SUFFICES** if the highest FLAT V is at or above the lowest DEF V;
  - otherwise **UNCLEAR**.
- **Verdict, on two-thirds of counted seeds:**
  - **FOOD SUFFICES:** AIM is ruled a food source in the computing world, at this horizon. Named follow-up: a flat amplitude
    stipend of the same mean size in AIM's place, retire-or-prove against AIM.
  - **SELECTED:** the purposes are selected.
  - **Anything else, or fewer than 3 counted:** INCONCLUSIVE.
- No default changes on Question 2.

## Prediction (mine, before any run; my last two were wrong)
- **Question 1:** WORSE on 2 of 3, through V, because the design leaned that way on both design seeds. I hold this loosely: the
  design is one stream per seed, and #377 showed how far one stream can mislead.
- **Question 2:** FOOD SUFFICES on 2 of 3.

## Saved worlds (rule 6)
- If cosmos goes dormant under TASKS, a reloaded TASKS universe founds no child worlds. Child worlds are not saved (nothing
  encodes `cosmosChildren`), so nothing is lost on reload. Laws the cosmos already changed keep their values.
- Said here; it does not block.
