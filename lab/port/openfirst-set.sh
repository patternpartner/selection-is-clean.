#!/bin/bash
# #476 (PREREG-openfirst.md): run the next unfinished pair of the registered set, one pair per launch.
cd "$(dirname "$0")/../.."; OUT=lab/port/out-openfirst-set; mkdir -p $OUT /home/user/of-edir
for k in 1 2 3 4 5 6 7 8; do [ -e $OUT/p$k.done ] && continue
  rm -f $OUT/p$k-*; EDIR=/home/user/of-edir OUT=$OUT TAG=p$k NAME=first FROM="__tk('__TASK_OPENFIRST',0)" TO="__tk('__TASK_OPENFIRST',1)" SECS=1200 lab/port/field-pair.sh
  echo "pair $k done"; exit 0; done; echo "all 8 done"
