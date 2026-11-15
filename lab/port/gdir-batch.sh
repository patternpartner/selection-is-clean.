#!/bin/bash
# #437 (PREREG-gdir.md): pairs of browser fields run together, the engine of commit 909e672 against the same file with TASK_GDIR's default 1.
# BOTH arms run frozen copies taken from that commit, so the working tree's engine.html can change while a pair runs.
# 1,500 s each; one pair a launch (MAXNEW, default 1); a pair with no .done is rerun from scratch.
#   EDIR=dir-for-the-engine-copies [PAIRS="1 2 ... 8"] lab/port/gdir-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-gdir; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0; E=${EDIR:?}
git show 909e672:engine.html > $E/gdir-ship.html
FROM="__tk('__TASK_GDIR',0)"; [ "$(grep -cF "$FROM" $E/gdir-ship.html)" = 1 ] || { echo "pattern count"; exit 1; }
sed "s/__tk('__TASK_GDIR',0)/__tk('__TASK_GDIR',1)/" $E/gdir-ship.html > $E/gdir-arm.html; cmp -s $E/gdir-ship.html $E/gdir-arm.html && { echo identical; exit 1; }
for i in ${PAIRS:-2 3 4 5 6 7 8 9}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*
  SECS=1500 EVERY=60 ENGINE=$E/gdir-ship.html OUT=$OUT/p$i-base.jsonl node lab/port/field-rate.js > $OUT/p$i-base.log 2>&1 & a=$!
  SECS=1500 EVERY=60 ENGINE=$E/gdir-arm.html OUT=$OUT/p$i-gdir.jsonl node lab/port/field-rate.js > $OUT/p$i-gdir.log 2>&1 & b=$!
  wait $a; wait $b; echo done > $OUT/p$i.done
done; echo "ran $n"
