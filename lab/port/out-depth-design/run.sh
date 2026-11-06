#!/bin/bash
# #389 design: can programs reach deeper functions? Seeds 10401-10403 (seen), 4,000 ticks, concurrent, CPU timed, the shipped world.
# DEF; CAP32 = a fresh world's founding program-length cap 32 (VM_CAP0, default 16); DRAW50 = half of opcode draws are logic ops (TASK_DRAWP, default 25).
cd "$(dirname "$0")/../../.."; OUT=lab/port/out-depth-design
for s in 10401 10402 10403; do for arm in DEF CAP32 DRAW50; do tag=${s}_$arm; [ -e $OUT/$tag.done ] && continue
  case $arm in DEF) X="";; CAP32) X="VM_CAP0=32";; DRAW50) X="TASK_DRAWP=50";; esac
  ( { time env $X SEED=$s TASKS=1 TICKS=4000 WIN=500 DIAG=1 node lab/port/probe-reload.js > $OUT/$tag.jsonl.part ; } 2> $OUT/$tag.time && mv $OUT/$tag.jsonl.part $OUT/$tag.jsonl && touch $OUT/$tag.done ) &
done; done; wait
