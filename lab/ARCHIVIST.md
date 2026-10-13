# THE ARCHIVIST — an outside memory that hands lost tricks back. Pre-registered (cos/archivist, written and committed before any deciding run).

Branch `cos/archivist`, off `cos/dreamer` at 4eb9b84 (DREAM deleted). Never main, no PR. Owner: the user's CoS agent, on its own
direction (the user, 11 Oct: "you do whatever you want ... take entirely your own direction").

## Why this bet

Three world-side rounds are dead: the GARDENER (tax the winner), the LOCKSMITH (open locked exits) and the DREAMER (hand in
tricks screened to earn). The Dreamer's write-up said the limit is RETENTION: handed tricks earned, then went. This round asks
why useful tricks die after they earn, and whether that death is reversible.

Autopsy of the Dreamer's own rows (decide 7411-7413, all 18 runs, 1k-tick rows, read before writing this): an earning episode
(a reaction >= 1% of metabolic income) lasts a median 2,000-7,000 ticks; a reaction that ever earned has ~3 separate episodes;
tricks the Dreamer screened to earn fast died FASTER than blind ones (median episode after release 5-10k X, 4-150k BE).

Scratch look before writing (seed 7690, 200,000 ticks, never a deciding seed; mechanism and timing only), with the coroner below:
at a trick's death the enzyme is gone from EVERY living program in 72-94% of deaths (all four modes), and in the plain world the
substrate is at a median 0.36 of its level at the trick's best period (19% fully back). So the usual death is GENE LOSS, not an
empty larder. Handed back (X), 3 of 18 writes re-earned within 5k. S on that one seed: X 0.17, plain 0.00, BT 0.33, BG 0.50
(WIN 10, says nothing at 1.2M; the blind arms leading is the risk I name below).

The AI-native bet: an agent outside the world is a perfect memory. If tricks die by unlucky loss of their carriers while their
food is still there, a memory that hands each lost trick back when its food has regrown should let them stick, and a world whose
tricks stick should build on them (products of kept reactions are substrates for new ones). If handed-back tricks die again,
death is structural and every "keep the good stuff" idea (archives, elitism, seed banks, protection) is dead here.

## The mechanism (`lab/oee-core.js`, option `ARCHIVE`, needs CHEM_BIG; not in DEF, default off)

Every `A_EVERY` (1,000) ticks, at the end of the step (before the sample), on this period's reaction income (rxE):
1. **Archive.** For every reaction (key q*4+j) earning >= 1% of metabolic income this period: if it has no entry or this period's
   share is its best, store the program of the living organism that earned most from it this period (per-cell income through a
   hook in METAB), the share, the world total of the substrate q, and the number of living carriers (a METABj/lo, next arg hi pair).
2. **Death.** An archived key under 1% for `A_DEAD` (5) checks running is dead. The coroner logs [tick, key, substrate now /
   substrate at archive, carriers now / carriers at archive, last tick on].
3. **Hand back,** at most `A_MAX` (3) times a key, into up to `A_F` (8) living organisms within `A_RAD` (2) cells of a centre,
   nearest first (energy, place, tag, template kept; pc reset; no energy added). After a write the key may die again.
   - **ARCHIVE=1, ARCHIVIST (X):** waits (from the check after death) until the substrate's world total is back to its archived
     level; centre = the cell with the most substrate q; writes the archived program of THAT key.
   - **ARCHIVE=2, BLIND-TIME (BT):** writes the same program at the death check, centred on a uniformly drawn living organism.
   - **ARCHIVE=3, WRONG-GENOME (BG):** the archivist's trigger and centre, but the archived program of ANOTHER key (uniform).
   - **ARCHIVE=4, WATCH:** archive and coroner only, never writes.
- Own stream `mulberry32(seed0 ^ 0xa4c41fe5)` (used by BT and BG only); state saves and restores. Row readout `arch`: archived,
  dead / alive / handed-back counts, writes, new written keys (`wnew`), deaths and writes this row.
- **Identity when off** (`lab/archivist/ident.sh /home/box/wt/dreamer/lab`): rows and saves byte-identical to cos/dreamer 4eb9b84's
  core on plain, CHEM, CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS, TASKS, CHEM_BIG+FLUXALL (seed 7, 6,000 ticks). PASSED.
- **Resume exact** (`lab/archivist/resume.sh`, 40,000 straight vs 23,000 + save + load + 17,000, seed 7690): EXACT in modes 1-4. PASSED.
- **WATCH changes nothing** (`lab/archivist/watch.sh`): ARCHIVE 4 rows minus `arch` byte-identical to the plain world, 40k. PASSED.
  So P0 below is the plain world with the coroner attached.

## Measures (`lab/archivist/score.js`)

