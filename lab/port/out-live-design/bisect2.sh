#!/bin/bash
# #377 design, round 2: which of the novelty pair carries the world, and is it AIM (inside the OPCODE_NOVELTY branch)?
cd "$(dirname "$0")"
run(){ n=$1; shift; [ -f b2_$n.done ] && return; ( env "$@" SEED=10401 TASKS=1 TICKS=1500 WIN=500 node ../probe-reload.js > b2_$n.jsonl 2> b2_$n.err; touch b2_$n.done ) & }
run opnov  LIVE_STACK=0 GLOBALS=__OPCODE_NOVELTY=1
run arch   LIVE_STACK=0 GLOBALS=__NOVELTY_ARCHIVE=1
run opnov_noaim LIVE_STACK=0 AIM=0 GLOBALS=__OPCODE_NOVELTY=1
run def_noaim AIM=0
run def_noopnov GLOBALS=__OPCODE_NOVELTY=0
wait
