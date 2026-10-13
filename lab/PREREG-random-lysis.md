# PRE-REGISTRATION: a disturbance-matched null for the #287 virus claim (random lysis)

Written and committed before any run on the deciding seeds. No result exists when this file is committed.
Branch `cos/random-lysis-null`, from `origin/main` @ `8efaf9d`.

## The question
#287 and #289 credit lytic viruses that enter through a metabolic reaction with "2-5x the novelty" (new active reactions)
of the same chemistry without viruses. That comparison is against NO extra deaths at all. The alternative: the novelty comes
from ANY extra killing, which reshuffles who wins and frees space, and not from an enemy that targets what hosts do. This
test gives a world the virus world's own death toll, applied to random organisms, and asks whether the virus still makes more.

## The code change (one knob, off by default)
`lab/oee-core.js`: `LYSIS_SCHED` (a list of kill counts, one per `LYSIS_EVERY`=1000 ticks) and `lysisStep()`. Each interval's
count is spread evenly over its 1,000 ticks. Each kill takes a uniformly random LIVING organism, whatever it carries, and lyses
it the way the virus does (`kill(c,'lysed')`: store and body to the corpse). It has its own RNG, so the main stream is untouched.
Plumbing checks run before this commit (seed 99 / 98, not deciding seeds):
- knob unset: CHEM and CHEM+VIRUS output identical to `8efaf9d` in every field except wall-clock time (4,000 ticks);
- an all-zero schedule: identical to CHEM-only in every field except the added `ev.lysed` counter;
- a schedule [0,37,500,3]: exactly 0, 37, 500 and 3 lysed in the four samples;
- `lab/random-lysis/run.sh` end-to-end at 24,000 ticks on seed 98 (all five arms, r reading v's schedule).

## Arms (all `CHEM=1`, the 256-species chemistry of #286-#287; defaults otherwise, viruses start at tick 20,000)
| arm | what | OPTS |
|---|---|---|
| c | chemistry only | `{"CHEM":1}` |
| v | evolving virus (#287) | `{"CHEM":1,"VIRUS":1}` |
| m | non-mutating virus + random-key immigrants (#287c as run) | `+ "V_MUT":0` |
| o | #287's never-run pre-registered control: every one of the 1,024 keys seeded once at onset (30 virions each), then no immigrants and no re-keying | `+ "V_MUT":0,"V_IMMIG":0,"V_SEEDN":30,"V_SEED":[0..1023]` |
| r | random lysis matched to v: the same seed's v run's per-1,000-tick lysis count (`ev.lysed`), applied to random organisms | `{"CHEM":1,"LYSIS_SCHED":[...from v],"LYSIS_EVERY":1000}` |

(V_SEEDN is 30, not the default 100, because 1,024 x 100 exceeds V_MAX=40,000 and would seed only the first 400 keys.)

## Seeds, horizon, runs
- **Seeds 4, 5, 6.** Never used in the lean core (`lab/`). Every lab entry #285-#290 used seeds 1-3.
- **600,000 ticks** per run, sampled every 1,000 (`lab/core-run.js`, EVERY=1000), one run per arm per seed: 15 runs.
- Runner: `lab/random-lysis/run.sh` (c, v, m, o in parallel, 7 at a time; then r on each seed from that seed's finished v run).
- Estimated wall time about 1.5 hours on 8 cores (24,000 ticks took 40-70 s per run, four in parallel). If the estimate turns
  out to exceed about 3 hours, the horizon is cut BEFORE starting and recorded here; it was not.

## The metric (#287's, unchanged)
`lab/core-chem.js` with WIN=30 (30,000-tick windows, so 20 windows) and MIN=0.01: a reaction is ACTIVE in a window when it
captures at least 1% of the window's metabolic income. It is NEW when it was never active before in that run.
- **Primary: total new active reactions in windows 11-20 (ticks 300,000-600,000)**, the late half, as #287c read its runs at
  600,000 ticks.
- Also reported, deciding nothing: windows of 11-20 with at least one new active reaction (#287's count); reactions ever active
  by 600,000; mean share of the living carrying the commonest reaction over 300k-600k (`chem.topRx[0]`); mean population; total
  lysed.

## The verdict rule
- On a seed, **v beats r** when v's primary count is STRICTLY greater than r's. A tie does not beat.
- **The virus counts as evolution-driven (enemy-driven) novelty only if v beats r on all 3 seeds.** Otherwise: NOT SHOWN. The
  virus's extra novelty is then not distinguishable from matched random deaths at this horizon.
- Reported with the same strict per-seed comparison, but not ruling: v against c, v against m, v against o. If v passes against r
  but not against m, the novelty needs targeting, not virus evolution (the #287c reading). One run per arm per seed: no
  replicates. The 3-of-3 strict rule is the only protection against noise, and that is said now, not afterwards.
- The rule is not revised after the data. Any later change (horizon, threshold, replicates) is a new experiment.
