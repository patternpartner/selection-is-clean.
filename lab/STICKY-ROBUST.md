# STICKY-ROBUST: a search that rewards robustness around c055 / e003-noCH, with held-out + nudge confirmation (pre-registered)

Branch `cos/sticky-robust`, off `cos/sticky-longrun` tip `0f330f4`. Script: `lab/sticky/robust.js` (orchestrator; reuses `lab/sticky/seg-run.js` + `lab/sticky/fullsave.js` for exact segment resume).
**This file and every script were committed before any run of this test started.** Everything that decides (space, sampling, jitter, score, phases, seeds, ticks, windows, bars, run budget) is fixed below and in `robust.js`. `robust.js` appends the results to the end of this file automatically. Nothing is changed after launch; any extra analysis will be labelled EXPLORATORY.

## In plain words
c055 (local food renewal + gentler body mutation) passed the bar on seeds 301–303 and 401–403 but failed on 501–503 at 450k, and only 5 of 12 one-knob ±25% nudges passed (FRAGILE, `lab/STICKY-LONGRUN.md`). The first search picked the best *point* on 6 seeds; it did not ask whether the point's *neighbourhood* works. This search looks near c055 (wider in the directions whose nudges passed) and scores each configuration by how badly it does in its **bad cases**: across 6 new search seeds, each run with a fresh small random jitter of the configuration's own knobs, the score is the 2nd-worst result. A configuration only scores well if it beats every matched null on almost every seed *and* nearby setting. The top 3 then go to unseen seeds 801–803 at full length, plus a ±25% nudge check on those seeds. Only a configuration that passes both is ROBUST-GO.

## Search space (6 knobs, RENEW on in every configuration; log-uniform)
W = world knob (applied to the design arm and to every null, including the in-world RANDCAP). O = operator knob (design arm, SHUF and DRIFT; not RANDCAP).

| knob | grp | range | c055 | e003-noCH | why this range (STICKY-LONGRUN test 2 on 501–503) |
|---|---|---|---|---|---|
| RN_CAP | W | 9 – 20 | 18.1 | 18.1 | −25% (13.6) passed, +25% (22.6) failed → wider downward |
| BODY_MUT | O | 0.014 – 0.04 | 0.02 | 0.0158 | +25% passed → wider upward; lower end keeps e003-noCH inside |
| BODY_CAP | O | 0.04 – 0.1 | 0.0456 | 0.0456 | +25% passed 3/3, −25% failed → wider upward |
| BODY_DEL | O | 0.0026 – 0.004 | 0.00319 | 0.00319 | both directions failed → kept narrow (±~20%) |
| BODY_MQ | O | 0.22 – 0.55 | 0.255 | 0.255 | +25% passed, −25% failed → wider upward |
| CH_LEN | O | 2.5 – 4.2 | 2.77 | 2.74 | +25% (3.46) passed, −25% failed → wider upward |

Values are rounded to 3 significant figures. Arms are built exactly as in `search.js` / `longrun.js`: base `CHEM 1, HBODY 1, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02`; **X** = base + `BODY_RCAP 1, CH_LEN 1.5` + W + O; **R** = RANDCAP = base + W + `BODY_RCAP 1`; **SH** = X + `BODY_SHUF 1`; **DR** = X + `BODY_DRIFT 1`. References per seed: **D** (stage-2 default), **DRIFT** (D + BODY_DRIFT), **BASE** (`CHEM 1`).

## Jitter (robustness to the configuration's own knobs)
Every evaluation of a configuration on a search seed runs a **jittered copy**: each of the 6 knobs is multiplied by an independent U(0.875, 1.125) factor (±12.5%, half the ±25% nudge), 3 s.f., not clipped to the box. The jitter is deterministic from sha1(config values | seed), so each (configuration, seed) pair has its own fresh jitter and a relaunch reproduces it. All four arms of that evaluation (X, R, SH, DR) use the same jittered knobs (R moves with the jittered RN_CAP), so the nulls stay matched. The references D/DRIFT/BASE are not jittered (they have no knobs). The un-jittered centre itself is deliberately never scored in the search: the score is a property of the neighbourhood.

## Seed score and robust objective (same matched-null relative stickiness as STICKY-SEARCH)
- S = sticky used novelty, as before: a trick is used in a window if mean bU ≥ 1% or mean bC ≥ 1%; new(w) = used in w and never before; st(w) = |new(w) still used in w+2|; S = mean st over the last third of the windows that have a w+2. Search runs: **100k ticks, 5k windows** (as STICKY-SEARCH).
- Seed score = log(min(rR, rSH, rDR)), rR = (S_X+1)/(S_R+1), rSH = (S_X+1)/(S_SH+1), rDR = [(S_X+1)/(S_D+1)] / [(S_DR+1)/(S_DRIFT+1)]. **−5** if any arm failed, reseeded, had late-third mean N below 50% of BASE's on that seed (collapse), or the metric was undefined.
- **Robust score q** of a configuration with n evaluations (each = one search seed × its own jitter) = the r-th worst seed score, **r = max(1, floor(n/3))**: n = 2 → the worst; **n = 6 → the 2nd worst**. Ties are broken by the mean seed score. A config therefore needs to beat every null on (almost) every seed-and-jitter, not on average.

