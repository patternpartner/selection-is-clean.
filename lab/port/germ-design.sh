#!/bin/bash
# #394 DESIGN: per seed, one world to tick T writes the AMP and VIS genomes (probe-germ.js); each is then booted as a harvest
# is (probe-reload.js LOAD=) for TICKS ticks. Stage markers: <seed>.save.done, <seed>_<ARM>.done.
cd "$(dirname "$0")/../.."; OUT=${OUT:-lab/port/out-germ-design}; mkdir -p $OUT; T=${T:-3000}; TICKS=${TICKS:-2000}
for s in ${SEEDS:-10401 10402 10403}; do (
  [ -e $OUT/$s.save.done ] || { SEED=$s T=$T OUTDIR=$OUT TASKS=1 node lab/port/probe-germ.js > $OUT/$s.save.json && touch $OUT/$s.save.done; }
  [ -e $OUT/$s.save.done ] && for arm in AMP VIS; do [ -e $OUT/${s}_$arm.done ] && continue
    ( { time env SEED=$s TASKS=1 TICKS=$TICKS WIN=250 LOAD=$OUT/${s}_$arm.genome node lab/port/probe-reload.js > $OUT/${s}_$arm.jsonl.part ; } 2> $OUT/${s}_$arm.time \
      && mv $OUT/${s}_$arm.jsonl.part $OUT/${s}_$arm.jsonl && touch $OUT/${s}_$arm.done ) & done; wait ) &
done; wait; echo finished
