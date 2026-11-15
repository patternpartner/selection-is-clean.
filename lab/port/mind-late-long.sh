#!/bin/bash
# REMOVED AGAIN by #434 (the knob did no better and fell behind late); this script records how the run was made, and needs the
# knob from commit 5f3fce7 to run again.
# #434 design (one long pair, not a decision): the mind that learns from birth and writes drawn instructions until its universe is
# MIND_LATE (8,000) ticks old, then from its model (MIND_MODE 4, 'late'), against the engine as shipped (draw). #433 had draw ahead
# for two hours and the learner ahead after; this asks whether one mind can have both. One leg of long-pair.sh per launch.
#   PDIR=dir-for-the-profiles lab/port/mind-late-long.sh
cd "$(dirname "$0")/../.."
NAME=lm2 ARM=late FROM="else if(!mm&&!mset&&TASKS_ON)mode=3;" TO="else if(!mm&&!mset&&TASKS_ON)mode=4;" PDIR=${PDIR:?} lab/port/long-pair.sh
