# Report 11: world d2103 (seed 2103) at tick 1100000

Write module 11 into `mods/11-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1072 (inert twin 1337); mean program length 11.05 (twin 9); mean generation 5782.3
- distinct functional programs 228; the commonest holds 8.2%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 11957.0 | corpses eaten 2114.9 | taken by attack 47.9 (0.4 kills)
- module GUT (op 32, since tick 100000): income 328.41, energy put in 0.00, executions 110928, carried by 11.1% now 12.9%, energy held in its fields 8.95
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 5077, carried by 0.6% now 0.3%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 2.31, energy put in 0.23, executions 3598, carried by 0.4% now 0.6%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 55.09, energy put in 101.88, executions 1713, carried by 0.2% now 0.0%, energy held in its fields 0
- module BITE (op 36, since tick 500000): income 1.71, energy put in 0.00, executions 4899, carried by 0.6% now 0.4%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 15593.32, energy put in 0.00, executions 1351360, carried by 98.2% now 99.4%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 69.70, energy put in 104.55, executions 6117, carried by 0.7% now 0.7%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 0.66, energy put in 33.94, executions 7539, carried by 1.2% now 0.2%, energy held in its fields 4.53
- module FANG (op 40, since tick 900000): income 76676.94, energy put in 84344.64, executions 4920530, carried by 100.0% now 99.2%, energy held in its fields 0
- module SNARL (op 41, since tick 1000000): income 1475.36, energy put in 1622.89, executions 167782, carried by 15.6% now 48.5%, energy held in its fields 0

## Energy lying in the world now
- light 67.8, corpses 1431.3, in organisms 637.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 8.2%: MOVE(175) FANG(239) EAT_CORPSE(35) EAT_LIGHT(106) FANG(114) STRETCH(19) FANG(226) DIVIDE(234) FANG(28) TURN(199)
- 6.3%: FANG(8) FANG(72) EAT_LIGHT(84) FANG(166) FANG(61) STRETCH(198) SNARL(26) DIVIDE(156) FANG(227) TURN(221)
- 4.8%: FANG(105) FANG(14) EAT_LIGHT(227) FANG(81) FANG(61) STRETCH(61) SNARL(26) DIVIDE(156) FANG(191) TURN(221)
- 4.6%: MOVE(175) FANG(239) EAT_CORPSE(35) EAT_LIGHT(106) FANG(80) STRETCH(19) FANG(226) DIVIDE(234) FANG(28) TURN(199)
- 4.2%: FANG(52) FANG(255) FANG(164) FANG(29) FANG(171) STRETCH(7) DIVIDE(209) FANG(83) FANG(85) TURN(193)
- 3.7%: MOVE(8) FANG(105) FANG(155) EAT_LIGHT(103) FANG(231) FANG(244) STRETCH(61) DIVIDE(48) FANG(75) TURN(242)
- 3.1%: FANG(105) FANG(14) EAT_LIGHT(119) FANG(166) FANG(61) STRETCH(61) SNARL(26) DIVIDE(156) FANG(191) TURN(221)
- 3.0%: FANG(84) FANG(109) FANG(164) FANG(29) FANG(171) STRETCH(7) DIVIDE(209) FANG(83) FANG(203) TURN(193)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 88%, MOVE 53%, EAT_CORPSE 42%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 14.5%, effect 0.38 (t 8.6), carriers' births 3115: SELECTED
- CARRION: carried 0.2%, effect 0.00 (t 0.0), carriers' births 45: not told from zero
- SQUEEZE: carried 0.8%, effect -0.03 (t -0.1), carriers' births 150: not told from zero
- LEAF: carried 0.1%, effect -2.66 (t -7.5), carriers' births 0: AGAINST
- BITE: carried 0.7%, effect 0.83 (t 2.0), carriers' births 123: not told from zero
- STRETCH: carried 98.5%, effect 1.14 (t 2.7), carriers' births 23016: not told from zero
- MAUL: carried 0.2%, effect 0.70 (t 3.7), carriers' births 31: SELECTED
- FAT: carried 0.4%, effect -0.72 (t -1.1), carriers' births 46: not told from zero
- FANG: carried 99.8%, effect 0.88 (t 2.7), carriers' births 23354: not told from zero
- SNARL: carried 48.0%, effect 0.07 (t 1.8), carriers' births 10377: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: BITE at tick 500000 (5-bite.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
- 8: FAT at tick 800000 (8-fat.js)
- 9: FANG at tick 900000 (9-fang.js)
- 10: SNARL at tick 1000000 (10-snarl.js)
