#!/bin/bash
# #431 (PREREG-mind-learn.md): pairs of browser fields run together, the learning mind against the same writes drawn without a model.
# 1,500 s each; one pair a launch (MAXNEW, default 1); a pair with no .done is rerun from scratch.
#   EDIR=dir-for-the-engine-copy [PAIRS="1 2 ... 6"] lab/port/mind-learn-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-mind; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0
for i in ${PAIRS:-1 2 3 4 5 6}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*
  OUT=$OUT TAG=p$i lab/port/mind-pair.sh
done; echo "ran $n"
