#!/bin/bash
# #466 (PREREG-cap.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-cap-set; mkdir -p $OUT /home/user/cap-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/cap-edir OUT=$OUT TAG=p$k NAME=cap1 FROM="const INTERACTION_CAP=10;" TO="const INTERACTION_CAP=1;" SECS=1200 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
