#!/bin/bash
# #381 design: STORE_DEATH=1, with and without AIM, on #377's design seeds 10401/10402 (DEF in out-live-design), 4000 ticks
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-store-design
for s in 10401 10402; do for arm in STORE STORENOAIM; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue; X="STORE_DEATH=1"; [ $arm = STORENOAIM ] && X="STORE_DEATH=1 AIM=0"
  ( env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
