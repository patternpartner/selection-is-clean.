#!/bin/bash
# #382 design, round 3: the cliff between a birth price of 0.25 (cap-bound) and 0.5 (dying): 300, 350, 400 thousandths
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-cap-design
for s in 10401 10402; do for c in 300 350 400; do tag=${s}_B$c; [ -e $OUT/$tag.done ] && continue
  ( { time env PROV_BIRTH=0 STORE_DEATH=1 AIM=0 REPL_BIRTH_COSTM=$c SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
