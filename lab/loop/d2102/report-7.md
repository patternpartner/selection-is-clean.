# Report 7: world d2102 (seed 2102) at tick 700000

Write module 7 into `mods/7-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1981 (inert twin 1663); mean program length 8.49 (twin 9.42); mean generation 3994.9
- distinct functional programs 385; the commonest holds 4.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 11129.4 | corpses eaten 2618.0 | taken by attack 15124.0 (79.3 kills)
- module FAT (op 32, since tick 100000): income 40.79, energy put in 65.71, executions 16113, carried by 0.8% now 1.1%, energy held in its fields 1.03
- module GUT (op 33, since tick 200000): income 3176.37, energy put in 0.00, executions 1619348, carried by 64.7% now 79.6%, energy held in its fields 23.52
- module BITE (op 34, since tick 300000): income 8827.25, energy put in 0.00, executions 1296439, carried by 49.1% now 51.9%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 3243.80, energy put in 324.38, executions 550519, carried by 22.4% now 47.5%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 4.27, energy put in 47.70, executions 1031, carried by 0.1% now 0.1%, energy held in its fields 1.86
- module STRETCH (op 37, since tick 600000): income 17600.05, energy put in 0.00, executions 3736650, carried by 91.3% now 98.0%, energy held in its fields 0

## Energy lying in the world now
- light 29.7, corpses 67.4, in organisms 4887.6

## The commonest programs now (functional: neutral markers dropped), share of the living
- 4.5%: STRETCH(241) EAT_LIGHT(142) SQUEEZE(48) BITE(29) DIVIDE(183) GUT(239) TURN(77) STRETCH(20)
- 3.8%: STRETCH(241) EAT_LIGHT(142) SQUEEZE(227) BITE(29) DIVIDE(183) GUT(239) TURN(77) STRETCH(20)
- 2.9%: EAT_CORPSE(5) STRETCH(3) TURN(13) GUT(184) BITE(214) DIVIDE(183)
- 2.8%: SQUEEZE(129) GUT(0) STRETCH(68) TURN(115) STRETCH(218) GUT(172) SQUEEZE(149) EAT_LIGHT(63) DIVIDE(109) BITE(173)
- 2.7%: STRETCH(16) EAT_LIGHT(142) DIVIDE(29) TURN(171) STRETCH(238)
- 2.3%: SENSE_KIN(29) EAT_LIGHT(200) GUT(74) EAT_LIGHT(92) STRETCH(19) STRETCH(43) EAT_CORPSE(22) DIVIDE(248) TURN(63) STRETCH(116) EAT_LIGHT(189) IFGT(221) MOVE(196)
- 2.1%: STRETCH(114) EAT_LIGHT(77) BITE(29) DIVIDE(122) STRETCH(46) GUT(239) TURN(225) STRETCH(20)
- 2.0%: STRETCH(241) EAT_LIGHT(142) SQUEEZE(227) BITE(29) DIVIDE(183) GUT(239) TURN(77) STRETCH(120)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 99%, EAT_LIGHT 88%, EAT_CORPSE 26%, ATTACK 16%, IFGT 12%, SENSE_KIN 12%, MOVE 10%, ADD 8%, SENSE_MATCH 7%, IFLT 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 1.1%, effect -0.10 (t -0.6), carriers' births 456: not told from zero
- GUT: carried 76.0%, effect 0.75 (t 12.4), carriers' births 32816: SELECTED
- BITE: carried 51.2%, effect 0.21 (t 4.8), carriers' births 21569: SELECTED
- SQUEEZE: carried 48.1%, effect 0.18 (t 2.9), carriers' births 20794: not told from zero
- LEAF: carried 0.0%, effect -8.73 (t -9.8), carriers' births 0: AGAINST
- STRETCH: carried 98.7%, effect 0.58 (t 2.0), carriers' births 40752: not told from zero

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
- 5: LEAF at tick 500000 (5-leaf.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
