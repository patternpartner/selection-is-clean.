# Report 4: world d2101 (seed 2101) at tick 400000

Write module 4 into `mods/4-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1468 (inert twin 1774); mean program length 11.48 (twin 8.75); mean generation 2259.4
- distinct functional programs 278; the commonest holds 8.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27014.4 | corpses eaten 6285.6 | taken by attack 16277.3 (82.5 kills)
- module GUT (op 32, since tick 100000): income 1667.31, energy put in 0.00, executions 667858, carried by 40.2% now 47.4%, energy held in its fields 46.3
- module BITE (op 33, since tick 200000): income 2672.44, energy put in 0.00, executions 738577, carried by 43.3% now 34.9%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1214.35, energy put in 121.44, executions 192999, carried by 11.1% now 17.7%, energy held in its fields 0

## Energy lying in the world now
- light 76.5, corpses 108.4, in organisms 2497.1

## The commonest programs now (functional: neutral markers dropped), share of the living
- 8.9%: EAT_LIGHT(184) EAT_LIGHT(101) EAT_LIGHT(116) MOVE(58) EAT_CORPSE(89) EAT_CORPSE(206) SENSE_MATCH(41) DIVIDE(166) IFLT(143) TURN(101)
- 4.1%: EAT_LIGHT(147) ATTACK(159) SQUEEZE(76) DIVIDE(174) IFLT(239) RAND(148) GUT(105) TURN(161)
- 3.7%: EAT_LIGHT(206) EAT_LIGHT(3) EAT_LIGHT(200) MOVE(163) BITE(216) EAT_CORPSE(167) EAT_LIGHT(58) TURN(57) SENSE_KIN(4) DIVIDE(166) BITE(236) IFLT(249) TURN(126) EAT_LIGHT(232)
- 2.9%: EAT_CORPSE(214) EAT_LIGHT(206) EAT_LIGHT(3) GUT(163) BITE(216) TURN(57) SENSE_MATCH(4) DIVIDE(166) IFLT(109) TURN(126) EAT_LIGHT(232)
- 2.4%: EAT_LIGHT(206) EAT_LIGHT(3) MOVE(163) BITE(216) EAT_CORPSE(167) EAT_LIGHT(179) GUT(11) TURN(57) SENSE_KIN(4) DIVIDE(166) BITE(236) IFLT(249) TURN(126) EAT_LIGHT(232)
- 2.1%: EAT_CORPSE(9) EAT_LIGHT(196) SENSE_CORPSE(208) RAND(216) EAT_CORPSE(239) EAT_LIGHT(38) DIVIDE(27) DIVIDE(166) IFLT(32) TURN(38) ATTACK(65)
- 2.0%: EAT_LIGHT(103) DIVIDE(252) LOADK(217) GUT(105) ATTACK(126) TURN(251) SUB(81) SQUEEZE(43) EAT_CORPSE(64) EAT_LIGHT(176) DIVIDE(29) SENSE_AHEAD(238)
- 2.0%: EAT_LIGHT(113) IFLT(226) IFGT(245) DIVIDE(174) BITE(156) TURN(161) LOADK(55)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 100%, TURN 98%, IFLT 78%, EAT_CORPSE 72%, MOVE 42%, ATTACK 35%, SENSE_MATCH 32%, SENSE_KIN 26%, SUB 24%, RAND 18%, LOADK 18%, SENSE_CORPSE 15%, SENSE_LIGHT 9%, SENSE_AHEAD 9%, IFGT 7%, MUL 6%, ADD 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 43.8%, effect 0.32 (t 6.9), carriers' births 13828: SELECTED
- BITE: carried 43.5%, effect 0.29 (t 5.3), carriers' births 15456: SELECTED
- SQUEEZE: carried 17.2%, effect 0.15 (t 1.8), carriers' births 5416: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
