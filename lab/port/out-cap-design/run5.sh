#!/bin/bash
# #382 design, round 5: a steeper density price (REPL_CROWD_K 300, 450) on the one-currency world, concurrent, CPU timed
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-cap-design
for s in 10401 10402; do for k in 300 450; do tag=${s}_K$k; [ -e $OUT/$tag.done ] && continue
  ( { time env PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=$k SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
