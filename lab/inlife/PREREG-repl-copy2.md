# REPL_COPY v2: does computed replication, priced on the energy clock and with heredity intact, stop the clonal sweep? (written and COMMITTED before the first decision run)

21 Oct 2026. Engine: engine.html with #325 (`REPL_COPY=3`). With the knob unset, harness-oee is identical to the previous engine for the default world (seed 2) and REPL=1 (seed 2), and `REPL_COPY=1` (v1) is identical too (seed 1), so #324's runs stay reproducible. Batch `lab/inlife/repl-copy2-batch.sh`, analysis `lab/inlife/analyse-repl-copy2.js`, fidelity probe `lab/inlife/probe-birthvar.js`. Asked for by the user after #324's correction.

## What changed from v1 (#324), and why
#324's BETTER verdict measured broken heredity: 96-99% of children differed from their parent at about 8.5 of 16 opcode positions, 60% of copied instructions were injected by partners. Two faults: the ancestor's op 225 injected on every pairwise contact, and injection advanced the injector's own copy cursor. And the length trade-off could not bind: a copy finished in about 16 ticks while a birth's energy took hundreds.
v2 (`REPL_COPY=3`):
- op 225 with **k >= 0** (the ancestor carries k = 1) **self-copies, in the solo VM only**; pairwise it does nothing.
- op 225 with **k < 0** **injects** one of the actor's instructions into the partner's buffer, **pairwise only**, on its own cursor. Injection is one mutation away and never scrambles a self-copy.
- **Each copied or injected instruction costs the actor `BIRTH_ENERGY_COST*(1-SUN_ENDOW)/L0`** (L0 = the ancestor's length) and needs that much in its store; **the birth then charges only `BIRTH_ENERGY_COST*SUN_ENDOW`**, which is what the child receives. An ancestor-length program pays exactly a plain REPL birth's 0.25; each instruction more or less changes that.
Unchanged: a birth is refused before anything is paid until the buffer is as long as the parent's running program.

## Arms (per seed)
- **V2**: REPL=1 REPL_COPY=3, NULLSHIFT 0, 3, 7.
- **CONTROL**: REPL=1 REPL_COPY=2 REPL_INERT=225, NULLSHIFT 0, 3, 7 (the same ancestor, op 225 disarmed, plain REPL births).
Every run: TICKS=10000 SAMPLE=500 ESTABLISH=1000 ESTWARM=2000 ESTN=10. Seeds **6401-6405** (never run). 30 harness-oee runs.
**Plus a fidelity run per arm per seed** (`probe-birthvar.js`, NULLSHIFT 0, SAMPLE=1000): 10 runs. The probe draws nothing, so each is the same trajectory as that seed's NULLSHIFT 0 harness run.
Horizon, out loud: 10,000 ticks.

## Pilot (practice seed 1, 3,000 ticks; NOT evidence)
Fidelity per 500-tick window, children differing from parent / opcode positions changed per birth: **V2 10-25% / 0.34-1.25**; CONTROL 7-46% / 0.17-0.67; v1 (#324, seeds 6301-6303, whole run) 96-99% / 8.4-8.9. V2 copied 7,000-24,000 instructions per window and injected none (k < 0 had not arisen). Lineages V2 329 -> 55 at 3,000 (CONTROL pilot from #324: 329 -> 27); top exact-program share V2 0.12, CONTROL 0.03. No errors.

## Step 1 - executed first
A seed COUNTS if all 6 harness runs finished without loopErrors/driverErr; every V2 run fired `repl.copyBirth` and no CONTROL run did; and each arm has at least 2 DISTINCT replicates (identical N series = one replicate). Fewer than 3 counted seeds = INCONCLUSIVE.

## The heredity guard (new, because of #324)
From the fidelity runs: F = share of births whose child's opcode sequence differs from the parent's, over the whole run. **On a seed where F(V2) > 2 x F(CONTROL), P2 cannot count as DOWN** (a lower top share there is read as scrambling, not as held diversity), and the seed is reported as heredity-broken.

## Ruling measures (as #324)
Late = mean over the last third of samples.
- **P1 lineages standing, late.** Moves if every V2 replicate is outside every CONTROL replicate on one side and the means differ by more than 25% of the CONTROL mean. UP = more lineages.
- **P2 top exact-program share, late** (`topSeqShare`). Same rule, threshold 50%. DOWN = less dominated (subject to the heredity guard).
- **Guards:** centredEntropyRatio (0.05), spread_late (10%), crashes.

## Verdicts (as #324)
- **BETTER**: P1 UP or P2 DOWN (guarded) on >= 2/3 of counted seeds, AND neither P1 DOWN nor P2 UP on >= 2/3, AND no guard WORSE on >= 2/3.
- **WORSE**: P1 DOWN or P2 UP on >= 2/3, or a guard WORSE on >= 2/3. **SPLIT**: both. Otherwise **NO CONSISTENT DIRECTION** / **NO MEASURED DIFFERENCE**.

## Secondary claim, pre-registered separately (rules on nothing above)
**LENGTH:** mean program length late (`progLen_late`). "SHORTER UNDER V2" if all three V2 replicates are below all three CONTROL replicates on >= 2/3 of counted seeds; "LONGER" mirrored; else "NOT SHOWN". This is the direct test of whether pricing copies makes length matter.

## Prediction written before running
LENGTH: SHORTER UNDER V2 (now that each instruction costs energy). Ruling measures: NO CONSISTENT DIRECTION — I expect P2's gap to close now that heredity is intact, and lineages to fall as they do under plain REPL. Fidelity: F(V2) within 2x of CONTROL on every seed.

## Template step 6
REPL_COPY is a rig-only knob; REPL is off by default. No saved universe changes.

## What this cannot say
Five seeds, one horizon, one copy design. Whether parasites (k < 0 injectors) arise is reported (inject counts), not ruled on. Nothing about the default world.
