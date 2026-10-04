#!/bin/bash
# lab/chance/diag-runs.sh - the four instrumented diagnosis runs (trial seed 63, 90k ticks, niced so the meta-search is not slowed).
cd "$(dirname "$0")/../.." ; D=lab/chance/trial
C1='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02'; B3='"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16'
for x in "C1-FULL|{$C1}" "C1-RANDCAP|{$C1,\"BODY_RCAP\":1}" "B3-FULL|{$B3}" "B3-RANDCAP|{$B3,\"BODY_RCAP\":1}"; do n=${x%%|*}; o=${x#*|}
  SEED=63 TICKS=90000 WIN=10000 OPTS="$o" OUT=$D/capdiag-$n-63.json nohup nice -n 10 node lab/chance/capdiag.js > $D/capdiag-$n-63.txt 2>&1 & done
