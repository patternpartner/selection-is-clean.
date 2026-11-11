#!/bin/bash
# #398: one pair of browser fields run together, the shipped engine (the ground remembers) against a copy whose TASKS default fill
# sets TASK_GROUND to MODE (2: the ground forgets at the epoch boundary; 0: no ground). SECS each. Set EDIR for the copy, never TMPDIR.
#   EDIR=dir MODE=2 TAG=a lab/port/ground-control.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-ground-control; mkdir -p $OUT; SECS=${SECS:-1500}; MODE=${MODE:?}; TAG=${TAG:-a}; E=${EDIR:-/tmp}/engine-groundmode$MODE.html
[ "$(grep -cF "globalThis.__TASK_GROUND=1;" engine.html)" = 1 ] || { echo "pattern count"; exit 1; }
sed "s/globalThis.__TASK_GROUND=1;/globalThis.__TASK_GROUND=$MODE;/" engine.html > $E
SECS=$SECS EVERY=60 OUT=$OUT/$TAG-ground.jsonl node lab/port/field-rate.js > $OUT/$TAG-ground.log 2>&1 & a=$!
SECS=$SECS EVERY=60 ENGINE=$E OUT=$OUT/$TAG-mode$MODE.jsonl node lab/port/field-rate.js > $OUT/$TAG-mode$MODE.log 2>&1 & b=$!
wait $a; wait $b; echo done > $OUT/$TAG.done
