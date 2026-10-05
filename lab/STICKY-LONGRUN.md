# STICKY-LONGRUN: does c055 stay open-ended over 1.5M ticks, and is it robust to ±25% knob nudges? (pre-registered)

Branch `cos/sticky-longrun`, off `cos/sticky-search` tip `dd0ce75`. Script: `lab/sticky/longrun.js` (orchestrator), `lab/sticky/seg-run.js` + `lab/sticky/fullsave.js` (segmented runs with exact resume).
**This file and every script were committed before any run of this test started.** Everything that decides (arms, seeds, ticks, windows, metrics, bars, thresholds, run-time reductions) is fixed below and in `longrun.js`. `longrun.js` appends the results to the end of this file automatically.

## In plain words
c055 (local food renewal + gentler body mutation) passed the sticky-novelty bar twice at 450k ticks: on held-out seeds 301–303 and on fresh seeds 401–403 (`lab/STICKY-SEARCH.md`). Two questions remain before anyone leans on it:
1. **Does it keep going?** At 450k it could still be riding an early burst that fades. Test 1 runs c055 and all its nulls for **1.5M ticks** (3.3× longer) and asks: does sticky used novelty hold up in the last third compared with the middle third, does the count of distinct sticky tricks keep climbing all through the last third, and does c055 still beat every null?
2. **Is it a knife-edge?** The search found one point in a 25-knob space, and a near neighbour failed. Test 2 moves each of c055's six knobs by −25% and +25%, one at a time, and reruns the original bar at 450k. The output is a **sensitivity map** (which knobs it is sensitive to, in which direction), with a pre-set summary line: robust if at least 70% of the 12 nudges still pass. The post-hoc e003-without-CH_AWAY variant gets its own pre-registered arm here, judged by the same bar.

## The configuration under test (exactly `top3.json` c055; arms built exactly as in `lab/sticky/search.js`)
- World knobs (W, applied to every arm incl. RANDCAP): `RENEW 1, RN_CAP 18.1`.
- Operator knobs (O, design arm, SHUF and DRIFT, not RANDCAP): `BODY_MUT 0.02, BODY_CAP 0.0456, BODY_DEL 0.00319, BODY_MQ 0.255, CH_LEN 2.77`.
- Base for all arms: `CHEM 1, HBODY 1, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02`; design arm also `BODY_RCAP 1` (before knobs; CH_LEN 1.5 overridden by 2.77).
- Arms: **X** design; **R** = RANDCAP in the same world (base + W + BODY_RCAP 1); **SH** = X + BODY_SHUF; **DR** = X + BODY_DRIFT. References per seed: **D** (stage-2 default design), **DRIFT** (D + BODY_DRIFT), **BASE** (`CHEM 1`). The script checks these arms are byte-identical (canonical JSON) to the `top3.json` arms of c055.

## Seeds, length, windows (fixed now)
- Seeds **501, 502, 503** for both tests. Never used before (search 201–206, held-out 301–303, re-confirm 401–403). Seeds 601–603 are **reserved and not used** by this test.
- Sampling every 1k ticks; S uses **10k-tick windows** (10 samples), as in held-out/re-confirm.
- Test 1: **1,500,000 ticks** = 150 windows. Test 2: **450,000 ticks** = 45 windows.
- **Run-time decision, made now:** estimated cost from measured 450k timings at 8-way load (BASE ≈ 620 s, D/DRIFT ≈ 1000 s, c055 arms ≈ 1450–1700 s per 450k): test 1 ≈ 25 core-hours, test 2 ≈ 54 core-hours, ≈ **10 hours wall on 8 cores**. No seeds or ticks are reduced. There is **no early stop and no time cut-off** that changes the analysis: if the box is slow or restarts, the runs simply take longer.
- Test-1 runs are queued first, then test-2 runs, 8 in parallel.

## Mechanics: segmented runs with exact resume (because the box restarts often)
- Every run is split into **150k-tick segments**. After each segment the complete world state is saved with `lab/sticky/fullsave.js` (every own field of the World: typed arrays, RNG states, Maps, Sets, plain values) and the next segment resumes from it. The core's own `World.save()` is *not* exact with the body/renewal knobs (checked: it diverges after a resume), so it is not used. The core itself is unchanged.
- Identity checks before launch (`lab/sticky/trial-lr/identity-segments.txt`): for all 7 arm types (X, R, SH, DR, D, DRIFT, BASE; seed 401) a 30k run in 3×10k segments is byte-identical (all sample fields except wall-clock) to a contiguous 30k run; and c055 X seed 401 in 2×150k production-size segments is byte-identical to the first 300 rows of the existing contiguous 450k run from the re-confirmation. A short run is also identical to the prefix of a longer run (tick count does not change the trajectory).
- Therefore, **where a 450k test-2 arm is identical to a test-1 arm** (the c055 centre X/R/SH/DR, the shared R of the non-RN_CAP nudges and of e003-noCH, and the D/DRIFT/BASE references), test 2 uses the **first 450 samples of the 1.5M run** instead of rerunning it.
- Files: `/home/box/sticky-runs-lr/<sha1(opts|seed|ticks)>` with `.opts`, `.jsonl`, `.err`, `.ckpt.<k>` (state after k segments), `.done` or `.fail`. On (re)start a killed segment is discarded (the jsonl is truncated to the finished segments) and redone from the last checkpoint. A segment that times out (2 h) or crashes is retried; after 3 failures the run is `.fail` and counts as a failed run (the seed counts as not beating the nulls and the no-collapse criterion fails), exactly as in the held-out script.
- Progress is committed and pushed every 40 segments and after each test (`lab/sticky/trial-lr/`). After a box restart: `bash /home/box/wt/sticky-longrun/lab/sticky/launch-longrun.sh` (idempotent; restarts the orchestrator and the watcher `watch-longrun.sh`, which relaunches the orchestrator every 5 min if it died).
- The plumbing (kill mid-run, relaunch, resume, both analyses) was dry-run with `TEST=1` (tiny ticks, `/tmp/slr-test`, no git) before launch.

