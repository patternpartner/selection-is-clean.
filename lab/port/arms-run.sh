#!/bin/bash
# #407: one field with arms, alone on the machine, SECS (1,500); prints the per-arm reading.
#   NAME=troph ARMS='TASK_TROPHP:25/50/75/100' [OFF=2] lab/port/arms-run.sh
cd "$(dirname "$0")/../.."; mkdir -p lab/port/out-arms; H="#arms=${ARMS:?}"; [ -n "$OFF" ] && H="$H,armoff=$OFF"
( cd lab/port && HASH="$H" SECS=${SECS:-1500} EVERY=60 OUT=out-arms/${NAME:?}.jsonl node field-rate.js > out-arms/$NAME.log 2>&1 )
node lab/port/analyse-arms.js lab/port/out-arms/$NAME.jsonl
