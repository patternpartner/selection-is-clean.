#!/bin/bash
# #465: build depth of new functions, shipped core world against the shuffle control. Skips finished runs (.done).
#   ARM=base|shuf SEEDS="11 12 13" TICKS=12000 lab/port/depth-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-depth465/${VER:-v2}; mkdir -p $OUT; ARM=${ARM:-base}; TICKS=${TICKS:-12000}
for s in ${SEEDS:-11 12 13}; do f=$OUT/$ARM-$s; [ -f $f.done ] && continue
  ( if [ $ARM = shuf ]; then export TASK_SHUFFLE=1; fi
    SEED=$s TASKS=1 MIND=20 TICKS=$TICKS EVERY=1000 node lab/port/probe-depth.js > $f.out 2> $f.err && touch $f.done ) &
done; wait
