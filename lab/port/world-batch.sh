#!/bin/bash
# #396 (PREREG-world.md): pairs of browser fields run together, today's field against #world=920, SECS (1,500) each, sampled every 60 s.
# A .done per pair; MAXNEW pairs a launch (default 1, so a launch ends inside the 30-minute limit).
cd "$(dirname "$0")/../.."; OUT=lab/port/out-world; mkdir -p $OUT; SECS=${SECS:-1500}; MAXNEW=${MAXNEW:-1}; n=0
for i in $(seq 1 ${PAIRS:-8}); do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*.jsonl
  SECS=$SECS EVERY=60 OUT=$OUT/p$i-default.jsonl node lab/port/field-rate.js > $OUT/p$i-default.log 2>&1 & a=$!
  SECS=$SECS EVERY=60 HASH='#world=920' OUT=$OUT/p$i-world.jsonl node lab/port/field-rate.js > $OUT/p$i-world.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb" > $OUT/p$i.done
done; echo "ran $n"
