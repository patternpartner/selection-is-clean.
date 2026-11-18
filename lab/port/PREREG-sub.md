# #455 — capturing an operator (pre-registered before the decision runs)

Written after design checks on seed 11 only (`out-sub/chk*.out`, 2,000 ticks).

## What is tested
`TASK_SUB=1` (open world; default 0, byte-identical: `9e88d2f9`, seed 11, `MIND=20`, 2,000 ticks). A READ with src bit 3 set also
copies the neighbour's running task program into the reader's subroutine (its READs and OUTPUT dropped, its own subroutine inlined,
at most 32 instructions); a COPY with src bit 2 set calls the subroutine on the caller's words (an empty subroutine: an ordinary
COPY). Subroutines are inherited. The question is step 2 of the OEE answer: can an organism grow, by capture, into something more
than one node in a relay, and does that find more?

Design check, seed 11 at 2,000: 8,055 functions against the shipped 8,281; mean subroutine 2.2, longest 9, capture depth 2;
0.4% of payments built by a call.

## Runs
Node, seeds **12, 13, 14** (11 designed it), `TASKS=1 MIND=20`, 12,000 ticks, `EVERY=2000` (`lab/port/sub-batch.sh`). Shipped
baselines: 12 and 13 from `out-open-node/b12`, `b13` (162,996, 8 inputs; 74,397, 7); 14 run alongside (`ship-14`).

## Executed first
A seed counts if `subCall > 0` and `subPaid > 0` by 12,000. Report counted seeds first.

## Early stop (written because #454 ran to 12,000 after its 2,000-tick check had already shown the answer)
At 6,000 ticks, if on all three seeds fewer than 1% of payments so far were built by a call, stop: the capability is not used, and
it is removed as decoration.

## Decisions (node sees only severalfold or kind, #397)
- **Used:** payments built by a call at least 5% of all payments on at least 2 of 3 counted seeds.
- **Grows:** mean subroutine length at 12,000 above 4 (one founder-sized capture) and capture depth at least 3 on 2 of 3.
- **Field pair** (one, 25 minutes, then a registered set) if USED and functions at least 0.5x shipped with at least as many inputs
  minus one, on 2 of 3.
- **Removed** if not used (under 1% on 2 of 3: decoration), or under 0.5x shipped on 2 of 3.
- Otherwise (used 1-5%, or used but not growing): INCONCLUSIVE in node; one design field pair decides whether to go on.

## Readouts
`sub.len`, `sub.max`, `sub.gen`, `sub.genMax` along the run; `subNew` (first finds built by a call); populations.
