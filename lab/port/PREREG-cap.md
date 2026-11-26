# #466 — one encounter a tick (`INTERACTION_CAP` 10 -> 1): the registered set (written before pair 1)

**Why (measured):** in a field, `processGrid` (the pair loop: entrainment, the pair VM, the cluster VM, neighbour models) is 49% of a
universe's tick (`field-phase.js`, 27 universes, 120 s); the solo VM, where every task op runs, is 15%. The pair VM computes nothing the
world pays for; it carries predation (op 155 needs a partner), movement and amplitude effects. Node (`probe-pairs.js`, `out-cap/`), cap 1
against 10: 24,769 against 10,742 functions (seed 11, 3,000 ticks), 71,828 against 50,057 (seed 12, 6,000), 108,878 against 59,551 (seed
13, 6,000); populations larger (1,132-1,614 against 776-1,015), ms a tick about level. Seen seeds design, they do not decide (#397:
node counts are mostly draw order).

- **Arms:** the engine (cap 10) against a copy with `const INTERACTION_CAP=1;` (`field-pair.sh`). 8 pairs, 25 minutes each, each alone,
  one per launch (`lab/port/cap-set.sh`); a pair cut short is void and rerun. No stopping early, one futility stop: pairs 1 and 2 both
  below 0.75 at the last sample.
- **SHIP** if the median F ratio is above 1.00 AND at least 7 of 8 are ahead AND the median size-17+ ratio is at least 0.90: the cap
  becomes 1 (everywhere: it is a constant, not a TASKS knob, and the non-TASKS world changes with it; said here, as the template asks).
- **Otherwise REMOVED** (the constant stays 10). Analysis: `lab/port/analyse-cap.js`, written now.

## Amendment (after pair 2, before pair 3 counted): the horizon is 20 minutes
The container restarted three times in 90 minutes (about 00:30, 01:04, 01:28 UTC), each killing the running pair; one died 22 minutes in.
A 25-minute pair does not fit between restarts. From pair 3 on, pairs run `SECS=1200`, and EVERY pair (1 and 2 included) is ruled on
F at its sample nearest t = 1200 s, not its last. Pairs 1 and 2 at 20 minutes: 1.68 and 2.35 (at 25: 1.77 and 2.16), so the change
does not move what has been seen. Everything else in the rule stands.

## Result
SHIP: 8 of 8 ahead, median 1.748, size-17+ median 1.682 (`analyse-cap.js`). `INTERACTION_CAP` is 1.
