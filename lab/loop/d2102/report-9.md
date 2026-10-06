# Report 9: world d2102 (seed 2102) at tick 900000

Write module 9 into `mods/9-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1372 (inert twin 1691); mean program length 12.35 (twin 10); mean generation 5043
- distinct functional programs 290; the commonest holds 6.6%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 8362.7 | corpses eaten 1609.4 | taken by attack 2248.8 (14.0 kills)
- module FAT (op 32, since tick 100000): income 195.78, energy put in 218.82, executions 91404, carried by 5.1% now 20.0%, energy held in its fields 0
- module GUT (op 33, since tick 200000): income 1785.81, energy put in 0.00, executions 1254961, carried by 70.4% now 64.1%, energy held in its fields 32.39
- module BITE (op 34, since tick 300000): income 5507.93, energy put in 0.00, executions 1100543, carried by 51.3% now 39.9%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 599.19, energy put in 59.92, executions 159259, carried by 9.5% now 6.9%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 24.28, energy put in 56.30, executions 1380, carried by 0.1% now 0.0%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 20388.86, energy put in 0.00, executions 3625017, carried by 99.1% now 99.2%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 17645.57, energy put in 26468.35, executions 1204736, carried by 39.1% now 49.6%, energy held in its fields 0
- module SPINES (op 39, since tick 800000): income 0.00, energy put in 22.31, executions 195, carried by 0.0% now 0.0%, energy held in its fields 0

## Energy lying in the world now
- light 51.3, corpses 246.9, in organisms 2447.3

## The commonest programs now (functional: neutral markers dropped), share of the living
- 6.6%: MAUL(213) MAUL(93) EAT_LIGHT(2) STRETCH(135) GUT(145) STRETCH(75) SENSE_LIGHT(254) MAUL(161) DIVIDE(60) TURN(97) STRETCH(218) GUT(152) EAT_LIGHT(215) MAUL(165) STRETCH(37) MAUL(147) TURN(6) MOVE(217) MAUL(39) EAT_LIGHT(131)
- 4.2%: EAT_CORPSE(10) STRETCH(42) TURN(111) BITE(143) STRETCH(238) DIVIDE(208)
- 4.1%: EAT_CORPSE(46) STRETCH(42) TURN(111) DIVIDE(88)
- 4.0%: MAUL(88) MAUL(93) EAT_LIGHT(2) STRETCH(135) GUT(145) STRETCH(115) MAUL(161) DIVIDE(204) TURN(97) STRETCH(218) GUT(152) EAT_LIGHT(215) MAUL(165) STRETCH(37) MAUL(147) TURN(6) STRETCH(14) MOVE(93) MAUL(39) EAT_LIGHT(131)
- 2.6%: EAT_LIGHT(230) TURN(143) STRETCH(70) FAT(162) DIVIDE(211) BITE(3)
- 2.6%: GUT(180) EAT_LIGHT(99) SQUEEZE(218) EAT_LIGHT(4) STRETCH(123) EAT_CORPSE(145) LOADK(219) TURN(143) STRETCH(70) FAT(162) DIVIDE(211)
- 2.0%: GUT(233) STRETCH(123) TURN(26) STRETCH(70) FAT(162) DIVIDE(200) DIVIDE(152) BITE(3)
- 1.7%: MAUL(213) MAUL(155) EAT_LIGHT(150) STRETCH(135) GUT(145) STRETCH(115) DIVIDE(204) TURN(97) STRETCH(218) GUT(141) EAT_LIGHT(215) MAUL(13) STRETCH(37) DIVIDE(104) TURN(28) STRETCH(14) MOVE(93) MAUL(39) EAT_LIGHT(131)

## Instructions carried, share of the living
- DIVIDE 100%, TURN 97%, EAT_LIGHT 71%, EAT_CORPSE 42%, MOVE 38%, LOADK 20%, SENSE_LIGHT 13%, SENSE_E 9%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 16.8%, effect -0.05 (t -0.6), carriers' births 5095: not told from zero
- GUT: carried 68.2%, effect 0.09 (t 1.5), carriers' births 18803: not told from zero
- BITE: carried 38.9%, effect 0.21 (t 2.7), carriers' births 10970: not told from zero
- SQUEEZE: carried 8.2%, effect 0.13 (t 1.0), carriers' births 2693: not told from zero
- LEAF: carried 0.1%, effect -4.43 (t -7.5), carriers' births 0: AGAINST
- STRETCH: carried 98.9%, effect 0.84 (t 2.5), carriers' births 28176: SELECTED
- MAUL: carried 49.7%, effect 0.15 (t 4.3), carriers' births 13837: SELECTED
- SPINES: carried 0.0%, effect -52.18 (t -2.5), carriers' births 8: AGAINST

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
- 2: GUT at tick 200000 (2-gut.js)
- 3: BITE at tick 300000 (3-bite.js)
- 4: SQUEEZE at tick 400000 (4-squeeze.js)
- 5: LEAF at tick 500000 (5-leaf.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: SPINES at tick 800000 (8-spines.js)
