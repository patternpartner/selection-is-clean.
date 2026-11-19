#!/bin/bash
# #459 (PREREG-core.md): run the next unfinished pair of the core-alone set, one pair per launch. Both fields serve this tree and the
# same engine; the core field's address carries #core (every universe gets the 43 older layers off through its own knobs).
cd "$(dirname "$0")/../.."; OUT=lab/port/out-core; mkdir -p $OUT
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue; rm -f $OUT/p$k-*
  SECS=1500 EVERY=60 OUT=$OUT/p$k-base.jsonl node lab/port/field-rate.js > $OUT/p$k-base.log 2>&1 & a=$!
  SECS=1500 EVERY=60 HASH='#core' OUT=$OUT/p$k-core.jsonl node lab/port/field-rate.js > $OUT/p$k-core.log 2>&1 & b=$!
  wait $a; wait $b; touch $OUT/p$k.done; echo "pair $k done"; exit 0; done; echo "all 8 done"
