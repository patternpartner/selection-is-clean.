#!/bin/bash
# #430 (PREREG-factorial.md): two factorial fields per launch (#factorial=20), each its own random assignment, 1,500 s, fresh profiles.
# Launch k runs fields f(2k-1) and f(2k); a .done per launch; MAXNEW launches per call (default 1).
#   [LAUNCHES="1 2 3"] lab/port/factorial-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-factorial; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0
for k in ${LAUNCHES:-1 2 3}; do [ -e $OUT/l$k.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1))
  a=$((2*k-1)); b=$((2*k)); rm -f $OUT/f$a.* $OUT/f$b.*
  SECS=${SECS:-1500} EVERY=60 HASH='#factorial=20' OUT=$OUT/f$a.jsonl node lab/port/field-rate.js > $OUT/f$a.log 2>&1 & x=$!
  SECS=${SECS:-1500} EVERY=60 HASH='#factorial=20' OUT=$OUT/f$b.jsonl node lab/port/field-rate.js > $OUT/f$b.log 2>&1 & y=$!
  wait $x; rx=$?; wait $y; ry=$?; echo "$rx $ry" > $OUT/l$k.done
done; echo "ran $n"
