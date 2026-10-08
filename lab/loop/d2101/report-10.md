# Report 10: world d2101 (seed 2101) at tick 1000000

Write module 10 into `mods/10-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1202 (inert twin 1649); mean program length 10.56 (twin 9.59); mean generation 5291.1
- distinct functional programs 195; the commonest holds 18.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 10677.1 | corpses eaten 2031.7 | taken by attack 264.6 (0.9 kills)
- module GUT (op 32, since tick 100000): income 582.47, energy put in 0.00, executions 256356, carried by 16.7% now 1.8%, energy held in its fields 0.23
- module BITE (op 33, since tick 200000): income 368.19, energy put in 0.00, executions 148913, carried by 8.5% now 0.9%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 34.94, energy put in 3.49, executions 14758, carried by 1.0% now 0.3%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 1520.34, energy put in 1148.98, executions 13642, carried by 12.7% now 14.4%, energy held in its fields 81.17
- module GRAZE (op 36, since tick 500000): income 749.67, energy put in 0.00, executions 185207, carried by 14.1% now 15.1%, energy held in its fields 21.08
- module STRETCH (op 37, since tick 600000): income 15569.52, energy put in 0.00, executions 1467103, carried by 90.9% now 83.4%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 1624.35, energy put in 2436.53, executions 77188, carried by 6.0% now 0.3%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 0.00, energy put in 32.73, executions 3450, carried by 0.3% now 0.5%, energy held in its fields 4.24
- module FANG (op 40, since tick 900000): income 75724.50, energy put in 83296.95, executions 4266084, carried by 93.3% now 100.0%, energy held in its fields 0

## Energy lying in the world now
- light 70.4, corpses 140.7, in organisms 576.5

## The commonest programs now (functional: neutral markers dropped), share of the living
- 18.5%: STRETCH(107) FANG(66) EAT_CORPSE(33) FANG(189) TURN(210) DIVIDE(61) MOVE(28) FANG(44) FANG(84) EAT_LIGHT(55)
- 7.6%: SENSE_GRAD(120) IFGT(146) LEAF(136) EAT_LIGHT(252) MOVE(26) EAT_CORPSE(137) FANG(216) EAT_CORPSE(116) EAT_LIGHT(153) GRAZE(21) SENSE_MATCH(208) GRAZE(105) DIVIDE(118) IFLT(139) TURN(237)
- 6.5%: STRETCH(107) FANG(193) EAT_CORPSE(225) FANG(189) TURN(90) DIVIDE(133) MOVE(26) FANG(237) FANG(84) EAT_LIGHT(14)
- 5.9%: STRETCH(236) FANG(193) EAT_CORPSE(252) FANG(189) TURN(90) DIVIDE(133) MOVE(26) FANG(36) FANG(84) EAT_LIGHT(14)
- 3.9%: STRETCH(107) EAT_CORPSE(33) FANG(189) MOV(193) TURN(210) DIVIDE(61) MOVE(28) FANG(44) FANG(84) EAT_LIGHT(55)
- 3.6%: FANG(89) STRETCH(14) FANG(229) FANG(16) TURN(205) DIVIDE(244) FANG(15) FANG(88)
- 3.4%: FANG(16) FANG(254) FANG(90) STRETCH(79) FANG(118) FANG(1) TURN(205) DIVIDE(123) FANG(252) EAT_LIGHT(94)
- 3.4%: FANG(16) FANG(16) FANG(241) STRETCH(79) FANG(118) FANG(1) TURN(205) DIVIDE(123) FANG(252) EAT_LIGHT(49)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 99%, EAT_LIGHT 92%, MOVE 70%, EAT_CORPSE 70%, IFGT 15%, SENSE_MATCH 15%, IFLT 14%, SENSE_GRAD 14%, MOV 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 1.1%, effect 1.79 (t 5.3), carriers' births 185: SELECTED
- BITE: carried 0.3%, effect -0.56 (t -1.3), carriers' births 40: not told from zero
- SQUEEZE: carried 0.4%, effect 0.00 (t 0.0), carriers' births 28: not told from zero
- LEAF: carried 13.7%, effect 2.06 (t 29.6), carriers' births 3695: SELECTED
- GRAZE: carried 14.1%, effect -0.21 (t -10.9), carriers' births 3828: AGAINST
- STRETCH: carried 85.1%, effect 0.74 (t 4.3), carriers' births 23260: SELECTED
- MAUL: carried 0.1%, effect 0.24 (t 0.6), carriers' births 41: not told from zero
- FAT: carried 1.0%, effect 0.58 (t 0.9), carriers' births 158: not told from zero
- FANG: carried 99.8%, effect 2.91 (t 4.7), carriers' births 27241: SELECTED

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
