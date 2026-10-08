# Report 3: world d2103 (seed 2103) at tick 300000

Write module 3 into `mods/3-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1567 (inert twin 1562); mean program length 7.95 (twin 9.05); mean generation 1711.9
- distinct functional programs 240; the commonest holds 6.5%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27180.8 | corpses eaten 2968.4 | taken by attack 12398.2 (63.2 kills)
- module GUT (op 32, since tick 100000): income 9207.24, energy put in 0.00, executions 1595844, carried by 70.2% now 81.2%, energy held in its fields 281.62
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 90277, carried by 5.6% now 1.5%, energy held in its fields 0

## Energy lying in the world now
- light 75.4, corpses 69.7, in organisms 4709.3

## The commonest programs now (functional: neutral markers dropped), share of the living
- 6.5%: EAT_LIGHT(193) EAT_LIGHT(80) EAT_CORPSE(253) MOVE(185) EAT_LIGHT(145) EAT_LIGHT(83) DIVIDE(19) SENSE_MATCH(50) IFLT(115) TURN(3)
- 5.4%: EAT_CORPSE(160) EAT_LIGHT(111) GUT(132) EAT_LIGHT(207) DIVIDE(253) EAT_LIGHT(64) TURN(55) MOVE(100)
- 5.4%: SENSE_AHEAD(136) TURN(157) EAT_LIGHT(0) GUT(65) DIVIDE(169)
- 5.0%: SENSE_AHEAD(68) GUT(146) TURN(157) EAT_LIGHT(0) GUT(25) DIVIDE(169)
- 3.0%: EAT_LIGHT(161) DIVIDE(53) ADD(252) GUT(178) SENSE_MATCH(190) TURN(155) GUT(127)
- 2.7%: GUT(146) TURN(157) EAT_LIGHT(0) GUT(25) DIVIDE(169)
- 2.6%: EAT_LIGHT(161) SENSE_GRAD(12) DIVIDE(53) DIVIDE(2) ADD(252) GUT(178) SENSE_MATCH(190) TURN(155) GUT(127)
- 2.3%: IFLT(233) SENSE_KIN(117) DIVIDE(92) RAND(86) TURN(21) EAT_LIGHT(101) GUT(102) DIVIDE(140)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, TURN 93%, SENSE_MATCH 39%, SENSE_AHEAD 28%, EAT_CORPSE 25%, MOVE 23%, IFLT 23%, ADD 17%, ATTACK 16%, RAND 16%, SENSE_KIN 15%, SENSE_LIGHT 13%, SENSE_GRAD 7%, SENSE_E 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 80.5%, effect 0.57 (t 5.8), carriers' births 28595: SELECTED
- CARRION: carried 2.5%, effect 0.03 (t 0.1), carriers' births 711: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
