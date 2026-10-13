# THE DREAMER — an agent that finds tricks by imagining them first. Pre-registered (cos/dreamer, written and committed before any deciding run).

Branch `cos/dreamer`, off `cos/locksmith` at f7750d4 (REACH deleted). Never main, no PR. Owner: the user's CoS agent, on its own
direction (the user, 11 Oct: "you do whatever you want ... take entirely your own direction").

## Why this bet

The GARDENER (taxing the winner) and the LOCKSMITH (opening exits from locked molecules) both changed the WORLD and both failed:
S did not move beyond the plain band. Both write-ups said the limit is upstream: discovery (mutational supply) or retention. This
round splits those two. It changes neither the world nor selection; it changes how new tricks get FOUND. An outside agent drafts
variants of a real organism, tries them in a private copy of the world, and releases the one that earned from chemistry nobody
uses. The world then decides, unaided, whether the trick stays. If the world keeps what it is handed, discovery was the limit; if
handed tricks fade like home-grown ones, retention is, and every "find better tricks" idea (minds, directed mutation) is dead here.

Why a dream and not another learned mind: the three wild-mind rounds learned statistics of parents and failed against a sham.
This uses no model at all: the simulator itself is the model (counterfactual rollouts), so the screening is exact for D_T ticks.

Scratch look before writing (seed 7490, 40,000 ticks, never a deciding seed; mechanism and timing only): the dreamer released 4
enzyme drafts, 3 earned >= 1% of income at 40k, metabolic income 6,874 against 2,474 plain. Blind (any draft) released 1 enzyme
draft of 4. Seen early; says nothing about S at 1.2M.

## The mechanism (`lab/oee-core.js`, option `DREAM`, needs CHEM_BIG; not in DEF, default off)

Every `D_EVERY` (10,000) ticks, at the end of the step:
1. **Pick** one living organism uniformly (own stream). **Founders**: it plus living clone-mates (same functional genotype) within
   2 cells, at most `D_F` (8) in all.
2. **Draft** `D_K` (8) variants of its program. Up to 4 ENZYME drafts: the unused reactions (key q*4+j, not >= 1% of metabolic
   income in the current period, runnable: 0 < drop <= CHEM_DMAX) on species present in the founders' cells and their neighbours,
   ranked by local amount x drop; each inserts [METABj, q low byte][NOP, q high byte] at a drawn position. The rest are ordinary
   mutants (the world's own mutateInto on the dreamer's stream, redrawn until the functional genotype changes).
3. **Choose and release** one draft, written into every founder (energy, place, tag, template kept; pc reset). No energy added.
   - **DREAM=1, DREAMER (X):** each draft is run in a private copy (save/load; every copy on the same random stream) for `D_T`
     (1,000) ticks, founders' lineage labelled through births, moves and deaths. Score: the lineage's income from reactions NOT in
     use when the dream began. Highest wins; ties by the lineage's living count at the end, then draft order.
   - **DREAM=2, BLIND (B):** the same drafts, one released uniformly at random. No dream.
   - **DREAM=3, BLIND-ENZYME (BE):** the same drafts, one of the ENZYME drafts released uniformly (any draft if none). No dream.
     This is the hard control: it asks whether imagination adds anything beyond "write an enzyme for local chemistry".
   All three modes draw the same pick variable, so their streams stay aligned. Dreams run on copies and never touch the world.
- Own stream `mulberry32(seed0 ^ 0xd2ea4d01)`; state saves and restores (`lab/dreamer/resume.sh`: 24,000 straight vs 13,000 +
  save + load + 11,000, EXACT in all three modes, passed before this commit).
- Row readout `dream`: mode, events, releases, enzyme releases, the last release [tick, founders, enzyme key or -1, dreamed novel
  income, drafts with novel income > 0, enzyme drafts], and how many released enzyme keys earn >= 1% in the row.
- **Identity when off:** `lab/dreamer/ident.sh /home/box/wt/locksmith/lab` — rows AND saves byte-identical to cos/locksmith
  f7750d4's core on plain, CHEM, CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS, TASKS, CHEM_BIG+FLUXALL (seed 7, 6,000 ticks). Passed.

## Measures (`lab/dreamer/score.js`) — the fixed metric, unchanged from the GARDENER and LOCKSMITH

