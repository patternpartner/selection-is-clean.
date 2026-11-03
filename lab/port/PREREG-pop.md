# PRE-REGISTRATION #368 — does the population crossing a reload keep a TASKS world on its own trajectory?

Written and committed before any decision run. Seeds 10101, 10102, 10103 have never been run by anyone.

## What changed
A browser save held the germline genome and nothing else (#352a), so a reload spawned every creature from one program. #368
saves the living population beside each autosaved genome (`encodePopulation`), fingerprinted to that genome, and boot restores
it (`popRestore`). Off the browser nothing is encoded; node runs are byte-identical (seed 3, 1,500 ticks, TASKS on and off).

## Why (design seeds 10001-10003, exploratory; they design this rule and do not decide it)
10001, reloaded from its germline at tick 4,000: mean formula size 6 to 3.4, and 187 functions new to its history in the next
4,000 ticks against 1,410 for the same world run on. It sat at about 250 alive and never took off again in that window.

## Arms (per seed)
- **NULL x3** — the world run to 8,000 ticks in one process, its random stream reseeded after tick 4,000 (`RESEED_AT=4000
  RESEED=k`, k = 1, 2, 3). Same state, other draws: a perfect reload. NULL k=1 writes the save at tick 4,000 (genome, population,
  the set of functions ever paid).
- **GERM x3** — a fresh engine booted from that genome alone, 4,000 ticks (today's reload). Reload seeds s+501, s+502, s+503.
- **POP x3** — the same, with the population snapshot handed to boot. Same reload seeds as GERM.
- `TASKS=1`, every other knob at its default. Probe: `lab/port/probe-reload.js`, one row per 500 ticks. Batch:
  `lab/port/pop-batch.sh`. Out: `lab/port/out-pop/`. Analysis: `lab/port/analyse-pop.js`, written before the runs finish.

## Executed first
A seed COUNTS if (a) its world had taken off by the save, at least 500 functions ever paid by tick 4,000, and (b) every POP
replicate restored a population (`popBoot.restored > 0`). Report the number of counted seeds before any other number.
Fewer than 3 counted seeds: INCONCLUSIVE, and the default does not change. Extend with unseen seeds 10104 onward.

## Measures (after the save / reload, in ticks since it)
- **F, fidelity.** For each replicate, three window means over its first 1,000 ticks (windows 500 and 1,000): income-weighted
  mean formula size, functions paid per window, exp(H) of the window's income. Its distance from the NULL band is
  d = sum over the three of |ln(x / m)|, with m the mean of the three NULL replicates' values.
- **V, novelty.** Functions paid that the universe had never been paid for (its pre-save history included), summed over the
  4,000 ticks (`newToHistory`, all eight windows).
- **Guard.** Alive, mean of the last two windows. A replicate CRASHES if that is under 5 while its arm-mate under the other
  arm with the same reload seed is over 20.

## Rule, per counted seed
- **F holds** if every POP replicate's d is below every GERM replicate's d.
- **V is BETTER** if every POP replicate's V exceeds every GERM replicate's V; **WORSE** if every POP V is below every GERM V;
  otherwise neither.
- **Guard fails** on a seed if any POP replicate crashes.

## Verdict (two-thirds of counted seeds)
- **SHIP** — F holds on at least two-thirds of counted seeds, V is not WORSE on two-thirds, and the guard does not fail on
  two-thirds. The population persists across reloads in the browser.
- **DO NOT SHIP** — V is WORSE on at least two-thirds, or the guard fails on at least two-thirds. The engine code stays (it is
  inert without the hook) and the bridge line that sets `__popHook` is removed.
- **INCONCLUSIVE** — anything else, or fewer than 3 counted seeds. The default does not change: the hook stays unset.
- Claimed at its rung only: a POP reload is closer to the world that was saved than a GERM reload, and finds this many new
  functions. It is not a claim that selection acts differently.

## Prediction (mine, before any run)
SHIP, with F on 3 of 3 and V BETTER on 2 or 3 of 3. The risk I can see: a POP reload arrives with full pools (the reload
windfall) and the whole saved population at once, and could boom and crash where the NULL band does not.

## Not weighed by the rule
Saved worlds: a universe saved before #368 has no snapshot and boots exactly as before. A universe saved after it boots its own
creatures. Per CLAUDE.md rule 6, that is said here and does not block.
