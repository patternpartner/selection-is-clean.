#!/bin/bash
# Runner for lab/PREREG-random-lysis.md. Phase 1: arms c, v, m, o on seeds 4-6 (7 at a time).
# Phase 2: arm r on each seed, its kill schedule read from that seed's v run (per-sample ev.lysed).
cd "$(dirname "$0")/../.." || exit 1
D=${OUT:-lab/random-lysis/raw}; mkdir -p "$D"; T=${TICKS:-600000}; SEEDS=${SEEDS:-4 5 6}
ALLKEYS=$(node -e 'console.log(JSON.stringify([...Array(1024).keys()]))')
declare -A OPT
OPT[c]='{"CHEM":1}'
OPT[v]='{"CHEM":1,"VIRUS":1}'
OPT[m]='{"CHEM":1,"VIRUS":1,"V_MUT":0}'
OPT[o]='{"CHEM":1,"VIRUS":1,"V_MUT":0,"V_IMMIG":0,"V_SEEDN":30,"V_SEED":'"$ALLKEYS"'}'
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a.$s.all.jsonl" 2> "$D/$a.$s.err"; echo "$(date +%T) done $a $s exit $?"; }
jobs_wait(){ while [ "$(jobs -rp | wc -l)" -ge "$1" ]; do sleep 5; done; }
for a in v c m o; do for s in $SEEDS; do jobs_wait 7; run $a $s "${OPT[$a]}" & done; done
wait
for s in $SEEDS; do
  SCHED=$(node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2];const a=new Array(n/1000).fill(0);for(const x of r)a[x.t/1000-1]=x.ev.lysed||0;console.log(JSON.stringify(a))' "$D/v.$s.all.jsonl" $T)
  run r $s '{"CHEM":1,"LYSIS_EVERY":1000,"LYSIS_SCHED":'"$SCHED"'}' &
done
wait; echo "$(date +%T) ALL DONE"
