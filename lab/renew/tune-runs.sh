#!/bin/bash
# lab/renew/tune-runs.sh - LOCAL-RENEWAL step 1 (TRIAL seeds 116-118 only): tune ONLY the renewal amount RN_CAP in {1.5, 5, 15} at 150k.
# Arms: RENEW-c<cap> (D + RENEW 1), MATCHED-c<cap> (D + RENEW 2), BASE. Then lab/renew/rn-check.js tune freezes the cap
# (rule in that file and in lab/LOCAL-RENEWAL.md), appends to lab/LOCAL-RENEWAL.md and pushes cos/local-renewal.
#   setsid nohup lab/renew/tune-runs.sh > /dev/null 2>&1 &        (NOT started at design time)
cd "$(dirname "$0")/../.." || exit 1; R=/home/box/renew-runs/tune; P=${P:-8}; DOC=lab/LOCAL-RENEWAL.md; mkdir -p $R lab/renew/trial
B='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02'; D="$B,\"BODY_RCAP\":1,\"CH_LEN\":1.5"
for s in 116 117 118; do for c in 1.5 5 15; do echo "$R RENEW-c$c $s 150000 {$D,\"RENEW\":1,\"RN_CAP\":$c}"; echo "$R MATCHED-c$c $s 150000 {$D,\"RENEW\":2,\"RN_CAP\":$c}"; done; echo "$R BASE $s 150000 {\"CHEM\":1}"; done | P=$P lab/autocat/body-runs.sh
A='BASE'; for c in 1.5 5 15; do A="$A RENEW-c$c MATCHED-c$c"; done
node lab/renew/rn-check.js metric $R "$A" '116 117 118' > lab/renew/trial/rn-tune-metric.txt; node lab/renew/rn-check.js tune $R '116 117 118' > lab/renew/trial/rn-tune.txt
{ echo; echo "### Step 1 result: tuning on trial seeds 116-118, 150k (appended by tune-runs.sh $(date '+%Y-%m-%d %H:%M %Z'))"; echo '```'; cat lab/renew/trial/rn-tune-metric.txt; echo; cat lab/renew/trial/rn-tune.txt; echo '```'; } >> $DOC
git add $DOC lab/renew/trial && git commit -qm "local-renewal: step 1 tuning (trial seeds 116-118) => $(tail -1 lab/renew/trial/rn-tune.txt)" && for i in 1 2 3; do git push -q origin cos/local-renewal && break; sleep 60; done
