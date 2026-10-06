# lab/cos — the cos/* rounds (1-6 October 2026): write-ups only

These are the result documents from 17 `cos/*` branches, copied unedited from the branch where each was finished. **The code
and the run data stay on those branches.** Paths inside the documents (`lab/autocat/…`, `lab/sticky/…`, `lab/chance/…`) refer to
the branch layout. The experimental switches those rounds added to `lab/oee-core.js` (HBODY and the BODY_* family, NICHE,
SKIN, SCAR, XFEED, RENEW, BODY_CROWD, XB, DISP and others) are **not** in main's core. Every round that used them ended NO-GO
or NOT SHOWN. The only code brought into main is the speedup (`SPEEDUP.md`), ported on its own and identity-checked (#291).

**Read the "used novelty" numbers in these documents with #291 in hand.**
- Lu and S counted a trick as used when 1% of organisms carried it, so hitchhikers that earn nothing scored as inventions.
- The no-selection twin (DRIFT, DR) scored higher than the design in nearly every round. The sticky bar let that pass through
  a difference rule instead of requiring the design to beat its twin outright.
- `lab/used-novelty.js` scores income-only use, and requires every null to be beaten outright.

| document | branch | question | verdict |
|---|---|---|---|
| `AUDIT-cos.md` | cos/random-lysis-null | read-only audit of OEE-NOTES #238-#290 | 37 claims: 9 hold, 11 weak, 17 did not hold; none of the claims that novelty keeps arriving holds |
| `NOTE-for-claude-random-lysis.md` | cos/random-lysis-null | summary note for the virus null and the audit | — |
| `PREREG-random-lysis.md`, `RESULT-random-lysis.md` | cos/random-lysis-null | is #287's virus more than extra deaths? (unseen seeds 4-6, 600k) | PASSES, narrowly: the virus beat matched random lysis on 3/3 seeds (3 v 2, 9 v 3, 9 v 1). Targeting holds diversity (dominant reaction 42-60% v 86-95%). A non-mutating virus with immigrants did better still, so coevolution is not shown. The one-off control left nothing lasting |
| `PREREG-niche.md`, `RESULT-niche.md` | cos/niche-construction | world structures organisms build | NOT SHOWN |
| `PREREG-niche-v2.md`, `RESULT-niche-v2.md` | cos/niche-v2 | the same, revised | NOT SHOWN: random placement matched or beat building on 2/3 seeds |
| `PREREG-niche-v3.md`, `RESULT-niche-v3.md` | cos/niche-v3 | the same, revised again | NOT SHOWN |
| `PREREG-skin.md`, `RESULT-skin.md` | cos/skin | a structure carried on the organism | NOT SHOWN |
| `PHASEA-autocatalysis.md` | cos/autocatalysis | structures catalyse the next build | NO-GO: easier to build, not a living (0-4.5% of income) |
| `PHASEA2-scarcity.md` | cos/scarcity | run base metabolism down so invention is needed | NO-GO: structures still 0.0-0.1% of income |
| `PHASEA3-heritable-body.md` | cos/heritable-body | inherited body chemistry; then pathway fusion (A3b) | NO-GO: the body pays (20-44% of income) but novelty declined; random capture beat directed capture after fusion |
| `PHASEA4-cross-feeding.md` | cos/cross-feeding | waste leaks to neighbours | NO-GO: cross-feeding was 2-4% of body income, and random capture won on every seed |
| `FINDINGS-2026-10-03.md` | cos/cross-feeding | summary of rounds A-A4 | — |
| `META-SEARCH.md` | cos/meta-search | search over capture and mutation rules | NO-GO on held-out seeds 30-32 |
| `CHANCE-ENGINE.md` | cos/chance-engine, cos/chance-logging | why random capture wins; chance made heavy-tailed or evolvable | NO-GO. The no-selection arm scored Lu 77-120 against 15-51 for the selected arms. The logged rerun found established tricks often die when their own input runs out |
| `SPEEDUP.md` | cos/speedup | headless speedup of the core | 1.65-1.96x, byte-identical; **ported to main (#291)** |
| `LOCAL-RENEWAL.md` | cos/local-renewal | food that grows back where it is eaten | STOPPED at its tuning gate (no cap qualified) |
| `STICKY-SEARCH.md` | cos/sticky-search | search for "used novelty that sticks" | c055 "GO (re-confirmed)". **Superseded:** the metric counted carriers, the design never beat its drift twin outright, and c055 failed on seeds 501-503 (#291) |
| `STICKY-LONGRUN.md` | cos/sticky-longrun | c055 to 1.5M ticks, plus ±25% nudges | NOT SHOWN: late S below middle S (fades); FRAGILE, 5/12 nudges pass; the centre failed at 450k on 501-503 |
| `STICKY-ROBUST.md` | cos/sticky-robust | search for a robust neighbourhood of c055 | no configuration ROBUST-GO |
