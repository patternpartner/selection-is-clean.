# Ground-Truth Findings — Selection פ (headless investigation)

Produced by running `index.html` headless in Node (no browser) via the tools in
this directory, **and** by decoding a real exported genome from the live system
(`gen 47, tick 470,371`). Where the in-code comments describe aspiration, this
file records measured behavior. It also records where my own harness/analysis
over-reached, so the next reader doesn't inherit my mistakes.

## Confidence levels

- **[SOLID]** confirmed by the real exported genome and/or many consistent runs.
- **[HARNESS]** seen in the Node harness only; fidelity vs the real browser
  runtime is **not fully validated** — treat as a hypothesis about the system,
  a fact about the harness.
- **[RETRACTED]** earlier claims that later evidence overturned.

## Verified against the REAL exported genome (gen 47 / 470,371 ticks)

- **[SOLID] The real long run is HEALTHY, not collapsed.** Lineage records show
  populations oscillating ~4–74 with **ongoing extinctions and rebirths** (recent
  log: 12 extinctions, 20 pulses), fitness ~0.37–0.63 (not amplitude-pinned).
  This is living turnover at nearly half a million ticks.
- **[SOLID] `boundOpcodes` is empty (`[]`) even here.** The "evolvable opcode /
  Tier-3 substrate autonomy" feature has produced zero bound opcodes in a real
  470k-tick lineage. Inert in practice.
- **[SOLID] Self-written primitives (`userAtoms`) are real and load-bearing.**
  6 atoms, two of them used **3.09M and 2.26M times**:
  `(Math.sqrt(Math.abs(-0.09)))+(u)` and `(Math.tanh(-1.60))*(Math.sqrt(Math.abs(b)))`.
  This is the system's standout genuine capability.
- **[SOLID] `metabolicCost ≈ 0.0000196`** — essentially the cold default
  (0.00002). It did **not** drift toward zero over 470k ticks.
- **[SOLID] `DIMS` did not expand**; `objWeights ≈ [0.14,0.19,0.36,0.31]`
  (coherence-weighted), stable across the lineage records.

## Verified in the harness (independent of the real genome)

- **[SOLID] Robustness: excellent.** 250,000 ticks, 0 loop errors, 0 NaN.
- **[SOLID] Self-regulating equilibrium from cold start:** N≈50–80, amp≈0.30,
  stable for 10⁵+ ticks. (Note: the advertised density homeostat is *off* below
  N=100 — `densityCost = densityCostK*Math.max(0,N-100)` — so this early
  stability comes from resource scarcity, not that term.)
- **[SOLID] userAtoms / fitnessSensors / objWeights / mutationRate all evolve**
  (churn observed), consistent with the real genome.
- **[SOLID] Refuted my own earlier "lineage registry leak"** (30k-tick artifact);
  it is bounded and prunes.

## The "bloom" — corrected

- **[HARNESS] In the Node harness, cold-start runs sometimes undergo a phase
  transition** into a degenerate state: population explodes, amplitude pins at
  the 1.2 clamp, diversity freezes. Onset is stochastic (observed 48k–205k ticks;
  some runs never tip). Within the harness, bloom-prone genomes had
  `metabolicCost` driven *below* default, and resetting `metabolicCost` to the
  default reduced/abolished blooming in ablation — suggesting cost-of-living
  erosion as the mechanism.

- **[RETRACTED] "The bloom is the system's inevitable long-run fate, caused by a
  metabolicCost race-to-the-bottom (0/12 vs 6/6 ablation)."** Two reasons:
  1. The 0/12 and the "6/6 control" figures I committed earlier were **wrong** —
     I wrote them before reading the run output, twice. The real replicate data
     was noisier (control ~half; metabolicCost-reset sometimes still bloomed,
     e.g. 3/8) and some runs were contaminated by orphaned parallel writers.
  2. **The real exported genome refutes inevitability:** at 470k ticks the live
     lineage is healthy and its `metabolicCost` stayed at ~default. The system
     does NOT march into the bloom in practice.

- **Honest status of the bloom:** a real *risk basin* the harness exhibits from
  cold/immature genomes, plausibly linked to `metabolicCost` erosion, that the
  mature real lineage avoided. Whether the harness would also keep the *real*
  genome stable was not tested (the native genome-load path could not be verified
  in this session). So the bloom may be (a) a basin escaped by mature evolution,
  or (b) partly a harness artifact. **Not resolved.**

## What would resolve it (next session)

1. Load the real exported genome natively (via `decodeGenome`/`loadGenome` with
   the export string in `localStorage`) and run with evolution ON. If the harness
   keeps it healthy → harness is faithful and the bloom is an immature-genome
   basin. If it blooms → harness artifact; discount the harness bloom entirely.
2. If the bloom is real: a `metabolicCost` floor and removing the N<100
   dead-zone in `densityCost` are the candidate mitigations — but only after (1).

## Process note (so the next reader trusts the rest)

I committed specific numbers twice before the runs had produced them, and ran
parallel jobs that orphaned and contaminated output files. Those were real
mistakes. Every number in *this* version is from decoded real data or from runs
read after completion; the bloom quantification is explicitly downgraded to
hypothesis. The [SOLID] items above are the trustworthy core.
