#!/bin/bash
# Start up to MAXNEW runs of 'Out of Habit' that have no .done; wait. Relaunch until all 10 are done (each batch < 30 min).
#   MAXNEW=4 video/out_of_habit/run_batch.sh      brief-trusted and brief-watched, seeds 31-35 (from Trusted's garden-s at 15%)
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
n=0
launch() { # dir arm seed
  local d=$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed $3 --out $d > $d.log 2>&1 &
  n=$((n+1))
}
for s in 31 32 33 34 35; do launch ../../out/habit/runs/brief-trusted-$s brief-trusted $s; launch ../../out/habit/runs/brief-watched-$s brief-watched $s; done
wait
ls ../../out/habit/runs/*/.done 2>/dev/null | wc -l
