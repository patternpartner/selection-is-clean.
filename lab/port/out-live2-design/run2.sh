#!/bin/bash
# #385 design, round 2: four more SEEN seeds (10403 from #370; 11501-11503 from #382), same arms, 4,000 ticks, concurrent, CPU timed.
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-live2-design
for s in 10403 11501 11502 11503; do for arm in DEF NOLIVE; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in DEF) X="";; NOLIVE) X="LIVE_STACK=0";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
