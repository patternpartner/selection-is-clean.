# PRE-REGISTRATION #371 — does the law process earn its place in the computing world? (retire-or-prove, `LAWMUT`)

Written and committed before any decision run. Seeds 10501, 10502, 10503 have never been run by anyone. `lab/PORT-PLAN.md` names
it: "re-run retire-or-prove on the big layers (mind, plasmids, cosmos, clusters, channels, laws) in THAT world". Every earlier
verdict on the laws was measured where nothing a program computes could be selected for.

## The finding that raises it (design seeds 104010 and 104020: #370's chunk 0 of 10401 and 10402; they design this, not decide it)
- `attemptLawMutation` proposes `to = from + (rand-0.5) x (hi-lo) x 0.35`: a step scaled to the law's WHOLE range, not to its value,
  and holds it for `LAW_PROBATION` = 4,000 ticks before the verdict (kept if the mean population held at least `LAW_VIABLE` of its
  baseline, otherwise reverted). Every living creature also pays `LAW_COST` amp for each proposal.
- REPL sets `BIRTH_ENERGY_COST` to 0.25 (#278); its range is 0.01-8, so one proposal moves it by up to 1.4. On 104010,
  `BIRTH_ENERGY_COST` 0.25 -> **1.48** at tick 1,200. Births fell from 211 to 2-11 per 100 ticks. The population died of age with
  FULL stores (mean store 0.24 rising to 0.80), from 604 to 46 by 1,800. The verdict reverted it at **5,200**; births were 1,088 per
  100 ticks the same window and the population was back to 1,039 by 5,400. The same seed with `LAWMUT=0` grew to 1,734 by 2,750.
- On 104020, `REACH_RENT` 0.5 -> 0.70 at 800 was followed by a decline from 748 to 98 alive, and the verdict KEPT it. That one is
  not shown to be the law's doing.
- A replicator lives about 400 ticks, so a 4,000-tick probation is ten generations under the proposal.

## Arms
- **LAWS**: today's world (`TASKS=1`, the law process on). **NOLAW**: `LAWMUT=0`, which makes no proposal ever (rows tied to a gene,
  like FIELD_DECAY, still move with the gene).
- 3 replicates per arm per seed: the same world reseeded after tick 1 (`RESEED_AT=1 RESEED=k`, k = 1, 2, 3), LAWS and NOLAW sharing k.
- 12,000 ticks (room for about three law trials). Probe `lab/port/probe-reload.js` (one row per 500 ticks; it reports the engine's
  law proposals, kept and reverted, and draws nothing). Batch `lab/port/laws-batch.sh`, out `lab/port/out-laws/`, analysis
  `lab/port/analyse-laws.js`, written before the runs finish.

## Executed first
A seed COUNTS if every LAWS replicate made at least 2 law proposals by 12,000 and every NOLAW replicate made none. Counted seeds are
reported first. Fewer than 3 counted: INCONCLUSIVE, the default does not move, extend with unseen seeds 10504 onward.

## Measures
- **V** novelty: functions paid that the universe had never been paid for before, summed over the whole run.
- **S** circuit size: income-weighted mean formula size, averaged over the windows ending 6,500-12,000.
- **E** breadth: exp(H) of each window's income, averaged over the same windows.
- **C** collapse: a replicate COLLAPSES if, at any two consecutive windows, alive is under 25% of the highest alive it had reached
  before them (counted only after it first reached 300 alive).
- Reported, not ruled on: alive late, law proposals / kept / reverted, which laws were tried.

## Rule, per counted seed (the mechanism is the law process; LAWS is judged against NOLAW's three replicates)
- LAWS is **WORSE** on V if every LAWS V is below every NOLAW V and the highest LAWS V is more than 10% below the lowest NOLAW V; on S
  if every LAWS S is below every NOLAW S by more than 0.25 gates; on E if every LAWS E is below every NOLAW E by more than 10%; on C
  if at least 2 LAWS replicates collapse and no NOLAW replicate does. **BETTER** is each of these the other way.
- The seed is **WORSE** if LAWS is WORSE on anything and BETTER on nothing; **BETTER** if BETTER on anything and WORSE on nothing;
  **SPLIT** if both; otherwise it **differs** (or is **identical** if every paired replicate matches on V, S and E).

## Verdict (two-thirds of counted seeds)
- **WORSE on two-thirds:** the law process goes DORMANT wherever TASKS runs (the browser's default world stops proposing laws;
  `LAWMUT=1` turns it back on). Node's default and REPL worlds are untouched and byte-identical.
- **SPLIT on two-thirds:** no change; named follow-up: proposal steps relative to the law's value.
- **Anything else** (BETTER, or not WORSE and the arms differ): KEEP, no change.

## Prediction (mine, before any run)
WORSE on 2 of 3, through C: at least one law trial per seed kills its world for its probation, as on 104010.

## Saved worlds (rule 6)
A universe already holds whatever values its laws had been moved to (they persist in the genome, #216x). If the process goes dormant
under TASKS, those values stay where they are and simply stop moving. Said here; it does not block.
