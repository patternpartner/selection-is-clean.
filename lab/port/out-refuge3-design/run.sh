#!/bin/bash
# #380 design (seen seeds from #379): the adaptive refuge, REPL_REFUGE=2, against #379's DEF and REFUGE runs of the same seeds
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-refuge3-design
for s in 11201 11202 11209 11213 11214 11215; do tag=${s}_ADAPT; [ -e $OUT/$tag.done ] && continue
  ( env SEED=$s TASKS=1 REPL_REFUGE=2 TICKS=12000 WIN=500 DIAG=1 RESEED_AT=1 RESEED=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part 2> $OUT/$tag.err && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; wait
