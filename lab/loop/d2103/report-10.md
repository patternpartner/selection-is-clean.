# Report 10: world d2103 (seed 2103) at tick 1000000

Write module 10 into `mods/10-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1155 (inert twin 1587); mean program length 10.95 (twin 8.23); mean generation 5192.9
- distinct functional programs 193; the commonest holds 17.4%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 9624.9 | corpses eaten 829.1 | taken by attack 414.8 (6.6 kills)
- module GUT (op 32, since tick 100000): income 1353.72, energy put in 0.00, executions 558592, carried by 52.4% now 16.4%, energy held in its fields 14.74
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 6347, carried by 0.7% now 0.5%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 452.47, energy put in 45.25, executions 152597, carried by 11.2% now 1.0%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 50.87, energy put in 109.74, executions 1850, carried by 0.2% now 0.2%, energy held in its fields 29.43
- module BITE (op 36, since tick 500000): income 381.93, energy put in 0.00, executions 124986, carried by 8.6% now 0.0%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 18319.49, energy put in 0.00, executions 1724012, carried by 97.5% now 96.0%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 3102.93, energy put in 4654.39, executions 319898, carried by 22.1% now 0.7%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 1.22, energy put in 35.30, executions 3410, carried by 0.4% now 0.1%, energy held in its fields 1.9
- module FANG (op 40, since tick 900000): income 78935.15, energy put in 86828.66, executions 3928597, carried by 93.3% now 100.0%, energy held in its fields 0

## Energy lying in the world now
- light 67.3, corpses 157, in organisms 562.9

## The commonest programs now (functional: neutral markers dropped), share of the living
- 17.4%: MOVE(212) FANG(39) EAT_CORPSE(14) EAT_LIGHT(59) FANG(74) FANG(27) STRETCH(242) DIVIDE(90) FANG(190) TURN(19)
- 11.2%: MOVE(5) FANG(105) FANG(142) EAT_LIGHT(64) FANG(74) FANG(77) STRETCH(61) DIVIDE(167) FANG(243) TURN(150)
- 4.8%: FANG(78) FANG(44) EAT_LIGHT(99) FANG(236) FANG(77) STRETCH(146) DIVIDE(131) FANG(73) FANG(249) TURN(19)
- 3.5%: MOVE(5) FANG(105) FANG(142) EAT_LIGHT(64) FANG(74) FANG(77) STRETCH(61) DIVIDE(167) FANG(100) TURN(150)
- 2.6%: MOVE(5) FANG(105) FANG(142) EAT_LIGHT(64) FANG(231) FANG(77) STRETCH(61) DIVIDE(167) FANG(100) TURN(150)
- 2.5%: MOVE(212) FANG(39) EAT_CORPSE(14) EAT_LIGHT(59) FANG(74) FANG(27) STRETCH(242) DIVIDE(90) FANG(190) TURN(45)
- 2.3%: MOVE(212) FANG(39) EAT_CORPSE(14) EAT_LIGHT(59) FANG(74) FANG(27) STRETCH(242) DIVIDE(90) FANG(190) TURN(127)
- 2.3%: FANG(62) TURN(25) FANG(197) DIVIDE(3) STRETCH(153) FANG(247) FANG(97) FANG(19)

## Instructions carried, share of the living
- DIVIDE 99%, TURN 98%, EAT_LIGHT 83%, MOVE 77%, EAT_CORPSE 51%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 15.0%, effect 0.04 (t 0.8), carriers' births 3565: not told from zero
- CARRION: carried 0.3%, effect 0.00 (t 0.0), carriers' births 73: not told from zero
- SQUEEZE: carried 0.6%, effect -0.32 (t -0.6), carriers' births 97: not told from zero
- LEAF: carried 0.2%, effect -2.32 (t -6.6), carriers' births 0: AGAINST
- BITE: carried 1.1%, effect -0.08 (t -0.1), carriers' births 97: not told from zero
- STRETCH: carried 98.4%, effect 2.19 (t 4.5), carriers' births 25839: SELECTED
- MAUL: carried 0.3%, effect -0.01 (t -0.0), carriers' births 103: not told from zero
- FAT: carried 0.2%, effect 0.66 (t 1.4), carriers' births 32: not told from zero
- FANG: carried 100.0%, effect - (t -), carriers' births 26374: not told from zero

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
