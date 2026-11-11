#!/bin/bash
# #404: ONE LEG of a long field. Each launch runs the field for SECS (1,500), then the next launch reloads it from the browser profile
# and carries the union and the clock on (field-rate.js PROFILE, PORT, CHAIN). Run it again for the next leg.
#   PDIR=dir-for-the-browser-profile [NAME=long1] lab/port/long-field.sh
cd "$(dirname "$0")/../.."; NAME=${NAME:-long1}; OUT=lab/port/out-long; mkdir -p $OUT; P=${PDIR:?}/profile-$NAME
PORT=${PORT:-8932} PROFILE=$P CHAIN=$OUT/$NAME.chain.json SECS=${SECS:-1500} EVERY=60 OUT=$OUT/$NAME.jsonl node lab/port/field-rate.js > $OUT/$NAME.log 2>&1
node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("legs",c.legs,"elapsed",c.elapsed,"F",c.n)' $OUT/$NAME.chain.json
