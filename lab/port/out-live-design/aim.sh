#!/bin/bash
# #377 design: the default TASKS world with AIM=0, 4000 ticks, the two design seeds (DEF runs already made by run.sh)
cd "$(dirname "$0")"
for s in 10401 10402; do [ -f ${s}_NOAIM.done ] && continue
  ( t0=$(date +%s.%N); AIM=0 SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node ../probe-reload.js > ${s}_NOAIM.jsonl 2> ${s}_NOAIM.err; t1=$(date +%s.%N); echo "$t0 $t1" > ${s}_NOAIM.time; touch ${s}_NOAIM.done ) &
done
wait
