#!/bin/bash
# #465c (PREREG-klin.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-klin-set; mkdir -p $OUT /home/user/klin-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/klin-edir OUT=$OUT TAG=p$k NAME=klin FROM="__tk('__TASK_KLIN',0)" TO="__tk('__TASK_KLIN',1)" SECS=1500 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
