#!/bin/bash
# #377 design: drop ONE group of LIVE flags from the default TASKS world. Seed 10401, 4000 ticks. WHICH="a b" picks which.
cd "$(dirname "$0")"
declare -A G
G[cosmos]="__COSMOS=0,__COSMOS_LAW=0"
G[decide]="__DECIDE_REAL=0,__DECIDE=0"
G[group]="__GROUP_ROLES=0,__GROUP_COMMONS=0"
G[draw]="__DRAW_VM=0"
G[spec]="__SPECIATE=0,__COLO_SURV=0,__COLO_PIONEER=0,__MINT_GATE=0"
G[niche]="__NICHE_FRONTIER=0,__NICHE_NDIM=0,__NICHE_LOCAL=0,__NICHE_BUILD=0,__RED_QUEEN=0,__FRONTIER_EXPAND=0,__SPATIAL_NICHE=0,__DIMS_SAT=0"
G[arch]="__NOVELTY_ARCHIVE=0"
G[meme]="__MEME_TRANSFER=0"
for k in ${WHICH:-cosmos decide group draw}; do [ -f drop_$k.done ] && continue
  ( t0=$(date +%s.%N); GLOBALS="${G[$k]}" SEED=10401 TASKS=1 TICKS=4000 WIN=500 node ../probe-reload.js > drop_$k.jsonl 2> drop_$k.err; t1=$(date +%s.%N); echo "$t0 $t1" > drop_$k.time; touch drop_$k.done ) &
done
wait
