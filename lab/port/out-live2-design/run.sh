#!/bin/bash
# #385 design: does the LIVE stack still earn its place in the shipped one-currency TASKS world? Seeds 10401/10402 (seen), 4,000
# ticks, concurrent, CPU timed. DEF = TASKS=1 (now one currency held to a size); NOLIVE = the same with LIVE_STACK=0.
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-live2-design
for s in 10401 10402; do for arm in DEF NOLIVE; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in DEF) X="";; NOLIVE) X="LIVE_STACK=0";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
