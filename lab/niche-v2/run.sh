#!/bin/bash
# Runner for lab/PREREG-niche-v2.md. V0, V1, V3 on each seed at once; V2 on each seed starts when that seed's V1 is done,
# with its random-placement schedule [found, extend, copy-build] per 1,000 ticks read from V1's samples.
cd "$(dirname "$0")/../.." || exit 1
D=${OUT:-lab/niche-v2/raw}; mkdir -p "$D"; T=${TICKS:-600000}; SEEDS=${SEEDS:-10 11 12}
B='"CHEM":1,"NICHE":2'; T3='"NICHE_R":2,"NICHE_COPY":1,"NICHE_XCOST":0.02'; OP='"NICHE_OPEN":1,"NICHE_OPEN_P":0.125,"NICHE_OPEN_CAP":2'
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a.$s.all.jsonl" 2> "$D/$a.$s.err"; echo "$(date +%T) done $a $s exit $?"; }
v2(){ local s=$1; while [ ! -f "$D/V1.$s.done" ]; do sleep 20; done
  SCHED=$(node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2];const a=new Array(n/1000).fill(0).map(()=>[0,0,0]);for(const x of r){const k=x.niche;a[x.t/1000-1]=k?[k.found,k.ext,k.recB]:[0,0,0];}console.log(JSON.stringify(a))' "$D/V1.$s.all.jsonl" $T)
  run V2 $s "{$B,$T3,$OP,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$SCHED}"; }
for s in $SEEDS; do
  run V0 $s "{$B}" &
  ( run V1 $s "{$B,$T3,$OP}"; touch "$D/V1.$s.done" ) &
  run V3 $s "{$B,$T3}" &
  v2 $s &
done
wait; rm -f "$D"/V1.*.done; echo "$(date +%T) ALL DONE"
