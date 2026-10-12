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

## Result - deciding round (seeds 7961-7963, 1.2M ticks): NO-GO (X does not MOVE enough)

```
7961 X  rows 1200 N 1221 | S 0.256 (mid 0.077) usedEver 147 | late ligation share 0.340
7961 XP rows 1200 N 1449 | S 0.000 (mid 0.333) usedEver 164 | late ligation share 0.004
7961 SH rows 1200 N 1505 | S 0.000 (mid 0.000) usedEver 27 | late ligation share 0.003
7961 B  rows 1200 N 1398 | S 0.000 (mid 0.000) usedEver 12 | late ligation share 0.000
7962 X  rows 1200 N 1298 | S 0.667 (mid 0.590) usedEver 289 | late ligation share 0.104
7962 XP rows 1200 N 1257 | S 0.410 (mid 1.256) usedEver 240 | late ligation share 0.093
7962 SH rows 1200 N 1191 | S 0.154 (mid 0.231) usedEver 52 | late ligation share 0.117
7962 B  rows 1200 N 1397 | S 0.000 (mid 0.179) usedEver 17 | late ligation share 0.000
7963 X  rows 1200 N 1140 | S 0.205 (mid 0.051) usedEver 172 | late ligation share 0.312
7963 XP rows 1200 N 1220 | S 0.000 (mid 0.872) usedEver 115 | late ligation share 0.340
7963 SH rows 1200 N 1141 | S 0.000 (mid 0.026) usedEver 13 | late ligation share 0.072
7963 B  rows 1200 N 1460 | S 0.026 (mid 0.103) usedEver 25 | late ligation share 0.000
[{"seed":"7961","X":0.2564102564102564,"XP":0,"SH":0,"B":0,"beatsAll":true,"lostTo":[]},{"seed":"7962","X":0.6666666666666666,"XP":0.41025641025641024,"SH":0.15384615384615385,"B":0,"beatsAll":true,"lostTo":[]},{"seed":"7963","X":0.20512820512820512,"XP":0,"SH":0,"B":0.02564102564102564,"beatsAll":true,"lostTo":[]}]
bar: wins 3/3 (need 2) rel 1.211 (>=1.10 true) collapse [] | X moves false (mean S 0.376) | means {"X":0.37606837606837606,"XP":0.13675213675213674,"SH":0.05128205128205129,"B":0.008547008547008546}

VERDICT: NO-GO - FORGE KILLED: delete FORGE from oee-core.js and lab/forge runners; branch keeps the record
```

Read: the bar passed - X beat its noise twin (XP), the sham (SH) and plain CHEM_BIG (B) outright on 3/3 seeds, mean rel 1.21,
no collapse. X also lifted S off zero on every seed (0.256, 0.667, 0.205), the first arm in eight rounds to do so, with ligation
carrying 10-34% of late income. But the locked MOVES clause needed mean S >= 0.5 and X's mean is 0.376, so by the
pre-registration this is NO-GO. FORGE is deleted from oee-core.js (back to f2fa3af) and lab/forge runners removed; this file
and the score stay as the record. Note for whatever comes next: generative chemistry is the first change that moved the score
at all; the shortfall is size, not direction. Any follow-up must be a fresh pre-registration on new unseen seeds, not a
re-reading of this one.
