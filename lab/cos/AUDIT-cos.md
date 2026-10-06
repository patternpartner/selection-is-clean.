# Has *selection-is-clean.* shown open-ended evolution? An audit of entries #238–#290

**Scope.** Read-only. Sources: `OEE-NOTES.md`, `CLAUDE.md` and `lab/*.js` as on `origin/main` @ `8efaf9d`, fetched 1 Oct 2026, 20:10 BST. VIDEO.md is out of scope. Nothing was edited, pushed or posted. I ran one spot check: `lab/core-run.js` with SEED=1 for 20,000 ticks, about 31 s. The neutral shadow population matched the real population's size at every sample (1,272 → 1,433), which is what #285c says. Speed was about 650 ticks/s, against #285's "about 600". Both claims check out.

**How to read this.** The project tries to grow digital organisms that keep inventing new things, and to check, honestly, whether they do. Its own test is strict. It is not enough that new things appear, because random copying errors ("drift") make new things all the time. A new thing counts only if it beats a **null**: an identical world where nothing is selected (a "shadow" or "neutral" population), or the same world with the new behaviour switched off (an "inert" control). The rule is also pre-registered: written down before the data comes in.

I sorted each claim into one of three classes:
- **HOLDS:** a proper control or null, three or more seeds, an effect clearly outside the noise, and ideally a rule written in advance.
- **WEAK:** plausible, but no control, too few seeds or replicates, interpreted after the fact, never followed up, or still pending.
- **DIDN'T HOLD:** the notes themselves report a null, a revert, a failed pre-registered rule, or a control that matched the treatment.

A claim can HOLD and still be bad news for open-endedness. "The world plateaus" is a finding that holds. I mark the direction separately.

---

## Claims table

Commit hashes are on `origin/main`. "Notes" means `OEE-NOTES.md`.

