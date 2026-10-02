#!/bin/bash
# Byte-identity check for NICHE_AC unset: this branch's lab/oee-core.js vs origin/main and vs cos/skin (9b9e799), wallS stripped.
cd "$(dirname "$0")/../.." || exit 1; T=/tmp/ac-bytecheck; rm -rf $T; mkdir -p $T/main/lab $T/skin/lab
git show origin/main:lab/oee-core.js > $T/main/lab/oee-core.js; git show 9b9e799:lab/oee-core.js > $T/skin/lab/oee-core.js; cp lab/core-run.js $T/main/lab/; cp lab/core-run.js $T/skin/lab/
V2='"CHEM":1,"NICHE":2,"NICHE_R":2,"NICHE_COPY":1,"NICHE_OPEN":1,"NICHE_OPEN_P":0.125,"NICHE_OPEN_CAP":2,"NICHE_GC":1'; W1="$V2,\"NICHE_XCOST\":0.1,\"NICHE_BCOST\":0.3,\"NICHE_BLD\":1,\"NICHE_UP\":1,\"NICHE_UCOST\":0.05"
one(){ local ref=$1 name=$2 seed=$3 ticks=$4 o=$5; local A=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" node lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); local B=$(SEED=$seed TICKS=$ticks EVERY=1000 OPTS="$o" node $T/$ref/lab/core-run.js | sed 's/,"wallS":[0-9.]*//' | md5sum); [ "$A" = "$B" ] && echo "IDENTICAL vs $ref: $name" || echo "DIFFERENT vs $ref: $name"; }
one main default 97 4000 '{}' & one main CHEM 97 4000 '{"CHEM":1}' & one main CHEM+VIRUS 97 4000 '{"CHEM":1,"VIRUS":1,"V_ONSET":1000}' & one main TASKS 97 4000 '{"TASKS":1}' & one main CHEM_BIG 97 4000 '{"CHEM":1,"CHEM_BIG":1}' & wait
one skin "NICHE 2" 96 40000 '{"CHEM":1,"NICHE":2}' & one skin "v3 W1" 96 40000 "{$W1}" & one skin "skin S1" 96 40000 "{$W1,\"NICHE_SKIN\":1,\"NICHE_SKIN_REGROW\":1}" & one skin "skin S2" 96 40000 "{$W1,\"NICHE_SKIN\":1,\"NICHE_SKIN_REGROW\":1,\"NICHE_PERM\":1}" & wait
