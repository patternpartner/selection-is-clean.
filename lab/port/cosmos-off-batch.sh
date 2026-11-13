#!/bin/bash
# #423 (PREREG-cosmos-off.md): pairs of browser fields run together, today's engine against a copy with the cosmos off (LIVE __COSMOS:0).
# 1,500 s each; one pair a launch (MAXNEW, default 1); a pair with no .done is rerun from scratch.
#   EDIR=dir-for-the-engine-copy [PAIRS="1 2 ... 6"] lab/port/cosmos-off-batch.sh
cd "$(dirname "$0")/../.."; OUT=lab/port/out-cosmos-decide; mkdir -p $OUT; MAXNEW=${MAXNEW:-1}; n=0
for i in ${PAIRS:-1 2 3 4 5 6}; do [ -e $OUT/p$i.done ] && continue; [ $n -ge $MAXNEW ] && break; n=$((n+1)); rm -f $OUT/p$i-*
  OUT=$OUT TAG=p$i NAME=off FROM="const LIVE={ __COSMOS:1," \
    TO="const LIVE={ __COSMOS:0," lab/port/field-pair.sh
done; echo "ran $n"
