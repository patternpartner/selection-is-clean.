#!/bin/bash
# #447 (PREREG-collearn.md): pairs of browser fields run together and ALONE on the machine: today's field against the same field opened
# with #collearn (the collective's mind is the one that learns). Same engine file in both. 1,500 s; one pair a launch.
#   [PAIRS="1 2 ... 6"] lab/port/collearn-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-collearn; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0
for i in ${PAIRS:-1 2 3 4 5 6}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*
  SECS=1500 EVERY=60 OUT=$OUT/p$i-base.jsonl node lab/port/field-rate.js > $OUT/p$i-base.log 2>&1 & a=$!
  SECS=1500 EVERY=60 HASH='#collearn' OUT=$OUT/p$i-collearn.jsonl node lab/port/field-rate.js > $OUT/p$i-collearn.log 2>&1 & b=$!
  wait $a; wait $b; echo done > $OUT/p$i.done
done; echo "ran $n"; node lab/port/analyse-collearn.js | tail -8 | cut -c1-330
