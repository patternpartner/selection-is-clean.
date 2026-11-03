#!/bin/bash
# design runs for #377: default vs LIVE_STACK=0, timing each
cd "$(dirname "$0")"
for s in 10401 10402; do for a in DEF NOLIVE; do
  E=""; [ $a = NOLIVE ] && E="LIVE_STACK=0"
  ( t0=$(date +%s.%N); env $E SEED=$s TASKS=1 TICKS=4000 WIN=500 node ../probe-reload.js > ${s}_$a.jsonl 2> ${s}_$a.err; t1=$(date +%s.%N); echo "$t0 $t1" > ${s}_$a.time; touch ${s}_$a.done ) &
done; done
wait
