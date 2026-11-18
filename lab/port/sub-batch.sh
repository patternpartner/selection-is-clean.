#!/bin/bash
# #455 (PREREG-sub.md): TASK_SUB arms on node seeds, 12,000 ticks. A .done per run; skips finished runs and runs whose pid lives.
# ARMS="1:11 1:12 ..." (mode:seed), MAXNEW=n starts at most n new runs. Output lab/port/out-sub/m<mode>-<seed>.{out,err}.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-sub; mkdir -p $OUT
ARMS=${ARMS:-"1:12 1:13 1:14 0:14"}; MAXNEW=${MAXNEW:-3}; TICKS=${TICKS:-12000}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for a in $ARMS; do m=${a%%:*}; s=${a##*:}; n=$([ $m = 0 ] && echo ship || echo sub)-$s; [ -n "$EXTRA" ] && n=$n-$EXTRA
  [ -e $OUT/$n.done ] && continue; busy $n && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  ( env SEED=$s TASKS=1 MIND=20 TICKS=$TICKS EVERY=2000 TASK_SUB=$m $ENVX node lab/port/digest.js > $OUT/$n.out 2> $OUT/$n.err && touch $OUT/$n.done ) &
  echo $! > $OUT/$n.pid
done; echo "started $started"; wait
