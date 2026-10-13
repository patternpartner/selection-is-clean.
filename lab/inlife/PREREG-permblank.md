# Permanent blank: does a founder with NO program survive as well as one with its own? (written before any deciding run)

13 Oct 2026. Engine: engine.html at main 8795752, defaults. Follows PREREG-scramble.md (sha256 52e3d0a5c0655e41), whose BLANK arm was only a
temporary deprivation: neighbours re-donated code (72% still empty at tick 2000, about half at 2500, about 18% at 3000, few by 4000).

## Design
- Tag true founders at tick 1 (WeakMap on the genome object). At T = 1500, ELIGIBLE = true founders alive whose program differs from their tick-1 program.
- Randomly split eligible into three equal arms (own PRNG):
  - BLANK:   program set to [] (pProg[i] and pGenome[i].vmProgram), and RE-EMPTIED every 20 ticks for the rest of the run if code has been re-donated.
  - SHAM:    program replaced by a clone of its own current program, and RE-CLONED every 20 ticks (same handling frequency and code path, no content change).
  - CONTROL: untouched.
- Follow to tick 4000. UNCHANGED founders reported, not randomized.
- Primary outcome: survival to tick 4000. Secondary: fraction with >= 1 parented birth in (1500, 4000].
- Manipulation check: at ticks 2000, 2500, ..., 4000, BEFORE that tick's re-emptying, the fraction of ALIVE BLANK founders whose program is empty.
  Adequate if >= 90% at every check; otherwise the BLANK arm is reported as diluted.

## Seeds
Deciding: 31, 32, 33, 34, 35, 36, 37, 38 (never run before). A seed COUNTS if no engine error and eligible >= 90 (30 per arm). Fewer than 4 counted = INCONCLUSIVE.

## Analysis and decision rule (as in PREREG-scramble.md)
B = survival(BLANK) - survival(SHAM), pooled over counted seeds; stratified permutation p (20,000, two-sided); stratified bootstrap 95% CI (4,000).
- SENSITIVE:   B <= -0.10 and p < 0.05 and negative on at least 2/3 of counted seeds. (Program content moves survival by 10+ points over 2,500 ticks.)
- INSENSITIVE: the 95% CI lies inside [-0.08, +0.08]. (Removing the program does not move survival here; survival is the wrong outcome for adaptivity.)
- otherwise INCONCLUSIVE.
- Guard: |survival(CONTROL) - survival(SHAM)| pooled > 0.05 = COMPROMISED.
Secondary outcome and manipulation check are reported beside the verdict and do not rule.

## What this cannot say
It says whether an individual's own program content moves its survival / its chance of reproducing from tick 1500 to 4000, at default settings. A blank founder
still sits in a world of coded neighbours that act on it (they can copy, donate, bond), so this is not "life without programs". One horizon, one run per seed.
