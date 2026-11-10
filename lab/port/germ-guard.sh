#!/bin/bash
# #394 guard (PREREG-germ.md): seeds 12113-12120, GERM_STORE 0 against 1 in the shipped TASKS world, 6,000 ticks, CPU by bash's time.
# A .done per run; MAXNEW=n starts at most n new runs.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-germ-guard; mkdir -p $OUT; MAXNEW=${MAXNEW:-3}; started=0
for s in $(seq 12113 12120); do for a in 0 1; do tag=${s}_G$a; [ -e $OUT/$tag.done ] && continue; [ $started -ge $MAXNEW ] && break 2; started=$((started+1)); rm -f $OUT/$tag.*
  ( { time env GERM_STORE=$a SEED=$s TASKS=1 TICKS=6000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; echo "started $started"; wait
