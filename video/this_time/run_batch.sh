#!/bin/bash
# One launch of 'This Time': keep MAXNEW runs going until about MINUTES from now, then stop. Runs part-way (a resume.pkl and
# no .done) go first, then new runs in the fixed order. Each process is told the minutes left, stops after the update that
# passes them, and saves; when one finishes early the next starts in its place, while more than MINLEFT minutes remain.
# Relaunch until all are done (each launch fits inside the ~30 minutes a job may run here).
#   MAXNEW=4 video/this_time/run_batch.sh
# A run whose process (its .pid, written at launch) is still running is live, and is never touched. A directory with
# neither .done nor resume.pkl, and not live, died before its first save: it starts again from nothing (the same result,
# the learner being deterministic). A directory with a resume.pkl is never removed.
cd "$(dirname "$0")"
MAXNEW=${MAXNEW:-4}
MINUTES=${MINUTES:-24}
MINLEFT=${MINLEFT:-4}
R=../../out/this/runs
mkdir -p $R
ORDER=$(python3 -c "from worlds import ORDER; print(' '.join(ORDER))")
END=$(( $(date +%s) + MINUTES * 60 ))
declare -A STARTED
live() { local p=$R/$1/.pid; [ -f $p ] && kill -0 $(cat $p) 2>/dev/null; }     # (signal 0: only asks if it exists)
skip() { [ -f $R/$1/.done ] || [ -n "${STARTED[$1]}" ] || live $1; }
next() {
  for r in $ORDER; do skip $r && continue; [ -f $R/$r/resume.pkl ] && { echo $r; return; }; done
  for r in $ORDER; do skip $r && continue; echo $r; return; done
}
start() {
  local d=$R/$1 left=$(( (END - $(date +%s)) / 60 ))
  [ -f $d/resume.pkl ] || { rm -rf $d; mkdir -p $d; }
  STARTED[$1]=1
  python3 train.py $1 --out $d --minutes $left >> $R/$1.log 2>&1 &
  echo $! > $d/.pid
}
while :; do
  while [ $(jobs -rp | wc -l) -lt $MAXNEW ] && [ $(( END - $(date +%s) )) -gt $(( MINLEFT * 60 )) ]; do
    r=$(next); [ -z "$r" ] && break
    start $r
  done
  [ $(jobs -rp | wc -l) -eq 0 ] && break
  wait -n
done
echo "done $(ls $R/*/.done 2>/dev/null | wc -l) of $(echo $ORDER | wc -w); part-way $(ls $R/*/resume.pkl 2>/dev/null | wc -l)"
