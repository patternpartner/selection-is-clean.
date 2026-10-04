# LOCAL RENEWAL: does food that grows back where it is eaten let new tricks stick?

Branch `cos/local-renewal`, from `cos/chance-logging` (8a8560a). Design and pre-registration only: **no trial or deciding run has been
started.** Nothing here touches main.

## Plain summary (for a non-technical reader or an outside reviewer)
1. In our simulated world, organisms invent new chemical "tricks". Almost all of them disappear again, so very little real novelty builds up.
2. Detailed logging showed one cause that pure chance does not explain. Tricks that spread widely often die because they use up their
   own food molecule where they live. That was 32% of such deaths, against 12–24% in a comparison world with no selection.
3. The test: let food slowly grow back in each spot, back toward what that spot normally holds, so a heavily eaten molecule recovers
   where it is eaten ("RENEW").
4. Extra food alone could help anything, so the main control gets exactly the same amount of the same molecules, scattered at random
   spots instead of where they were eaten ("MATCHED-FOOD").
5. We also compare against: the current design without renewal, plain random invention (the old best), a no-selection world, and a
   world where organisms inherit a random stranger's tricks.
6. Main score: how many new tricks get used, per stretch of time, and are still in use two stretches later, measured over the last
   third of the run ("used novelty that sticks").
7. Step 1 (practice seeds 116–118, short runs) may set only one thing: how much food grows back (three candidate levels). That level is
   then frozen.
8. Step 2 (unseen seeds 119–121, full-length runs) decides. RENEW must beat every control on at least 2 of 3 seeds, and score at least
   10% higher than plain random invention and than MATCHED-FOOD on average. No population may collapse, and the food must really be matched.
9. A pass would only mean that local renewal makes new tricks stick in this simulated world, a reason for a larger test. It would not
   be a general claim. A fail is also informative: running out of local food would then not be what holds novelty back.
10. With the mechanism switched off, the simulation is byte-for-byte unchanged. A 20k-tick smoke test ran cleanly.

## Why (from `lab/CHANCE-ENGINE.md`, logged rerun on cos/chance-logging)
Among new tricks that reached ≥ 10 carriers, the input molecule ran out at the last carrier in 32% (D) and 28% (RANDCAP) of deaths.
The no-selection DRIFT figure was 12% of all its deaths, or 24% of those that earned anything. A further 36% died after their input
roughly halved. Hypothesis: **local depletion of a trick's own input kills tricks that have spread.** Local renewal should let them
persist, and should do so more than the same food delivered elsewhere.

## Mechanism (`lab/oee-core.js`, flag `RENEW`, default 0 = off)
- **Baseline.** Every cell keeps a slow baseline of every molecule species: an exponential moving average of its own concentration
  with time constant `RN_TAU` = 20,000 ticks.
- **Shortfall.** After each chemistry step (every 5 ticks), the shortfall is max(0, baseline − current), per cell and species.
- **Refill rule.** The rule asks for `RN_RATE` = 0.1 of every shortfall. The total injected energy per chemistry step is capped at
  `RN_CAP`. When the cap binds, every request is scaled down by the same factor.
- **`RENEW 1` (local renewal).** The molecules go into the cells where the shortfall is.
- **`RENEW 2` (MATCHED-FOOD).** The same rule computes the same amount per species from that world's own shortfalls, but the molecules
  go into `RN_K` = 64 uniformly random cells per species. These draws use a separate random-number stream, so the main stream is not
  disturbed.
- **Energy is not conserved in RENEW arms.** This is an external food source, like a chemostat. Every sample reports the injected
  energy (`rn.inj`), the requested energy and the share of steps where the cap bound. In the smoke test the cap bound in 100% of steps
  in both modes, so the two arms received **identical** energy per step. The pre-registration checks this on every seed.
- **Scale.** `RN_CAP` 1.5 is 300 energy per 1000 ticks. That is about 1.2% of the light organisms eat (about 24k per 1000 ticks), and
  a few percent of body income.
- **Not supported:** `CHEM_BIG` (the constructor throws). `save()`/`load()` do not carry the baseline; lab runs do not use them.

## Arms
Base world for all arms: A3b C1 (`CHEM, HBODY, BODY_F 0.05, BODY_MAX 16, BODY_FUSE 0.02`).

| arm | settings | role |
|---|---|---|
| **RENEW** | D + `RENEW 1` | the design |
| **MATCHED** | D + `RENEW 2` | same food, not where eaten (main control) |
| **D** | R1: `BODY_RCAP 1, CH_LEN 1.5` | the design without food |
| **RANDCAP** | `BODY_RCAP 1` | plain chance, the old null to beat |
| **DRIFT** | D + `BODY_DRIFT 1` | no selection |
| **DRIFT-RN** | DRIFT + `RENEW 1` | no selection, same food |
| **SHUF-RN** | D + `BODY_SHUF 1` + `RENEW 1` | inheritance null, same food (cheap) |
| **BASE** | `CHEM` only | population reference, for the collapse check |

