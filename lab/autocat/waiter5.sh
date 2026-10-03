#!/bin/bash
# Phase A4 (cross-feeding) waiter, TRIAL seeds only: stage 1 = X1, X2 x {FULL,RANDCAP,NOLEAK,SHUFENV,NOINH,FIXED} + BASE at 150k on
# seeds 50-52; design rule; stage 2 = chosen design at 450k on fresh trial seeds 53-55; go criterion. Appends to
# lab/PHASEA4-cross-feeding.md and commits+pushes after each stage.
cd "$(dirname "$0")/../.." || exit 1; M=lab/PHASEA4-cross-feeding.md; R=lab/autocat/trial; H=/tmp/xf; mkdir -p $H
push(){ git add -A $M lab/autocat lab/oee-core.js; git commit -qm "$1"; for i in 1 2 3; do git push -q origin cos/cross-feeding && break; sleep 30; done; }
export NULLS="RANDCAP NOLEAK SHUFENV NOINH FIXED"; ARMS="FULL $NULLS BASE"
C1=',"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"XFEED":1'; SC=',"SCAR_T":100000,"SCAR_MIN":0.25'
declare -A DS=( [X1]="$C1" [X2]="$C1$SC" ); declare -A BS=( [X1]='' [X2]="$SC" )
declare -A NU=( [FULL]='' [RANDCAP]=',"BODY_RCAP":1' [NOLEAK]=',"XF_LEAK":0' [SHUFENV]=',"XF_SHUF":1' [NOINH]=',"BODY_INH":0' [FIXED]=',"BODY_FIXED":1' )
jobs(){ local T=$1 seeds=$2; shift 2; for s in $seeds; do for d in "$@"; do echo "$H/$d-$T BASE $s $T {\"CHEM\":1${BS[$d]}}"; for a in FULL $NULLS; do echo "$H/$d-$T $a $s $T {\"CHEM\":1${DS[$d]}${NU[$a]}}"; done; done; done; }
jobs 150000 "50 51 52" X1 X2 | P=12 lab/autocat/body-runs.sh > $H/stage1.log 2>&1
for d in X1 X2; do ARMS="$ARMS" DIR=$H/$d-150000 SEEDS="50 51 52" WIN=10 JSON=$R/a4-$d-150k.json node lab/autocat/body-trial.js > $R/a4-$d-150k.txt; done
SEEDS="50 51 52" node lab/autocat/body-check.js pick $R/a4-X1-150k.json $R/a4-X2-150k.json > $R/a4-pick.txt; CH=$(grep CHOSEN $R/a4-pick.txt | awk '{print $2}' | sed 's/a4-//;s/-150k//')
{ echo; echo "### Stage 1: X1–X2 at 150k, trial seeds 50–52 (appended by waiter $(date '+%F %H:%M %Z'))"; for d in X1 X2; do echo "**$d**"; echo '```'; cat $R/a4-$d-150k.txt; echo '```'; done
  echo "Design rule:"; echo '```'; cat $R/a4-pick.txt; echo '```'; } >> $M
push "cross-feeding A4: X1-X2 at 150k on trial seeds 50-52; design rule picks $CH"
jobs 450000 "53 54 55" $CH | P=21 lab/autocat/body-runs.sh > $H/stage2.log 2>&1
ARMS="$ARMS" DIR=$H/$CH-450000 SEEDS="53 54 55" WIN=15 JSON=$R/a4-long-$CH-450k.json node lab/autocat/body-trial.js > $R/a4-long-$CH-450k.txt
SEEDS="53 54 55" node lab/autocat/body-check.js go $R/a4-long-$CH-450k.json > $R/a4-go.txt
{ echo; echo "### Stage 2: $CH at 450k, fresh trial seeds 53–55, WIN 15 (appended $(date '+%F %H:%M %Z'))"; echo '```'; cat $R/a4-long-$CH-450k.txt; echo '```'; echo "Go criterion:"; echo '```'; cat $R/a4-go.txt; echo '```'; } >> $M
push "cross-feeding A4: $CH at 450k on trial seeds 53-55; go check: $(tail -1 $R/a4-go.txt)"
echo "$(date) WAITER5 DONE"
