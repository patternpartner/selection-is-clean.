# PRE-REGISTRATION #377 — the computing world lives on its creatures' PURPOSES: is that selection, or food? (`AIM`, `AIM_FLAT`)

Written and committed before any decision run. Seeds 11001, 11002, 11003 have never been run by anyone.

## Why (design seeds 10401 and 10402; they design this, they do not decide it)
`lab/PORT-PLAN.md` step 2 asks for retire-or-prove on the big layers in the computing world. The cheapest first cut was the whole
LIVE stack (the block that turns about 45 older mechanisms on by default). `LIVE_STACK=0` (#377, byte-identical unset) skips it.
- **Without the stack the computing world dies.** 329 founders fall to 13-15 by tick 500 and stay there on both seeds. 11-13
  functions were ever paid by 4,000, against 1,834 and 1,578 with the stack.
- **Adding one group back at a time** (1,500 ticks, seed 10401):
  - cosmos, decide, draw and group selection: byte-identical to the stack-less world;
  - atoms and speciation: 21-23 alive;
  - the niche economy: 60 alive;
  - the novelty pair (opcode novelty and the novelty archive): 828 alive, 380 functions, against the default's 678 and 412.
- **Inside the pair, it is AIM.**
  - The archive alone dies, and opcode novelty with `AIM=0` dies.
  - Opcode novelty alone lives (344 alive, 129 functions at 1,500).
  - AIM (#218c) runs ONLY inside the opcode-novelty branch of `applyNicheEconomy`.
  - An aim pays amplitude, `w x (pay x moved - AIM_TAX)` with `w` up to 1.2 a tick, when a sense the creature chose moves near a
    target it chose. Amplitude below `deathThreshold` kills, so the aim pull is how creatures stay alive. Computing pays the store,
    `pE`, which pays for births.
- **In the full default world:**

  | Seed | Arm | Functions ever paid by 4,000 |
  |---|---|---|
  | 10401 | AIM on | 1,834 |
  | 10401 | `AIM=0` | 138 |
  | 10402 | AIM on | 1,578 |
  | 10402 | `AIM=0` | 105 |

- **`AIM_FLAT=1`** (#377, new, byte-identical unset) gives every living creature the population's MEAN aim payment each tick
  instead of its own. Each creature's own payment is applied first, so every sense is read exactly as in the default, and is then
  swapped for the mean. Total amplitude is the same; only the link between meeting an aim and being paid for it is cut.
  - Seed 10401: 461 functions by 4,000, between the two arms above.
  - Seed 10402: 523 by 2,500, against the default's 413.

  So AIM may be mostly food, or selection on purposes may matter. Two design seeds cannot say which.

## Runs
- **DEF x3** (today's world), **NOAIM x3** (`AIM=0`) and **FLAT x3** (`AIM_FLAT=1`) per seed. All `TASKS=1`, 12,000 ticks.
- Replicate k reseeds after tick 1 (`RESEED_AT=1 RESEED=k`), shared by all three arms.
- Probe `lab/port/probe-reload.js` with `DIAG=1`. It draws nothing and now reports aim pulls, mean amplitude and aims per creature.
- Batch `lab/port/aim-batch.sh`, out `lab/port/out-aim/`, analysis `lab/port/analyse-aim.js`, written before the runs finish.

## Measures (as #371)
- **V:** functions new to the universe's history over the 12,000 ticks.
- **S, E:** mean formula size and exp(H), averaged over the windows ending 6,500-12,000.
- **C:** collapse: two consecutive windows under 25% of the highest alive before them, after first reaching 300.
- Reported, not ruled on: alive late, aim pulls, mean amplitude, aims per creature.

## Question 1: does AIM earn its place? (retire-or-prove; DEF judged against NOAIM's three replicates)

**Executed first.** A seed counts if:
- every DEF replicate made aim pulls; and
- every NOAIM replicate made none (the off-switch is off).

Fewer than 3 counted: INCONCLUSIVE, the default does not move.

**Per counted seed:**
- AIM is **BETTER** on:
  - V, if every DEF V is above every NOAIM V and the lowest DEF V is more than 10% above the highest NOAIM V;
  - S, if every DEF S is above every NOAIM S by more than 0.25 gates;
  - E, if every DEF E is above every NOAIM E by more than 10%;
  - C, if at least 2 NOAIM replicates collapse and no DEF replicate does.
- **WORSE** is each of these the other way.
- The seed is:
  - **BETTER** if BETTER on anything and WORSE on nothing;
  - **WORSE** if the reverse;
  - **SPLIT** if both;
  - otherwise it **differs**.

**Verdict, on two-thirds of counted seeds:**
- **BETTER:** AIM is PROVEN at the TASKS rung. It changes who has offspring and the dependent variable. No change.
- **WORSE:** AIM goes dormant wherever TASKS runs.
- **Anything else:** KEEP (the template).

## Question 2: is aim satisfaction SELECTED, or is it food? (a control, like #376; DEF against FLAT)

**Executed first.** A seed counts if:
- every DEF replicate was paid for at least 500 functions by 12,000; and
- every FLAT replicate made aim pulls (the control ran).

Fewer than 3 counted: INCONCLUSIVE.

**Per counted seed:**
- **SELECTED** if every DEF V is above every FLAT V and the lowest DEF V is more than 25% above the highest FLAT V.
- **FOOD SUFFICES** if the highest FLAT V is at or above the lowest DEF V.
- Otherwise **UNCLEAR**.

**Verdict, on two-thirds of counted seeds:**
- **SELECTED:** the claim stands at this rung. New functions arrive faster when the creatures that meet their own purposes are the
  ones kept alive; the purposes are selected, not just eaten.
- **FOOD SUFFICES:** at this horizon AIM is a food source, and its selective content does no measured work here. Named
  follow-up: replace it under TASKS with a flat amplitude stipend of the same size, and retire-or-prove that against AIM.
- **Anything else:** INCONCLUSIVE.
- **No default changes on Question 2.** `AIM_FLAT` stays as a permanent control, like `TASK_SHUFFLE`.

## Prediction (mine, before any run)
- **Question 1:** BETTER on 3 of 3, through V and S (design: ten times the novelty).
- **Question 2:** UNCLEAR or SELECTED on two-thirds. On 10401, flat was a quarter of the default; on 10402 it was ahead early.
  I expect the purposes to matter more as worlds age, because the default's lead on 10401 grew after tick 1,500.

## Saved worlds (rule 6)
Nothing changes in a saved world unless Question 1 comes back WORSE. Said here; it does not block.