All arms CHEM=1, CHEM_BIG=1, FLUXALL=1, rows every 1,000 ticks, 30-row windows.
- **S (primary):** `lab/used-novelty.js` S late (#291), unchanged: used = mean share of metabolic income >= 1%; carriers never read;
  new = first use; sticky = still used 2 windows later; S = mean sticky-new per window, late third.
- **Sf (must agree):** S with an absolute floor of 5 energy per 1,000 ticks (as the Dreamer).
- **Sn (must agree, new):** S with every key the arm ever wrote (every METAB pair in every program it wrote) removed from the income
  lists. The archivist gets no credit for what it hands back: Sn counts only novelty the world finds itself, downstream.
  Asymmetric on purpose (plain arms lose nothing), so it can only make X's job harder.
- **Collapse:** mean living, last quarter, under 200.
- **Reported, not ruling:** coroner per arm (deaths, median substrate ratio at death, share of deaths with the substrate back, share
  with zero carriers, writes, writes re-earning within 5k, writes on again 20-30k later); usedEver; metabolic income.

## Deciding round (unseen seeds 7611, 7612, 7613) — no trial; A_EVERY 1,000, A_DEAD 5, A_MAX 3, A_F 8, A_RAD 2 fixed here

1,200,000 ticks, fresh runs. Six arms per seed: **X**, **P0** (WATCH), **P1, P2** (NULLSHIFT 1, 2), **BT**, **BG** — 18 runs,
from a frozen worktree at this commit: `lab/archivist/chain.sh OUT` (deciding -> score.js).
- A seed is READABLE unless a null arm collapsed. An X collapse is a loss on that seed.
- **GO (candidate):** on at least 2 readable seeds X beats EVERY null (P0, P1, P2, BT, BG) outright on S, Sf AND Sn, and the mean
  (S+1) and (Sn+1) ratios against every null are at least 1.10. Ties are not wins. A candidate only; nothing leaves this branch
  without the user.
- **NO-GO, RETENTION KILLED:** X does not beat all of P0, P1, P2 on S on 2 readable seeds. Read: handing lost earners back when
  their food has regrown does not make lasting novelty; the loss is not reversible by memory, and archives / elitism / seed banks /
  protection are dead for this metric in this core.
- **NO-GO, LIFE SUPPORT ONLY:** X beats the plain band on S but not on Sn on 2 readable seeds. Read: the archivist can keep tricks
  alive, but kept tricks do not seed new ones; retention is not what stops building.
- **NO-GO, MEMORY NOT SHOWN:** X beats the plain band on S and Sn but not both BT and BG on 2 readable seeds. Read: writing programs
  in helps (disturbance or supply), the timing/identity of a remembered trick does not.
- **NO-GO, NOT SHOWN:** X beats plain and blind on S and Sn on 2 seeds but fails Sf or a 1.10 ratio.
- **INCONCLUSIVE:** fewer than 2 readable seeds.
- **On any NO-GO, ARCHIVE is deleted from the core on this branch** (retire or prove), including the METAB hook. The coroner's
  findings, ident.sh, the scorer and the results stay.

**Written before, so it can be wrong:** I expect NO-GO. The scratch look says handed-back tricks rarely re-take (3 of 18), and
the blind arms led on S there, so MEMORY NOT SHOWN is the likeliest ending if X beats plain at all. Whatever the verdict, the
coroner answers the user's question directly: do useful tricks die by losing carriers or by emptying their food.

## Deciding round (seeds 7611–7613, 1,200,000 ticks) — finished 12 Oct ~00:17 BST

Full printout `lab/archivist/SCORE.txt` (score.js, unchanged). Readable 3 (no null collapse).

| seed | X S | P0 | P1 | P2 | BT | BG | note |
|---|---|---|---|---|---|---|---|
| 7611 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.08 | loses/ties to P0,P1,P2,BT,BG |
| 7612 | 0.08 | 0.00 | 0.00 | 0.08 | 0.00 | 0.00 | loses/ties to P2 |
| 7613 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | loses/ties to P0,P1,P2,BT,BG |

Sf matches S on every seed. Means: X 0.028, P0 0, P1 0, P2 0.028, BT 0, BG 0.028.
X beats the plain band on 0 seeds; beats both blind archivists on 1; rel 1.

Coroner (plain words): at death, carriersGone medians/shares are high (~0.53–0.93 across arms; often ~0.7–0.9),
substrate often partly/mostly back (subRecovered ~0.16–0.79; subRatioMed varies 0.25–1.8). So deaths are mostly
gene/carrier loss, not empty food — yet handing programs back when food recovered still did not raise lasting novelty.

**VERDICT: NO-GO, RETENTION KILLED.** X does not beat P0,P1,P2 on S on 2 readable seeds.
Per the pre-reg: ARCHIVE is deleted from `lab/oee-core.js` on this branch. FLUXALL, NULLSHIFT, the CHEM_BIG
load-salt fix, the scorer, the chain and these results stay. Core matches cos/dreamer 4eb9b84 when off.
