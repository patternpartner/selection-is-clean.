#!/bin/bash
# #467 (PREREG-entropy.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-entropy-set; mkdir -p $OUT /home/user/entropy-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/entropy-edir OUT=$OUT TAG=p$k NAME=noent FROM="__tk('__ENTROPY_PAIRS',1)" TO="__tk('__ENTROPY_PAIRS',0)" SECS=1200 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
