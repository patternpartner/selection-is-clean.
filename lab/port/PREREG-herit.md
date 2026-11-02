# PRE-REGISTRATION #369b — should what a creature RUNS be what its children INHERIT? (`LATERAL_HERIT`)

Written and committed before any decision run. Seeds 10201, 10202, 10203 have never been run by anyone.

## The finding that raises it
Op 225 (`PROG_LATERAL_COPY`) replaces a creature's running program `pProg[i]` with a copy of a partner's, and leaves its genome's
program `pGenome[i].vmProgram` as it was. Births clone the parent's genome (`addParticle`), so the children inherit the program the
parent ran BEFORE it copied. #322 closed the question under REPL, where copies were rare (germline carriage under 3%): "whether a
lateral copy should be inherited is not worth a retire-or-prove; op 225 stays as it is". Under TASKS, the artwork's default since
#351, it is not rare: on design seed 10102, 12 of 506 living creatures ran a program that was not their genome's at tick 500, 236
of 1,066 at 1,500, and **837 of 1,455 (58%) at 2,000**, every one differing in its logic ops. Under TASKS the running program earns
the income that pays for births. So for most of the world, what selection pays for and what offspring inherit are different programs.

## The arm
`LATERAL_HERIT=1`: op 225's copy also becomes the genome's program (`pGenome[i].vmProgram=pProg[i]`), at the one site that copies
(asserted: one real `case 225`, plus a profiler stub that never copies). A lateral copy becomes a horizontal transfer that is
inherited, and `pProg[i]` is `pGenome[i].vmProgram` again for every creature. Unset, the world is byte-identical to today's (seed 3,
1,500 ticks, TASKS on and off). Set, on design seed 10102: 0 desynchronised creatures at ticks 500, 1,000, 1,500 and 2,000.

## Runs
- Per seed: **OFF x3** (today's world) and **ON x3**, all `TASKS=1`, 10,000 ticks. Replicate k = 1, 2, 3 is the same world
  reseeded after tick 1 (`RESEED_AT=1 RESEED=k`); OFF and ON share k, so the three OFF runs are the null band ON is judged against.
- Probe `lab/port/probe-reload.js`, one row per 500 ticks; it counts op 225 copies (`__on225`) and desynchronised creatures, and
  draws nothing. Batch `lab/port/herit-batch.sh`, out `lab/port/out-herit/`, analysis `lab/port/analyse-herit.js` (written before
  the runs finish).

## Executed first
A seed COUNTS if every ON replicate made at least 100 copies by tick 10,000 and every replicate of both arms had at least 500
functions ever paid by then (the world took off; without that there is nothing computed to inherit). Report the counted seeds
first. Fewer than 3 counted: INCONCLUSIVE, the default does not move, and unseen seeds 10204 onward extend it.

## Measures (late = the ten windows ending at ticks 5,500 to 10,000)
- **V** novelty: functions paid that the universe had never been paid for before, summed over the late windows (`newToHistory`).
- **S** circuit size: the income-weighted mean formula size, averaged over the late windows.
- **E** breadth: exp(H) of each window's income, averaged over the late windows.
- **Crash guard:** a replicate CRASHES if its alive count, averaged over the last two windows, is under 5 while its OFF partner
  (same k) is over 20.
- Reported beside them, not ruled on: V over the whole run, alive late, copies, and desynchronised creatures at 10,000.

## Rule, per counted seed (the OFF replicates are the null band)
- ON is **WORSE** on V if every ON V is below every OFF V AND the highest ON V is more than 10% below the lowest OFF V; on S if
  every ON S is below every OFF S by more than 0.25 gates; on E if every ON E is below every OFF E by more than 10%. BETTER is the
  same the other way.
- The seed is **WORSE** if ON is WORSE on any of V, S or E, or any ON replicate crashes. It is **BETTER** if ON is BETTER on V and
  WORSE on nothing. It is **SPLIT** if ON is WORSE on one measure and BETTER on another.

## Verdict (two-thirds of counted seeds)
- **WORSE on two-thirds:** `LATERAL_HERIT` stays 0 and the knob is DELETED (its comment and this file stay as the record).
- **SPLIT on two-thirds:** the default does not move; the knob stays 0 (DORMANT), named follow-up: a longer horizon.
- **BETTER on two-thirds:** ship it: `LATERAL_HERIT` defaults to 1 wherever TASKS runs (the browser's default world), byte-identical
  elsewhere.
- **Otherwise, and the arms differ on the counted seeds:** KEEP by the template ("it changes the world and does no measured harm"):
  ship it as above, claimed only as a heredity repair, not as more novelty.
- **Arms identical on every counted seed:** decoration: DELETE the knob.

## Prediction (mine, before any run)
BETTER on 2 of 3. Inheriting what pays should let the computing lineages that copied a good program keep it, so novelty and circuit
size rise. The risk I see is the other way: copies might mostly spread whatever is common nearby, and making them heritable could
narrow the world (E falls) faster than it builds.

## Saved worlds (rule 6)
A saved universe carries no knob; a TASKS universe that reloads after the change runs with it. Its saved creatures (#368) keep the
running programs #369 now saves, and from then on copies are inherited.