## Seeds (all new)
- Search: **701–706**. Held-out confirmation and nudge check: **801–803**. Never used before (201–206 search, 301–303 held-out, 401–403 re-confirm, 501–503 long-run). 601–603 stay reserved and unused.

## Search phases (deterministic RNG 20261005; 8 parallel)
- **A. 12 configurations on seeds 701–702** (2 evaluations each):
  - 5 hand-placed points, fixed now: `h-c055` (c055); `h-e003noCH` (e003 minus CH_AWAY); `h-c055pass` (c055 with all five passing nudges at once: RN_CAP 13.6, BODY_MUT 0.025, BODY_CAP 0.057, BODY_MQ 0.319, CH_LEN 3.46); `h-c055half` (half of each of those moves: 15.8, 0.0225, 0.0513, 0.287, 3.12); `h-e003pass` (e003-noCH-like: e003-noCH's low BODY_MUT 0.0158 kept, the other passing nudges applied: RN_CAP 13.6, BODY_CAP 0.057, BODY_MQ 0.319, CH_LEN 3.43).
  - 7 Latin-hypercube points in the box.
- **B. 8 children on seeds 701–702**: parents = top 4 of A by q (rank-weighted 4:3:2:1), 50% chance of uniform crossover with a second parent, then each knob moved by N(0, 0.1) of its log-range (clipped to the box).
- **C. Top 6 of A+B by q** (2-evaluation score) get seeds **703–706** → 6 evaluations each. Ranked by **q = 2nd worst of 6** (tie: mean). **Top 3 go to confirmation** (no exclusions: c055 or e003-noCH may be picked again; confirmation is on new seeds).
- Planned: **20 configurations, 64 evaluations, 274 runs at 100k** (incl. 18 reference runs).

## Held-out confirmation (chained automatically when the search ends)
**Centre:** each of the top 3 at **450k ticks on seeds 801–803**, arms X, R, SH, DR + references D, DRIFT, BASE (45 runs; 10k windows, late third = windows 29–42), judged by the **original bar**:
1. On **≥ 2 of 3 seeds** it beats every null: S_X > S_R, S_X > S_SH, and (S_X − S_D) > (S_DR − S_DRIFT).
2. **Relative stickiness ≥ 1.10**: min((mX+1)/(mR+1), (mX+1)/(mSH+1), [(mX+1)/(mD+1)] / [(mDR+1)/(mDRIFT+1)]) ≥ 1.10, m = mean S over the 3 seeds.
3. **No collapse** in X, R, SH or DR on any seed, and no missing/failed run.

**Mini-nudge check:** the configuration's 6 knobs × **0.75 and × 1.25**, one at a time (12 nudges, 3 s.f.; RN_CAP is a W knob so its nudges also move R), each with its own X, SH, DR (and R) on seeds **801–803**, at **100k ticks, 5k windows** (the search length), judged by the same three-part original bar at that length (references D/DRIFT/BASE at 100k on the same seeds).

**ROBUST-GO** only if the centre clears the original bar (≥ 2/3 seeds, rel ≥ 1.10, no collapse) **and ≥ 9 of 12 nudges pass**. Otherwise NOT ROBUST-GO. Because 3 configurations are confirmed, a ROBUST-GO is a candidate to re-confirm on fresh seeds (a separate, not chained step), not a final claim.

**Verdict-preserving economies (fixed now):** nudges are run only for a configuration whose centre passes (a failing centre already decides NOT ROBUST-GO). Nudges run in two fixed batches of 6 — batch 1: RN_CAP ×0.75, BODY_MUT ×1.25, BODY_CAP ×0.75, BODY_DEL ×1.25, BODY_MQ ×0.75, CH_LEN ×1.25; batch 2: the opposite directions — and if ≥ 4 of batch 1 fail, ≥ 9/12 is impossible, so batch 2 is skipped. Neither economy can change any verdict; skipped nudges are reported as "not run".

## Run budget (decided now, to finish by about 07:00 BST on 8 cores)
Measured at 8-way load on this box (STICKY-SEARCH / STICKY-LONGRUN): RENEW arms ≈ 285 s per 100k and ≈ 1700–2100 s per 450k; BASE ≈ 620 s and D/DRIFT ≈ 1000 s per 450k.
- Search: 274 runs × ~285 s ≈ 77k core-s ≈ 2.7 h wall.
- Centre: 45 runs at 450k ≈ 76k core-s ≈ 2.6 h wall (the 9 references run in idle slots during the search).
- Nudges: per configuration whose centre passes, ≤ 117 runs at 100k ≈ 33k core-s ≈ 1.2 h (batch 1 only: ≈ 17k ≈ 0.6 h).
- Total: 153k core-s + nudges (0–100k). From a ~22:15 launch: no centre passes → done ≈ 04:00; typical (1–2 pass) ≈ 05:00–06:30; worst case (all 3 pass and all batch 1s pass) ≈ 07:00–07:30.
- **Why the nudge check is at 100k, not 450k (stated in advance):** the 12 nudges × 3 seeds at 450k would be ≈ 114 runs ≈ 200k core-s *per configuration* (≈ 7 h on 8 cores each), impossible overnight for 3 configurations. The 100k check is therefore weaker than STICKY-LONGRUN test 2 (450k); a ROBUST-GO here must be followed by a 450k nudge map before anyone leans on it.
- **Why each evaluation combines a new seed and a new jitter** (rather than every seed × several jitters): the full cross would cost ≥ 2× per configuration and leave too few configurations for an adaptive search. The low quantile is taken over the joint seed × jitter variation.
- There is **no early stop and no time cut-off** that changes the analysis: if the box is slow or restarts, the runs simply take longer.

## Mechanics: resumable because the box restarts often
- Every run is the file `/home/box/sticky-runs-rb/<sha1(opts|seed|ticks)>` with `.opts`, `.jsonl`, `.err`, `.done` or `.fail`. 100k runs are one segment (a killed run restarts from 0). 450k runs are split into **150k segments** with exact full-state checkpoints (`.ckpt.<k>`, `lab/sticky/fullsave.js`; byte-identity of segmented vs contiguous runs was checked on `cos/sticky-longrun`, `lab/sticky/trial-lr/identity-segments.txt`). On (re)start a partial segment is discarded and redone from the last checkpoint. A run/segment that times out (1800 s per 100k run, 7200 s per 150k segment) or crashes is retried; after 3 failures it is `.fail` and counts as a failed run (seed score −5 in the search; missing run → bar fails in confirmation).
- All decisions are a deterministic function of the finished runs, so a relaunch makes exactly the same decisions.
- Progress is committed and pushed every 40 finished runs and after each phase (`lab/sticky/trial-rb/`). After a box restart: `bash /home/box/wt/sticky-robust/lab/sticky/launch-robust.sh` (idempotent; restarts the orchestrator and the watcher `watch-robust.sh`, which relaunches the orchestrator every 5 min if it died).
- The plumbing (search phases, segmented 450k runs, kill mid-run + relaunch + resume, confirmation and report) was dry-run with `TEST=1` (tiny ticks, `/tmp/srb-test`, no git) before launch.

## What will and will not be claimed
- ROBUST-GO = "on 3 unseen seeds the centre beats every matched null at 450k, and ≥ 9/12 ±25% nudges still pass at 100k", for one of 3 tested configurations. It is a candidate for re-confirmation and a 450k nudge map, not open-endedness.
- If no configuration is ROBUST-GO, the result is that this search did not find a robust region near c055 at this budget.

### Search result (appended by robust.js 06/10/2026, 01:13:18 BST)
```
# search result: top 6 by robust score (2nd worst of 6 evaluations = seeds 701-706 x own jitter)
id | q (2nd worst) | mean | knobs | per-eval scores
a03 | -0.138 | -0.002 | {"RENEW":1,"RN_CAP":11.3,"BODY_MUT":0.0226,"BODY_CAP":0.0974,"BODY_DEL":0.00265,"BODY_MQ":0.481,"CH_LEN":2.91} | 701:0.140 702:0.123 703:-0.318 704:-0.113 705:0.293 706:-0.138
h-c055pass | -0.153 | 0.096 | {"RENEW":1,"RN_CAP":13.6,"BODY_MUT":0.025,"BODY_CAP":0.057,"BODY_DEL":0.00319,"BODY_MQ":0.319,"CH_LEN":3.46} | 701:0.206 702:0.511 703:-0.212 704:-0.153 705:0.362 706:-0.138
b04 | -0.210 | -0.066 | {"RENEW":1,"RN_CAP":15.5,"BODY_MUT":0.0228,"BODY_CAP":0.056,"BODY_DEL":0.0033,"BODY_MQ":0.31,"CH_LEN":3.72} | 701:-0.047 702:0.115 703:-0.210 704:-0.376 705:0.100 706:0.022
a06 | -0.223 | 0.105 | {"RENEW":1,"RN_CAP":10.3,"BODY_MUT":0.0181,"BODY_CAP":0.0772,"BODY_DEL":0.00378,"BODY_MQ":0.253,"CH_LEN":3.18} | 701:0.072 702:0.985 703:-0.223 704:-0.265 705:0.276 706:-0.216
a07 | -0.241 | 0.111 | {"RENEW":1,"RN_CAP":13.6,"BODY_MUT":0.0149,"BODY_CAP":0.0464,"BODY_DEL":0.00359,"BODY_MQ":0.303,"CH_LEN":4.19} | 701:0.026 702:0.606 703:-0.298 704:-0.241 705:0.458 706:0.114
h-e003noCH | -0.277 | 0.034 | {"RENEW":1,"RN_CAP":18.1,"BODY_MUT":0.0158,"BODY_CAP":0.0456,"BODY_DEL":0.00319,"BODY_MQ":0.255,"CH_LEN":2.74} | 701:-0.010 702:0.580 703:-0.440 704:-0.277 705:0.556 706:-0.207
top 3 -> confirmation: a03, h-c055pass, b04
```
