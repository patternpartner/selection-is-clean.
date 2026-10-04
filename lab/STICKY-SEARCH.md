# STICKY-SEARCH: an automated search over rule knobs for used novelty that sticks (pre-registered)

Branch `cos/sticky-search` (off `cos/chance-logging`, which already has the speedup core). Script: `lab/sticky/search.js`.
Everything that makes a decision is fixed in that script before launch: the knobs, their ranges, the sampling, the phases, the score, the seeds and the held-out bar.
This file was committed before the search was launched. `search.js` appends results to the end of the file automatically.

## In plain words
Local-renewal stopped at its practice gate (NO-GO). Testing one hand-designed hypothesis at a time is slow, so this search lets the machine try about 70 combinations of rule changes overnight.
For each combination it asks one question: **do new tricks that get used still stick around two windows later, more often than in the same world with selection taken out?**
Each combination is scored only against null runs made *in that same combination*:
- plain random capture (RANDCAP),
- shuffled credit (SHUF),
- the no-selection DRIFT control, used through a difference rule.

So a knob that simply makes everything churn more does not win. Search runs are short (100k ticks) and use search seeds only.
The 3 best combinations are then rerun automatically at full length (450k) on 3 seeds the search never saw. They have to clear a bar fixed in advance.
Passing the bar makes a combination only a *candidate*. Because 3 combinations were tested, a candidate must be re-confirmed on fresh seeds 401–403 before anyone claims anything.

