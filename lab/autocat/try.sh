#!/bin/bash
# try.sh NAME SEED TICKS 'extra-json-fields'  -> /tmp/ac/NAME-SEED.jsonl  (base is $BASE: S2 or W1)
cd "$(dirname "$0")/../.." || exit 1; . lab/autocat/arms.sh; B=${BASE:-S2}; O="${!B}"; [ -n "$4" ] && O="$O,$4"
SEED=$2 TICKS=$3 EVERY=1000 OPTS="{$O}" nohup node lab/core-run.js > /tmp/ac/$1-$2.jsonl 2> /tmp/ac/$1-$2.err &