## Pre-registration (fixed now, before any trial run; code: `lab/renew/rn-check.js`)
- **Primary metric S, "used novelty that sticks".**
  - Windows are 10k ticks. A trick is *used* in a window when its mean share of chemical income is ≥ 1% or ≥ 1% of organisms carry
    it (the Lu rule).
  - *New used*: used for the first time ever.
  - *Sticky*: new used in window w and still used in window w+2.
  - S is the mean sticky count per window over the late third of the windows that have a w+2. At 450k that is windows 29–42; at 150k,
    windows 9–12.
- **Secondary metrics** (reported, not part of the bar): Lu and LuInc (`lab/chance/ce-trial.js`, WIN 15), the sticky share, injected
  energy and cap binding.
- **Step 1, tuning.** Trial seeds **116, 117, 118**, 150k ticks.
  - Arms: RENEW and MATCHED at `RN_CAP` ∈ {**1.5, 5, 15**} (about 1%, 4% and 12% of eaten light), plus BASE. 21 runs.
  - A cap qualifies if, on every trial seed, all of these hold:
    - MATCHED's injected energy is within ±10% of RENEW's;
    - the cap binds in ≥ 95% of steps in both arms;
    - nothing reseeds;
    - RENEW and MATCHED each keep late N ≥ 50% of BASE.
  - Pick: the qualifying cap with the highest mean S(RENEW) / mean S(MATCHED). Both means get +0.5, so a zero denominator is defined.
    Ties within 0.02 go to the smaller cap.
  - If no cap qualifies: **STOP**. MATCHED gets redesigned, and there is no deciding round.
  - Nothing else may be changed after step 1.
- **Step 2, deciding.** Unseen seeds **119, 120, 121**, 450k ticks, all 8 arms, 24 runs, cap frozen. **GO only if all four hold:**
  1. On ≥ 2 of the 3 seeds, RENEW beats every null:
     - S(RENEW) > S(MATCHED), S(D), S(RANDCAP) and S(SHUF-RN), strictly;
     - for the no-selection null, as a difference: S(RENEW) − S(D) > S(DRIFT-RN) − S(DRIFT). Renewal must help more with selection
       than it helps drift.
  2. Mean S(RENEW) ≥ 1.10 × mean S(RANDCAP), **and** ≥ 1.10 × mean S(MATCHED) (ratios of seed means).
  3. No population collapse: no arm reseeds, and every arm's late N ≥ 50% of BASE on every seed.
  4. Food matched: MATCHED's injected energy is within ±10% of RENEW's on every seed.
- **What a GO means.** It supports writing a larger confirmation on fresh seeds. It is not a general claim.
- **Seeds 116–121 have never been run** on any branch of this project.

### One deliberate deviation from the brief: the DRIFT comparison
The brief asked RENEW to beat every null directly, DRIFT included. On S that would almost certainly fail for a reason unrelated to
renewal. Shadow bodies in the no-selection world pile up many tricks carried by ≥ 1% of organisms, so plain DRIFT scores far higher
on S. Existing stage-2 data (seeds 113–115, not used for this test; `lab/renew/trial/s2-reference.txt`): S for D 3.6 / 7.9 / 10.4,
RANDCAP 5.3 / 5.9 / 4.1, DRIFT 15.2 / 22.1 / 18.7, SHUF 0.4 / 1.0 / 0.4. So DRIFT enters the bar as the difference above. The direct
S(RENEW) > S(DRIFT-RN) comparison is still printed. An income-only sticky count would avoid the problem, but it is almost always 0–1
per window, too small to decide on. If the user prefers the literal rule, change `rn-check.js go` **before step 2**.

## Checks done at design time
- **Identity when off** (`lab/renew/trial/identity-off.txt`): seed 59, 20k ticks, D / RANDCAP / DRIFT / SHUF / BASE. The sample-log
  hash and the full state hash are identical between this core (flag present, off) and the cos/chance-logging core (8a8560a). Seed 59
  is a smoke seed, not a trial or deciding seed.
- **Smoke** (`lab/renew/trial/smoke.txt`): seed 59, 20k ticks, D base, RENEW 0 / 1 / 2 at `RN_CAP` 1.5. All three ran without error or
  reseed, with N 1045 / 1122 / 1309 at 20k. Both modes injected exactly 300 energy per 1000 ticks, with the cap binding in 100% of
  steps. RENEW ran about 1.4× slower per tick than plain D. No outcome is read from the smoke.

