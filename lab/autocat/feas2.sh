#!/bin/bash
# Phase A2 runner (TRIAL seeds only). Like feas.sh, for scarcity: SCAR (json fields) is added to FULL and NOAC and hence to
# RAND/RANDN/SHUF (built from FULL, matched to FULL's schedules). FULLNS (FULL without scarcity) runs if NS=1.
#   OUT=/tmp/sc/D1 SCAR='"SCAR_T":100000' TICKS=150000 SEEDS="80 81 82" NS=1 nohup lab/autocat/feas2.sh > log 2>&1 &
cd "$(dirname "$0")/../.." || exit 1; . lab/autocat/arms.sh
D=${OUT:?}; mkdir -p "$D"; T=${TICKS:-150000}; SEEDS=${SEEDS:-80 81 82}; AC='"NICHE_AC":2,"NICHE_AC_B":0.001'
FULL="$S2,$AC,$SCAR"; NOAC="$S2,$SCAR"; FULLNS="$S2,$AC"
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a-$s.jsonl" 2> "$D/$a-$s.err"; local e=$?; echo "$(date +%T) done $a $s exit $e"; [ $e = 0 ] && [ $(wc -l < "$D/$a-$s.jsonl") = $((T/1000)) ] && touch "$D/$a-$s.done"; }
sched(){ node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2]/1000;
  const a=new Array(n).fill(0).map(()=>process.argv[3]==="b"?0.5:[0,0,0,0]);for(const x of r){const k=x.niche;a[x.t/1000-1]=process.argv[3]==="b"?k.builderShare:[k.found,k.ext,k.recB,k.maint];}console.log(JSON.stringify(a))' "$D/FULL-$1.jsonl" $T $2; }
wf(){ while [ ! -f "$D/FULL-$1.done" ]; do sleep 20; done; }
for s in $SEEDS; do
  [ -f "$D/FULL-$s.done" ] || run FULL $s "{$FULL}" &
  [ -f "$D/NOAC-$s.done" ] || run NOAC $s "{$NOAC}" &
  [ -n "$NS" ] && { [ -f "$D/FULLNS-$s.done" ] || run FULLNS $s "{$FULLNS}" & }
  [ -f "$D/RAND-$s.done" ] || ( wf $s; run RAND $s "{$FULL,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $s r)}" ) &
  [ -f "$D/RANDN-$s.done" ] || ( wf $s; run RANDN $s "{$FULL,\"NICHE_RAND_NAMED\":1,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $s r)}" ) &
  [ -f "$D/SHUF-$s.done" ] || ( wf $s; run SHUF $s "{$FULL,\"NICHE_EVERY\":1000,\"NICHE_BSCHED\":$(sched $s b)}" ) &
done
wait; echo "$(date +%T) ALL DONE"
