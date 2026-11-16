#!/bin/bash
# one more leg of the second long pair of #438 (today's open world against the same engine with opening off), then its reading
cd "$(dirname "$0")/../.."
PDIR=${PDIR:?} NAME=op2 ARM=closed FROM="if(globalThis.__TASK_OPEN===undefined)globalThis.__TASK_OPEN=1;" TO="if(globalThis.__TASK_OPEN===undefined)globalThis.__TASK_OPEN=0;" lab/port/long-pair.sh > /dev/null 2>&1
node lab/port/analyse-open.js op2 closed base | cut -c1-640
