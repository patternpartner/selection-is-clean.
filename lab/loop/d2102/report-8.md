# Report 8: world d2102 (seed 2102) at tick 800000

Write module 8 into `mods/8-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1444 (inert twin 1570); mean program length 11.31 (twin 9.17); mean generation 4545.2
- distinct functional programs 301; the commonest holds 7.0%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 9468.6 | corpses eaten 654.9 | taken by attack 3159.6 (17.5 kills)
- module FAT (op 32, since tick 100000): income 16.51, energy put in 33.25, executions 18041, carried by 1.1% now 0.1%, energy held in its fields 0.82
- module GUT (op 33, since tick 200000): income 2255.51, energy put in 0.00, executions 1426444, carried by 76.2% now 66.3%, energy held in its fields 23.79
- module BITE (op 34, since tick 300000): income 2742.42, energy put in 0.00, executions 738468, carried by 36.7% now 41.4%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 1750.79, energy put in 175.08, executions 406687, carried by 21.2% now 15.9%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 19.76, energy put in 47.93, executions 1345, carried by 0.1% now 0.3%, energy held in its fields 8.86
- module STRETCH (op 37, since tick 600000): income 19322.82, energy put in 0.00, executions 3585787, carried by 99.2% now 98.8%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 18299.65, energy put in 27449.48, executions 1002706, carried by 44.9% now 46.9%, energy held in its fields 0

## Energy lying in the world now
- light 50.5, corpses 139.9, in organisms 1517.1

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.0%: EAT_LIGHT(107) STRETCH(142) MAUL(148) BITE(43) EAT_CORPSE(54) MAUL(32) DIVIDE(22) TURN(97) MAUL(186) STRETCH(107) STRETCH(58) EAT_LIGHT(92) EAT_LIGHT(250) TURN(58) STRETCH(223) MOVE(196) MAUL(62)
- 3.8%: GUT(155) EAT_LIGHT(230) STRETCH(61) BITE(57) TURN(53) STRETCH(85) DIVIDE(237)
- 3.8%: GUT(8) EAT_LIGHT(230) TURN(53) STRETCH(66) DIVIDE(11) BITE(95) STRETCH(204) BITE(124)
- 3.4%: BITE(211) GUT(225) MUL(109) EAT_LIGHT(230) LOADK(194) STRETCH(42) TURN(111) STRETCH(125) DIVIDE(88)
- 3.2%: IFLT(29) EAT_CORPSE(114) EAT_LIGHT(230) STRETCH(3) TURN(53) STRETCH(66) DIVIDE(20)
- 2.1%: EAT_CORPSE(114) EAT_LIGHT(230) STRETCH(3) TURN(53) STRETCH(66) DIVIDE(219)
- 2.1%: SQUEEZE(241) GUT(179) TURN(69) STRETCH(66) EAT_LIGHT(190) SENSE_E(121) DIVIDE(109)
- 1.9%: MAUL(216) EAT_LIGHT(2) STRETCH(139) MAUL(148) GUT(184) STRETCH(22) EAT_CORPSE(45) MAUL(184) DIVIDE(22) TURN(97) STRETCH(107) EAT_LIGHT(90) TURN(6) STRETCH(205) MOVE(196) MAUL(39) MAUL(233) STRETCH(121)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 93%, EAT_CORPSE 48%, MOVE 31%, MUL 16%, LOADK 10%, IFLT 9%, SENSE_E 9%, SENSE_LIGHT 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 1.7%, effect -0.27 (t -0.4), carriers' births 176: not told from zero
- GUT: carried 63.7%, effect 0.58 (t 5.8), carriers' births 19301: SELECTED
- BITE: carried 43.8%, effect 0.28 (t 3.8), carriers' births 12166: SELECTED
- SQUEEZE: carried 15.0%, effect 0.19 (t 2.0), carriers' births 4319: not told from zero
- LEAF: carried 0.1%, effect -3.62 (t -8.8), carriers' births 0: AGAINST
- STRETCH: carried 99.8%, effect 2.72 (t 4.0), carriers' births 28965: SELECTED
- MAUL: carried 51.4%, effect 0.34 (t 7.0), carriers' births 14961: SELECTED

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
- 5: LEAF at tick 500000 (5-leaf.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
