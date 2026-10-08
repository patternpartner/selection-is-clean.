# Report 11: world d2102 (seed 2102) at tick 1100000

Write module 11 into `mods/11-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1233 (inert twin 1617); mean program length 19.65 (twin 9.1); mean generation 6183.7
- distinct functional programs 289; the commonest holds 10.6%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 6855.9 | corpses eaten 2034.3 | taken by attack 64.8 (0.6 kills)
- module FAT (op 32, since tick 100000): income 0.22, energy put in 45.04, executions 1972, carried by 0.4% now 0.9%, energy held in its fields 8.97
- module GUT (op 33, since tick 200000): income 455.94, energy put in 0.00, executions 164283, carried by 14.9% now 10.3%, energy held in its fields 5.47
- module BITE (op 34, since tick 300000): income 1.94, energy put in 0.00, executions 4483, carried by 0.8% now 1.4%, energy held in its fields 0
- module SQUEEZE (op 35, since tick 400000): income 21.46, energy put in 2.15, executions 7835, carried by 1.3% now 0.8%, energy held in its fields 0
- module LEAF (op 36, since tick 500000): income 87.89, energy put in 121.21, executions 1526, carried by 0.3% now 0.5%, energy held in its fields 36.91
- module STRETCH (op 37, since tick 600000): income 20948.64, energy put in 0.00, executions 1872325, carried by 100.0% now 100.0%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 6904.70, energy put in 10357.05, executions 570850, carried by 54.4% now 1.0%, energy held in its fields 0
- module SPINES (op 39, since tick 800000): income 0.00, energy put in 48.97, executions 371, carried by 0.1% now 0.1%, energy held in its fields 0
- module FANG (op 40, since tick 900000): income 58882.81, energy put in 64771.09, executions 4434626, carried by 99.9% now 100.0%, energy held in its fields 0
- module SNARL (op 41, since tick 1000000): income 3677.62, energy put in 4045.38, executions 537012, carried by 62.3% now 97.3%, energy held in its fields 0

## Energy lying in the world now
- light 69.5, corpses 78.6, in organisms 567.5

## The commonest programs now (functional: neutral markers dropped), share of the living
- 10.6%: FANG(51) EAT_LIGHT(68) STRETCH(240) FANG(183) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(4) DIVIDE(109) FANG(48) TURN(71) FANG(147) STRETCH(85) FANG(80) FANG(60) FANG(149) TURN(27) STRETCH(25) MOVE(83) FANG(163)
- 10.4%: FANG(51) EAT_LIGHT(44) STRETCH(240) FANG(208) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(4) DIVIDE(103) FANG(48) TURN(71) FANG(181) STRETCH(15) FANG(80) FANG(60) FANG(147) TURN(27) STRETCH(193) MOVE(83) FANG(163)
- 4.7%: FANG(51) EAT_LIGHT(245) STRETCH(240) FANG(183) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(4) DIVIDE(109) FANG(48) TURN(71) FANG(147) STRETCH(54) FANG(80) FANG(60) FANG(149) TURN(27) STRETCH(25) MOVE(83) FANG(163)
- 4.5%: FANG(51) EAT_LIGHT(129) FANG(240) FANG(115) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(116) DIVIDE(135) FANG(116) TURN(71) FANG(147) STRETCH(192) FANG(104) FANG(60) FANG(149) TURN(27) STRETCH(50) MOVE(83) FANG(163)
- 3.3%: FANG(164) EAT_LIGHT(116) STRETCH(240) FANG(183) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(49) DIVIDE(109) FANG(48) TURN(71) FANG(147) STRETCH(85) FANG(80) FANG(60) FANG(149) TURN(27) STRETCH(25) MOVE(83) FANG(163)
- 3.0%: FANG(164) EAT_LIGHT(68) STRETCH(240) FANG(183) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(86) DIVIDE(109) FANG(48) TURN(71) FANG(147) STRETCH(85) FANG(80) FANG(60) FANG(149) TURN(27) STRETCH(25) MOVE(83) FANG(163)
- 3.0%: FANG(51) EAT_LIGHT(129) FANG(240) FANG(208) EAT_CORPSE(115) FANG(35) SNARL(3) SNARL(116) DIVIDE(135) FANG(116) TURN(71) FANG(147) STRETCH(192) FANG(104) FANG(60) FANG(149) TURN(27) STRETCH(30) MOVE(83) FANG(163)
- 2.8%: FANG(51) EAT_LIGHT(68) STRETCH(240) FANG(208) EAT_CORPSE(115) FANG(35) SNARL(187) SNARL(4) DIVIDE(109) FANG(149) TURN(71) FANG(215) FANG(35) FANG(80) FANG(60) FANG(147) TURN(27) STRETCH(25) MOVE(83) FANG(69)

## Instructions carried, share of the living
- TURN 100%, DIVIDE 100%, EAT_LIGHT 99%, MOVE 99%, EAT_CORPSE 99%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 2.3%, effect -0.18 (t -0.2), carriers' births 162: not told from zero
- GUT: carried 11.3%, effect 0.18 (t 4.5), carriers' births 2959: SELECTED
- BITE: carried 1.8%, effect 0.20 (t 0.7), carriers' births 367: not told from zero
- SQUEEZE: carried 0.5%, effect 0.12 (t 0.4), carriers' births 57: not told from zero
- LEAF: carried 0.3%, effect -1.56 (t -2.8), carriers' births 11: AGAINST
- STRETCH: carried 100.0%, effect - (t -), carriers' births 26709: not told from zero
- MAUL: carried 1.4%, effect -0.22 (t -0.8), carriers' births 153: not told from zero
- SPINES: carried 0.1%, effect -11.86 (t -5.1), carriers' births 4: AGAINST
- FANG: carried 100.0%, effect - (t -), carriers' births 26709: not told from zero
- SNARL: carried 98.3%, effect 0.38 (t 1.6), carriers' births 26008: not told from zero

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
- 10: SNARL at tick 1000000 (10-snarl.js)
