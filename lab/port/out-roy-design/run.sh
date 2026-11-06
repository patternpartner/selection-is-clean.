#!/bin/bash
# #391 design: a ROYALTY to the publishers of read words (TASK_ROYP, default 0). Seeds 10401-10403 (seen), 4,000 ticks, concurrent, CPU
# timed, the shipped world. R25 / R50 = 25 / 50 percent of a paid word's pay split among its read words' publishers. DEF = #389's.
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-roy-design
for s in 10401 10402 10403; do for arm in R25 R50; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in R25) X="TASK_ROYP=25";; R50) X="TASK_ROYP=50";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
