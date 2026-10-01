#!/bin/bash
# Runner for lab/PREREG-niche.md. Phase 1: N0, N1, N2 on the seeds (all at once). Phase 2: N3 on each seed, its random-founding
# schedule read from that seed's N2 run (per-sample niche.found).
cd "$(dirname "$0")/../.." || exit 1
D=${OUT:-lab/niche/raw}; mkdir -p "$D"; T=${TICKS:-1200000}; SEEDS=${SEEDS:-7 8 9}
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a.$s.all.jsonl" 2> "$D/$a.$s.err"; echo "$(date +%T) done $a $s exit $?"; }
n3(){ local s=$1; while [ ! -f "$D/N2.$s.done" ]; do sleep 20; done
  SCHED=$(node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2];const a=new Array(n/1000).fill(0);for(const x of r)a[x.t/1000-1]=x.niche?x.niche.found:0;console.log(JSON.stringify(a))' "$D/N2.$s.all.jsonl" $T)
  run N3 $s '{"CHEM":1,"NICHE":3,"NICHE_EVERY":1000,"NICHE_FOUND_SCHED":'"$SCHED"'}'; }
for s in $SEEDS; do
  run N0 $s '{"CHEM":1}' &
  run N1 $s '{"CHEM":1,"NICHE":1}' &
  ( run N2 $s '{"CHEM":1,"NICHE":2}'; touch "$D/N2.$s.done" ) &
  n3 $s &
done
wait; rm -f "$D"/N2.*.done; echo "$(date +%T) ALL DONE"
