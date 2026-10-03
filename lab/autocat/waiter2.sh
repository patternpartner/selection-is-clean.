#!/bin/bash
# Phase A2 waiter (trial seeds only): D1-D3 at 150k on seeds 80-82 (+FULLNS), readouts, design rule, then the chosen design at
# 450k on fresh trial seeds 83-85, go criterion; appends everything to lab/PHASEA2-scarcity.md and commits+pushes after each step.
cd "$(dirname "$0")/../.." || exit 1; M=lab/PHASEA2-scarcity.md; R=lab/autocat/trial; mkdir -p /tmp/sc
push(){ git add -A $M lab/autocat lab/oee-core.js; git commit -qm "$1"; for i in 1 2 3; do git push -q origin cos/scarcity && break; sleep 30; done; }
declare -A SC=( [D1]='"SCAR_T":100000,"SCAR_MIN":0.25' [D2]='"SCAR_T":100000,"SCAR_MIN":0.25,"SCAR_ALPHA":0.8' [D3]='"SCAR_T":100000,"SCAR_MIN":0.1,"SCAR_ALPHA":0.8' )
OUT=/tmp/sc/D1 SCAR="${SC[D1]}" NS=1 TICKS=150000 SEEDS="80 81 82" lab/autocat/feas2.sh > /tmp/sc/D1.log 2>&1 &
OUT=/tmp/sc/D2 SCAR="${SC[D2]}" TICKS=150000 SEEDS="80 81 82" lab/autocat/feas2.sh > /tmp/sc/D2.log 2>&1 &
OUT=/tmp/sc/D3 SCAR="${SC[D3]}" TICKS=150000 SEEDS="80 81 82" lab/autocat/feas2.sh > /tmp/sc/D3.log 2>&1 &
wait
for d in D1 D2 D3; do [ $d != D1 ] && cp /tmp/sc/D1/FULLNS-* /tmp/sc/$d/; ARMS="FULL NOAC RAND RANDN SHUF FULLNS" DIR=/tmp/sc/$d SEEDS="80 81 82" JSON=$R/a2-$d-150k.json node lab/autocat/trial.js > $R/a2-$d-150k.txt; done
node lab/autocat/pick2.js $R/a2-D1-150k.json $R/a2-D2-150k.json $R/a2-D3-150k.json > $R/a2-pick.txt; CH=$(grep CHOSEN $R/a2-pick.txt | awk '{print $2}' | sed 's/-150k//;s/a2-//')
{ echo; echo "### Step 1: D1–D3 at 150k, trial seeds 80–82 (appended by waiter $(date '+%F %H:%M %Z'))"; for d in D1 D2 D3; do echo "**$d** (${SC[$d]})"; echo '```'; cat $R/a2-$d-150k.txt; echo '```'; done
  echo "Design rule:"; echo '```'; cat $R/a2-pick.txt; echo '```'; } >> $M
push "scarcity A2: D1-D3 at 150k on trial seeds 80-82; design rule picks $CH"
OUT=/tmp/sc/long SCAR="${SC[$CH]}" NS=1 TICKS=450000 SEEDS="83 84 85" lab/autocat/feas2.sh > /tmp/sc/long.log 2>&1
ARMS="FULL NOAC RAND RANDN SHUF FULLNS" DIR=/tmp/sc/long SEEDS="83 84 85" WIN=15 JSON=$R/a2-long-$CH-450k.json node lab/autocat/trial.js > $R/a2-long-$CH-450k.txt
node lab/autocat/gocheck.js $R/a2-long-$CH-450k.json > $R/a2-go.txt
{ echo; echo "### Step 2: $CH at 450k, fresh trial seeds 83–85, WIN 15 (appended $(date '+%F %H:%M %Z'))"; echo '```'; cat $R/a2-long-$CH-450k.txt; echo '```'; echo "Go criterion:"; echo '```'; cat $R/a2-go.txt; echo '```'; } >> $M
push "scarcity A2: $CH at 450k on trial seeds 83-85; go check: $(tail -1 $R/a2-go.txt)"
echo "$(date) WAITER2 DONE"
