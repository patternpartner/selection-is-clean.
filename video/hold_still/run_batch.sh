#!/bin/bash
# Start up to MAXNEW runs of 'Hold Still' that have no .done; wait. Relaunch until all are done (each batch < 30 min).
#   MAXNEW=4 video/hold_still/run_batch.sh             the decision runs: four arms x seeds 11-15
#   DEV=1 MAXNEW=2 video/hold_still/run_batch.sh       the dev check: the broken arm on seeds 401-402
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
launch() { # dir arm seed
  local d=$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed $3 --out $d > $d.log 2>&1 &
  n=$((n+1))
}
if [ -n "$DEV" ]; then
  for s in 401 402; do launch ../../out/still/dev/broken-$s broken $s; done
else
  for s in 11 12 13 14 15; do for arm in costs paid interruptible broken; do launch ../../out/still/runs/$arm-$s $arm $s; done; done
fi
wait
ls ../../out/still/runs/*/.done ../../out/still/dev/*/.done 2>/dev/null | wc -l
