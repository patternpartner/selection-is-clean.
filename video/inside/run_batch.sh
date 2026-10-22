#!/bin/bash
# The decision runs of 'Inside' (video/tests/inside.md): camera and garden, seeds 41-45, 16M steps, from scratch.
# One launch: keep 4 going for about MINUTES (resumable; a run whose .pid is alive is never touched). Relaunch until 10.
cd "$(dirname "$0")"
MINUTES=${MINUTES:-24}; MAXNEW=${MAXNEW:-4}
R=../../out/inside/runs; mkdir -p $R
ORDER="camera-41 garden-41 camera-42 garden-42 camera-43 garden-43 camera-44 garden-44 camera-45 garden-45"
END=$(( $(date +%s) + MINUTES * 60 ))
declare -A STARTED
live() { local p=$R/$1/.pid; [ -f $p ] && kill -0 $(cat $p) 2>/dev/null; }
skip() { [ -f $R/$1/.done ] || [ -n "${STARTED[$1]}" ] || live $1; }
next() {
  for r in $ORDER; do skip $r && continue; [ -f $R/$r/resume.pkl ] && { echo $r; return; }; done
  for r in $ORDER; do skip $r && continue; echo $r; return; done
}
start() {
  local d=$R/$1 left=$(( (END - $(date +%s)) / 60 ))
  [ -f $d/resume.pkl ] || { rm -rf $d; mkdir -p $d; }
  STARTED[$1]=1
  python3 train.py --arm ${1%-*} --seed ${1##*-} --steps 16000000 --minutes $left --out $d >> $R/$1.log 2>&1 &
  echo $! > $d/.pid
}
while :; do
  while [ $(jobs -rp | wc -l) -lt $MAXNEW ] && [ $(( END - $(date +%s) )) -gt 240 ]; do
    r=$(next); [ -z "$r" ] && break
    start $r
  done
  [ $(jobs -rp | wc -l) -eq 0 ] && break
  wait -n
done
echo "done $(ls $R/*/.done 2>/dev/null | wc -l) of 10; part-way $(ls $R/*/resume.pkl 2>/dev/null | wc -l)"
