#!/bin/bash
# #377 design: drop the cosmos group (COSMOS, COSMOS_LAW) on seed 10402, 4000 ticks (10402_DEF is the comparison)
cd "$(dirname "$0")"; t=10402_NOCOSMOS; [ -f $t.done ] && exit 0
t0=$(date +%s.%N); GLOBALS="__COSMOS=0,__COSMOS_LAW=0" SEED=10402 TASKS=1 TICKS=4000 WIN=500 node ../probe-reload.js > $t.jsonl.part 2> $t.err && mv $t.jsonl.part $t.jsonl && echo "$t0 $(date +%s.%N)" > $t.time && touch $t.done
