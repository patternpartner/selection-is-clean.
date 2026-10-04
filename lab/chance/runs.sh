#!/bin/bash
# lab/chance/runs.sh - CHANCE-ENGINE trial pipeline (TRIAL seeds only), fixed in lab/CHANCE-ENGINE.md before any result.
# Stage 1: R1 vs R2 at 150k on trial seeds 110-112 (WIN 10) -> ce-check.js pick. Stage 2: the chosen design at 450k on fresh
# trial seeds 113-115 (WIN 15) -> ce-check.js go. Results are appended to lab/CHANCE-ENGINE.md and pushed to cos/chance-engine.
# Resumable: finished runs (.done) are skipped.   R=/home/box/chance-runs P=8 lab/chance/runs.sh
cd "$(dirname "$0")/../.." || exit 1; R=${R:-/home/box/chance-runs}; P=${P:-8}; DOC=lab/CHANCE-ENGINE.md; mkdir -p $R lab/chance/trial
B='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02'
R1="$B,\"BODY_RCAP\":1,\"CH_LEN\":1.5"; R2="$R1,\"CH_EVO\":0.1"; D1="$B,\"CH_LEN\":1.5"; D2="$D1,\"CH_EVO\":0.1"
declare -A O=( [R1]="{$R1}" [R2]="{$R2}" [RANDCAP]="{$B,\"BODY_RCAP\":1}" [DIRECT-R1]="{$D1}" [DIRECT-R2]="{$D2}"
  [DRIFT-R1]="{$R1,\"BODY_DRIFT\":1}" [DRIFT-R2]="{$R2,\"BODY_DRIFT\":1}" [SHUF-R1]="{$R1,\"BODY_SHUF\":1}" [SHUF-R2]="{$R2,\"BODY_SHUF\":1}" [BASE]='{"CHEM":1}' )
S1="R1 R2 RANDCAP DIRECT-R1 DIRECT-R2 DRIFT-R1 DRIFT-R2 SHUF-R1 SHUF-R2 BASE"
push(){ git add $DOC lab/chance/trial && git commit -qm "$1" && for i in 1 2 3; do git push -q origin cos/chance-engine && break; sleep 60; done; }
# ---- stage 1
for s in 110 111 112; do for a in $S1; do echo "$R/s1 $a $s 150000 ${O[$a]}"; done; done | P=$P lab/autocat/body-runs.sh
DIR=$R/s1 ARMS="$S1" SEEDS='110 111 112' WIN=10 JSON=lab/chance/trial/ce-s1-150k.json node lab/chance/ce-trial.js > lab/chance/trial/ce-s1-150k.txt
SEEDS='110 111 112' node lab/chance/ce-check.js pick lab/chance/trial/ce-s1-150k.json > lab/chance/trial/ce-pick.txt
CH=$(sed -n 's/^CHOSEN \(R[12]\).*/\1/p' lab/chance/trial/ce-pick.txt)
{ echo; echo "### Stage 1: R1 vs R2 at 150k, trial seeds 110-112 (appended by runs.sh $(date '+%Y-%m-%d %H:%M %Z'))"; echo '```'; cat lab/chance/trial/ce-s1-150k.txt; echo '```'; echo 'Design rule:'; echo '```'; cat lab/chance/trial/ce-pick.txt; echo '```'; } >> $DOC
push "chance-engine: stage 1 (150k, seeds 110-112) done, chosen $CH"
# ---- stage 2
declare -A L=( [D]="${O[$CH]}" [RANDCAP]="${O[RANDCAP]}" [DIRECT]="${O[DIRECT-$CH]}" [DRIFT]="${O[DRIFT-$CH]}" [SHUF]="${O[SHUF-$CH]}" [R1]="${O[R1]}" [BASE]='{"CHEM":1}' )
S2="D RANDCAP DIRECT DRIFT SHUF BASE"; [ "$CH" = R2 ] && S2="D RANDCAP DIRECT DRIFT SHUF R1 BASE"
for s in 113 114 115; do for a in $S2; do echo "$R/s2-$CH $a $s 450000 ${L[$a]}"; done; done | P=$P lab/autocat/body-runs.sh
DIR=$R/s2-$CH ARMS="$S2" SEEDS='113 114 115' WIN=15 JSON=lab/chance/trial/ce-s2-$CH-450k.json node lab/chance/ce-trial.js > lab/chance/trial/ce-s2-$CH-450k.txt
SEEDS='113 114 115' node lab/chance/ce-check.js go lab/chance/trial/ce-s2-$CH-450k.json $CH > lab/chance/trial/ce-go.txt
{ echo; echo "### Stage 2: $CH at 450k, fresh trial seeds 113-115, WIN 15 (appended by runs.sh $(date '+%Y-%m-%d %H:%M %Z'))"; echo '```'; cat lab/chance/trial/ce-s2-$CH-450k.txt; echo '```'; echo 'Go criterion:'; echo '```'; cat lab/chance/trial/ce-go.txt; echo '```'; } >> $DOC
push "chance-engine: stage 2 ($CH, 450k, seeds 113-115) => $(grep -o 'GO: propose a deciding round\|NO-GO' lab/chance/trial/ce-go.txt | head -1)"
echo "$(date) pipeline finished" >> lab/chance/trial/waiter.log
