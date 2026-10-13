# Can this test see a program effect at all? Positive control for PREREG-inlife (written before any deciding run)

13 Oct 2026. Engine: engine.html on main at 8795752, defaults. Follow-up to the INCONCLUSIVE in-life test (sha256 3f197fe0fc732829).

## Question
The in-life test found REVERT - SHAM survival = +0.060, CI [-0.024, +0.145]. If program content has little effect on survival in that window, that
test could never have found "adaptive". So: how much does program content move survival here, when we wreck it?

## Design (same as before, four arms, new seeds)
- Tag true founders at tick 1 (WeakMap on the genome object). At T = 1500 take ELIGIBLE = true founders alive whose program differs from their tick-1 program.
- Randomly split eligible into four equal arms (own PRNG), each written to pProg[i] and pGenome[i].vmProgram:
  - BLANK:   empty program [] (no code at all).
  - RANDOM:  same length as the founder's own program, each instruction an [op,a,b,k] drawn independently at random from the pool of all instructions
             in all living programs at tick 1500 (realistic, valid, but unordered garbage).
  - SHAM:    clone of its own current program.
  - CONTROL: untouched.
- Follow to tick 4000. UNCHANGED founders reported, not randomized.
- Primary outcome: survival to tick 4000. Secondary: fraction with >= 1 parented birth in (1500, 4000] ("reproduced at all"; offspring COUNTS are heavy-tailed).
- Manipulation check: fraction of the BLANK arm whose program is still empty at tick 2000 and at tick 4000 (neighbours can re-donate code).
- Balance and integrity checks as before (program length, differing instructions, aliasing; BLANK length 0, SHAM hash unchanged).

## Seeds
Deciding: 21, 22, 23, 24, 25, 26, 27, 28 (never run before). A seed COUNTS if no engine error and eligible >= 120 (30 per arm).
Fewer than 4 counted seeds = INCONCLUSIVE.

## Analysis (as before)
B = survival(BLANK) - survival(SHAM) pooled over counted seeds; stratified permutation p (20,000, two-sided); stratified bootstrap 95% CI (4,000).
Same for RANDOM - SHAM, and for the secondary outcome. Sign agreement = counted seeds whose per-seed difference has the sign of B.

## Decision rule (primary: BLANK - SHAM survival)
- SENSITIVE:   B <= -0.10 and p < 0.05 and negative on at least 2/3 of counted seeds.
               Meaning: program content moves survival by 10 points or more over 2,500 ticks, so the in-life test could have seen a large effect and its
               CI [-0.024, +0.145] bounds the benefit of the accumulated changes to about 2 points.
- INSENSITIVE: the 95% CI lies inside [-0.08, +0.08].
               Meaning: wrecking the program does not move survival here; survival cannot say whether changes are adaptive; the in-life test was uninformative.
               (Weaker if the manipulation check shows < 50% of BLANK still empty at tick 2000: the arm was diluted by re-donation.)
- otherwise INCONCLUSIVE.
- Guard: |survival(CONTROL) - survival(SHAM)| pooled > 0.05 = COMPROMISED.
RANDOM - SHAM and the secondary outcome are reported beside the verdict and do not rule.

## What this cannot say
It says how much program content moves survival (and "reproduced at all") from tick 1500 to 4000, at default settings, for founders that had changed.
It does not say the in-life changes themselves are adaptive or neutral, and it is one horizon, one run per seed.
