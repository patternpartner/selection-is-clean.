# THE LOCKSMITH — an agent that opens locked chemistry instead of taxing the winner. Pre-registered (cos/locksmith, written and committed before any trial or deciding run).

Branch `cos/locksmith`, off `cos/gardener` at 93eb754 (GARDEN deleted; FLUXALL, NULLSHIFT and the CHEM_BIG load-salt fix kept).
Never main, no PR. Owner: the user's CoS agent, on its own direction (the user, 11 Oct: "you do whatever you want ... take entirely
your own direction"). Not a wild-mind round: nothing here writes, edits or picks any organism's program.

## Why this bet

The GARDENER (lab/GARDENER.md, 911-913) killed the "pressure on the winner" class: a perfect-information tax on whatever route was
winning added no lasting income-bearing novelty beyond the same tax dealt blind. #289's surviving lever is OPPORTUNITY: make more ways
to make a living, not punish the current one. So the opposite bet: leave the winner alone and make UNUSED chemistry reachable.

What the plain CHEM_BIG world looks like (scratch seed 7290, 100,000 ticks, `lab/locksmith/diag.js`, looked at before writing this,
never a trial or deciding seed): the economy is ONE linear chain (0 -> 256 -> 2304 -> 10496 -> 43264) built downward over time, and
it leaves energy LOCKED in molecules nobody can run: at 20k ticks species 1536 (energy 0.48 a unit) held ~17,000 units = ~8,000 energy
with only one weak usable exit and no harvester; by 100k the chain ends in 43264 (0.08 a unit, ~16,000 units) with no usable exit.
The chemistry's small-step rule (each product a one-bit flip, drop within CHEM_DMAX) means a molecule whose four product slots all
fall outside the usable window is a dead end however much of it piles up. That is a concrete place where reachable opportunity is
missing — the energy is already in the world, it is simply locked.

## The mechanism (`lab/oee-core.js`, option `REACH`, needs CHEM_BIG; not in DEF, default off)

