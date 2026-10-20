#!/bin/bash
# One chunk of 'This Time': go on with every run that has a resume.pkl and no .done, then start new runs in the fixed order,
# up to MAXNEW processes at once; each stops after about MINUTES (default 24) and saves. Relaunch until all are done.
#   MAXNEW=4 video/this_time/run_batch.sh
# A run directory with neither .done nor resume.pkl died before its first save: it starts again from nothing (the result
# is the same, the learner being deterministic). A directory with a resume.pkl is never removed.
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
MINUTES=${MINUTES:-24}
R=../../out/this/runs
mkdir -p $R
ORDER=$(python3 -c "from worlds import ORDER; print(' '.join(ORDER))")
n=0
start() { python3 train.py $1 --out $R/$1 --minutes $MINUTES >> $R/$1.log 2>&1 & n=$((n+1)); }
for r in $ORDER; do
  [ $n -ge $MAXNEW ] && break
  [ -f $R/$r/resume.pkl ] && [ ! -f $R/$r/.done ] && start $r
done
for r in $ORDER; do
  [ $n -ge $MAXNEW ] && break
  d=$R/$r
  { [ -f $d/.done ] || [ -f $d/resume.pkl ]; } && continue
  rm -rf $d; mkdir -p $d
  start $r
done
wait
echo "done $(ls $R/*/.done 2>/dev/null | wc -l) of $(echo $ORDER | wc -w); part-way $(ls $R/*/resume.pkl 2>/dev/null | wc -l)"
