# Report 11: world d2101 (seed 2101) at tick 1100000

Write module 11 into `mods/11-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1150 (inert twin 1436); mean program length 10.59 (twin 9.86); mean generation 5867.9
- distinct functional programs 186; the commonest holds 14.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 11603.1 | corpses eaten 2469.1 | taken by attack 30.2 (0.3 kills)
- module GUT (op 32, since tick 100000): income 112.63, energy put in 0.00, executions 19569, carried by 1.8% now 0.3%, energy held in its fields 0.01
- module BITE (op 33, since tick 200000): income 1.02, energy put in 0.00, executions 2868, carried by 0.3% now 0.3%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 0.32, energy put in 0.03, executions 2766, carried by 0.3% now 0.0%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 1394.48, energy put in 911.63, executions 10607, carried by 10.4% now 12.6%, energy held in its fields 62.98
- module GRAZE (op 36, since tick 500000): income 551.48, energy put in 0.00, executions 126457, carried by 10.9% now 14.0%, energy held in its fields 14.9
- module STRETCH (op 37, since tick 600000): income 14391.49, energy put in 0.00, executions 994715, carried by 88.0% now 86.3%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 73.58, energy put in 110.37, executions 4971, carried by 0.5% now 0.2%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 0.00, energy put in 37.04, executions 1821, carried by 0.2% now 0.3%, energy held in its fields 5.83
- module FANG (op 40, since tick 900000): income 84233.43, energy put in 92656.77, executions 4867247, carried by 99.7% now 99.7%, energy held in its fields 0
- module SNARL (op 41, since tick 1000000): income 90.69, energy put in 99.76, executions 9163, carried by 0.9% now 6.8%, energy held in its fields 0

## Energy lying in the world now
- light 79.7, corpses 222.6, in organisms 563.8

## The commonest programs now (functional: neutral markers dropped), share of the living
- 14.5%: FANG(68) EAT_CORPSE(87) FANG(86) TURN(187) DIVIDE(79) MOVE(143) FANG(51) FANG(150) STRETCH(8) EAT_LIGHT(68)
- 13.9%: FANG(68) EAT_CORPSE(161) FANG(200) TURN(174) DIVIDE(79) MOVE(150) FANG(215) FANG(150) STRETCH(43) EAT_LIGHT(209)
- 8.4%: FANG(177) FANG(47) STRETCH(225) FANG(121) FANG(97) FANG(23) TURN(147) DIVIDE(154) FANG(174) FANG(151)
- 5.1%: SENSE_GRAD(179) IFGT(146) LEAF(136) EAT_LIGHT(252) MOVE(26) EAT_CORPSE(244) FANG(216) EAT_CORPSE(116) EAT_LIGHT(101) GRAZE(114) SENSE_MATCH(208) GRAZE(171) DIVIDE(167) IFLT(139) TURN(237)
- 4.3%: FANG(82) FANG(240) STRETCH(225) FANG(215) FANG(97) FANG(126) TURN(173) DIVIDE(154) FANG(174) FANG(172)
- 4.1%: SENSE_GRAD(179) IFGT(158) LEAF(136) EAT_LIGHT(255) MOVE(22) EAT_CORPSE(244) FANG(216) EAT_CORPSE(204) EAT_LIGHT(238) GRAZE(114) SENSE_MATCH(32) GRAZE(147) DIVIDE(167) IFLT(139) TURN(237)
- 3.0%: FANG(67) FANG(47) STRETCH(225) FANG(121) FANG(47) FANG(23) TURN(147) DIVIDE(154) FANG(174) FANG(151)
- 2.9%: FANG(68) EAT_CORPSE(161) SNARL(200) TURN(167) DIVIDE(49) MOVE(150) ADD(215) FANG(150) STRETCH(43) EAT_LIGHT(209)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, MOVE 67%, EAT_LIGHT 67%, EAT_CORPSE 66%, SENSE_GRAD 14%, SENSE_MATCH 13%, IFLT 13%, IFGT 13%, ADD 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 0.7%, effect 1.09 (t 1.1), carriers' births 112: not told from zero
- BITE: carried 0.2%, effect 0.25 (t 0.6), carriers' births 9: not told from zero
- SQUEEZE: carried 0.1%, effect 0.00 (t 0.0), carriers' births 36: not told from zero
- LEAF: carried 11.9%, effect 2.44 (t 20.0), carriers' births 3314: SELECTED
- GRAZE: carried 14.0%, effect -0.14 (t -2.8), carriers' births 3730: not told from zero
- STRETCH: carried 86.8%, effect 0.98 (t 16.8), carriers' births 22465: SELECTED
- MAUL: carried 0.5%, effect 0.97 (t 1.8), carriers' births 89: not told from zero
- FAT: carried 0.3%, effect -1.22 (t -3.2), carriers' births 14: AGAINST
- FANG: carried 99.2%, effect 2.16 (t 2.2), carriers' births 25923: not told from zero
- SNARL: carried 7.4%, effect 0.40 (t 2.5), carriers' births 2076: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: GRAZE at tick 500000 (5-graze.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: FAT at tick 800000 (8-fat.js)
- 9: FANG at tick 900000 (9-fang.js)
- 10: SNARL at tick 1000000 (10-snarl.js)
