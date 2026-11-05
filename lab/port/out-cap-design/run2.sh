#!/bin/bash
# #382 design, round 2: the one-currency world with a dearer birth (REPL_BIRTH_COSTM 500, 800), against OLD and ONE, concurrent, CPU timed
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-cap-design
for s in 10401 10402; do for arm in OLD2 ONE2 B500 B800; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in OLD2) X="";; ONE2) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0";; B500) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_BIRTH_COSTM=500";; B800) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_BIRTH_COSTM=800";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
