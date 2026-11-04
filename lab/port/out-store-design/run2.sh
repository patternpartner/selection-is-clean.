#!/bin/bash
# #381 design, round 2: births gated by the store alone (PROV_BIRTH=0), and the full one-currency world (PROV_BIRTH=0 STORE_DEATH=1 AIM=0)
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-store-design
for s in 10401 10402; do for arm in NOPROV ONE; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue; X="PROV_BIRTH=0"; [ $arm = ONE ] && X="PROV_BIRTH=0 STORE_DEATH=1 AIM=0"
  ( env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
