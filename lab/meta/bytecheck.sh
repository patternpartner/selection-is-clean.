#!/bin/bash
# Byte-identity check for the META-SEARCH knobs unset: this branch's lab/oee-core.js vs cos/cross-feeding 0535d6c and origin/main, wallS stripped.
cd "$(dirname "$0")/../.." || exit 1; T=/tmp/meta-bytecheck; rm -rf $T; mkdir -p $T/xf/lab $T/main/lab
git show 0535d6c:lab/oee-core.js > $T/xf/lab/oee-core.js; git show origin/main:lab/oee-core.js > $T/main/lab/oee-core.js; cp lab/core-run.js $T/xf/lab/; cp lab/core-run.js $T/main/lab/
. lab/autocat/arms.sh
one(){ local ref=$1 name=$2 seed=$3 ticks=$4 o=$5; local A=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" node lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); local B=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" node $T/$ref/lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); [ "$A" = "$B" ] && echo "IDENTICAL vs $ref: $name" || echo "DIFFERENT vs $ref: $name"; }
one main default 97 4000 '{}' & one main CHEM 97 4000 '{"CHEM":1}' & one main TASKS 97 4000 '{"TASKS":1}' & one xf "skin S2 + AC + SCAR" 96 30000 "{$S2,\"NICHE_AC\":2,\"NICHE_AC_B\":0.001,\"SCAR_T\":20000}" & wait
one xf "HBODY B" 95 30000 '{"CHEM":1,"HBODY":1}' & one xf "HBODY RCAP" 95 30000 '{"CHEM":1,"HBODY":1,"BODY_RCAP":1}' & one xf "C1 fusion+XFEED" 95 30000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"XFEED":1}' & one xf "C1+SHUF+SCAR" 95 30000 '{"CHEM":1,"HBODY":1,"BODY_F":0.05,"BODY_MAX":16,"BODY_FUSE":0.02,"BODY_SHUF":1,"SCAR_T":20000,"SCAR_MIN":0.25}' & wait
