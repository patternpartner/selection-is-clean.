#!/bin/bash
# lab/renew/decide-runs.sh - LOCAL-RENEWAL step 2: the DECIDING round, 450k on unseen seeds 119-121, with the cap frozen by step 1.
# Refuses to start unless step 1 froze a cap AND it is called with --approved (the user must approve the deciding round).
# Arms (lab/LOCAL-RENEWAL.md): RENEW, MATCHED, D, RANDCAP, DRIFT, DRIFT-RN, SHUF-RN, BASE. Then rn-check.js go + ce-trial.js
# secondary readout, appended to lab/LOCAL-RENEWAL.md and pushed to cos/local-renewal.
#   setsid nohup lab/renew/decide-runs.sh --approved > /dev/null 2>&1 &        (NOT started at design time)
cd "$(dirname "$0")/../.." || exit 1; [ "$1" = --approved ] || { echo "deciding round needs --approved"; exit 1; }
CAP=$(sed -n 's/^FROZEN RN_CAP \([0-9.]*\)$/\1/p' lab/renew/trial/rn-tune.txt 2>/dev/null); [ -n "$CAP" ] || { echo "no frozen cap (step 1 not run or STOP)"; exit 1; }
R=/home/box/renew-runs/decide; P=${P:-8}; DOC=lab/LOCAL-RENEWAL.md; mkdir -p $R
B='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02'; D="$B,\"BODY_RCAP\":1,\"CH_LEN\":1.5"; RN="\"RN_CAP\":$CAP"
declare -A O=( [RENEW]="{$D,\"RENEW\":1,$RN}" [MATCHED]="{$D,\"RENEW\":2,$RN}" [D]="{$D}" [RANDCAP]="{$B,\"BODY_RCAP\":1}" [DRIFT]="{$D,\"BODY_DRIFT\":1}"
  [DRIFT-RN]="{$D,\"BODY_DRIFT\":1,\"RENEW\":1,$RN}" [SHUF-RN]="{$D,\"BODY_SHUF\":1,\"RENEW\":1,$RN}" [BASE]='{"CHEM":1}' )
A='RENEW MATCHED D RANDCAP DRIFT DRIFT-RN SHUF-RN BASE'
for s in 119 120 121; do for a in $A; do echo "$R $a $s 450000 ${O[$a]}"; done; done | P=$P lab/autocat/body-runs.sh
node lab/renew/rn-check.js metric $R "$A" '119 120 121' > lab/renew/trial/rn-decide-metric.txt; node lab/renew/rn-check.js go $R '119 120 121' > lab/renew/trial/rn-go.txt
DIR=$R ARMS="$A" SEEDS='119 120 121' WIN=15 node lab/chance/ce-trial.js > lab/renew/trial/rn-decide-secondary.txt
{ echo; echo "### Step 2 result: DECIDING round, seeds 119-121, 450k, RN_CAP $CAP (appended by decide-runs.sh $(date '+%Y-%m-%d %H:%M %Z'))"; echo '```'; cat lab/renew/trial/rn-decide-metric.txt; echo; cat lab/renew/trial/rn-go.txt; echo; echo 'Secondary (not in the bar): Lu / LuInc'; cat lab/renew/trial/rn-decide-secondary.txt; echo '```'; } >> $DOC
git add $DOC lab/renew/trial && git commit -qm "local-renewal: deciding round (seeds 119-121) => $(tail -1 lab/renew/trial/rn-go.txt | cut -c1-40)" && for i in 1 2 3; do git push -q origin cos/local-renewal && break; sleep 60; done
