# Report 5: world d2101 (seed 2101) at tick 500000

Write module 5 into `mods/5-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1890 (inert twin 1693); mean program length 10.38 (twin 7.78); mean generation 2776.6
- distinct functional programs 324; the commonest holds 13.3%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 25822.2 | corpses eaten 4060.8 | taken by attack 13203.8 (74.8 kills)
- module GUT (op 32, since tick 100000): income 1400.44, energy put in 0.00, executions 1029649, carried by 53.8% now 44.9%, energy held in its fields 22.66
- module BITE (op 33, since tick 200000): income 5493.17, energy put in 0.00, executions 1049477, carried by 52.0% now 56.9%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 2152.33, energy put in 215.23, executions 311356, carried by 21.9% now 13.4%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 1813.91, energy put in 1132.64, executions 11903, carried by 13.6% now 36.5%, energy held in its fields 535.62

## Energy lying in the world now
- light 48.9, corpses 67.3, in organisms 5087

## The commonest programs now (functional: neutral markers dropped), share of the living
- 13.3%: EAT_LIGHT(3) SENSE_GRAD(100) IFGT(146) LEAF(80) EAT_LIGHT(137) EAT_LIGHT(91) MOVE(51) EAT_CORPSE(6) EAT_LIGHT(58) SENSE_KIN(4) DIVIDE(166) IFLT(138) TURN(221) EAT_CORPSE(121)
- 5.7%: EAT_LIGHT(3) SENSE_GRAD(100) IFGT(146) LEAF(9) EAT_LIGHT(137) EAT_LIGHT(91) MOVE(234) EAT_CORPSE(6) EAT_LIGHT(221) SENSE_KIN(4) DIVIDE(166) IFLT(107) TURN(221) EAT_CORPSE(121)
- 3.9%: GUT(198) EAT_LIGHT(141) BITE(206) DIVIDE(179) TURN(179)
- 2.3%: EAT_LIGHT(21) SENSE_GRAD(100) IFGT(146) LEAF(80) EAT_LIGHT(91) MOVE(68) EAT_CORPSE(111) EAT_LIGHT(74) SENSE_KIN(4) DIVIDE(91) IFLT(162) TURN(221) EAT_CORPSE(121)
- 2.0%: BITE(102) SENSE_CORPSE(46) SENSE_KIN(49) GUT(198) EAT_LIGHT(196) BITE(45) DIVIDE(179) TURN(171) MOV(163)
- 1.9%: BITE(136) EAT_CORPSE(237) EAT_LIGHT(33) SENSE_LIGHT(172) GUT(50) SENSE_LIGHT(13) TURN(65) DIVIDE(176) SQUEEZE(43) EAT_LIGHT(124)
- 1.7%: ATTACK(24) EAT_LIGHT(47) IFLT(45) EAT_CORPSE(106) DIVIDE(192) TURN(237)
- 1.7%: SENSE_CORPSE(46) GUT(198) EAT_LIGHT(196) BITE(45) DIVIDE(179) TURN(171) BITE(225)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 99%, TURN 95%, EAT_CORPSE 59%, IFGT 44%, IFLT 43%, SENSE_GRAD 41%, SENSE_KIN 40%, MOVE 37%, SENSE_CORPSE 28%, ATTACK 16%, SENSE_LIGHT 12%, SENSE_MATCH 8%, MOV 8%, SUB 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 45.7%, effect 0.71 (t 8.2), carriers' births 19376: SELECTED
- BITE: carried 57.2%, effect 0.13 (t 3.1), carriers' births 23179: SELECTED
- SQUEEZE: carried 13.7%, effect 0.05 (t 0.4), carriers' births 5963: not told from zero
- LEAF: carried 35.4%, effect -0.00 (t -0.2), carriers' births 24313: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
