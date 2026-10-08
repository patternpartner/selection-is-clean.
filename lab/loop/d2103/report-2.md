# Report 2: world d2103 (seed 2103) at tick 200000

Write module 2 into `mods/2-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1525 (inert twin 1577); mean program length 9.08 (twin 9.07); mean generation 1136.7
- distinct functional programs 261; the commonest holds 8.0%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26936.3 | corpses eaten 8800.6 | taken by attack 14238.1 (91.4 kills)
- module GUT (op 32, since tick 100000): income 10303.40, energy put in 0.00, executions 1378119, carried by 53.0% now 75.6%, energy held in its fields 221.09

## Energy lying in the world now
- light 74.5, corpses 29.5, in organisms 4243

## The commonest programs now (functional: neutral markers dropped), share of the living
- 8.0%: EAT_LIGHT(20) EAT_LIGHT(12) EAT_CORPSE(253) MOVE(49) EAT_LIGHT(65) EAT_LIGHT(83) DIVIDE(19) SENSE_MATCH(117) IFLT(66) TURN(3) EAT_CORPSE(236)
- 4.6%: SENSE_AHEAD(209) EAT_LIGHT(184) EAT_LIGHT(121) DIVIDE(192) TURN(54) GUT(222)
- 3.4%: EAT_LIGHT(40) EAT_LIGHT(12) EAT_CORPSE(22) MOVE(49) EAT_LIGHT(212) DIVIDE(19) SENSE_MATCH(77) IFLT(66) TURN(3) EAT_CORPSE(236)
- 2.6%: EAT_LIGHT(211) GUT(219) DIVIDE(192) TURN(1) SENSE_KIN(83) GUT(17)
- 2.5%: SENSE_GRAD(112) MUL(18) EAT_LIGHT(194) DIVIDE(78) GUT(26) MUL(210) TURN(157) SENSE_GRAD(87)
- 2.4%: EAT_LIGHT(211) GUT(219) EAT_LIGHT(161) EAT_LIGHT(211) EAT_LIGHT(40) GUT(230) DIVIDE(192) TURN(1) GUT(17) MOVE(155)
- 2.3%: EAT_LIGHT(211) GUT(219) EAT_LIGHT(161) SENSE_KIN(61) EAT_LIGHT(211) EAT_LIGHT(40) DIVIDE(192) TURN(1) GUT(17) MOVE(155)
- 2.2%: EAT_LIGHT(157) SENSE_MATCH(63) MOV(129) GUT(102) DIVIDE(33) TURN(31)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, TURN 92%, EAT_CORPSE 47%, SENSE_MATCH 35%, MOVE 30%, IFLT 24%, SENSE_GRAD 19%, ATTACK 18%, SENSE_KIN 15%, MUL 15%, ADD 14%, SENSE_AHEAD 14%, MOV 9%, IFGT 7%, SENSE_E 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 76.3%, effect 0.58 (t 6.7), carriers' births 26021: SELECTED

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
