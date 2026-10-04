#!/bin/bash
# Byte-identity check for the CHANCE-ENGINE knobs unset: this branch's lab/oee-core.js vs cos/meta-search 2633322 (wallS stripped).
# Run niced and sequentially so the meta-search held-out runs are not slowed.
cd "$(dirname "$0")/../.." || exit 1; T=/tmp/chance-bytecheck; rm -rf $T; mkdir -p $T/ref/lab
git show 2633322:lab/oee-core.js > $T/ref/lab/oee-core.js; cp lab/core-run.js $T/ref/lab/
one(){ local name=$1 seed=$2 ticks=$3 o=$4; local A=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" nice -n 10 node lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); local B=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" nice -n 10 node $T/ref/lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); [ "$A" = "$B" ] && echo "IDENTICAL vs 2633322: $name" || echo "DIFFERENT vs 2633322: $name"; }
one default 97 4000 '{}'
one CHEM 97 4000 '{"CHEM":1}'
one "HBODY B" 95 15000 '{"CHEM":1,"HBODY":1}'
one "C1 fusion" 95 15000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02}'
one "C1 fusion RANDCAP" 95 15000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"BODY_RCAP":1}'
one "C1 + XFEED" 95 8000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"XFEED":1}'
one "meta CW+HIST+EVO" 95 15000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"BODY_CW":[0.3,0.3,0.3,0.1],"BODY_HIST":2,"BODY_EVO":0.1}'
