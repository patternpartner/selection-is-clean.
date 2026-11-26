#!/bin/bash
# #468 (PREREG-cap0.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-cap0-set; mkdir -p $OUT /home/user/cap0-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/cap0-edir OUT=$OUT TAG=p$k NAME=cap0 FROM="const INTERACTION_CAP=1;" TO="const INTERACTION_CAP=0;" SECS=1200 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