All arms CHEM=1, CHEM_BIG=1, FLUXALL=1, rows every 1,000 ticks, 30,000-tick windows.
- **S (primary):** `lab/used-novelty.js` S late (#291): used = mean share of net metabolic income >= 1%; carriers never read;
  new = used for the first time; sticky = still used 2 windows later; S = mean sticky-new per window over the late third.
- **Sf (must agree):** S with an absolute floor of 5 energy per 1,000 ticks. **Collapse:** mean living, last quarter, under 200.
- **Reported, not ruling:** Snat = S with every released enzyme key removed (does the world's OWN discovery move, e.g. downstream
  of handed tricks?); releases; released keys earning late; reactions ever active; commonest share; metabolic income.

Said now, because it matters: S credits a key the dreamer inserted exactly as one the world found. That is the point (the question
is whether handed tricks STICK), and B and BE get the same crediting, so X must beat injection itself, not just plain worlds.

## Deciding round (unseen seeds 7411, 7412, 7413) — no trial; D_EVERY 10,000, D_K 8, D_T 1,000, D_F 8 fixed here

1,200,000 ticks, fresh runs. Six arms per seed: **X**, **P0, P1, P2** (NULLSHIFT 0, 1, 2), **B**, **BE** — 18 runs, from a frozen
worktree at this commit: `lab/dreamer/chain.sh OUT` (deciding -> score.js).
- A seed is READABLE unless a null arm collapsed. An X collapse is a loss on that seed.
- **GO (candidate):** on at least 2 readable seeds X beats EVERY null (P0, P1, P2, B, BE) outright on S AND Sf, and the mean (S+1)
  ratio against every null is at least 1.10 on both. Ties are not wins. A candidate only; nothing leaves this branch without the user.
- **NO-GO, DISCOVERY KILLED:** X does not beat all of P0, P1, P2 on S on 2 readable seeds. Read: even tricks screened to earn from
  unused chemistry, handed in every 10,000 ticks, do not raise lasting novelty — the limit is retention (or the metric's horizon),
  not discovery; minds and directed mutation are dead for this metric in this core.
- **NO-GO, IMAGINATION NOT SHOWN:** X beats the plain band on 2 seeds but not both B and BE. Read: supply may matter, dreaming does
  not; if BE also beats the plain band on 2 seeds (reported), "handing in enzymes helps" is a lead for its own round, not a result.
- **NO-GO, NOT SHOWN:** X beats plain and blind on S on 2 seeds but fails Sf or the 1.10 ratio.
- **INCONCLUSIVE:** fewer than 2 readable seeds.
- **On any NO-GO, DREAM is deleted from the core on this branch** (retire or prove). ident.sh, the scorer and the results stay.

**Written before, so it can be wrong:** I expect X to beat the plain band easily (handed enzymes earned within 10k ticks on 7490)
and the real risk is BE: blind enzyme drafts already earn (the scratch BE-like picks earned too). If BE ties X, that is
IMAGINATION NOT SHOWN, and I will report it as such — with "discovery is the limit" as a lead, not a win.

## Deciding round (seeds 7411–7413, 1,200,000 ticks, D_EVERY 10,000) — finished 11 Oct ~20:50 BST

Full printout `lab/dreamer/SCORE.txt` (score.js, unchanged). Readable 3 (no null collapse).

| seed | X S | P0 | P1 | P2 | B | BE | note |
|---|---|---|---|---|---|---|---|
| 7411 | 0.00 | 0.00 | 0.08 | 0.08 | 0.00 | 0.58 | loses/ties every null |
| 7412 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | loses/ties every null |
| 7413 | 0.00 | 0.00 | 0.08 | 0.00 | 0.25 | 0.00 | loses/ties every null |

Sf matches S on every seed. Means: X 0.000, P0 0.000, P1 0.056, P2 0.028, B 0.083, BE 0.194.
X beats the plain band on 0 seeds; beat every null on 0. Blind beats plain on 1 seed each for B and BE.
BE mean S 0.194 beat X and the plain band on means (reported, not a GO for enzyme-handing alone — the pre-reg said that would be a lead for its own round).

**VERDICT: NO-GO, DISCOVERY KILLED.** X does not beat the plain band (P0, P1, P2) on S on 2 readable seeds.
Per the pre-reg: DREAM is deleted from `lab/oee-core.js` on this branch. FLUXALL, NULLSHIFT, the CHEM_BIG
load-salt fix, the scorer, the chain and these results stay. Read: even tricks screened to earn from unused
chemistry and handed in every 10k ticks do not raise lasting novelty — the limit is retention (or the metric's
horizon), not discovery; minds and directed mutation are dead for this metric in this core. Core matches
cos/locksmith f7750d4 when off.
