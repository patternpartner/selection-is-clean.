#!/bin/bash
# #377 design: AIM_FLAT=1 (mean aim payment to all), 4000 ticks, the two design seeds
cd "$(dirname "$0")"
for s in 10401 10402; do [ -f ${s}_FLAT.done ] && continue
  ( t0=$(date +%s.%N); AIM_FLAT=1 SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node ../probe-reload.js > ${s}_FLAT.jsonl 2> ${s}_FLAT.err; t1=$(date +%s.%N); echo "$t0 $t1" > ${s}_FLAT.time; touch ${s}_FLAT.done ) &
done
wait
