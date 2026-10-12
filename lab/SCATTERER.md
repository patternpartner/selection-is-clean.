# THE SCATTERER — keep the carriers of earning tricks from vanishing together. Pre-registered (cos/scatterer, written and committed before any deciding run).

Branch `cos/scatterer`, off `cos/archivist` at b8712ad (ARCHIVE deleted). Never main, no PR. Owner: the user's CoS agent, on its own
direction (the user, 11 Oct: "you do whatever you want ... take entirely your own direction").

## Why this bet

Four outside-agent rounds are dead: the GARDENER (tax the winner), the LOCKSMITH (open locked exits), the DREAMER (hand in screened
tricks) and the ARCHIVIST (hand lost tricks back). The Archivist's coroner said the usual death of an earning trick is CARRIER LOSS
(the enzyme gone from every living program in ~53-93% of deaths) while its food is often partly back — and handing the program back
did not help. Writing programs in is the wrong lever. This round writes nothing: it asks whether tricks die because their carriers
sit together and go down together (one patch starves, one lineage is crowded out), and whether keeping carriers spread stops that.

The AI-native bet: an agent outside the world sees where every carrier is. If a trick's carriers form one clump, one local disaster
ends it. Moving a few carriers — whole organisms, swapped with whoever lives there — to far cells that hold the trick's food founds
satellite colonies, so no single disaster wipes the trick out. If spread carriers still vanish, wipeout is not geographic, and every
"insure the good stuff by spreading it" idea (migration, island models, dispersal) is dead for this metric here.

Scratch look before writing (seed 7890, 200,000 ticks, never a deciding seed; mechanism and timing only): about 2.5-4 reactions earn
>= 1% at a check; the rule finds a far food cell for ~1-2 of them per check (dominant reactions have carriers everywhere, so no far
cell exists and they are left alone — the rule touches only clumped earners by construction); ~600 swaps in 200k ticks (~3 per
1,000 ticks, against ~1,100-1,300 living). Earners wiped (earning at one check, zero carriers at the next): X 7, plain 9, BS 8, BW 9.
S at 200k says nothing (X 0, P0 0, BS 1, BW 0).

## The mechanism (`lab/oee-core.js`, option `SCATTER`, needs CHEM_BIG; not in DEF, default off)

Every `S_EVERY` (1,000) ticks, at the end of the step (before the sample), on this period's reaction income (rxE):
1. **Earners.** Every reaction (key q*4+j) earning >= 1% of this period's metabolic income, in key order.
2. **Carriers.** Every living organism whose program holds that METABj/lo, hi pair.
3. **Destinations.** Mask every cell within `S_RAD` (8) cells (Chebyshev, torus) of a carrier. Among the unmasked cells holding a
   living organism and any substrate q, take the richest in q first; after each pick, mask its own radius, up to `S_F` (3). So each
   destination is > 8 cells from every carrier and from every other destination.
4. **Swap** (whole organism: energy, age, pc, facing, registers, program, shadow, tag, template, generation, stamp, body fields,
   task state). Nothing is written, made or killed; no energy added. Only places change.
   - **SCATTER=1, SCATTERER (X):** a carrier drawn uniformly (no repeats) goes to each destination; the organism there takes its cell.
   - **SCATTER=2, BLIND-SWAP (BS):** the same number of swaps, each between two uniformly drawn living organisms. (Same mixing volume, no targeting.)
   - **SCATTER=3, WRONG-MOVER (BW):** the same destinations; the organism moved there is drawn uniformly from living NON-carriers.
   - **SCATTER=4, WATCH:** census only, never swaps.
- Own stream `mulberry32(seed0 ^ 0x5ca77e12)`; state saves and restores. Row readout `scat`: earners, checks acted on, swaps,
  earners wiped (earning at the last check, zero carriers now), keys acted for, new keys acted for this row (`snew`).
