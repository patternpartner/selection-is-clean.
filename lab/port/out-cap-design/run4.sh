#!/bin/bash
# #382 design, round 4: the one-currency world with a density-dependent birth price (REPL_CROWD_K 600, 900) against OLD, concurrent, CPU timed
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-cap-design
for s in 10401 10402; do for arm in OLD3 K600 K900; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in OLD3) X="";; K600) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=600";; K900) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_CROWD_K=900";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
