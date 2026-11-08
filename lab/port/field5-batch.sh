#!/bin/bash
# #392 field check (PREREG-in5.md's Verdict): 8 pairs of browser fields, IN4 (today's engine.html) and IN5 (the same engine with the
# TASKS default fill extended to TASK_IN 5), launched together; 1,800 s each, sampled every 60 s by lab/port/field-rate.js.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-field5; mkdir -p $OUT
PAIRS=${PAIRS:-8}; MAXNEW=${MAXNEW:-8}; SECS=${SECS:-1800}; n=0
CE=${IN5ENGINE:?set IN5ENGINE to the five-input field engine}
for i in $(seq 1 $PAIRS); do
  [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1))
  rm -f $OUT/p$i-in4.jsonl $OUT/p$i-in5.jsonl
  SECS=$SECS OUT=$OUT/p$i-in4.jsonl node lab/port/field-rate.js > $OUT/p$i-in4.log 2>&1 & a=$!
  SECS=$SECS ENGINE="$CE" OUT=$OUT/p$i-in5.jsonl node lab/port/field-rate.js > $OUT/p$i-in5.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb $(date +%s)" > $OUT/p$i.done
done
echo "ran $n"
