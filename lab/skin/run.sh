#!/bin/bash
# Runner for lab/PREREG-skin.md. S0-S3 on each seed start at once; S4 on a seed starts when that seed's S1 is done and gets
# S1's per-1,000-tick [found, extend, recipe-build, maintain] counts as its random-assignment schedule (into living organisms).
# Launch with:  (nohup lab/skin/run.sh > lab/skin/raw/run.log 2>&1 &)      Re-run one: ONLY="S4 17" lab/skin/run.sh
cd "$(dirname "$0")/../.." || exit 1
D=${OUT:-lab/skin/raw}; mkdir -p "$D"; T=${TICKS:-450000}; SEEDS=${SEEDS:-16 17 18}
V2='"CHEM":1,"NICHE":2,"NICHE_R":2,"NICHE_COPY":1,"NICHE_OPEN":1,"NICHE_OPEN_P":0.125,"NICHE_OPEN_CAP":2,"NICHE_GC":1'
W1="$V2,\"NICHE_XCOST\":0.1,\"NICHE_BCOST\":0.3,\"NICHE_BLD\":1,\"NICHE_UP\":1,\"NICHE_UCOST\":0.05"   # = niche-v3 W1 (costly, public)
SK="$W1,\"NICHE_SKIN\":1,\"NICHE_SKIN_REGROW\":1"
S0="$W1"; S1="$SK"; S2="$SK,\"NICHE_PERM\":1"; S3="$SK,\"NICHE_SKIN_INH\":0"
run(){ local a=$1 s=$2 o=$3; SEED=$s TICKS=$T EVERY=1000 OPTS="$o" node lab/core-run.js > "$D/$a.$s.all.jsonl" 2> "$D/$a.$s.err"; local e=$?; echo "$(date +%T) done $a $s exit $e"; [ $e = 0 ] && [ $(wc -l < "$D/$a.$s.all.jsonl") = $((T/1000)) ] && touch "$D/$a.$s.done"; }
sched(){ node -e 'const r=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const n=+process.argv[2]/1000;
  const a=new Array(n).fill(0).map(()=>[0,0,0,0]);for(const x of r){const k=x.niche;a[x.t/1000-1]=[k.found,k.ext,k.recB,k.maint];}console.log(JSON.stringify(a))' "$D/S1.$1.all.jsonl" $T; }
w1(){ local s=$1; while [ ! -f "$D/S1.$s.done" ]; do sleep 30; done; }
s4(){ w1 $1; run S4 $1 "{$S1,\"NICHE_EVERY\":1000,\"NICHE_RAND_SCHED\":$(sched $1)}"; }
if [ -n "$ONLY" ]; then set -- $ONLY; case $1 in S0) run S0 $2 "{$S0}";; S1) run S1 $2 "{$S1}";; S2) run S2 $2 "{$S2}";; S3) run S3 $2 "{$S3}";; S4) s4 $2;; esac; exit; fi
for s in $SEEDS; do
  [ -f "$D/S0.$s.done" ] || run S0 $s "{$S0}" &
  [ -f "$D/S1.$s.done" ] || run S1 $s "{$S1}" &
  [ -f "$D/S2.$s.done" ] || run S2 $s "{$S2}" &
  [ -f "$D/S3.$s.done" ] || run S3 $s "{$S3}" &
  [ -f "$D/S4.$s.done" ] || s4 $s &
done
wait; echo "$(date +%T) ALL DONE"
