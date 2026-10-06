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

### TEST 1 result: open-endedness at 1.5M (appended by longrun.js 05/10/2026, 14:43:32 BST)
```
# TEST 1 (open-endedness): c055, 1500k ticks, seeds 501,502,503, 10k windows; late third = windows 99-147, middle third = 50-98
c055 seed 501: S X 7.16 | R 3.47 | SH 6.57 | DR 8.92 | ref D 4.33 | ref DRIFT 13.90 | beats all yes
c055 seed 502: S X 6.02 | R 3.65 | SH 0.65 | DR 6.76 | ref D 4.49 | ref DRIFT 12.20 | beats all yes
c055 seed 503: S X 5.96 | R 2.78 | SH 3.02 | DR 7.65 | ref D 4.78 | ref DRIFT 9.53 | beats all yes
c055 X seed 501: S mid 9.22 -> late 7.16 | cumulative sticky K end 1626 | K slope (late third, per window) 6.964 | K increments in 4 late blocks [96, 108, 53, 94] => keeps rising
c055 X seed 502: S mid 6.06 -> late 6.02 | cumulative sticky K end 1392 | K slope (late third, per window) 6.555 | K increments in 4 late blocks [46, 79, 84, 86] => keeps rising
c055 X seed 503: S mid 8.02 -> late 5.96 | cumulative sticky K end 1497 | K slope (late third, per window) 5.886 | K increments in 4 late blocks [61, 85, 63, 83] => keeps rising
  (descriptive) R seed 501: S mid 5.76 late 3.47 K end 908 blocks [53, 37, 26, 54]
  (descriptive) SH seed 501: S mid 6.16 late 6.57 K end 1200 blocks [96, 79, 84, 63]
  (descriptive) DR seed 501: S mid 11.20 late 8.92 K end 2175 blocks [96, 124, 128, 89]
  (descriptive) ref D seed 501: S mid 3.80 late 4.33 K end 726 blocks [44, 72, 51, 45]
  (descriptive) ref DRIFT seed 501: S mid 13.55 late 13.90 K end 2085 blocks [156, 172, 158, 195]
  (descriptive) R seed 502: S mid 7.08 late 3.65 K end 1223 blocks [46, 26, 53, 54]
  (descriptive) SH seed 502: S mid 0.96 late 0.65 K end 213 blocks [5, 5, 17, 5]
  (descriptive) DR seed 502: S mid 11.96 late 6.76 K end 2139 blocks [77, 91, 81, 82]
  (descriptive) ref D seed 502: S mid 4.94 late 4.49 K end 728 blocks [53, 61, 59, 47]
  (descriptive) ref DRIFT seed 502: S mid 14.39 late 12.20 K end 2243 blocks [162, 125, 134, 177]
  (descriptive) R seed 503: S mid 4.06 late 2.78 K end 825 blocks [24, 35, 31, 46]
  (descriptive) SH seed 503: S mid 1.90 late 3.02 K end 540 blocks [20, 37, 39, 52]
  (descriptive) DR seed 503: S mid 11.16 late 7.65 K end 2040 blocks [87, 100, 101, 87]
  (descriptive) ref D seed 503: S mid 3.82 late 4.78 K end 821 blocks [56, 54, 76, 48]
  (descriptive) ref DRIFT seed 503: S mid 10.61 late 9.53 K end 1762 blocks [168, 118, 96, 85]
c055 1.5M: (1a) no fade: mean late S 6.38 >= mean middle S 7.77 FAIL | (1b) cumulative sticky keeps rising on 3/3 seeds PASS | (1c) beats every null on 3/3 seeds, relative stickiness 1.672, collapse none PASS => NOT SHOWN (at least one criterion fails)
  (descriptive) original bar on the 450k prefix: 1/3 seeds, relative stickiness 1.514, fail
  (descriptive) original bar on the 900k prefix: 2/3 seeds, relative stickiness 1.268, pass
```

