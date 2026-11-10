#!/bin/bash
# #397 DESIGN (seen seeds, not a decision): TASK_GROUND 0 against 1 in the shipped TASKS world, TICKS ticks, CPU by bash's time.
#   SEEDS="10401 10402" TICKS=4000 lab/port/ground-design.sh
cd "$(dirname "$0")/../.."; OUT=${OUT:-lab/port/out-ground-design}; mkdir -p $OUT; TICKS=${TICKS:-4000}
for s in ${SEEDS:-10401}; do for g in ${GS:-0 1}; do tag=${s}_G$g; [ -e $OUT/$tag.done ] && continue
  ( { time env $X TASK_GROUND=$g SEED=$s TASKS=1 TICKS=$TICKS WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait; echo finished
