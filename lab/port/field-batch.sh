#!/bin/bash
# #383 (PREREG-field.md): 8 pairs of browser fields, OLD (today's engine.html) and CROWD (engine.html at 1b04adf, the #382 ship),
# launched together so they share the machine; 1,800 s of wall clock each, sampled every 60 s by lab/port/field-rate.js.
# A pair writes p<i>.done (the two exit codes) when both browsers have closed. MAXNEW=n runs at most n pairs, then exits.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-field; mkdir -p $OUT
PAIRS=${PAIRS:-8}; MAXNEW=${MAXNEW:-8}; SECS=${SECS:-1800}; n=0
CE=${TMPDIR:-/tmp}/engine-crowd-1b04adf.html; [ -s "$CE" ] || git show 1b04adf:engine.html > "$CE"
for i in $(seq 1 $PAIRS); do
  [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1))
  rm -f $OUT/p$i-old.jsonl $OUT/p$i-crowd.jsonl
  SECS=$SECS OUT=$OUT/p$i-old.jsonl node lab/port/field-rate.js > $OUT/p$i-old.log 2>&1 & a=$!
  SECS=$SECS ENGINE="$CE" OUT=$OUT/p$i-crowd.jsonl node lab/port/field-rate.js > $OUT/p$i-crowd.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb $(date +%s)" > $OUT/p$i.done
done
echo "ran $n"
