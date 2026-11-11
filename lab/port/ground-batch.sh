#!/bin/bash
# #397 (PREREG-ground.md): pairs of browser fields run together, today's engine against a copy with TASK_GROUND's default 1; 1,500 s.
# Pair "s" is the control: GROUND against GROUND + TASK_SHUFFLE. A .done per pair; MAXNEW pairs a launch (default 1).
#   EDIR=dir-for-engine-copies [PAIRS="1 2 ... 8 s"] lab/port/ground-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-ground; mkdir -p $OUT; SECS=${SECS:-1500}; MAXNEW=${MAXNEW:-1}; n=0; ED=${EDIR:-/tmp}
for pat in "__tk('__TASK_GROUND',0)" "__tk('__TASK_SHUFFLE',0)"; do [ "$(grep -cF "$pat" engine.html)" = 1 ] || { echo "pattern count: $pat"; exit 1; }; done
sed "s/__tk('__TASK_GROUND',0)/__tk('__TASK_GROUND',1)/" engine.html > $ED/engine-ground.html
sed "s/__tk('__TASK_GROUND',0)/__tk('__TASK_GROUND',1)/; s/__tk('__TASK_SHUFFLE',0)/__tk('__TASK_SHUFFLE',1)/" engine.html > $ED/engine-ground-shuffle.html
for i in ${PAIRS:-1 2 3 4 5 6 7 8 s}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*.jsonl
  if [ $i = s ]; then A=$ED/engine-ground.html; B=$ED/engine-ground-shuffle.html; an=ground; bn=shuffle; else A=engine.html; B=$ED/engine-ground.html; an=today; bn=ground; fi
  SECS=$SECS EVERY=60 ENGINE=$A OUT=$OUT/p$i-$an.jsonl node lab/port/field-rate.js > $OUT/p$i-$an.log 2>&1 & a=$!
  SECS=$SECS EVERY=60 ENGINE=$B OUT=$OUT/p$i-$bn.jsonl node lab/port/field-rate.js > $OUT/p$i-$bn.log 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?; echo "$ra $rb" > $OUT/p$i.done
done; echo "ran $n"
