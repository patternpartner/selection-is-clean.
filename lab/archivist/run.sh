#!/bin/bash
# lab/archivist/run.sh JOBFILE OUTDIR TICKS [PAR=7] - runs every line "NAME SEED OPTS_JSON" of JOBFILE with lab/core-run.js
# (EVERY=1000), writes OUTDIR/NAME.SEED.jsonl and a .done marker per run; a run with a .done marker is skipped, and a run
# without one is started from scratch (its partial file is deleted). Detached-safe: nohup this script.
JOBS=$1; OUT=$2; TICKS=$3; PAR=${PAR:-7}; CORE=$(cd "$(dirname "$0")/.." && pwd)/core-run.js
mkdir -p "$OUT"
one(){ name=$1; seed=$2; opts=$3; f="$OUT/$name.$seed"
  [ -e "$f.done" ] && return 0; rm -f "$f.jsonl"
  SEED=$seed TICKS=$TICKS EVERY=1000 OPTS="$opts" node "$CORE" > "$f.jsonl" 2> "$f.err" && date -Iseconds > "$f.done"; }
export -f one; export OUT TICKS CORE
grep -v '^#' "$JOBS" | grep -v '^$' | while read -r name seed opts; do printf '%s\0%s\0%s\0' "$name" "$seed" "$opts"; done | xargs -0 -n3 -P "$PAR" bash -c 'one "$0" "$1" "$2"'
date -Iseconds > "$OUT/ALL.done"
