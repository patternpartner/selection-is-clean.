#!/bin/bash
# Phase A feasibility runner (TRIAL seeds only; nothing here counts). FULL, NOAC (FULL minus autocatalysis) and W1 (niche-v3
# W1 baseline) on each seed start at once; RAND (availability null: FULL's per-1,000-tick [found, extend, recipe-build, maintain]
# counts applied to random living organisms; organisms cannot build) and SHUF (selection null: a child's builder bit drawn at
# FULL's per-sample builder share, not inherited) start when that seed's FULL is done. RANDN=1 adds RANDN: RAND whose founds
# name a uniformly random pair (NICHE_RAND_NAMED, the null matched to AC 2's named synthesis). Arms already present (.done) are skipped.
#   OUT=/tmp/ac/feas-v1 TICKS=150000 SEEDS="90 91 92" AC='"NICHE_AC":1,"NICHE_AC_B":0.001' nohup lab/autocat/feas.sh > log 2>&1 &
cd "$(dirname "$0")/../.." || exit 1; . lab/autocat/arms.sh
D=${OUT:-/tmp/ac/feas}; mkdir -p "$D"; T=${TICKS:-150000}; SEEDS=${SEEDS:-90 91 92}; AC=${AC:-'"NICHE_AC":1,"NICHE_AC_B":0.001'}; X=${EXTRA:+,$EXTRA}
FULL="$S2,$AC$X"; NOAC="$S2$X"
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a-$s.jsonl" 2> "$D/$a-$s.err"; local e=$?; echo "$(date +%T) done $a $s exit $e"; [ $e = 0 ] && [ $(wc -l < "$D/$a-$s.jsonl") = $((T/1000)) ] && touch "$D/$a-$s.done"; }
sched(){ node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2]/1000;
  const a=new Array(n).fill(0).map(()=>process.argv[3]==="b"?0.5:[0,0,0,0]);for(const x of r){const k=x.niche;a[x.t/1000-1]=process.argv[3]==="b"?k.builderShare:[k.found,k.ext,k.recB,k.maint];}console.log(JSON.stringify(a))' "$D/FULL-$1.jsonl" $T $2; }
wf(){ while [ ! -f "$D/FULL-$1.done" ]; do sleep 20; done; }
for s in $SEEDS; do
  [ -f "$D/FULL-$s.done" ] || run FULL $s "{$FULL}" &
  [ -f "$D/NOAC-$s.done" ] || run NOAC $s "{$NOAC}" &
  [ -f "$D/W1-$s.done" ] || run W1 $s "{$W1}" &
  [ -f "$D/RAND-$s.done" ] || ( wf $s; run RAND $s "{$FULL,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $s r)}" ) &
  [ -n "$RANDN" ] && { [ -f "$D/RANDN-$s.done" ] || ( wf $s; run RANDN $s "{$FULL,\"NICHE_RAND_NAMED\":1,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $s r)}" ) & }
  [ -f "$D/SHUF-$s.done" ] || ( wf $s; run SHUF $s "{$FULL,\"NICHE_EVERY\":1000,\"NICHE_BSCHED\":$(sched $s b)}" ) &
done
wait; echo "$(date +%T) ALL DONE"
