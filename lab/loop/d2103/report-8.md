# Report 8: world d2103 (seed 2103) at tick 800000

Write module 8 into `mods/8-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1233 (inert twin 1515); mean program length 9.74 (twin 10.01); mean generation 4138.1
- distinct functional programs 250; the commonest holds 10.1%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 8517.9 | corpses eaten 571.8 | taken by attack 2730.9 (16.3 kills)
- module GUT (op 32, since tick 100000): income 1892.91, energy put in 0.00, executions 1497203, carried by 78.8% now 76.3%, energy held in its fields 38.02
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 19791, carried by 1.1% now 1.7%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1045.71, energy put in 104.57, executions 278704, carried by 15.8% now 1.4%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 14.10, energy put in 44.93, executions 1493, carried by 0.1% now 0.2%, energy held in its fields 16.84
- module BITE (op 36, since tick 500000): income 3042.39, energy put in 0.00, executions 916338, carried by 46.2% now 49.1%, energy held in its fields 0
- module STRETCH (op 37, since tick 600000): income 19939.85, energy put in 0.00, executions 4194292, carried by 99.7% now 99.8%, energy held in its fields 0
- module MAUL (op 38, since tick 700000): income 18083.66, energy put in 27125.50, executions 826533, carried by 38.5% now 63.5%, energy held in its fields 0

## Energy lying in the world now
- light 59.1, corpses 59.6, in organisms 1139.7

## The commonest programs now (functional: neutral markers dropped), share of the living
- 10.1%: EAT_LIGHT(93) STRETCH(92) EAT_LIGHT(80) DIVIDE(91) MAUL(121) MAUL(29) STRETCH(155) TURN(29) MOVE(168) MAUL(212)
- 4.9%: EAT_LIGHT(197) STRETCH(188) TURN(116) MAUL(133) STRETCH(185) DIVIDE(101) TURN(99) STRETCH(230) GUT(95) MAUL(30)
- 4.1%: EAT_LIGHT(197) SENSE_E(94) STRETCH(58) DIVIDE(95) TURN(191) STRETCH(200) STRETCH(181) GUT(95)
- 4.1%: SENSE_MATCH(199) EAT_LIGHT(175) MAUL(188) STRETCH(155) EAT_LIGHT(110) STRETCH(84) BITE(201) DIVIDE(101) TURN(246) STRETCH(208) GUT(133)
- 3.1%: EAT_LIGHT(197) STRETCH(58) DIVIDE(203) TURN(49) BITE(93) STRETCH(3) GUT(95)
- 2.9%: EAT_LIGHT(197) STRETCH(58) DIVIDE(95) TURN(191) STRETCH(200) STRETCH(181) GUT(95)
- 2.5%: EAT_LIGHT(115) STRETCH(217) EAT_CORPSE(143) TURN(158) STRETCH(201) DIVIDE(101) TURN(99) BITE(26) GUT(95)
- 2.4%: EAT_LIGHT(197) STRETCH(58) BITE(138) DIVIDE(134) TURN(49) STRETCH(100) STRETCH(181) GUT(95) LOADK(199)

## Instructions carried, share of the living
- TURN 99%, DIVIDE 99%, EAT_LIGHT 98%, MOVE 27%, SENSE_MATCH 19%, EAT_CORPSE 13%, SENSE_E 11%, IFLT 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 74.3%, effect 0.55 (t 5.9), carriers' births 19198: SELECTED
- CARRION: carried 1.7%, effect 0.06 (t 0.2), carriers' births 495: not told from zero
- SQUEEZE: carried 0.6%, effect 0.21 (t 0.5), carriers' births 174: not told from zero
- LEAF: carried 0.1%, effect -3.99 (t -4.4), carriers' births 0: AGAINST
- BITE: carried 52.2%, effect 0.26 (t 4.6), carriers' births 13695: SELECTED
- STRETCH: carried 100.0%, effect 4.75 (t 3.9), carriers' births 26069: SELECTED
- MAUL: carried 65.8%, effect 0.13 (t 2.2), carriers' births 17141: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
- 5: BITE at tick 500000 (5-bite.js)
- 6: STRETCH at tick 600000 (6-stretch.js)
- 7: MAUL at tick 700000 (7-maul.js)
