# PRE-REGISTRATION #427 — the field nominated two mechanisms; do they earn their place? Red Queen and rich grammar off together

Written and committed before any decision run. Browser fields are unseeded, so every pair below is a fresh draw nobody has seen.

## Why
- **#425's tournament (v2)**, a field choosing its own switches from an all-on start, ended with two mechanisms OFF in 17 of 31
  universes each: **Red Queen** (`RED_QUEEN`, #28: frequency-dependent amplitude predation between niche cells) and **rich grammar**
  (`RICH_GRAMMAR`: the extra operators and senses of the atom-authoring grammar). No other switch was off in more than 13.
- #252 planned this step: the system nominates, the template decides. A nomination from one noisy field is not a verdict; #424's
  run showed a tournament can drift a useful switch off.
- **Both run in TASKS worlds:** off at tick 0 in node, Red Queen changes seed 3 by 1,500 ticks (`12d25b06` against `6cbe0c0d`).
  Rich grammar does not by 1,500 ticks on seed 3, and does by 4,000 on seeds 1, 2 and 3 (#253 saw it first at about tick 3,500).
  A field universe runs well past 4,000 ticks in 25 minutes.
- They are tested **together**, the bundle the field chose, so one experiment can remove both. If the bundle is worse, which of the
  two is missed is a follow-up.

## Arms
- **SHIP:** `engine.html` as on the branch.
- **OFF:** the same file with the LIVE table's `__RED_QUEEN:1,` and `__RICH_GRAMMAR:1,` both set to 0 (`field-pair.sh` with
  `FROM`/`TO` and `FROM2`/`TO2`; each pattern asserted once, and the copy asserted different).

## Runs
- **6 pairs**, tags p1-p6, together, 1,500 s, one pair a launch (`lab/port/nominated-off-batch.sh`, out `lab/port/out-nominated-off/`).
- Analysis `lab/port/analyse-nominated-off.js` (the #423 rule, unchanged), committed with this file.

## Floor, rule and verdict (as #423, which ran clean)
- A run counts if it ends final at 1,500 s with no universe missed and the switches `storeDeath 1, crowdK 100, provBirth 0, aim 0`.
  Fewer than 5 complete pairs: INCONCLUSIVE.
- **Primary:** a one-sided exact Wilcoxon on `log(F_off / F_ship)` at 1,500 s.
- **WORSE** (off less, p < 0.05): the field misses them; **they stay on**.
- **Otherwise they go off under TASKS only if both guards hold:** median F ratio at least **0.95**, and median size-17+ ratio at
  least **0.90**. A guard failing without WORSE is **INCONCLUSIVE**, and they stay on.
- **Off:** the TASKS default fill line sets `__RED_QUEEN` and `__RICH_GRAMMAR` to 0 (unset globals only, so `RED_QUEEN=1` and
  `RICH_GRAMMAR=1` restore them). The code stays, as worlds without TASKS still run both: DORMANT under TASKS. Acceptance before `main`.
- **Reported:** the ratio at 5, 10, 15, 20 minutes, size 17+, ticks, creatures.

## Prediction (mine, before any run; I am 6 for 13)
INCONCLUSIVE: count about level (median 1.00), size 17+ just under or just over the line. #425's own per-switch reading had both
worse OFF (0.77 and 0.68), and #423 showed how easily the depth guard fails on six pairs. My lean is that the bundle stays on.

## Saved worlds (rule 6)
If they go off, a reloaded TASKS universe stops running amplitude Red Queen predation and authors atoms from the plain grammar;
atoms already written with the rich operators still compile. Said here; it does not block.