- **Identity when off** (`lab/scatterer/ident.sh /home/box/wt/archivist/lab`): rows and saves byte-identical to cos/archivist b8712ad's
  core on plain, CHEM, CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS, TASKS, CHEM_BIG+FLUXALL (seed 7, 6,000 ticks). PASSED.
- **Resume exact** (`lab/scatterer/resume.sh`, 40,000 straight vs 23,000 + save + load + 17,000, seed 7890): EXACT in modes 1-4. PASSED.
- **WATCH changes nothing** (`lab/scatterer/watch.sh`): SCATTER 4 rows minus `scat` byte-identical to the plain world, 40k. PASSED.
  So P0 below is the plain world with the census attached.

## Measures (`lab/scatterer/score.js`)

All arms CHEM=1, CHEM_BIG=1, FLUXALL=1, rows every 1,000 ticks, 30-row windows.
- **S (primary):** `lab/used-novelty.js` S late (#291), unchanged: used = mean share of metabolic income >= 1%; carriers never read;
  new = first use; sticky = still used 2 windows later; S = mean sticky-new per window, late third.
- **Sf (must agree):** S with an absolute floor of 5 energy per 1,000 ticks.
- **Sn (must agree):** X's S with every key X ever acted for removed from its income lists. X gets no credit for the tricks it moved,
  only for novelty the world finds itself, downstream. Nulls keep everything (asymmetric on purpose; it can only make X's job harder).
- **Collapse:** mean living, last quarter, under 200.
- **Reported, not ruling:** checks acted on, keys acted for, swaps, earners wiped; usedEver; metabolic income.

## Deciding round (unseen seeds 7811, 7812, 7813) — no trial; S_EVERY 1,000, S_F 3, S_RAD 8 fixed here

1,200,000 ticks, fresh runs. Six arms per seed: **X**, **P0** (WATCH), **P1, P2** (NULLSHIFT 1, 2), **BS**, **BW** — 18 runs,
from a frozen worktree at this commit: `lab/scatterer/chain.sh OUT` (deciding -> score.js).
- A seed is READABLE unless a null arm collapsed. An X collapse is a loss on that seed.
- **GO (candidate):** on at least 2 readable seeds X beats EVERY null (P0, P1, P2, BS, BW) outright on S, Sf AND Sn, and the mean
  (S+1) and (Sn+1) ratios against every null are at least 1.10. Ties are not wins. A candidate only; nothing leaves this branch
  without the user.
- **NO-GO, SPREAD KILLED:** X does not beat all of P0, P1, P2 on S on 2 readable seeds. Read: keeping carriers of earning tricks
  apart does not make lasting novelty; wipeout is not geographic, and migration / island / dispersal ideas are dead for this metric
  in this core.
- **NO-GO, LIFE SUPPORT ONLY:** X beats the plain band on S but not on Sn on 2 readable seeds. Read: spreading keeps tricks alive,
  but kept tricks do not seed new ones.
- **NO-GO, TARGETING NOT SHOWN:** X beats the plain band on S and Sn but not both BS and BW on 2 readable seeds. Read: mixing helps,
  moving the carriers specifically does not.
- **NO-GO, NOT SHOWN:** X beats plain and blind on S and Sn on 2 seeds but fails Sf or a 1.10 ratio.
- **INCONCLUSIVE:** fewer than 2 readable seeds.
- **On any NO-GO, SCATTER is deleted from the core on this branch** (retire or prove). The census findings, ident.sh, the scorer and
  the results stay.

**Written before, so it can be wrong:** I expect NO-GO, most likely SPREAD KILLED. Two reasons stated now: (1) in the Archivist's
round every arm scored S 0-0.08 at 1.2M, so the metric sits near its floor and X must beat five nulls outright — ties at zero lose;
(2) the scratch look shows the rule acts on only ~1-2 earners per check with ~3 swaps per 1,000 ticks, a light touch. I am not
raising the dose after seeing that: the parameters above were fixed before any deciding data, and a stronger dose would be a new round.
