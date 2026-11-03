#!/bin/bash
# #377 design: LIVE_STACK=0 with one group of LIVE flags added back. Seed 10401, 1500 ticks.
cd "$(dirname "$0")"
declare -A G
G[niche]="__NICHE_FRONTIER=1,__NICHE_NDIM=1,__NICHE_LOCAL=1,__NICHE_BUILD=1,__RED_QUEEN=1,__FRONTIER_EXPAND=1,__SPATIAL_NICHE=1,__DIMS_SAT=3000"
G[novel]="__OPCODE_NOVELTY=1,__NOVELTY_ARCHIVE=1"
G[spec]="__SPECIATE=1,__COLO_SURV=1,__COLO_PIONEER=1,__MINT_GATE=cluster"
G[cosmos]="__COSMOS=1,__COSMOS_LAW=1"
G[group]="__GROUP_ROLES=1,__GROUP_COMMONS=1"
G[decide]="__DECIDE_REAL=1,__DECIDE=1"
G[atoms]="__RICH_GRAMMAR=1,__FORAGE_EYES=1,__ATOM_DURABLE=1,__REACH=1,__REACH_MAIN=1,__REACH_NOK=1,__ATOM_CREDIT=1,__EXPR_CREDIT=1,__EXPR_CREDIT_POP=1,__ATOM_CREDIT_VERT=1,__ATOM_NOVELTY_CREDIT=1,__ATOM_REPRO=1,__ATOM_ELIGIBILITY=1,__ATOM_RECOMB=1,__OEE_METER=1,__ATOM_WRSENSE=1,__DIMS_ATOM=1,__UA_INHERIT=1,__ATOM_NFD=1,__ATOM_OBJ=1,__ATOM_FRSENSE=1,__REACH_GAIN=1,__MEME_TRANSFER=1"
G[draw]="__DRAW_VM=1"
for k in "${!G[@]}"; do
  [ -f add_$k.done ] && continue
  ( LIVE_STACK=0 GLOBALS="${G[$k]}" SEED=10401 TASKS=1 TICKS=1500 WIN=500 node ../probe-reload.js > add_$k.jsonl 2> add_$k.err; touch add_$k.done ) &
done
wait
