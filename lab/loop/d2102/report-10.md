# Report 10: world d2102 (seed 2102) at tick 1000000

Write module 10 into `mods/10-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1126 (inert twin 1586); mean program length 18.16 (twin 11.19); mean generation 5573.4
- distinct functional programs 268; the commonest holds 8.8%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 4854.5 | corpses eaten 1007.3 | taken by attack 246.7 (3.0 kills)
- module FAT (op 32, since tick 100000): income 4.87, energy put in 44.56, executions 21444, carried by 1.4% now 0.1%, energy held in its fields 0
- module GUT (op 33, since tick 200000): income 1472.28, energy put in 0.00, executions 466564, carried by 46.5% now 17.8%, energy held in its fields 9.01
- module BITE (op 34, since tick 300000): income 181.55, energy put in 0.00, executions 66071, carried by 5.6% now 0.2%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 99.78, energy put in 9.98, executions 19319, carried by 2.3% now 1.1%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 59.83, energy put in 102.61, executions 1539, carried by 0.2% now 0.3%, energy held in its fields 46.75
- module STRETCH (op 37, since tick 600000): income 22957.57, energy put in 0.00, executions 2148681, carried by 99.5% now 100.0%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 9722.18, energy put in 14583.27, executions 1088892, carried by 62.7% now 80.9%, energy held in its fields 0
- module SPINES (op 39, since tick 800000): income 0.00, energy put in 25.52, executions 210, carried by 0.0% now 0.0%, energy held in its fields 0
- module FANG (op 40, since tick 900000): income 67822.47, energy put in 74604.71, executions 3415303, carried by 80.3% now 96.9%, energy held in its fields 0

## Energy lying in the world now
- light 65.4, corpses 57.2, in organisms 524.8

## The commonest programs now (functional: neutral markers dropped), share of the living
- 8.8%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(35) MAUL(152) DIVIDE(22) FANG(5) TURN(71) MAUL(236) STRETCH(54) FANG(9) FANG(220) FANG(147) TURN(27) STRETCH(229) MOVE(83) FANG(220)
- 5.7%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(35) MAUL(152) DIVIDE(22) FANG(5) TURN(71) MAUL(236) STRETCH(54) FANG(254) FANG(220) FANG(147) TURN(27) STRETCH(229) MOVE(83) FANG(220)
- 4.8%: GUT(103) EAT_CORPSE(230) STRETCH(1) EAT_LIGHT(141) FANG(214) DIVIDE(68) STRETCH(58) TURN(97) STRETCH(250) GUT(149) EAT_LIGHT(162) STRETCH(105) TURN(6) STRETCH(80) MOVE(159)
- 4.3%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(63) MAUL(152) DIVIDE(22) FANG(5) TURN(71) MAUL(236) STRETCH(54) FANG(127) FANG(220) FANG(147) TURN(27) STRETCH(229) MOVE(83) FANG(220)
- 3.3%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(35) MAUL(183) DIVIDE(22) FANG(5) TURN(71) MAUL(227) STRETCH(217) FANG(254) FANG(255) FANG(147) TURN(27) STRETCH(84) MOVE(83) FANG(220)
- 3.2%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(35) MAUL(196) DIVIDE(22) FANG(5) TURN(71) STRETCH(54) FANG(254) FANG(220) FANG(147) TURN(27) STRETCH(229) MOVE(83) FANG(220)
- 3.2%: FANG(20) MAUL(164) EAT_LIGHT(165) STRETCH(55) FANG(89) EAT_CORPSE(115) FANG(165) SENSE_GRAD(103) DIVIDE(36) FANG(5) TURN(107) STRETCH(169) FANG(53) FANG(220) FANG(147) TURN(27) STRETCH(66) MOVE(41) FANG(39)
- 2.8%: FANG(20) MAUL(225) EAT_LIGHT(165) STRETCH(205) FANG(89) EAT_CORPSE(115) FANG(35) MAUL(183) DIVIDE(163) FANG(5) TURN(71) MAUL(201) STRETCH(54) FANG(254) FANG(255) FANG(147) TURN(27) STRETCH(229) MOVE(83) FANG(220)

## Instructions carried, share of the living
- TURN 100%, DIVIDE 99%, EAT_LIGHT 95%, MOVE 91%, EAT_CORPSE 90%, SENSE_KIN 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 0.4%, effect -0.80 (t -1.2), carriers' births 23: not told from zero
- GUT: carried 17.7%, effect 0.08 (t 2.0), carriers' births 3780: not told from zero
- BITE: carried 0.3%, effect 0.14 (t 0.3), carriers' births 28: not told from zero
- SQUEEZE: carried 0.6%, effect 0.43 (t 1.0), carriers' births 123: not told from zero
- LEAF: carried 0.3%, effect -1.48 (t -4.8), carriers' births 4: AGAINST
- STRETCH: carried 99.9%, effect - (t -), carriers' births 22657: not told from zero
- MAUL: carried 79.5%, effect 0.22 (t 3.7), carriers' births 18572: SELECTED
- SPINES: carried 0.0%, effect -16.73 (t -6.6), carriers' births 16: AGAINST
- FANG: carried 97.4%, effect 1.96 (t 11.4), carriers' births 22186: SELECTED

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
- 5: LEAF at tick 500000 (5-leaf.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: SPINES at tick 800000 (8-spines.js)
- 9: FANG at tick 900000 (9-fang.js)
