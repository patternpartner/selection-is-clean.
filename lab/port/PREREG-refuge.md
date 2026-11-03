# PRE-REGISTRATION #373 — a PREY REFUGE: may predation take a prey below the price of a birth? (`REPL_REFUGE`)

Written and committed before any decision run. Seeds 10601, 10602, 10603 have never been run by anyone.

## Why (#372's census; design seeds, not deciding)
Ten collapses of the default TASKS world were replayed exactly. Four, plus one later in a fifth, were predator outbreaks:
- prey events rose 100-fold (to 216,468 per 250 ticks on 10502 LAWS k2);
- carriers of op 155 rose to hundreds;
- the mean store of the WHOLE population fell to about 0.05, the floor op 155 stops at.

Predators were not full either: everyone drains everyone, and a fifth of each take is lost. A birth costs 0.25
(`BIRTH_ENERGY_COST` under REPL), so the world was held unable to breed until it aged out. #366 found predation does real work where
worlds live: removing it cost late novelty on 4 of 6 seeds. So it is not removed here; it is bounded.

## The arm
`REPL_REFUGE=1`, at the one predation site (asserted: one). A take may not bring the prey's store below `BIRTH_ENERGY_COST`, and a
prey at or below it is not taken from. Unset: today's predation, byte-identical (seed 3, 1,500 ticks, TASKS on and off).
On design seed 10502 LAWS k2:
- prey events stayed at 400-1,800 per 250 ticks where they had reached 216,468;
- carriers peaked at 163 against 748;
- the mean store held at 0.13-0.15 against 0.044;
- the world dipped from 1,769 to 651 and recovered to 1,070, where without the refuge it fell to 268.

## Runs
- **DEFAULT x3** (today's world) and **REFUGE x3** per seed, all `TASKS=1`, 12,000 ticks.
- Replicate k reseeds after tick 1 (`RESEED_AT=1 RESEED=k`), shared by both arms. The three DEFAULT runs are the null band.
- Probe `lab/port/probe-reload.js` with its draw-free `DIAG=1`. Batch `lab/port/refuge-batch.sh`, out `lab/port/out-refuge/`,
  analysis `lab/port/analyse-refuge.js`, written before the runs finish.

## Executed first
A seed COUNTS if every replicate of both arms had at least 1,000 prey events by 12,000: the route the refuge bounds existed there.
Report counted seeds first. Fewer than 3: INCONCLUSIVE, the default does not move, extend with unseen seeds 10604 onward.

## Measures (as #371)
- **V:** functions new to the universe's history over the whole run.
- **S, E:** mean formula size and exp(H), averaged over the windows ending 6,500-12,000.
- **C:** collapse, as #371 defined it (two consecutive windows under 25% of the highest alive before them, after first reaching 300).

## Rule, per counted seed (REFUGE judged against DEFAULT's three replicates)
- REFUGE is **BETTER** on V if every REFUGE V is above every DEFAULT V and the lowest REFUGE V is more than 10% above the highest
  DEFAULT V. It is BETTER on S if every REFUGE S is above every DEFAULT S by more than 0.25 gates, and on E if every REFUGE E is
  above every DEFAULT E by more than 10%. It is BETTER on C if at least 2 DEFAULT replicates collapse and no REFUGE replicate does.
  **WORSE** is each of these the other way.
- The seed is **BETTER** if BETTER on anything and WORSE on nothing; **WORSE** if the reverse; **SPLIT** if both; otherwise it
  **differs** (or is **identical**).

## Verdict (two-thirds of counted seeds)
- **BETTER on two-thirds:** ship. `REPL_REFUGE` defaults to 1 wherever TASKS runs (the browser's default world), byte-identical
  elsewhere.
- **WORSE on two-thirds, or identical on every counted seed:** DELETE the knob (this file and its note stay as the record).
- **Anything else:** not shipped. The knob stays 0 (DORMANT), with a named follow-up: a longer horizon. A mechanism an addition
  makes must PROVE itself (CLAUDE.md), so "not worse" is not enough to ship it.

## Prediction (mine, before any run)
BETTER on 2 of 3, through C. The risk I see: the refuge also starves predators sooner, and a world with fewer energy flows may
compute less (#366: worlds without predation found fewer functions late), so V could fall.

## Saved worlds (rule 6)
The refuge is a rule, not a gene: a saved TASKS universe that reloads after the change runs with it. Said here; it does not block.
