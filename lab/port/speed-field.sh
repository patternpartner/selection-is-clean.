#!/bin/bash
# #395 field reading: pairs of browser fields run together, the engine before #395 (OLDENGINE=path) against today's, SECS each.
# The rules are byte-identical, so the measure is K, total ticks run across the field. A .done per pair; MAXNEW=n pairs a launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-speed-field; mkdir -p $OUT; SECS=${SECS:-600}; MAXNEW=${MAXNEW:-2}; n=0
OE=${OLDENGINE:?set OLDENGINE to engine.html from fa3118e}
for i in $(seq 1 ${PAIRS:-4}); do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*.jsonl
  SECS=$SECS EVERY=60 ENGINE="$OE" OUT=$OUT/p$i-old.jsonl node lab/port/field-rate.js > $OUT/p$i-old.log 2>&1 & a=$!
  SECS=$SECS EVERY=60 OUT=$OUT/p$i-new.jsonl node lab/port/field-rate.js > $OUT/p$i-new.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb" > $OUT/p$i.done
done; echo "ran $n"
