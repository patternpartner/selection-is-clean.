#!/bin/bash
# Start up to MAXNEW runs of 'Teach It Once' that have no .done and whose phase 1 (if any) is done; wait; relaunch.
#   MAXNEW=4 video/teach_once/run_batch.sh
#   first-s : phase 1, the garden, 4M steps          A-s : first-s, then paid for what the cameras see (8M)
#   B-s     : first-s, then cameras minus catches    C-s : cameras minus catches from scratch (8M) - the control
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
R=../../out/teach/runs
n=0
launch() { # name arm steps init
  local d=$R/$1; [ -f $d/.done ] && return; [ $n -ge $MAXNEW ] && return
  if [ -n "$4" ] && [ ! -f $R/first-${1##*-}/.done ]; then return; fi
  rm -rf $d; mkdir -p $d
  python3 train.py --arm $2 --seed ${1##*-} --steps $3 ${4:+--init $4} --out $d > $d.log 2>&1 &
  n=$((n+1))
}
for s in 6 7 8 9 10; do launch first-$s garden 4000000; done
for s in 6 7 8 9 10; do
  launch B-$s inspected 8000000 $R/first-$s/ckpt_1.00.pt
  launch A-$s camera 8000000 $R/first-$s/ckpt_1.00.pt
  launch C-$s inspected 8000000
done
wait
ls $R/*/.done 2>/dev/null | wc -l
