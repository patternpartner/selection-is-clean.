# DESIGN DRAFT: code-keyed parasitism in the lean core (not yet built, not pre-registered)

15 Oct 2026. A proposal for the next open-ended-evolution bench, written from #289 and the 14 Oct work (#302-#310). It is a draft for the user to accept, cut or redirect.

## Why a new bench, and why not `engine.html`
- `engine.html` (30k lines) is the artwork. In its default mode the VM programs do not set births or survival (#302-#303c), the REPL variant is bistable and needs about 100 runs per arm to see a 25% effect (#310), and every result there is hard to attribute. It stays as the artwork (see #311) and stops being asked to prove OEE.
- The lean core (`lab/oee-core.js`, 440 lines, about 4 generations a second) already exists and already found the bound (#289): **every new behaviour in those worlds was a new way to take energy; the income is fixed, so the number of profitable ways is fixed.** Enemies (viruses keyed to a reaction, #287, or a logic function, #290) reshuffle who uses which way. They do not create ways.

## The one idea
**Make the opportunity space the organisms' own code.** Every key so far came from a fixed menu (S x 4 reactions; 251 functions). Here a parasite's key is a window of the HOST'S PROGRAM, so every new piece of host code is a new thing to be exploited, and every parasite innovation is a new thing for hosts to evade. An innovation then creates opportunity for others (a new host k-mer is a new target) instead of only consuming it.

## The one mechanism (and what it replaces)
`INJECT` (one new instruction, one of the neutral marker slots): the executing organism copies a window of its own program (k = 6 instructions, from a position given by its tag) into a NEIGHBOUR. It succeeds only if the neighbour holds a **binding site**: a k-mer whose functional hash (`fnHash`, already in the core, so neutral markers and unread argument bits do not count) matches the injected window's **complement key** (hash mod 2^16 against a fixed pairing). On success the window overwrites the neighbour's code at the site, the injector pays a small cost, the neighbour pays nothing but is now partly the injector's program (Tierra-style code-level parasitism).
- Defence is only mutation: a host that changes its site's code escapes. Escape is a code change, which creates new k-mers.
- No new resource and no new pool. Energy rules, the cost per instruction (#283), balanced insertion and deletion, and one-organism-per-cell are unchanged.
- **It must replace something (CLAUDE.md: every session removes or proves one).** Candidate: delete `TASKS` (#290) and `CHEM_BIG` (#288) from the bench if their pre-registered verdicts in `OEE-NOTES.md` were not "sustained"; I have not re-read those verdicts for this draft, so this is the first thing to check before building. Net code change should be about zero.

## What would count as success, in one number
**Late adaptive-novelty rate**: the core's existing calibrated measure (a behaviour counts as adaptive only if it beats every neutral one, `core-activity` / `core-assay`), per 1,000 generations, in the last quarter of the run against the second quarter. Success: PARA holds at least half its Q2 rate in Q4 while CTRL (INJECT present but neutral, like an N marker) falls below half, on at least 2/3 of the seeds.

## Design (retire-or-prove shape, filled in before any run)
- **Arms per seed:** PARA (INJECT live), CTRL (INJECT is a neutral marker: same genome, same mutation, no effect), and a null band by draw-order replicates with NON-adjacent shifts (#309: adjacent NULLSHIFT values are sometimes the same world).
- **Seeds and horizon:** at least 10 seeds per arm (#310: 3 per seed cannot see anything under about 2x). A 20,000-generation run is about 80 minutes at 4 generations a second, over the 30-minute job limit, so the run is chained in saved segments; **resume must be checked on a CHEM-free seed other than 1 first** (#301: a resumed world was silently on seed 1's chemistry).
- **Executed first (template step 1):** a seed counts only if INJECT fired and succeeded at least N times by the horizon and left at least one host with a changed binding site.
- **Floor:** fewer than 3 counted seeds = INCONCLUSIVE. Same threshold both directions (template step 2).
- **Say the horizon out loud** (CLAUDE.md): every verdict is about a number of generations, never "never".

## The kill rule (this is what answers "flogging a dead horse")
If PARA does not hold its late rate better than CTRL on at least 2/3 of at least 10 counted seeds at 20,000 generations, that is evidence the bound is structural to every energy-limited world of this kind, not an artefact of the menu. Then **stop the OEE search in this family**, record it as the result, and make the artwork the main line. A bounded result is still a result; the project's own standard (#289) says the answer must not be a pass count.

## Risks, said plainly
- The key space is large but a host that simply carries no copy of a common site is immune, so parasites may starve (a flat, not an open, outcome). The prediction I would write down is that PARA is NOT better; I think it is about as likely to fail as to work, and the work is worth it because it is the first test in this project where innovation creates opportunity by construction.
- It may reproduce #287's cycle among a few profitable sites, only in code space. The counts of distinct live keys over time distinguish that from open growth, and should be reported beside the main number.
- Saved universes are not affected (new bench, `engine.html` untouched).

## Cost
Build: INJECT and the binding-site key in `oee-core.js` (about 60 lines), a CTRL switch, one runner script. Compute: 10 seeds x 2 arms x about 80 minutes, chained in 25-minute segments. Generation of nothing billable; local node only.

## Not decided here
Whether to delete `TASKS`/`CHEM_BIG` from the bench (check their verdicts first), the k (6), the pairing function, and the injected-window length. All three would be fixed in the pre-registration, committed before the first deciding run.
