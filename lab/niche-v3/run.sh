#!/bin/bash
# Runner for lab/PREREG-niche-v3.md. W0 and W1 on each seed start at once; W2 and W3 on a seed start when that seed's W1
# is done: W2 gets W1's per-1,000-tick [found, extend, recipe-build, maintain] counts as a random-placement schedule;
# W3 gets W1's per-sample builder share as the probability a child is a builder (trait not inherited).
# Launch with:  (nohup lab/niche-v3/run.sh > lab/niche-v3/raw/run.log 2>&1 &)      Re-run one: ONLY="W2 14" lab/niche-v3/run.sh
cd "$(dirname "$0")/../.." || exit 1
D=${OUT:-lab/niche-v3/raw}; mkdir -p "$D"; T=${TICKS:-900000}; SEEDS=${SEEDS:-13 14 15}
V2='"CHEM":1,"NICHE":2,"NICHE_R":2,"NICHE_COPY":1,"NICHE_OPEN":1,"NICHE_OPEN_P":0.125,"NICHE_OPEN_CAP":2,"NICHE_GC":1'
W0="$V2,\"NICHE_XCOST\":0.02"
W1="$V2,\"NICHE_XCOST\":0.1,\"NICHE_BCOST\":0.3,\"NICHE_BLD\":1,\"NICHE_UP\":1,\"NICHE_UCOST\":0.05"
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a.$s.all.jsonl" 2> "$D/$a.$s.err"; local e=$?; echo "$(date +%T) done $a $s exit $e"; [ $e = 0 ] && [ $(wc -l < "$D/$a.$s.all.jsonl") = $((T/1000)) ] && touch "$D/$a.$s.done"; }
sched(){ node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2]/1000;
  const a=new Array(n).fill(0).map(()=>process.argv[3]==="b"?0.5:[0,0,0,0]);for(const x of r){const k=x.niche;a[x.t/1000-1]=process.argv[3]==="b"?k.builderShare:[k.found,k.ext,k.recB,k.maint];}console.log(JSON.stringify(a))' "$D/W1.$1.all.jsonl" $T $2; }
w1(){ local s=$1; while [ ! -f "$D/W1.$s.done" ]; do sleep 30; done; }
w2(){ w1 $1; run W2 $1 "{$W1,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $1 r)}"; }
w3(){ w1 $1; run W3 $1 "{$W1,\"NICHE_EVERY\":1000,\"NICHE_BSCHED\":$(sched $1 b)}"; }
if [ -n "$ONLY" ]; then set -- $ONLY; case $1 in W0) run W0 $2 "{$W0}";; W1) run W1 $2 "{$W1}";; W2) w2 $2;; W3) w3 $2;; esac; exit; fi
for s in $SEEDS; do
  [ -f "$D/W0.$s.done" ] || run W0 $s "{$W0}" &
  [ -f "$D/W1.$s.done" ] || run W1 $s "{$W1}" &
  [ -f "$D/W2.$s.done" ] || w2 $s &
  [ -f "$D/W3.$s.done" ] || w3 $s &
done
wait; echo "$(date +%T) ALL DONE"
