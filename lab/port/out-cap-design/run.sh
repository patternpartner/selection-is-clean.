#!/bin/bash
# #382 design: can a smaller one-currency world win per CPU-hour? Seeds 10401/10402 (seen), 4,000 ticks, concurrent, CPU timed.
# OLD = today's TASKS world; ONE = PROV_BIRTH=0 STORE_DEATH=1 AIM=0; SUN10 = ONE with sunlight at 10% of REPL's (default 25).
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-cap-design
for s in 10401 10402; do for arm in OLD ONE SUN10; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in OLD) X="";; ONE) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0";; SUN10) X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0 TASK_SUNP=10";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