## New core knobs (all default off; behaviour with them off is identical to the old core)
`lab/oee-core.js` adds:
- the RENEW flag from `cos/local-renewal` b3cb889,
- **BODY_CROWD** k: extra upkeep of BODY_UP·k·(share of organisms carrying the trick's substrate), recounted every 50 ticks and not charged under DRIFT. This is per-trick upkeep that scales with crowding on its substrate.
- **XB** (XB_GAIN): a separate exploration budget. It is credited from body income, scales capture probability, is spent on each capture and is split at birth.
- **DISP** (DISP_R 8): newborn dispersal by up to DISP_R cells with probability DISP. It uses its own RNG stream.

Identity with all of them off was checked against the 8a8560a core (ce-logcheck LOG=0, seed 59, 12k). D, RANDCAP, DRIFT, SHUF, BASE and PLAIN were byte-identical in both log hash and final state: `lab/sticky/trial/identity-off.txt`. Smoke checks are in `lab/sticky/trial/smoke.txt`.

## Search space (25 knobs; each one is changed from its default only if its flag gene < pOn)
W = world knob: applied to the design arm and to **every** null, including the in-world RANDCAP. O = operator knob: applied to the design arm, SHUF and DRIFT, but not to RANDCAP, which keeps plain-chance capture.

| knob | grp | range (scale) | pOn | what it stands for |
|---|---|---|---|---|
| CHEM_DECAY | W | 1e-4–5e-3 (log) | .5 | world-molecule turnover / chemistry drift |
| CHEM_D | W | 0.05–0.6 | .5 | molecule diffusion (food locality) |
| CHEM_ALPHA | W | 0.2–0.8 | .5 | share of eaten light left as molecule 0 |
| PATCHES | W | 1–8 (int) | .5 | light patchiness |
| PATCH_R | W | 4–16 | .5 | patch radius |
| PATCH_V | W | 5e-4–2e-2 (log) | .5 | patch drift (environment drift) |
| L_RATE | W | 0.01–0.2 (log) | .5 | light renewal rate |
| RENEW (RN_CAP) | W | cap 1.5–30 (log) | .35 | local food renewal |
| BODY_CROWD | W | 0.5–20 (log) | .35 | upkeep scaling with crowding on the substrate |
| DISP | W | 0.01–0.3 | .35 | carrier dispersal / locality |
| BODY_UP | W | 2e-4–2e-3 (log) | .5 | upkeep per catalyst (body-size cost) |
| BODY_UPX | W | 1–2 | .5 | body-size cost exponent |
| BODY_F | W | 0.02–0.2 | .5 | catalyst turnover |
| SCAR (SCAR_MIN) | W | 0.1–0.6 | .25 | base-metabolism run-down (SCAR_T 30k, SCAR_ON 20k) |
| BODY_MUT | O | 0.002–0.05 (log) | .5 | mutation rate |
| BODY_CAP | O | 0.005–0.1 (log) | .5 | capture rate |
| BODY_FUSE | O | 0–0.1 | .5 | fusion rate |
| BODY_DUP | O | 0.002–0.05 (log) | .5 | duplication |
| BODY_DEL | O | 0.002–0.05 (log) | .5 | deletion |
| BODY_MQ | O | 0–1 | .5 | mutation-quality mix |
| CH_LEN | O | 0 (one-step, if u<0.15) or 0.8–3.0 | .5 | jump tail |
| CH_AWAY | O | 0–0.8 | .35 | jump-away bias |
| BODY_MAX | O | 6–24 (int) | .5 | max body size |
| XB (XB_GAIN) | O | 0.1–10 (log) | .35 | separate exploration budget |
| CAPSRC | O | Dirichlet-like 4-way BODY_CW (LAST, RAND, ENV, EXT), RCAP 0 | .3 | capture-source mix |

Base for all arms: CHEM 1, HBODY 1, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02. The design arm adds BODY_RCAP 1 and CH_LEN 1.5 (that is stage-2 D) before the knobs.
The config c000 has every knob off, so it is exactly D. It is included as the reference point but cannot be picked for held-out.

**Deviations from the request, stated in advance:**
- "Multiple energy currencies" is only approximated, by the separate exploration budget XB. There is no second metabolic currency in the core, and adding one was not cheap.
- "Chemistry drift" is approximated by world-molecule turnover (CHEM_DECAY) and patch drift (PATCH_V).
- The RANDCAP null is plain chance capture *with the config's world knobs*. It is the matched "no design" operator in the same world.
- DRIFT enters through the difference rule, as in LOCAL-RENEWAL.md: DRIFT changes too much of the world to be a ratio null on its own.

## Metric S (sticky used novelty)
- Windows: 5 samples (5k ticks) in search runs; 10 samples (10k) in held-out runs.
- A trick is **used** in a window if its mean share of body income (bU) ≥ 1% or its mean carrier share (bC) ≥ 1%.
- **New used** in window w means used in w and never used in an earlier window. It is **sticky** if it is still used in window w+2.
- S = mean count of sticky new used tricks per window over the **late third** of the windows that have a w+2.

## Objective per config (search)
Arms on each search seed:
- X = design
- R = RANDCAP in the same world
- SH = X + BODY_SHUF
- DR = X + BODY_DRIFT

References per seed: D, DRIFT and BASE (the stage-2 defaults).

The seed score is log(min(rR, rSH, rDR)):
- rR = (S_X+1)/(S_R+1)
- rSH = (S_X+1)/(S_SH+1)
- rDR = [(S_X+1)/(S_D+1)] / [(S_DR+1)/(S_DRIFT+1)]

The score is −5 if any arm failed, reseeded, or had a late-third mean N below 50% of BASE's on that seed (collapse), or if the metric was undefined.
The config score is the mean over the seeds it has run on. The min means a config must beat **every** null, so inflating everything does not pay.

## Seeds
- Search: 201–206.
- Held-out (never used in the search): 301–303.
- Re-confirmation of any candidate: 401–403.

## Phases (100k ticks, 8 parallel; deterministic RNG 20261004, so a relaunch makes the same decisions)
- A. c000 plus 55 Latin-hypercube configs (53 genes) on seeds 201–202.
- B. Successive halving: the top 14 on +203–204.
- C. Evolution: 14 children from the top 6 of B (rank-weighted parents, 50% uniform crossover, flag flips at p 0.1, value mutation at p 0.25 with sd ≈ 0.15) on 201–202. The top 4 children get +203–204.
- D. The top 6 of all 4-seed configs get +205–206. The **top 3 by 6-seed score, excluding c000**, go to held-out.

Planned: **70 configs** (56 + 14 children), about **770 runs at 100k** (identical runs are shared through hashed run IDs).

## Held-out confirmation bar (fixed now; runs automatically when the search ends)
Each of the top 3 configs runs at **450k** on seeds **301–303**: arms X, R, SH and DR plus references D, DRIFT and BASE, 45 runs in total, with S on 10k windows. A config is a CANDIDATE only if all three hold:
1. On **≥ 2 of 3 seeds** it beats every null: S_X > S_R, S_X > S_SH, and (S_X − S_D) > (S_DR − S_DRIFT).
2. **Relative stickiness ≥ 1.10**: min((mX+1)/(mR+1), (mX+1)/(mSH+1), [(mX+1)/(mD+1)] / [(mDR+1)/(mDRIFT+1)]) ≥ 1.10, where m is the mean S over the 3 seeds.
3. **No collapse** in any arm on any seed: no reseeds, and late N ≥ 50% of BASE.

If no config passes, the result is NO-GO for this search. A CANDIDATE is not a claim: it must pass the same bar on seeds 401–403 (a separate step that is not chained).

## Mechanics and resuming
- Every run is the file `/home/box/sticky-runs/<sha1(opts|seed|ticks)>` with .opts, .jsonl, .err and .done (or .fail for a timeout or a short run: 1800 s at 100k, 7200 s at 450k).
- Finished runs are never redone. After a box restart, relaunch from `/home/box/wt/sticky-search` with `lab/sticky/launch.sh`.
- Progress is committed and pushed every 60 runs and at the end of each phase: `lab/sticky/trial/phase*.tsv`, `configs.json`, `top3.json`, `heldout.txt`, `search.log`.
- Before launch, the plumbing was dry-run with `TEST=1` (tiny ticks, a temp directory, no git).
