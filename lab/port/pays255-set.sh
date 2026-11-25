#!/bin/bash
# #473 (PREREG-pays255.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-pays255-set; mkdir -p $OUT /home/user/pays255-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/pays255-edir OUT=$OUT TAG=p$k NAME=pays255 FROM="__tk('__TASK_PAYS',2)" TO="__tk('__TASK_PAYS',255)" SECS=1200 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
