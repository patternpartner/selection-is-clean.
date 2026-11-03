#!/bin/bash
# #376 (PREREG-shuffle.md): PAID x3 and SHUFFLE x3 (TASK_SHUFFLE=1) per seed, TASKS=1, 12,000 ticks, replicate k reseeded after tick 1.
# A .done per run; running runs write .part and are skipped by later launches while their pid lives. MAXNEW=n starts at most n.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-shuffle; mkdir -p $OUT
SEEDS=${SEEDS:-"10901 10902 10903"}; MAXNEW=${MAXNEW:-6}; started=0
busy(){ [ -e $OUT/$1.pid ] && kill -0 "$(cat $OUT/$1.pid)" 2>/dev/null; }
for k in 1 2 3; do for s in $SEEDS; do for arm in PAID SHUFFLE; do tag=${s}_${arm}$k; [ -e $OUT/$tag.done ] && continue; busy $tag && continue
  [ $started -ge $MAXNEW ] && break 3; started=$((started+1)); sh=0; [ $arm = SHUFFLE ] && sh=1
  ( env SEED=$s TASKS=1 TASK_SHUFFLE=$sh TICKS=12000 WIN=500 RESEED_AT=1 RESEED=$k node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
  echo $! > $OUT/$tag.pid
done; done; done
echo "started $started"; wait