## Metric definitions (unchanged from STICKY-SEARCH)
- A trick is **used** in window w if its mean share of body income (bU) ≥ 1% or its mean carrier share (bC) ≥ 1% over the window.
- **new(w)** = used in w and never used in any earlier window. **st(w)** = number of tricks in new(w) still used in window w+2. st is defined for w = 0 … nW−3; let E = nW−2 and th = floor(E/3).
- **S (late)** = mean of st over the last th windows: w = E−th … E−1. **S (middle)** = mean of st over w = E−2th … E−th−1.
  - 1.5M: nW = 150, E = 148, th = 49 → **late = windows 99–147, middle = windows 50–98**.
  - 450k: nW = 45, E = 43, th = 14 → late = windows 29–42 (identical to held-out/re-confirm).
- **Collapse**: an arm has reseeds > 0, or its mean N over the last third of samples is below 50% of BASE's on that seed.
- **K(w)**, cumulative distinct sticky tricks = Σ_{v ≤ w} st(v). (Each trick can be "new" only once, so K counts distinct tricks that were ever new-and-sticky.)

## The original bar (as held-out / re-confirm), used in both tests
For a configuration over seeds 501–503 with S = late-third S at the stated length:
1. On **≥ 2 of 3 seeds** it beats every null: S_X > S_R, S_X > S_SH, and (S_X − S_D) > (S_DR − S_DRIFT).
2. **Relative stickiness ≥ 1.10**: min((mX+1)/(mR+1), (mX+1)/(mSH+1), [(mX+1)/(mD+1)] / [(mDR+1)/(mDRIFT+1)]) ≥ 1.10, with m = mean S over the 3 seeds.
3. **No collapse** in X, R, SH or DR on any seed, and no missing/failed run.

## TEST 1 — open-endedness of c055 at 1.5M (21 runs: 7 arms × 3 seeds)
c055 is **OPEN-ENDED over 1.5M** only if all three hold:
- **(1a) No fade:** mean over seeds 501–503 of S_late(X) ≥ mean over the same seeds of S_middle(X) (windows 99–147 vs 50–98). All 3 X runs must be present.
- **(1b) Keeps rising:** on **≥ 2 of 3 seeds**, K keeps rising through the whole last third: the late third (windows 99–147) is split into 4 consecutive blocks (99–110, 111–122, 123–134, 135–147) and **K increases in every block** (≥ 1 new sticky trick in each ~120k-tick block), **and** the OLS slope of K(w) on w over windows 99–147 is > 0. *Note, stated in advance:* because K is cumulative, a positive slope alone is almost automatic, so the no-plateau-in-any-block condition is the operative part; the size of the rate is already tested by (1a).
- **(1c) Still beats every null:** the original bar (all three parts) with S = late-third S of the 1.5M runs (windows 99–147).
If any fails: NOT SHOWN. Reported descriptively alongside (not part of the verdict): S middle/late and K blocks for every null arm, and the original bar re-computed on the 450k and 900k prefixes of the same runs.

## TEST 2 — robustness / sensitivity map at 450k
- **12 nudges**, each of c055's six knobs multiplied by **0.75 and 1.25** (3 significant figures), one at a time, everything else at c055:

| knob | group | c055 | ×0.75 | ×1.25 |
|---|---|---|---|---|
| RN_CAP | W (also moves R) | 18.1 | 13.6 | 22.6 |
| BODY_MUT | O | 0.02 | 0.015 | 0.025 |
| BODY_CAP | O | 0.0456 | 0.0342 | 0.057 |
| BODY_DEL | O | 0.00319 | 0.00239 | 0.00399 |
| BODY_MQ | O | 0.255 | 0.191 | 0.319 |
| CH_LEN | O | 2.77 | 2.08 | 3.46 |

  `RENEW 1` is a switch, not a level, so it is not nudged.
- **e003-noCH_AWAY** as its own pre-registered arm: `RENEW 1, RN_CAP 18.1, BODY_MUT 0.0158, BODY_CAP 0.0456, BODY_DEL 0.00319, BODY_MQ 0.255, CH_LEN 2.74` (the e003 arms minus CH_AWAY, byte-identical to the arms used post hoc on 401–403). It is judged by the same bar but **not counted** among the 12 nudges.
- Each nudge (and e003-noCH) gets its own X, SH, DR (and R if RN_CAP moves) at 450k on seeds 501–503; shared arms come from the 450k prefix of the test-1 runs (see Mechanics). 123 new 450k runs (41 per seed).
- Each nudge is judged by the **original bar** at 450k. The **centre** (c055 itself, from the 450k prefix) is reported too, so the map shows what the unnudged point does on these seeds; it is not counted.
- **Summary line:** ROBUST if **≥ 9 of the 12 nudges** (≥ 70%) clear the original bar, otherwise FRAGILE. This is a summary of a map, not a single verdict: the table (seeds won, relative stickiness, pass/fail per knob and direction) is the result.

## What will and will not be claimed
- A pass in Test 1 means "no sign of fading over 1.5M ticks on 3 unseen seeds, and still better than every null", not open-endedness in general.
- If Test 1 passes but Test 2 is FRAGILE, the result is "a long-lasting but narrow point". If Test 1 fails, the 450k result stands as a finite-horizon effect.
- Nothing is changed after launch. Any extra analysis will be labelled EXPLORATORY.
