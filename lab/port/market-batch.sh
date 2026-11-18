#!/bin/bash
# #454 (PREREG-market.md): TASK_MKT modes on node seeds, 12,000 ticks. A .done per run; skips finished runs and runs whose pid lives.
# ARMS="1:11 1:12 ..." (mode:seed), MAXNEW=n starts at most n new runs. Output lab/port/out-market/m<mode>-<seed>.{out,err}.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-market; mkdir -p $OUT
ARMS=${ARMS:-"1:11 1:12 1:13 2:11 2:12 2:13 3:11 3:12 3:13"}; MAXNEW=${MAXNEW:-3}; TICKS=${TICKS:-12000}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for a in $ARMS; do m=${a%%:*}; s=${a##*:}; n=m$m-$s; [ -n "$EXTRA" ] && n=$n-$EXTRA
  [ -e $OUT/$n.done ] && continue; busy $n && continue; [ $started -ge $MAXNEW ] && break; started=$((started+1))
  ( env SEED=$s TASKS=1 MIND=20 TICKS=$TICKS EVERY=2000 TASK_MKT=$m $ENVX node lab/port/digest.js > $OUT/$n.out 2> $OUT/$n.err && touch $OUT/$n.done ) &
  echo $! > $OUT/$n.pid
done; echo "started $started"; wait
