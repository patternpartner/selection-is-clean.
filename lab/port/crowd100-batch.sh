#!/bin/bash
# #416 (PREREG-crowd100.md): pairs of browser fields run together, today's engine against a copy with REPL_CROWD_K's TASKS default 100.
# 1,500 s each; one pair a launch (MAXNEW, default 1); a pair with no .done is rerun from scratch.
#   EDIR=dir-for-the-engine-copy [PAIRS="1 2 ... 8"] lab/port/crowd100-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-crowd100; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0
for i in ${PAIRS:-1 2 3 4 5 6 7 8}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*
  OUT=$OUT TAG=p$i NAME=k100 FROM="if(globalThis.__REPL_CROWD_K===undefined)globalThis.__REPL_CROWD_K=450;" \
    TO="if(globalThis.__REPL_CROWD_K===undefined)globalThis.__REPL_CROWD_K=100;" lab/port/field-pair.sh
done; echo "ran $n"
