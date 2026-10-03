#!/bin/bash
# Phase A3 runner (TRIAL seeds only): runs a list of "OUTDIR ARM SEED TICKS OPTS" jobs from stdin, at most P at once.
#   printf '...' | P=10 lab/autocat/body-runs.sh
cd "$(dirname "$0")/../.." || exit 1
job(){ read -r D A S T O <<<"$1"; mkdir -p "$D"; [ -f "$D/$A-$S.done" ] && return; SEED=$S TICKS=$T EVERY=1000 OPTS="$O" node lab/core-run.js > "$D/$A-$S.jsonl" 2> "$D/$A-$S.err" && [ $(wc -l < "$D/$A-$S.jsonl") = $((T/1000)) ] && touch "$D/$A-$S.done"; echo "$(date +%T) done $A $S $D"; }
export -f job; xargs -d '\n' -P ${P:-10} -I{} bash -c 'job "$@"' _ {}
