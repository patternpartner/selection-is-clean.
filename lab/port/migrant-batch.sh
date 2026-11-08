#!/bin/bash
# #393 (PREREG-migrant.md): 6 pairs of browser fields, AMP (engine.html at a8835c0, the amplitude-gated migrant) and VIS (today's
# engine.html, the visAmp gate), launched together; 1,800 s each, sampled every 60 s by lab/port/field-rate.js.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-migrant; mkdir -p $OUT
PAIRS=${PAIRS:-6}; MAXNEW=${MAXNEW:-8}; SECS=${SECS:-1800}; n=0
AE=${TMPDIR:-/tmp}/engine-a8835c0.html; [ -s "$AE" ] || git show a8835c0:engine.html > "$AE"
for i in $(seq 1 $PAIRS); do
  [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1))
  rm -f $OUT/p$i-amp.jsonl $OUT/p$i-vis.jsonl
  SECS=$SECS ENGINE="$AE" OUT=$OUT/p$i-amp.jsonl node lab/port/field-rate.js > $OUT/p$i-amp.log 2>&1 & a=$!
  SECS=$SECS OUT=$OUT/p$i-vis.jsonl node lab/port/field-rate.js > $OUT/p$i-vis.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb $(date +%s)" > $OUT/p$i.done
done
echo "ran $n"