### TEST 2 result: robustness / sensitivity map (appended by longrun.js 05/10/2026, 21:47:00 BST)
```
# TEST 2 (robustness): one knob at a time x0.75 / x1.25 from c055, 450k, seeds 501-503, original bar (>=2/3 seeds beat all nulls, rel >= 1.10, no collapse)
c055 (centre): 1/3, rel 1.514, no collapse => FAIL
   seed 501: S X 9.29 | R 4.86 | SH 13.36 | DR 19.64 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 13.71 | R 13.71 | SH 2.14 | DR 22.21 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 15.64 | R 5.93 | SH 4.07 | DR 19.50 | ref D 3.50 | ref DRIFT 17.00 | beats all yes

| knob | c055 value | x0.75 (value: seeds won, rel, pass) | x1.25 (value: seeds won, rel, pass) |
|---|---|---|---|
| RN_CAP (W) | 18.1 | 13.6: 2/3, 1.119, PASS | 22.6: 1/3, 1.016, FAIL |
| BODY_MUT (O) | 0.02 | 0.015: 1/3, 1.408, FAIL | 0.025: 2/3, 1.195, PASS |
| BODY_CAP (O) | 0.0456 | 0.0342: 2/3, 1.005, FAIL | 0.057: 3/3, 1.337, PASS |
| BODY_DEL (O) | 0.00319 | 0.00239: 1/3, 1.129, FAIL | 0.00399: 1/3, 1.179, FAIL |
| BODY_MQ (O) | 0.255 | 0.191: 1/3, 1.509, FAIL | 0.319: 2/3, 1.221, PASS |
| CH_LEN (O) | 2.77 | 2.08: 2/3, 1.065, FAIL | 3.46: 2/3, 1.457, PASS |
RN_CAP-25%:
   seed 501: S X 10.57 | R 14.71 | SH 2.29 | DR 16.07 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 9.00 | R 6.00 | SH 2.36 | DR 22.50 | ref D 2.71 | ref DRIFT 19.29 | beats all yes
   seed 503: S X 9.71 | R 5.14 | SH 1.29 | DR 17.36 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
RN_CAP+25%:
   seed 501: S X 8.71 | R 5.79 | SH 7.36 | DR 17.29 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 6.21 | R 10.71 | SH 6.21 | DR 16.86 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 14.29 | R 12.21 | SH 10.14 | DR 20.86 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_MUT-25%:
   seed 501: S X 8.14 | R 4.86 | SH 6.07 | DR 18.79 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 8.71 | R 13.71 | SH 7.50 | DR 17.79 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 18.86 | R 5.93 | SH 1.86 | DR 23.86 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_MUT+25%:
   seed 501: S X 7.43 | R 4.86 | SH 2.86 | DR 14.21 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 9.57 | R 13.71 | SH 4.21 | DR 10.07 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 12.86 | R 5.93 | SH 11.50 | DR 11.57 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_CAP-25%:
   seed 501: S X 10.21 | R 4.86 | SH 1.00 | DR 11.71 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 7.50 | R 13.71 | SH 11.00 | DR 12.64 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 6.93 | R 5.93 | SH 1.86 | DR 16.21 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_CAP+25%:
   seed 501: S X 11.21 | R 4.86 | SH 7.86 | DR 19.21 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 14.43 | R 13.71 | SH 11.00 | DR 15.57 | ref D 2.71 | ref DRIFT 19.29 | beats all yes
   seed 503: S X 13.57 | R 5.93 | SH 9.71 | DR 17.50 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_DEL-25%:
   seed 501: S X 12.14 | R 4.86 | SH 16.07 | DR 19.43 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 10.07 | R 13.71 | SH 6.57 | DR 11.14 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 14.93 | R 5.93 | SH 9.93 | DR 17.14 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_DEL+25%:
   seed 501: S X 5.57 | R 4.86 | SH 8.07 | DR 16.93 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 11.64 | R 13.71 | SH 4.57 | DR 12.36 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 12.21 | R 5.93 | SH 1.14 | DR 19.50 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_MQ-25%:
   seed 501: S X 11.86 | R 4.86 | SH 12.21 | DR 19.00 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 11.86 | R 13.71 | SH 3.36 | DR 15.14 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 14.79 | R 5.93 | SH 3.86 | DR 19.57 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
BODY_MQ+25%:
   seed 501: S X 11.29 | R 4.86 | SH 3.57 | DR 18.07 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 8.64 | R 13.71 | SH 4.50 | DR 18.29 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 10.64 | R 5.93 | SH 6.00 | DR 21.07 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
CH_LEN-25%:
   seed 501: S X 12.29 | R 4.86 | SH 9.50 | DR 16.50 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 5.07 | R 13.71 | SH 5.71 | DR 11.86 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 8.93 | R 5.93 | SH 8.36 | DR 21.57 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
CH_LEN+25%:
   seed 501: S X 13.43 | R 4.86 | SH 4.14 | DR 19.50 | ref D 5.57 | ref DRIFT 13.79 | beats all yes
   seed 502: S X 9.79 | R 13.71 | SH 7.50 | DR 17.93 | ref D 2.71 | ref DRIFT 19.29 | beats all no
   seed 503: S X 13.86 | R 5.93 | SH 1.36 | DR 19.93 | ref D 3.50 | ref DRIFT 17.00 | beats all yes

ROBUSTNESS: 5/12 nudges clear the original bar (pre-registered threshold >= 9/12, i.e. >= 70%) => FRAGILE (a sensitivity map, not a single verdict: see table)
e003-noCH_AWAY (own pre-registered arm, not counted in the 12): 2/3, rel 1.377, no collapse => PASS
   seed 501: S X 6.36 | R 4.86 | SH 6.79 | DR 22.50 | ref D 5.57 | ref DRIFT 13.79 | beats all no
   seed 502: S X 13.86 | R 13.71 | SH 4.57 | DR 17.14 | ref D 2.71 | ref DRIFT 19.29 | beats all yes
   seed 503: S X 14.64 | R 5.93 | SH 7.14 | DR 21.93 | ref D 3.50 | ref DRIFT 17.00 | beats all yes
```
