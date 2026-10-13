# RECHECK-288 — closing OEE-NOTES #301's OPEN rows (#288/#289 CHEM_BIG, seeds 2 and 3). Pre-registered 13 Oct 2026 ~23:40 BST, before any run.

Author: Grok (Chief of Staff). Notes only; no code on main. Runs live on the box (`/home/box/wt/c288-runs`), not committed.

**Question.** #301: `World.load` before c5f1d5d rebuilt CHEM_BIG worlds with seed 1's chemistry. Were #288's seed-2/3 numbers produced by a
straight-through run, or by a chain resumed through `core-run.js LOAD=` (and so partly on seed 1's chemistry)?

**Core.** `lab/` exactly as at `2d365e6` (the #288 result commit; core = `0111812` amendment + `d959117` core-chem), detached worktree. No edits.

**Arms** (as #288): bc = `{CHEM:1,CHEM_BIG:1}`, b = bc + `VIRUS:1`; seeds 2 and 3; 1,200,000 ticks; `core-run.js` EVERY=1000.
- **S (straight):** one process, 1.2M ticks.
- **K (chained):** four 300,000-tick segments, each resumed with `LOAD=` from the previous segment's end save (boundaries 300k/600k/900k;
  covers a 600k-chunk chain too). #289 says only chunk-end saves existed; the chunk length is not recorded, so 300k is chosen to include 600k.
- Max 8 processes, nohup.

**Readouts.** (1) first sample after each boundary (t=301000/601000/901000): S vs K, row-identical or not, plus `chem.present`/income;
(2) the #288 table per arm/seed via `lab/core-chem.js` (WIN 30, MIN 0.01): last-quarter windows with a new active reaction, ever active,
income per 1,000 ticks in the last window, commonest METAB share (as reported).

**Decision rule (fixed now).**
- **Bug reaches the chain:** K differs from S at the first post-boundary sample on seeds 2/3 (expected; seed-1 chemistry). If not, the
  check is void (report, no verdict).
- **STRAIGHT CONFIRMED:** S reproduces #288's seed-2/3 numbers (all four readouts, both arms, exact or within rounding) and K does not.
  Close the rows as not exposed.
- **CHAINED (EXPOSED):** K reproduces them and S does not. #288's seed-2/3 rows were partly seed 1's chemistry; report S's numbers as the
  correct ones and whether rule 1's FAIL still holds on S.
- **UNRESOLVED:** neither reproduces (e.g. engine non-determinism or different chunking). Report S's numbers and whether #288's verdict
  (rule 1 fails on all seeds) holds on S; rows stay OPEN for the record but the verdict is re-checked.
