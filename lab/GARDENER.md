# THE GARDENER — an oracle that taxes whatever is winning. Pre-registered (cos/gardener, written and committed before any trial or deciding run).

Branch `cos/gardener`, off `origin/main` at 615e05f. Never main, no PR. Owner: the user's CoS agent, on its own direction (the user, 11 Oct:
"you do whatever you want ... review the code and take entirely your own direction"). Not a wild-mind round: nothing here writes, edits
or picks any organism's program.

## Why this bet

#289's synthesis is the load-bearing explanation for every plateau in the lean core: *every new behaviour is a new way to take energy,
the energy income is fixed, so the number of profitable ways to make a living is fixed; enemies reshuffle who uses which way, they do not
create new ways.* It has never been tested directly. It was inferred from a virus that is a weak, slow, noisy targeter. And #288 is a
standing puzzle for it: in CHEM_BIG, thousands of usable reactions are reachable (2,400-4,600 species, 3,100-6,300 reactions) and the
worlds used under 1% of them, with one route holding 69-97% of metabolic income. That reads at least as much like INCUMBENCY (the first
good route takes the substrate and every newcomer starts on a starved molecule pool) as like an income ceiling.

So: put an AI outside the world with PERFECT information about the economy, and let it do the one thing every adversary idea in this
project (route-keyed viruses #287/#288, kill-the-winner #282, coevolving parasites #290, any learned adversary) is an imperfect
approximation of — make whatever is currently winning pay. The tax only changes RELATIVE profitability; it adds no energy. If even this
ceiling cannot make lasting income-bearing novelty beat the same tax dealt without information, the whole class "pressure on current
winners" is dead in fixed-income worlds and #289 stands, measured; the only remaining lever is opportunity creation (#289's three
directions). If it passes, incumbency, not income, was the limit, and a learned gardener (one that has to infer the economy from what it
can see) is the follow-up worth building.

## The mechanism (`lab/oee-core.js`, option `GARDEN`, needs CHEM; not in DEF, default off)

- Every `G_EVERY` (1,000) ticks the gardener reads each reaction's GROSS energy capture over the period just ended and its share s of the
  total. Each reaction's capture during the next period is taxed at rate tau; the organism keeps (1 - tau); the tax is heat (gone).
  Molecules convert exactly as before — only the energy kept changes.
- **GARDEN=1, targeted (X):** tau = min(G_CAP, G_K x s). G_CAP 0.9. A reaction that earned nothing last period is untaxed.
- **GARDEN=2, FLAT (F):** every reaction pays the same rate, the income-weighted rate rule 1 would charge in this world
  (sum of s x min(G_CAP, G_K x s)). Same take, no relative advantage for anything.
- **GARDEN=3, SHUFFLED (SH):** rule 1's rates, dealt at random (the gardener's own stream) among the reactions that earned last period.
  Same upheaval, no information about who is winning.
- The gardener draws only from its own stream; the world's stream is untouched. Its state is saved and restored (resume checked exact,
  all three modes, mid-period).
- Also added, both off by default: `FLUXALL` (readout only: `chem.flux` lists every reaction with at least 0.1% of income, not the top 24,
  so a world spread over many routes is not truncated) and `NULLSHIFT=k` (burn k draws of the world stream after boot: the same world on
  another draw order, for a null band).
- **Identity when off:** with none of these keys, output rows AND saves are byte-identical to origin/main's core on plain, CHEM,
  CHEM+VIRUS, CHEM_BIG, CHEM_BIG+VIRUS and TASKS (seed 7, 6,000 ticks).

**A pre-existing bug found and fixed on the way (shared core, load only):** `World.load` rebuilds the world with seed 1, and CHEM_BIG's
network is a hash salted by the seed, which the save did not carry. So every resumed CHEM_BIG world on any seed other than 1 continued on
SEED 1'S CHEMISTRY. #291's "CHEM_BIG resume re-checked exact" holds only for seed 1 (seed 7: the resumed rows differ from tick 3,500;
after the fix both seeds 1 and 7 resume byte-exact). Fresh runs are unaffected. Any chained CHEM_BIG run on seeds other than 1 that
resumed from a save should be re-read with this in mind. Nothing in this round resumes.

## Measures (`lab/garden/score.js`, committed with this file)