| # | Claim (as logged) | Entry / commit | Key file(s) | Class | Points toward open-endedness? |
|---|---|---|---|---|---|
| 1 | Evolvable chemistry should be deleted | #238, `98947dd` | engine.html | WEAK. DELETE came from the seed-count floor (2/6 seeds), not from a measured null effect | n/a |
| 2 | Peer-inscription bundle is load-bearing: KEEP | #241, `e3fd116` | harness-peerins.js | DIDN'T HOLD. #244 found the KEEP was reached through harm (late kinds 18.1→8.1, alive 499→294). The rule had no direction | No |
| 3 | Peer inscription goes DORMANT until it is shown no worse | #245, `d876f9b` | harness-peerins.js | WEAK. Stopped at 4/12 runs, which were never scored. The pre-registered re-test (focals 7–12) was **never run** | n/a |
| 4 | Novelty clock: trait novelty is *slower* than neutral shadows, and code-layer novelty arrives at the chance rate (0 of 15 layers faster) | #247 `b416afb`, #256b `59dc11e` | harness-novelty.js, novelty-shadows.js | HOLDS (8 shadows, calibrated neutral markers 6/6, 3 seeds) | **Against** |
| 5 | MUTUALISM, NICHE_BIOTIC and SELF_PREDICT are BETTER | #249 `852a2b3` → #249b `eab5c66`, #249f `4f0d105` | harness-oee.js | DIDN'T HOLD. Against four nulls, none beats chance. Deleted | No |
| 6 | A judge between worlds, or a law tournament, selects for novelty | #254 `df33ea2`, #255 `4bf3a65` | index.html field rigs | DIDN'T HOLD. #254 was negative. #255 could not be told apart from neutral copying, and the judge was gamed by starving populations | No |
| 7 | Deleting BIRTH_SHRINK widens trait spread | #257c, `5817256` | harness-oee.js | HOLDS (unseen seeds 131–133, beats every null 3/3) | Engine hygiene |
| 8 | Deleting the lineage trait pull helps | #258b `47e8cce`, #258c `a5cd08f` | trait-force.js | WEAK. A gain at 20k was neither confirmed nor refuted at 40k | n/a |
| 9 | A coevolving enemy makes novelty beat chance | #260 `48229bb`, #264 `7a0d2d6` | microcosm rigs | DIDN'T HOLD. New locks beat neutral tags in 4/26 runs. At field scale the lock rate equals the tag rate (0.56 vs 0.60) | Turnover only |
| 10 | An engine-variant search finds a better engine | #261 / #261b, `e521ef3` | lab-field rigs | DIDN'T HOLD. No candidate by the rule | No |
| 11 | Program novelty is selected *against*; nothing new out-breeds chance | #267, `b750cf9` | harness-novelty / TREE null | HOLDS (markers read chance 6/6) | **Against** (purifying selection) |
| 12 | **Predation arises by mutation and spreads by selection** | #273, `39e7113` | engine REPL, `REPL_INERT=155` | **HOLDS.** 3/3 seeds; the inert control is byte-identical until op 155 first runs. 79–99% carriers vs 0–3% | One adaptation, then a sweep |
| 13 | Parallel adaptation across seeds; the authored-atom layer is adaptive | #274 `b6a09f1` → correction `106bb8f` | scratchpad probes | DIDN'T HOLD. 98% of op-22 carriers hold no atom: a biased mutation supply, not selection | No |
| 14 | Evolved food web; scavenging is selected | #275–276, `7c453f2` | engine REPL | WEAK. The scavenging inert control was "queued" and **never reported** | Partial |
| 15 | 4-D and wide-key arms races | #277 / #277b, `7c453f2`, `919aa90` | REPL_ARMS | DIDN'T HOLD. Never engaged; the rise in take was drift. The predation-inert control was stopped by hand | No |
| 16 | Long REPL worlds: two innovations, then a plateau | #278, `f6f17af` | harness-passage.js | HOLDS (do-nothing ops as the baseline, 3 seeds, 72k ticks) | **Against** |
| 17 | "First signs of a Red Queen chase" | #279 first look, `f6f17af` | REPL_KEYD | DIDN'T HOLD as a chase (one clean seed). The long runs reclassified it as a cycle | No |
| 18 | Selection drives attack keys 1.5–2.5x faster than drift, as a *bounded cycle* | #279 long runs, `9f7aa13` | harness-passage.js | HOLDS (armed vs disarmed, 3/3 seeds). The notes themselves call it "turnover, not open-endedness" | Turnover only |
| 19 | "THE ATOMS ARE SELECTED: the open-ended layer is under selection" | #280–281 `06fea56` → correction `b64def5` | REPL_ATOM_INERT | DIDN'T HOLD. Inert atoms also sweep to 60–81%; the gap was mostly timing | No |
| 20 | A genotype-keyed pathogen breaks clonality | #282, `fdd18c9` | (reverted) | DIDN'T HOLD. It killed adaptation and was reverted | No |
| 21 | An instruction cost creates trade-offs | #283, `bf8d0f1` | REPL_COST | DIDN'T HOLD. Programs grew. The "supply-limited" diagnosis is arithmetic, not tested | No |
| 22 | Ancestor-program rescue fixes sterile founders | #284, `ad2bf19` | engine REPL | WEAK. A sensible fix; its effect on outcomes was never measured | n/a |
| 23 | Adaptive op pairs beat the shadow genealogy (7–20 per window vs ~0.5 by chance) | #285, `163c1e2` | lab/core-shadow.js | HOLDS (3 seeds, within-run null) | Adaptation, yes |
| 24 | "Adaptive novelty has not stopped at 1,800 generations" | #285 → #285b, `07ecce5` | lab/core-run.js | DIDN'T HOLD. Pairs reach the chance floor by ~7,000 generations | **Against** |
| 25 | A moving environment or stronger predation does not drive innovation | #285b, `07ecce5` | lab/oee-core.js | WEAK. Two windows per seed, small counts, seeds 1–3 again | n/a |
| 26 | Genotype novelty is "rising" against the shadow, then against the neutral population | #285c `78b5119`, #285d `a0fa7c0` | lab/core-geno.js | DIDN'T HOLD. Both bars were miscalibrated ("the bar is not the test") | No |
| 27 | Head-to-head assay: adopted genotypes really win, and wins decline (5,3,2,2 of 12 per quarter) | #285d/e, `b829bef`, `122c441` | lab/core-assay.js | HOLDS, narrowly (self-vs-self null, Welch t, 6 replicates). Only 4 genotypes per quarter, seeds 1–3, fresh-world only | Adaptation that fades |
| 28 | Chemistry: waste becomes food, pathways deepen, then stop at 8–15 reactions | #286 / #286b, `a0fa7c0`, `122c441` | lab/core-chem.js | WEAK. Descriptive, no neutral null for "active reaction" | Bounded |
| 29 | Viruses sustain novelty (pre-registered rule) | #287, `9f05708` | lab/oee-core.js VIRUS | DIDN'T HOLD. Seed 2 at 4/10, rule failed. At the 5% threshold seed 3 fails instead | No |
| 30 | The virus *causes* the late novelty (in-world replay) | #287b `7673a13` → `191fd99` | lab/core-replay.js | DIDN'T HOLD. Fails on 2/3 seeds, with only 3 replicates per arm | No |
| 31 | Coevolution: the virus's own mutation is needed | #287c, `92a3c33` | V_MUT=0 | DIDN'T HOLD. V_MUT=0 with immigrants matched or beat the evolving virus. The pre-registered control (no immigrants) was **never run** | No |
| 32 | "Viruses hold metabolic diversity and give 2–5x the novelty" | #287b, carried into #289 | lab/core-replay.js | WEAK. The comparison is against no virus, not a disturbance-matched null. ON/OFF ranges overlap | Weakly |
| 33 | Virus worlds plateau by 2.4M ticks | #287d, `cd4dec9` | lab/core-chem.js | HOLDS (3 seeds, growth falls from 24–41 to 3–10 per 600k) | **Against** |
| 34 | A 10x bigger chemistry (CHEM_BIG) keeps novelty coming | #288, `2cd00ff` → `2d365e6` | lab/oee-core.js | DIDN'T HOLD. Fails rule 1 on 3/3 seeds; the virus suppressed metabolism | No |
| 35 | Synthesis: novelty is bounded by "the number of profitable ways to live", plus "1 win per 4 replays per quarter to 14,000 generations" | #289, `2d365e6` | (notes only) | WEAK. A post-hoc hypothesis. The "to 14,000" figure has **no data entry behind it** anywhere in the notes | Diagnosis |
| 36 | Invasion-fitness assay inside the evolved community | #289b, `ed131c4` | lab/core-invade.js | WEAK. Inconclusive by its own account | n/a |
| 37 | Task world (Avida logic) with function-keyed parasites | #290, `50c0489` | lab/core-tasks.js | WEAK, pending. Pre-registered, but no result. Trials already show "the familiar slowdown", and the decision seeds 1–3 are the trial seeds | Untested |

