#!/bin/bash
# #369: which piece of world state a reload resets costs a restored population its payments? One process per arm: the world to
# 4,000, one reset (PERTURB), the same reseed k as its NULL in lab/port/out-pop, on to 6,000. A .done per run.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-reset; mkdir -p $OUT
SEEDS=${SEEDS:-10102}; ARMS=${ARMS:-"pools sun words pools,sun,words"}; K=${K:-1}
for s in $SEEDS; do for a in $ARMS; do tag=${s}_${a//,/+}_k$K; [ -e $OUT/$tag.done ] && continue
  ( env SEED=$s TASKS=1 TICKS=${TICKS:-6000} WIN=500 RESEED_AT=4000 RESEED=$K PERTURB=$a node lab/port/probe-reload.js > $OUT/$tag.jsonl 2> $OUT/$tag.err && touch $OUT/$tag.done ) &
done; done; wait
