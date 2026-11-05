#!/bin/bash
# #381 follow-up: CPU seconds per 12,000-tick world, one currency (the shipped TASKS default) against the old world
# (PROV_BIRTH=1 STORE_DEATH=0 AIM=1), seeds 11401/11402 reseeded as in the decision. bash's time reports user+sys CPU per run.
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-onespeed
for s in 11401 11402; do for arm in ONE OLD; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue; X=""; [ $arm = OLD ] && X="PROV_BIRTH=1 STORE_DEATH=0 AIM=1"
  ( { time env $X SEED=$s TASKS=1 TICKS=12000 WIN=500 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