**Counts (37 claims): HOLDS 9, WEAK 11, DIDN'T HOLD 17.** Four of the nine that hold are negative findings: #4, #11, #16 and #33. One more, #7, is engine hygiene. Of the claims that would mean novelty keeps coming, **none holds.**

---

## Patterns

**1. Several times, the control matched the effect.** This happened at least seven times. One control became a null band and three "BETTER" verdicts disappeared (#249→#249b). A repeat across seeds turned out to be a mutation-supply bias (#274). Do-nothing atoms swept just as far as working ones (#281). A virus that could not mutate tracked its hosts just as well (#287c). The shadow genotype bar was set by the bar's own decline (#285c). Neutral tags spread as fast as selected locks (#260/#264). A law tournament matched neutral copying (#255). Every time the project added a better null, a positive claim shrank or vanished. That is the main lesson of the record. It also speaks well of the instruments: they caught the problems.

**2. Verdicts flip.** KEEP became DORMANT (#241→#244/#245). "Chase" became "cycle" (#279). "THE ATOMS ARE SELECTED" was corrected (#281). "Novelty has not stopped" became "stops by about 7,000 generations" (#285→#285b). "The authored layer is adaptive" was retracted (#274). Every flip ran toward the more modest reading. None ran the other way.

**3. Controls promised and never run.**
- The scavenging inert control (#274/#275).
- The predation-inert arm in #277b, stopped by hand.
- #287's own pre-registered control (virus seeded once, no immigrants, no re-keying).
- #245's re-test.
- The figure in #289's synthesis table ("1 win per 4 replays per quarter to 14,000"), which has no entry behind it.

The virus control matters most, because the virus is the project's best candidate for sustained novelty.

**4. Seed discipline slipped in the lab era.** The engine-era tests (#245–#272) used fresh seeds every time: 71–73, 111–116, 131–133, 151–153, 161–172. Every REPL and lab result from #273 to #290 uses seeds 1–3, and the trials and the deciding runs share them (#288's trial, #290's trials). Within-run nulls such as shadows and inert arms reduce the risk. Still, no lab claim has been checked on a world nobody had looked at.

**5. Several things changed at once.** #288 changed three things at the same time: the network size, how the virus mutates (now step-by-step along the network), and which molecules immigrants target. Its conclusion, "size was never the limit", is confounded by the other two changes. The virus redesign alone suppressed metabolism.

**6. Good habits worth keeping.** Rules were written before runs. Failures were logged in the same entry as the pre-registration. Changing a rule after seeing the data was treated as a new experiment (#287d). Corrections were written next to the original claims, not over them. The record is unusually honest. The problem is not hidden failures. It is optimistic headlines, which the next entry then walks back.

---

## Plain answers

**Has the system shown open-ended evolution by its own standards?** **No.** Its own standard (CLAUDE.md, #278) is adaptations that are proven against a null and still arriving late in a run of thousands of generations, on 3 of 3 seeds. Every world built so far fails it the same way: a burst of real adaptation, then a plateau.
- REPL worlds find predation and scavenging, then stop (#278).
- The lean core's adaptive pairs fall to the chance floor by about 7,000 generations (#285b). Head-to-head wins thin out from 5 of 12 to 2 of 12 (#285e).
- Chemistry tops out at 8–15 reactions (#286b).
- Viruses slow the plateau without removing it. The virus's role was not shown to be causal, and a virus that could not evolve did just as well (#287b–d).
- The bigger network was worse (#288).
- The task world has no result yet, and its trials already slow down (#290).

What the system has shown is real **adaptation**: new behaviour that spreads because it works. It has also shown **turnover**: Red Queen cycles and loci that keep changing. Its own notes call the second "turnover, not open-endedness". In the engine itself, novelty arrives at the rate chance would give (#256b) or more slowly (#247).

**Strongest single result: #273, predation spreads by selection** (`39e7113`). The control arm is the same world with the predation instruction disarmed, and it is byte-identical until that instruction first runs. On 3 of 3 seeds, carriers rose to 79–99% in the real world and stayed at 0–3% in the control. Cause and effect are as clean as this project gets. It shows selection, not open-endedness, but it was never contradicted. A close second is #285/#285e: adaptive op pairs beat a shadow genealogy, and head-to-head assays confirm genuine wins.

**Most over-claimed single result: the virus line, #287 → #289** (`7f80926` … `2d365e6`). The entry was titled "coevolution as the source of new behaviour". Against that title, the record shows:
- it failed its own pre-registered rule;
- a virus that could not mutate matched it, so strict coevolution fell;
- the causal replay failed on 2 of 3 seeds;
- it plateaued by 2.4M ticks;
- the bigger-network version suppressed metabolism.

Even so, #289's synthesis still lists "2–5x the reactions; diversity held". That headline was never tested against the obvious alternative: the virus may be just a source of random deaths that reshuffles which pathways win, which is disturbance, not coevolution.

---

## The one cheap experiment that would settle the most

**A disturbance-matched null for the virus.** Described here, not run.

*Question:* is the extra metabolic novelty in virus worlds caused by enemies that **target what hosts do**, or by **any extra killing** that reshuffles who wins?

*Design (lean core, `lab/`):*
- **Seeds:** unseen seeds 4, 5 and 6.
- **Horizon:** 600,000 ticks. #287c already saw the effect by then.
- **Arms:**
  1. `c`: chemistry only.
  2. `v`: evolving virus, as in #287.
  3. `o`: #287's **own pre-registered control**, never run. Viruses seeded once on every key, then no immigrants and no re-keying.
  4. **`r`, the new random-lysis null.** No keys. Each tick it kills, at random, the same number of hosts that `v` lysed in the matching window, with the corpses handled the same way. It needs about a dozen lines in `oee-core.js`, behind a knob that is off by default.
- **Pre-registered rule:** count new active reactions per 30,000-tick window in the last quarter (the existing `lab/core-chem.js` readout). The virus counts as a source of novelty only if `v` is above both `r` and `o` on all three seeds. If `r` matches `v`, the novelty is disturbance, and the virus line should be retired.
- **Cost:** 12 runs at roughly 15–30 minutes each, run 4 at a time: about 1–2 hours of compute, and no new instruments apart from the `r` knob.

*Why this one:* it is the cheapest test that removes the last positive claim still on the books (#32 in the table). It also tells the pending task world (#290) what null its parasite arm needs. A parasite keyed to functions has to beat random killing too, or "climbing complexity" will be the same story again.
