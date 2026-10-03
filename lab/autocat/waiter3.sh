#!/bin/bash
# Phase A3 waiter (trial seeds only): stage 1 = B1-B3 x {FULL,NOINH,RANDCAP,SHUF,FIXED} + BASE at 150k on seeds 70-72; design rule;
# stage 2 = chosen design at 450k on fresh trial seeds 73-75; go criterion. Appends to lab/PHASEA3-heritable-body.md, commits+pushes.
cd "$(dirname "$0")/../.." || exit 1; M=lab/PHASEA3-heritable-body.md; R=lab/autocat/trial; H=/tmp/hb; mkdir -p $H
push(){ git add -A $M lab/autocat lab/oee-core.js; git commit -qm "$1"; for i in 1 2 3; do git push -q origin cos/heritable-body && break; sleep 30; done; }
declare -A DS=( [B1]='' [B2]=',"BODY_UP":0.002' [B3]=',"BODY_F":0.05,"BODY_MAX":16' ); declare -A NU=( [FULL]='' [NOINH]=',"BODY_INH":0' [RANDCAP]=',"BODY_RCAP":1' [SHUF]=',"BODY_SHUF":1' [FIXED]=',"BODY_FIXED":1' )
jobs(){ local T=$1 seeds=$2; shift 2; for s in $seeds; do echo "$H/base-$T BASE $s $T {\"CHEM\":1}"; for d in "$@"; do for a in FULL NOINH RANDCAP SHUF FIXED; do echo "$H/$d-$T $a $s $T {\"CHEM\":1,\"HBODY\":1${DS[$d]}${NU[$a]}}"; done; done; done; }
jobs 150000 "70 71 72" B1 B2 B3 | P=10 lab/autocat/body-runs.sh > $H/stage1.log 2>&1
for d in B1 B2 B3; do cp $H/base-150000/* $H/$d-150000/; DIR=$H/$d-150000 SEEDS="70 71 72" WIN=10 JSON=$R/a3-$d-150k.json node lab/autocat/body-trial.js > $R/a3-$d-150k.txt; done
SEEDS="70 71 72" node lab/autocat/body-check.js pick $R/a3-B1-150k.json $R/a3-B2-150k.json $R/a3-B3-150k.json > $R/a3-pick.txt; CH=$(grep CHOSEN $R/a3-pick.txt | awk '{print $2}' | sed 's/a3-//;s/-150k//')
{ echo; echo "### Stage 1: B1–B3 at 150k, trial seeds 70–72 (appended by waiter $(date '+%F %H:%M %Z'))"; for d in B1 B2 B3; do echo "**$d** (${DS[$d]:-defaults})"; echo '```'; cat $R/a3-$d-150k.txt; echo '```'; done
  echo "Design rule:"; echo '```'; cat $R/a3-pick.txt; echo '```'; } >> $M
push "heritable body A3: B1-B3 at 150k on trial seeds 70-72; design rule picks $CH"
jobs 450000 "73 74 75" $CH | P=18 lab/autocat/body-runs.sh > $H/stage2.log 2>&1
cp $H/base-450000/* $H/$CH-450000/; DIR=$H/$CH-450000 SEEDS="73 74 75" WIN=15 JSON=$R/a3-long-$CH-450k.json node lab/autocat/body-trial.js > $R/a3-long-$CH-450k.txt
SEEDS="73 74 75" node lab/autocat/body-check.js go $R/a3-long-$CH-450k.json > $R/a3-go.txt
{ echo; echo "### Stage 2: $CH at 450k, fresh trial seeds 73–75, WIN 15 (appended $(date '+%F %H:%M %Z'))"; echo '```'; cat $R/a3-long-$CH-450k.txt; echo '```'; echo "Go criterion:"; echo '```'; cat $R/a3-go.txt; echo '```'; } >> $M
push "heritable body A3: $CH at 450k on trial seeds 73-75; go check: $(tail -1 $R/a3-go.txt)"
echo "$(date) WAITER3 DONE"
