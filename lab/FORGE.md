# FORGE - change the chemistry: a generative, combinatorial network (pre-registered before any deciding run)

Seven rounds (gardener, locksmith, dreamer, archivist, scatterer, CEILING, FINE) left income-only sticky novelty on the floor
on every existing chemistry. Every existing network is a fixed downhill tree from species 0: products are fixed one-bit
neighbours, so what can be eaten is decided before life starts. FORGE makes the network grow from what organisms make.

Mechanism (oee-core.js, FORGE flag, needs CHEM_BIG; off = byte-identical, checked on seed 3 at 20k ticks for lean CHEM and
CHEM_BIG against f2fa3af): METAB3 becomes LIGATE. Substrate q (the usual two-byte address) is joined with the most abundant
other species p in the cell: x = EAT_F*min(q,p) of each is consumed, 2x of product k is made, k drawn by hash from (q,p)
anywhere in the 65,536 species (first of FORGE_TRY=24 draws paying d = be(q)+be(p)-2be(k) in (0,CHEM_DMAX]). The cell keeps x*d.
Energy is conserved; no energy added. No paying draw, or no partner: plain METAB3. Ligation income keys are
262144+q*65536+p, so they are income tricks under the same readout. FORGE 2 = sham: same pairs, same pay, product discarded.

Smoke only (seed 95, 100k, looked at before this file): FORGE 1 ligation reaches 2-8% of income and 20-60 species present
vs ~10 plain; sham ligation share ~0 (forged molecules are what make partners pay), so the sham is partly degenerate - stated
now. FORGE_TRY and the partner rule were set from mechanism, not tuned on score. ~1.4 ms/tick.

Deciding round: unseen seeds 7961-7963, 1.2M ticks, EVERY 1000, FLUXALL. Arms: X FORGE 1; XP X+NULLSHIFT 1 (noise twin);
SH FORGE 2 (sham); B plain CHEM_BIG (no-change world). Score LOCKED: FINE S (used-novelty.js, MIN 0.002, WIN 10, LAG 2,
late third), income only. Collapse = mean N last quarter < 200.
GO iff used-novelty.js bar(X vs XP,SH,B) passes (X beats every null outright on >=2/3 seeds, mean rel on S+1 >= 1.10, no
collapse in any arm) AND X MOVES (S>0 on every readable seed, mean S >= 0.5). GO = candidate only; flag stays off.
NO-GO: delete FORGE from oee-core.js and lab/forge runners; this file and the result stay as the record.
