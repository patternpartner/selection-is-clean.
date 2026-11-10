#!/bin/bash
# #394 DESIGN (seen seeds, not a decision): REPL_CROWD_K at five inputs. #382 chose K=450 in the four-input world, where it held
# the population to 400-1,250; five inputs (#392) pay more and the world is back near the array cap. One seed's arms run together.
#   SEEDS="10401" KS="450 300 200 130" TICKS=4000 lab/port/crowd5-design.sh
cd "$(dirname "$0")/../.."; OUT=${OUT:-lab/port/out-crowd5-design}; mkdir -p $OUT; TICKS=${TICKS:-4000}
for s in ${SEEDS:-10401}; do for k in ${KS:-450 300 200 130}; do tag=${s}_K$k; [ -e $OUT/$tag.done ] && continue
  ( { time env $X REPL_CROWD_K=$k SEED=$s TASKS=1 TICKS=$TICKS WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time \
    && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; wait; done; echo finished
