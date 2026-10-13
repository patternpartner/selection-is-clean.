# RESULT: niche construction that can expand the possibility space (NICHE). NOT SHOWN, and the structures went unused.

The pre-registration is `lab/PREREG-niche.md`, commit `fb2a352`, pushed before any run on seeds 7–9.
- **Runs:** 1 Oct 2026, 22:45 BST to 2 Oct, 01:05 BST. All 12 runs reached 1,200,000 ticks and exited 0.
- **One interruption:** the box was suspended for about 20 minutes during the N3 runs. The runs paused and resumed; they were
  not restarted.
- **Rule:** applied as written.
- **Data:** raw samples are in `lab/niche/raw/*.jsonl.gz`. The readout is `node lab/niche/analyse.js`, saved as
  `lab/niche/analysis.txt`, and it reproduces from the compressed files.

## What was asked
Every world in this lab plateaus, and the working idea is that the menu of possible ways to live is fixed. So organisms were
given a way to build lasting structures that outlive them. In arm N2, each structure is a new compound, named by what it was
built from. It catalyses a reaction of its own that is not in the base network, and it can be built on further, without limit.
Does that keep novelty coming?

The comparisons:
- **N0:** no structures.
- **N1:** inert structures that only speed up existing reactions.
- **N3:** N2's compounds, but founded at random places at N2's rate, not by the organisms.

## Verdict: NOT SHOWN, on all three seeds
The primary measure is L: new active reactions per 30,000-tick window over the second half of the run (600k–1.2M). A reaction
is active when it takes at least 1% of income, and new when that has never happened before in the run.

| seed | N0 off | N1 non-expanding | **N2 expanding** | N3 random founding | rule (N2 > 0, > N1, > N3) |
|---|---|---|---|---|---|
| 7 | 0.05 | 0.30 | **0.05** | 0.00 | fails (N1 higher) |
| 8 | 0.05 | 0.05 | **0.00** | 0.00 | fails (N2 is 0) |
| 9 | 0.15 | 0.30 | **0.05** | 0.05 | fails (N1 higher; N3 equal) |

## Did novelty keep growing? No. Every arm plateaued, as before.
- All twelve worlds add most of their new reactions in the first 300,000 ticks, then about one per 20 windows or none.
- The late-half trend is flat in every arm: OLS slopes from −0.018 to +0.030 new reactions per window per window.
- Reactions ever active by 1.2M: N0 10–16, N1 14–40, N2 11–23, N3 9–18.

## Were the structures used? Hardly, and the new reactions they offered never paid.
- **Organisms did build.** N2 registered 1,970 to 16,607 distinct compounds, nested up to 9–13 deep, covering 260–894 cells.
  The possibility space really did grow.
- **Almost none of it earned anything.** Structures (building plus catalysis) took 0.14–0.44% of late income. In the whole
  late half, not one compound reached 1% of income, on any seed. The best single compound in any sample took 1.8–4.2% (seed 7's
  came at tick 8,000). Every late new active reaction in N2 and N3 was an ordinary base-network METAB reaction. By the
  pre-registered terms, the expansion is junk: built, not used.
- **The BUILD and CATAL instructions** are carried by 8–17% of organisms, about what a do-nothing marker reaches by drift.

## Surprises
- **The inert structures (N1) did best on two seeds:** 0.30 against 0.05 on seeds 7 and 9. That novelty is all base METAB
  reactions, so it is most likely the speed-up structures give metabolism in their cell. It may also be noise: there is one run
  per arm per seed.
- **Random founding (N3) made more distinct compounds than organisms did** on seeds 8 and 9 (8,734 against 1,970, and 6,292
  against 2,503). It was no more used.

## Why it failed, read from the design (a diagnosis, not a test)
A structure is worth about one METAB step to whoever sits in its single cell:
- it catalyses one substrate, and only where it stands;
- extending it replaces its reaction instead of adding one;
- a useful compound cannot be copied, only re-founded from the same pair of molecules somewhere else.

So a new possibility is local, one-off and not inheritable, and it competes with base metabolism that works everywhere. This
matches #289: what limits these worlds is the number of PROFITABLE ways to live, set by energy income. A bigger menu of
possible reactions does not change that, as #288 found for a bigger network. Niche construction would need structures whose
value grows or spreads. Possibilities:
- structures that can be copied (heredity outside the genome);
- structures that reach a resource nothing else can, such as stored light, shelter from attack, or transport between cells;
- structures that serve many organisms at once.

That is a different experiment, not run here.

## Caveats
- One run per arm per seed. The 3-of-3 strict rule was the only guard against noise, as pre-registered.
- Catalysed reactions are among the 256 base species, so at most about 65,000 transformations exist. This ceiling was never
  approached: no compound reaction was used at all.
- The design was debugged on trial seeds 95–97. Its one trial-driven change was adding catalysis, because pure binding energy
  earned 0.0% of income. With catalysis it still earns almost nothing.
