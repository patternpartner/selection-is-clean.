# Report 7: world d2101 (seed 2101) at tick 700000

Write module 7 into `mods/7-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1869 (inert twin 1623); mean program length 8.61 (twin 8.36); mean generation 3746.9
- distinct functional programs 435; the commonest holds 4.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 11807.0 | corpses eaten 2349.2 | taken by attack 14215.4 (78.6 kills)
- module GUT (op 32, since tick 100000): income 3331.59, energy put in 0.00, executions 1611726, carried by 68.7% now 64.5%, energy held in its fields 38.36
- module BITE (op 33, since tick 200000): income 7212.73, energy put in 0.00, executions 1360038, carried by 56.0% now 69.3%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 3663.89, energy put in 366.39, executions 534090, carried by 23.6% now 34.0%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 664.61, energy put in 512.64, executions 5559, carried by 7.3% now 5.8%, energy held in its fields 33.87
- module GRAZE (op 36, since tick 500000): income 315.31, energy put in 0.00, executions 268537, carried by 15.2% now 14.1%, energy held in its fields 8.83
- module STRETCH (op 37, since tick 600000): income 16411.98, energy put in 0.00, executions 3799188, carried by 89.7% now 98.8%, energy held in its fields 0

## Energy lying in the world now
- light 38.6, corpses 192.6, in organisms 3866.1

## The commonest programs now (functional: neutral markers dropped), share of the living
- 4.5%: STRETCH(219) TURN(253) GUT(88) EAT_LIGHT(214) DIVIDE(26) STRETCH(17) BITE(198)
- 3.9%: SENSE_GRAD(224) IFGT(205) LEAF(62) EAT_LIGHT(207) STRETCH(38) MOVE(62) EAT_CORPSE(82) EAT_CORPSE(231) EAT_LIGHT(245) GRAZE(246) SENSE_MATCH(74) GRAZE(118) DIVIDE(114) IFLT(162) TURN(221)
- 2.4%: STRETCH(219) TURN(253) STRETCH(42) DIVIDE(51) GUT(88) EAT_LIGHT(185) SQUEEZE(66) BITE(122)
- 2.2%: DIVIDE(51) GUT(166) TURN(243) STRETCH(231) EAT_LIGHT(116) STRETCH(154) SQUEEZE(54)
- 1.9%: DIVIDE(51) GUT(166) TURN(243) STRETCH(231) STRETCH(154) SQUEEZE(54)
- 1.7%: STRETCH(30) BITE(197) MOV(248) TURN(253) EAT_LIGHT(34) ATTACK(86) STRETCH(185) DIVIDE(186) STRETCH(91)
- 1.4%: STRETCH(95) TURN(253) STRETCH(42) DIVIDE(51) GUT(88) EAT_LIGHT(55) SQUEEZE(66) EAT_LIGHT(230) BITE(252)
- 1.4%: STRETCH(30) BITE(197) MOV(248) TURN(253) EAT_LIGHT(34) ATTACK(86) STRETCH(185) DIVIDE(186) EAT_LIGHT(91)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 94%, TURN 93%, EAT_CORPSE 19%, ATTACK 15%, IFLT 12%, SENSE_MATCH 10%, MOV 9%, IFGT 9%, SENSE_GRAD 8%, MOVE 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 64.2%, effect 0.57 (t 9.8), carriers' births 25288: SELECTED
- BITE: carried 66.8%, effect 0.23 (t 4.5), carriers' births 26175: SELECTED
- SQUEEZE: carried 36.8%, effect 0.45 (t 12.3), carriers' births 14005: SELECTED
- LEAF: carried 5.3%, effect 0.29 (t 3.2), carriers' births 2737: not told from zero
- GRAZE: carried 13.3%, effect -0.04 (t -1.0), carriers' births 5565: not told from zero
- STRETCH: carried 98.5%, effect 0.44 (t 2.7), carriers' births 38225: SELECTED

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: GRAZE at tick 500000 (5-graze.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