## Runtime on the box (8 cores)
- **Per run.** A plain 450k run takes about 1,200 s at 8–9 in parallel (logged rerun: 1,222 s for 450k, 388 s for 150k). RENEW and
  MATCHED take about 1.4× that: roughly 550 s at 150k and 1,700 s at 450k.
- **Step 1:** 21 runs × 150k, 3 waves, about **30 min**.
- **Step 2:** 24 runs × 450k, 12 of them with renewal, 3 waves, about **1.3–1.5 h**.
- Runs cannot resume midway. A box restart means rerunning the unfinished runs; `.done` files skip the finished ones.

## How to run (not started)
- Step 1: `setsid nohup lab/renew/tune-runs.sh > /dev/null 2>&1 &`. It appends the frozen cap here and pushes.
- Step 2, only with the user's approval: `setsid nohup lab/renew/decide-runs.sh --approved > /dev/null 2>&1 &`. It refuses to run
  without a frozen cap.

## Log

### Step 1 result: tuning on trial seeds 116-118, 150k (appended by tune-runs.sh 2026-10-04 16:30 BST)
```
arm seed | ticks | S (sticky new used / window, late third) | new used / window (late third) | sticky share | late N | reseeds | injected energy | cap binding share
BASE 116 | 150000 | 0.00 | 0.00 | - | 1377 | 0 | 0 | -
RENEW-c1.5 116 | 150000 | 3.75 | 25.00 | 0.15 | 1224 | 0 | 42929 | 0.95
MATCHED-c1.5 116 | 150000 | 8.25 | 40.25 | 0.20 | 1012 | 0 | 43132 | 0.95
RENEW-c5 116 | 150000 | 7.00 | 35.50 | 0.20 | 1100 | 0 | 142382 | 0.95
MATCHED-c5 116 | 150000 | 4.75 | 27.00 | 0.18 | 1231 | 0 | 143401 | 0.95
RENEW-c15 116 | 150000 | 13.00 | 59.75 | 0.22 | 1190 | 0 | 422878 | 0.93
MATCHED-c15 116 | 150000 | 15.50 | 65.75 | 0.24 | 1167 | 0 | 429671 | 0.95
BASE 117 | 150000 | 0.00 | 0.00 | - | 1337 | 0 | 0 | -
RENEW-c1.5 117 | 150000 | 7.25 | 42.50 | 0.17 | 989 | 0 | 43777 | 0.97
MATCHED-c1.5 117 | 150000 | 9.00 | 46.25 | 0.19 | 970 | 0 | 43783 | 0.97
RENEW-c5 117 | 150000 | 6.00 | 31.75 | 0.19 | 1002 | 0 | 145822 | 0.97
MATCHED-c5 117 | 150000 | 12.25 | 51.75 | 0.24 | 1061 | 0 | 145845 | 0.97
RENEW-c15 117 | 150000 | 5.75 | 40.25 | 0.14 | 1198 | 0 | 436140 | 0.97
MATCHED-c15 117 | 150000 | 7.75 | 43.00 | 0.18 | 1146 | 0 | 436169 | 0.97
BASE 118 | 150000 | 0.00 | 0.00 | - | 1434 | 0 | 0 | -
RENEW-c1.5 118 | 150000 | 2.25 | 18.25 | 0.12 | 1184 | 0 | 44304 | 0.98
MATCHED-c1.5 118 | 150000 | 5.50 | 29.00 | 0.19 | 1188 | 0 | 44304 | 0.98
RENEW-c5 118 | 150000 | 3.25 | 26.75 | 0.12 | 1170 | 0 | 147662 | 0.98
MATCHED-c5 118 | 150000 | 5.50 | 41.50 | 0.13 | 1223 | 0 | 147663 | 0.98
RENEW-c15 118 | 150000 | 11.00 | 52.25 | 0.21 | 1268 | 0 | 441740 | 0.98
MATCHED-c15 118 | 150000 | 6.75 | 35.25 | 0.19 | 1213 | 0 | 440701 | 0.97

cap 1.5: S RENEW 3.75,7.25,2.25 | S MATCHED 8.25,9.00,5.50 | ratio 0.61 | does not qualify: seed 116 cap binding 0.95/0.95
cap 5: S RENEW 7.00,6.00,3.25 | S MATCHED 4.75,12.25,5.50 | ratio 0.74 | does not qualify: seed 116 cap binding 0.95/0.95
cap 15: S RENEW 13.00,5.75,11.00 | S MATCHED 15.50,7.75,6.75 | ratio 0.99 | does not qualify: seed 116 cap binding 0.93/0.95
STOP: no cap qualifies
```
