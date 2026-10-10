# WILD-MIND-3: a mind rewarded for income-bearing novelty

Branch cos/wild-mind-3 (off cos/wild-mind-2 51a59e5, after the keeper was deleted). Pre-registered here and committed and pushed
BEFORE any deciding run. The deciding seeds (3541, 3542, 3543) have never been run in this repo or on this box (checked: no
file, no run dir, no commit mentions them). Practice seed: 3430 only.

## 1. Instrumentation: what "income" means here (commit 839238f)

INCOME=1 (#income, and turned on by MIND_MODE 6/7) books, per creature, the energy it takes FROM THE WORLD at the nine sites
where the world pays a creature: predation (the 0.7 take), detritus, resource (localRes x entropyK), field, niche harvest,
niche.pioneer, niche.allee, niche.predgain, and aim pay. Bond transfers are booked as source 9 and are NOT income (energy moving
between creatures). Excluded and verified by count (exactly 9 income sites remain wrapped): cluster reallocation, observe and
ghost boosts, the opnov bonus, NFD, GENO_NFD and the novelty pay - those are the lab paying for novelty or redistributing, not
the world paying for a trick. Gross intake, before any cost.

It also marks which instruction slots a creature's program EXECUTED (both own-program VM sites, VM_MAIN and VM_SOLO; the plasmid
and cluster sites run borrowed code and are not booked to the creature's own slots).

What can be claimed: income is attributable to a creature and a tick; execution to a creature and an instruction slot. No VM
instruction pays energy itself; income arrives at world sites. So "this instruction earned X" is NOT measurable. What is
measurable, and what this round uses, is income per PROGRAM (the operation sequence the creature runs): engine.flux, each
program's share of all creatures' gross intake per sample - the engine analogue of the lab's chem.flux / tasks.flux. The
per-operation split (engine.opflux: a creature's intake split equally over the distinct operations it executed) is
association, not cause, and is not used to decide anything.

On a 4k smoke (seed 3430) income was dominated by aim pay (about 337k of 420k), then niche.pioneer, predation, niche, allee.

Identity: INCOME unset is byte-identical to main (86ef899, seed 1, 600 ticks). INCOME=1 does not move the world (identical
output at 600 and 4,000 ticks; LEARN+INCOME identical to LEARN). The earner commit re-checked: off identical to main; LEARN
and UNIFORM identical to cos/wild-mind-2 51a59e5; NOSEL_PROG unset identical.

## 2. The design (MIND_MODE=6 EARNER, 7 ESHAM)

The two NO-GOs taught: a mind that seeks surprise makes the world churn, not hold (WILD-MIND); a keeper rewarded for
reproduction learns weakly and its edits do not hold beyond the twin (WILD-MIND-2). Reproduction is not invention. So the
reward here is the thing the lab actually counts: a NEW program that EARNS. EARNER is an explorer and a judge. When the mind
writes a child (20% of parented births, the same rate and one edit as every mind, so supply matches UNIFORM), the explorer
drafts CAND=8 uniformly random single-instruction edits; the judge, a logistic model over whole-program features (instruction,
adjacent pair, instruction by quarter, instruction by registers; 4096 hashed weights, CLR 0.02), installs the draft it scores
highest. Every parented birth (written or not) is a record. Label, LAG=1000 ticks after birth: y=1 when the child's program
(operation sequence) had never been carried in this world at its birth AND the child's gross intake per tick of life over
those first 1000 ticks (read from INCOME at each 125-tick census) was at least the population's running intake per
creature-tick. Prequential: each record is scored before the one gradient step on it. ESHAM: identical machinery, labels
drawn at the true running rate from its own stream - as many positives, no information. Pure novelty without income scores 0;
income without novelty scores 0. Nothing in the label reads offspring.

## 3. The no-selection twin (NOSEL_PROG=1)

The engine has no selection-off mode (BIRTH_LOTTERY/RATION are fair lotteries, not selection removal). TWIN = EARNER with
NOSEL_PROG=1: a parented child's program is copied (with the ordinary birth mutation) from a uniformly random living creature
instead of from its parent; all else inherits as before, and the mind then writes into that child exactly as in EARNER. So
which programs are copied no longer depends on who reproduces. Honest limit: viability selection is NOT removed (a program
that starves still dies sooner), so this is a program-FECUNDITY-blind twin, a partial twin. That makes it a harder twin to
beat only if fecundity selection is what carries the effect; it is the closest twin this engine can run.

## 4. Arms (all INCOME=1, MIND=20 where a mind runs, 20,000 ticks, 6 replicates by NULLSHIFT 0-5, MIND_SEED rep+1)

EARNER (6), TWIN (6 + NOSEL_PROG), ESHAM (7), UNIFORM (2), LEARN (0), OFF. Runner lab/wild/run3.sh; decider
lab/wild/decide3.sh; scorer lab/wild/score3.js - all committed here.

## 5. Primary measure

S = income-only sticky novelty (lab/used-novelty.js, #291) on engine.flux: WIN=10 samples (1,000 ticks), MIN=1% income share,
LAG=2 windows, S = mean st over the late third. Carrier share never read.

## 6. GO bar (LOCKED; may only be hardened after looking, never loosened)

Per deciding seed:
- LEARNING: every EARNER rep wrote and labelled edits; mean prequential log loss < its base-rate log loss AND < ESHAM's mean log
  loss; mean (score of positives - score of negatives) > 0 AND > ESHAM's.
- TWIN, OUTRIGHT: mean S(EARNER) > mean S(TWIN), and S(EARNER) > S(TWIN) on at least 4 of 6 paired replicates.
- CONTROLS: mean S(EARNER) above EVERY ESHAM and UNIFORM replicate, and above the LEARN and OFF means.
- GUARD: no loop errors; no extinction or collapse (alive < 5) in EARNER where OFF is clean.
Overall GO: learning on >= 2 of 3 seeds, guard clean, (mean S over seeds of EARNER + 1)/(TWIN + 1) >= 1.10, and LEARNING+TWIN+
CONTROLS all pass on >= 2 of 3 seeds. Anything else NO-GO.

NO-GO: delete MIND_MODE 6/7 and NOSEL_PROG from engine.html (keep INCOME only if a later round is pre-registered to use it,
otherwise delete it too) and record it here.

## 7. Trial gate

Practice seed 3430 only, EARNER and ESHAM, 2 replicates each. The deciding round launches only if the earner learns past the
sham there (log loss < base and < ESHAM; separation > 0 and > ESHAM's). Not a decision about the world - only whether the
judge learns at all.

## 8. Trial (practice seed 3430, frozen bc8d2bb, 20k ticks, 2 reps each) - gate PASSED

| run | log loss | base | pos-neg score | positive rate | novel-child rate | S |
|---|---|---|---|---|---|---|
| EARNER r0 | 0.4031 | 0.4472 | 0.137 | 0.166 | 0.321 | 2.333 |
| EARNER r1 | 0.3681 | 0.3963 | 0.126 | 0.137 | 0.297 | 3.000 |
| ESHAM r0 | 0.4604 | 0.4391 | 0.031 | 0.162 | 0.304 | 2.167 |
| ESHAM r1 | 0.4248 | 0.3904 | 0.028 | 0.136 | 0.305 | 2.667 |

The judge learns past the sham on both replicates (log loss under base and under ESHAM; separation 0.131 v 0.029). Note,
not a decision: the positive rate of EARNER's records (0.151) is not above ESHAM's (0.149) - learning has not yet shown up
as more income-bearing novel children; the deciding round says whether it shows in S. Deciding round launched 21:18 BST
from /home/box/wt/wild-mind-3-frozen (bc8d2bb), seeds 3541-3543, PAR=4, output /home/box/wild-runs/decide3, SCORE.txt + ALL-DONE.