Every `R_EVERY` ticks the locksmith opens ONE exit: it picks a species q that is LOCKED (energy at least R_EMIN 0.25 and at least one
product slot whose reaction cannot run: drop <= 0 or > CHEM_DMAX), and rewires q's first unusable slot j to a new product p, two
(else three) bit flips from q, with energy within 0.05 of be(q) - CHEM_STEP (so the drop is a normal usable step). Nothing else changes:
no energy is added, no molecule is created, no program is touched. The enzyme that names slot j on q (METABj with q's two bytes) simply
starts to work, and p's own products are bit flips of p, so downstream chemistry continues by the usual rule. The choice of p is a
deterministic hash (no draws), so every mode opens exits the same way; the modes differ only in WHICH species gets one.
- **REACH=1, TARGETED (X):** reads the whole world: among species PRESENT (total > 0.5 units), UNHARVESTED last period (under
  R_HARV 1% of metabolic income was captured from it) and locked, the one holding the most energy (units x be). Locked energy first.
- **REACH=2, BLIND-PRESENT (BP):** a present, locked species drawn uniformly (own stream). Same number of exits, opened where molecules
  are, with no reading of how much is there or whether anyone harvests it.
- **REACH=3, BLIND-NETWORK (BN):** a locked species drawn anywhere in the 65,536-species network (own stream). Same number of exits,
  no information at all.
- A period with no eligible species opens nothing (counted as a skip). An exit is never opened twice; opened exits stay open.
- Own random stream (`mulberry32(seed ^ 0x10c45317)`); the world's stream is untouched. State (stream, period tally, every exit) saves
  and restores: `lab/locksmith/resume.sh` — resume byte-exact in all three modes, mid-period, after exits were opened.
- Row readout `reach`: mode, exits opened, skips, the last exit, and how many opened exits earn at least 1% of income in the row.
- **Identity when off:** `lab/locksmith/ident.sh /workspace/cos-wt/lab` — rows AND saves byte-identical to cos/gardener 93eb754's core
  on plain, CHEM, CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS, TASKS, CHEM_BIG+FLUXALL (seed 7, 6,000 ticks). Passed before this commit.

## Measures (`lab/locksmith/score.js`, committed with this file) — the fixed metric, unchanged from the GARDENER

All arms CHEM=1, CHEM_BIG=1, FLUXALL=1, rows every 1,000 ticks, 30,000-tick windows.
- **S (primary):** `lab/used-novelty.js` S late (#291's fixed metric): used = mean share of net metabolic income >= 1%; carriers never
  read; new = used for the first time; sticky = still used 2 windows later; S = mean sticky-new per window over the late third.
- **Sf (must agree):** S with an absolute floor of 5 energy per 1,000 ticks.
- **Collapse:** mean living over the last quarter under 200.
- Reported, not ruling: last-quarter windows with a new active reaction, reactions ever active, commonest share late, metabolic income
  late, S middle, exits opened, skips, opened exits earning late, and whether each BLIND arm beats the plain band.

Note on what S can and cannot credit: an opened slot keeps its reaction key (q*4+j), never used before because it could not run, so
it counts as new if it earns; reactions downstream of p count too. All three locksmith arms get exactly the same crediting.

## Trial (design seeds 7301, 7302 — never used before; they design, they do not decide)

300,000 ticks. Arms X at R_EVERY 5,000 / 10,000 / 20,000 (X5, X10, X20); P0; BP and BN at R_EVERY 10,000. `lab/locksmith/pick.js`:
- **R_EVERY is fixed by this rule:** among X variants that did not collapse on either trial seed, the highest mean S; ties by mean Sf,
  then mean reactions ever active, then the larger R_EVERY. BP and BN use that R_EVERY in the deciding round.
- **The deciding round is launched unless** no X variant survived both trial seeds, or the chosen X has S strictly below P0 on BOTH
  trial seeds (STOPPED AT TRIAL, a weak reading, not the verdict below). The gate is deliberately loose: S at 300k sits near its floor
  (GARDENER trial), so the trial sets the rate; it is not asked to show the effect.

## Deciding round (unseen seeds 7311, 7312, 7313)

1,200,000 ticks, fresh runs, no resume. Six arms per seed: **X**, **P0, P1, P2** (no locksmith; NULLSHIFT 0, 1, 2), **BP**, **BN** — 18 runs.
The whole round runs unattended from a frozen worktree: `lab/locksmith/chain.sh OUT` (trial -> pick.js -> deciding -> score.js).
- A seed is READABLE unless a null arm collapsed. An X collapse is a loss on that seed.
- **GO (candidate):** on at least 2 readable seeds X beats EVERY null (P0, P1, P2, BP, BN) outright on S AND on Sf, and in the mean over
  readable seeds (S+1) by at least 1.10 against every null on both. Ties are not wins. A GO is a candidate only; nothing leaves this
  branch without the user, and the browser default is untouched.
- **NO-GO, REACH KILLED:** X does not beat all three plain arms (P0, P1, P2) on S on at least 2 readable seeds. Read as: even opening
  the world's largest locked energy stores, one exit at a time, does not make lasting income-bearing novelty beyond plain seed noise
  in the lean core at 1.2M. Together with the GARDENER: neither punishing the winner nor unlocking idle chemistry moves S here, and the
  limit is upstream of both (discovery/mutational supply, or the metric's horizon), which is where the next bet goes.
- **NO-GO, TARGETING NOT SHOWN:** X beats the plain band on 2 readable seeds but does not beat BOTH blind locksmiths on 2. Read as:
  opening chemistry may matter, but knowing where the locked energy is does not; if a blind arm also beats the plain band on 2 seeds
  (reported), "opportunity creation helps" is a lead for its own round, not a result here.
- **NO-GO, NOT SHOWN:** X beats plain and blind on S on 2 readable seeds but fails Sf or the 1.10 mean ratio.
- **INCONCLUSIVE:** fewer than 2 readable seeds.
- **On any NO-GO, REACH is deleted from the core on this branch** (CLAUDE.md: retire or prove). ident.sh, the scorer and the results stay.

**Written before, so it can be wrong:** I expect X to beat the plain band (the first opened exits on 7290 earned within 20k ticks)
and the honest risk is BP: present locked species are few, so a blind pick among them often lands on the same big stores. If BP
ties X, that is TARGETING NOT SHOWN, and I will say so rather than argue it up.
