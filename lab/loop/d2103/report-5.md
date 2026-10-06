# Report 5: world d2103 (seed 2103) at tick 500000

Write module 5 into `mods/5-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1356 (inert twin 1377); mean program length 8.62 (twin 8.99); mean generation 2767.5
- distinct functional programs 262; the commonest holds 7.4%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27057.3 | corpses eaten 2276.9 | taken by attack 11733.8 (66.9 kills)
- module GUT (op 32, since tick 100000): income 10727.18, energy put in 0.00, executions 2106621, carried by 76.7% now 73.4%, energy held in its fields 259.73
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 298726, carried by 14.4% now 3.5%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 3100.94, energy put in 310.09, executions 345683, carried by 17.1% now 1.7%, energy held in its fields 0
- module LEAF (op 35, since tick 400000): income 40.47, energy put in 90.34, executions 2465, carried by 0.2% now 0.0%, energy held in its fields 0

## Energy lying in the world now
- light 76.2, corpses 81.6, in organisms 7012.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.4%: EAT_LIGHT(193) EAT_LIGHT(80) EAT_CORPSE(253) MOVE(185) EAT_LIGHT(145) EAT_LIGHT(83) DIVIDE(19) SENSE_MATCH(50) IFLT(115) TURN(3)
- 2.7%: EAT_LIGHT(104) EAT_LIGHT(125) EAT_CORPSE(51) MOVE(175) EAT_LIGHT(129) DIVIDE(43) SENSE_MATCH(93) IFLT(95) TURN(3) EAT_CORPSE(231)
- 2.7%: SENSE_GRAD(204) EAT_LIGHT(123) GUT(137) DIVIDE(172) GUT(37) TURN(137)
- 2.5%: EAT_LIGHT(190) DIVIDE(32) GUT(199) EAT_LIGHT(228) EAT_LIGHT(0) TURN(63) EAT_CORPSE(226)
- 2.0%: SENSE_GRAD(204) EAT_LIGHT(123) DIVIDE(17) GUT(137) DIVIDE(172) MUL(207) GUT(37) TURN(137)
- 1.9%: ATTACK(170) SENSE_KIN(200) SENSE_MATCH(142) SUB(234) EAT_LIGHT(202) GUT(211) TURN(75) DIVIDE(76)
- 1.6%: EAT_LIGHT(86) EAT_LIGHT(103) MUL(113) SENSE_LIGHT(226) EAT_CORPSE(224) IFGT(122) DIVIDE(241) GUT(34) TURN(219)
- 1.6%: EAT_LIGHT(128) EAT_LIGHT(103) SENSE_KIN(119) EAT_CORPSE(224) DIVIDE(61) SUB(181) DIVIDE(241) GUT(34) TURN(219) SENSE_MATCH(185)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 99%, TURN 83%, EAT_CORPSE 56%, SENSE_MATCH 48%, MOVE 25%, SENSE_GRAD 24%, IFLT 23%, ATTACK 19%, SENSE_LIGHT 17%, IFGT 13%, MUL 11%, SENSE_KIN 10%, SUB 9%, SENSE_E 7%, SENSE_AHEAD 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 73.0%, effect 0.28 (t 2.9), carriers' births 21309: not told from zero
- CARRION: carried 4.3%, effect 0.14 (t 1.2), carriers' births 1209: not told from zero
- SQUEEZE: carried 2.2%, effect 0.31 (t 1.8), carriers' births 860: not told from zero
- LEAF: carried 0.2%, effect -3.02 (t -9.3), carriers' births 5: AGAINST

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
- 4: LEAF at tick 400000 (4-leaf.js)
