# PRE-REGISTRATION #430 — A RANDOMIZED SCREEN OF 44 LAYERS: what is each worth to a universe's novelty?

Written and committed before any decision run. Browser fields are unseeded, so every field below is a fresh draw nobody has seen.

## Why
- The user asked whether the engine's 30,000-odd lines still serve a purpose. One pairs test per layer costs about 2.5 hours and
  #423 and #427 each came back INCONCLUSIVE. A randomized design asks about every layer at once.
- **`index.html#factorial=P`** (#430): each universe, independently, runs with each of 44 layers switched OFF with probability P%,
  through its own knobs. The 44 are the LIVE table's switches (less `COSMOS` and `COSMOS_LAW`, tested in #423; `DIMS_SAT`, a level;
  `OEE_METER`, an instrument) and `MIND`, `MOTIF_SELECT`, `FOUND`, `REPL_PREY`, `TASK_TROPHP`.
- **Node pre-screen, seed 3, 3,000 ticks** (each layer off alone): nothing crashed; 31 change the world; 13 leave it byte-identical
  (`COLO_SURV DRAW_VM GROUP_ROLES EXPR_CREDIT_POP ATOM_CREDIT_VERT ATOM_WRSENSE DIMS_ATOM ATOM_NFD ATOM_OBJ ATOM_FRSENSE
  GROUP_COMMONS MIND REPL_PREY`). `MIND` is off by default under node and predation does not fire on seed 3 by 4,000, so those two
  say nothing; the other eleven are being checked on seeds 1-2 at 6,000 ticks.
- **Mechanics** (`out-factorial/mech1.jsonl`, 20%, six minutes): all 30 universes carried a set (3-13 layers off), none died, no errors.

## Design
- **6 fields at `#factorial=20`**, two run together per launch (`lab/port/factorial-batch.sh`, tags f1-f6, out
  `lab/port/out-factorial/`), 1,500 s each, sampled every 60 s, fresh profiles. Each field draws its own assignment.
- **Unit:** a universe, from each field's final sample; the collective is excluded (everyone feeds it). A universe counts if its
  final read answered.
- **Outcome:** `y = log(1 + n)`, `n` = functions new to that universe since its boot (`tSeenN`; every profile is fresh).
- **Model:** ordinary least squares, `y ~ field + kind + sum over layers of beta_f * off_f`, where `kind` is built (`u`), first layer
  (`L1_`), second layer (`L2_`) or grown (`g`). `beta_f` is the log of how much a universe without layer f finds, against one with it.
  Standard errors from the residual variance. Analysis `lab/port/analyse-factorial.js`, committed with this file.

## Floor
- At least 5 complete fields and 120 counted universes, or the screen is INCONCLUSIVE and nominates nothing.

## What it reports, and what each reading means
- **The check that it can see anything:** the three layers #410 found a field misses when off (`REPL_PREY` 0.60, `TASK_TROPHP` 0.67,
  `MOTIF_SELECT` 0.76) should have negative `beta`. **If none of the three has `beta < 0` with t < -2, the screen is too weak at this
  size, and it nominates nothing.**
- **Earns its place (screen level):** `beta_f < 0` with **t < -2.5** (44 tests; at this threshold about half a false positive is expected).
- **Removal candidate:** `t > -1` and the lower bound `beta_f - 2*SE > -0.30` (a loss over about a quarter is ruled out). Candidates go to
  the template as a bundle in pairs of fields, as #427 did, before any code moves. The node pre-screen's byte-identical layers are
  reported beside them.
- **Everything else:** unclear at this size.
- Reported: each layer's `beta`, SE, t and how many universes ran without it; the residual standard deviation; the kind effects.

## What it cannot say
- **A universe is not alone.** Migration and the collective carry programs between universes, so a layer switched off in one universe
  is partly made up by its neighbours. That biases every `beta` toward 0, which makes a layer look more removable than it is. This is
  why candidates go to pairs of whole fields, where a layer is off everywhere.
- Interactions between layers are not estimated.
- 25 minutes only. #427 showed two layers cost a field its first minutes and nothing by 25; a 25-minute screen sees the 25-minute value.

## Prediction (mine, before any run; I am 7 for 14)
The check passes for `REPL_PREY` and `TASK_TROPHP` (t < -2), not for `MOTIF_SELECT`. Two to five other layers earn their place, and
fifteen to twenty-five are removal candidates, mostly the atom-credit layers.
