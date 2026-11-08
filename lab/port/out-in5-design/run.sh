#!/bin/bash
# #392 design: FIVE-INPUT functions (TASK_IN=5). Seeds 10401-10403 (seen), 4,000 ticks, concurrent, CPU timed, the shipped world.
# The four-input arm is #389's DEF (byte-identical engine for TASK_IN=4).
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-in5-design
for s in 10401 10402 10403; do tag=${s}_IN5; [ -e $OUT/$tag.done ] && continue
  ( { time env TASK_IN=5 SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; wait
