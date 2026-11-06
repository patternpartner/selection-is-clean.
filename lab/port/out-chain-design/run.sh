#!/bin/bash
# #390 design: does the drain on read functions' pools (TASK_TROPHP, default 50) help or hurt depth? Seeds 10401-10403 (seen), 4,000
# ticks, concurrent, CPU timed, the shipped world. T0 = no drain; T50 = the default (identical to DEF); T100 = double.
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-chain-design
for s in 10401 10402 10403; do for arm in T0 T100; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in T0) X="TASK_TROPHP=0";; T100) X="TASK_TROPHP=100";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