All arms: CHEM=1, CHEM_BIG=1, FLUXALL=1, rows every 1,000 ticks, 30,000-tick windows (WIN=30, as #287/#288).
- **S (primary):** `lab/used-novelty.js`'s S late, exactly #291's fixed metric: a reaction is used in a window when its mean share of
  (net) metabolic income is at least 1%; carriers never read; new = used for the first time; sticky = still used 2 windows later; S = mean
  sticky-new per window over the late third.
- **Sf (must agree):** the same, with an absolute floor: also at least 5 energy per 1,000 ticks of net income in that window. A heavy tax
  shrinks metabolic income, and 1% of a tiny total is noise; Sf stops a starved economy reading as inventive.
- **Collapse:** mean living over the last quarter of rows under 200.
- Reported, not ruling: last-quarter windows with a new active reaction (#288's rule 1), reactions ever active, the commonest reaction's
  share late, metabolic income late, S middle against S late (fading), the gardener's take.

## Trial (design seeds 91 and 92 — never used before; they design, they do not decide)

300,000 ticks. Arms: X at G_K 0.5, 1 and 2; P0 (no gardener); F and SH at G_K 1.
- **G_K is fixed by this rule:** the X variant with the highest mean S over the two seeds, among variants that did not collapse on either
  seed (ties: the smaller G_K). F and SH use that G_K in the deciding round.
- **The deciding round is launched only if** the chosen X beats P0, or beats both F and SH, on S on at least one trial seed. Otherwise
  the round stops at trial and is written up as STOPPED AT TRIAL: a weak reading, not the class verdict below.

## Deciding round (unseen seeds 911, 912, 913)

1,200,000 ticks, fresh runs, no resume. Six arms per seed: **X** (GARDEN 1), **P0, P1, P2** (no gardener; NULLSHIFT 0, 1, 2: the plain
null band), **F**, **SH** — 18 runs.
- A seed is READABLE unless a null arm collapsed. An X collapse is a loss on that seed.
- **GO (candidate):** on at least 2 readable seeds X beats EVERY null (P0, P1, P2, F, SH) outright, on S AND on Sf, and in the mean over
  readable seeds (S+1) by at least 1.10 against every null on both. A GO is a candidate only; nothing leaves this branch without the user.
- **NO-GO, TARGETING KILLED:** X does not beat BOTH F and SH on S on at least 2 readable seeds. Read as: with perfect information,
  making the winner pay adds no lasting income-bearing novelty beyond the same pressure dealt blind. Class verdict, scoped to the lean
  core's chemistry at 1.2M ticks: designs whose mechanism is pressure on current winners are not pursued further here unless they also
  add new opportunity; #289 stands, now measured.
- **NO-GO, NOT SHOWN:** X beats F and SH on S on 2 readable seeds but fails the full GO bar (targeting matters, but the tax as a whole
  does not beat the plain worlds, or Sf disagrees).
- **INCONCLUSIVE:** fewer than 2 readable seeds.
- **On any NO-GO, GARDEN is deleted from the core on this branch** (CLAUDE.md: retire or prove). FLUXALL, NULLSHIFT and the load fix stay.

**Written before, so it can be wrong:** I expect NOT SHOWN or GO — that a tax on the incumbent opens the unused CHEM_BIG routes (X beats
F and SH), but a 90% tax on the main route costs enough metabolic income that whether X beats the plain band is a coin flip.

## Trial result (seeds 91, 92, 300,000 ticks) — G_K = 2 chosen; deciding round launched by its rule

| arm | 91: S / Sf / reactions ever active / commonest share late / metabolic income late | 92: same |
|---|---|---|
| X, G_K 0.5 | 0 / 0 / 8 / 0.61 / 2,760 | 0 / 0 / 8 / 0.39 / 3,233 |
| X, G_K 1 | 0 / 0 / 10 / 0.37 / 2,872 | 0 / 0 / 4 / — / **0 (metabolism abandoned)** |
| X, G_K 2 | **0.5 / 0.5** / 10 / 0.44 / 1,681 | 0 / 0 / 4 / — / **0** |
| P0 | 0 / 0 / 3 / 0.98 / 3,372 | 0 / 0 / 4 / 0.96 / 2,958 |
| F (G_K 1) | 0 / 0 / 6 / — / **0** | 0 / 0 / 3 / — / **0** |
| SH (G_K 1) | 0 / 0 / 3 / — / **0** | 0.5 / 0.5 / 9 / 0.37 / 3,087 |

- **The rule picks G_K 2** (mean S 0.25 against 0 for 0.5 and 1; nothing collapsed — living 820-1,213 everywhere). F and SH run at G_K 2 in
  the deciding round, as registered.
- **Launch condition met, thinly:** X(2) beats P0, F and SH on seed 91 (0.5 against 0). One sticky new reaction in the late third of a
  300k run is close to the floor of what S can show; the trial horizon (10 windows) is too short for S to separate arms. Said now, before
  the deciding data: this launch is a rule being followed, not a signal being chased.
- **What the trial does show (not ruling):** the targeted tax spreads metabolic income (commonest route 0.37-0.61 against 0.96-0.98
  plain; 8-10 reactions ever active against 3-4) — and taxes of any kind often make metabolism not worth having: 5 of 10 taxed worlds
  had abandoned it by 300k (income 0, organisms living on light alone). Abandonment is not a collapse by the registered rule (living stays
  above 200); an arm that abandons metabolism simply scores no new reactions.

## Deciding round — running (launched 11 Oct 13:20 BST from the frozen worktree at 98de2bf, `/home/box/wt/gardener-frozen`)

Jobs `/home/box/garden-runs/decide.jobs` (18 runs, 7 at a time, `.done` marker per run, `ALL.done` at the end); output
`/home/box/garden-runs/decide/<ARM>.<SEED>.jsonl`. Score when `ALL.done` exists, unchanged rule:
`node lab/garden/score.js /home/box/garden-runs/decide` (default SEEDS 911,912,913, ARMS X,P0,P1,P2,F,SH).
Seed 911 finished first and I scored it once, with the committed scorer and nothing changed after: X S 0.08 against 0.00 for all five nulls
(Sf the same); X held 19 reactions ever active against 7-22, commonest route 0.19 against 0.37-0.73, metabolic income 4,565 against 6,887-10,201
plain and 2,732-2,962 for F/SH. Thin (one sticky new reaction in the late third), and the mean-ratio clause needs 1.10 where 911 alone gives 1.08.
One seed decides nothing; the verdict waits for 912 and 913.
