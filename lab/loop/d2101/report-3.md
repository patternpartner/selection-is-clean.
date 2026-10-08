# Report 3: world d2101 (seed 2101) at tick 300000

Write module 3 into `mods/3-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1659 (inert twin 1729); mean program length 9.77 (twin 9.47); mean generation 1736.5
- distinct functional programs 276; the commonest holds 7.7%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27252.0 | corpses eaten 6588.7 | taken by attack 12092.1 (106.3 kills)
- module GUT (op 32, since tick 100000): income 1825.97, energy put in 0.00, executions 746509, carried by 41.9% now 46.1%, energy held in its fields 40.33
- module BITE (op 33, since tick 200000): income 4194.38, energy put in 0.00, executions 1022624, carried by 46.8% now 58.5%, energy held in its fields 0

## Energy lying in the world now
- light 101, corpses 89.8, in organisms 12213.5

## The commonest programs now (functional: neutral markers dropped), share of the living
- 7.7%: EAT_LIGHT(178) EAT_LIGHT(169) EAT_LIGHT(101) EAT_LIGHT(116) MOVE(58) EAT_CORPSE(150) EAT_CORPSE(206) SENSE_MATCH(191) DIVIDE(166) IFLT(143) TURN(101)
- 4.6%: EAT_LIGHT(32) EAT_LIGHT(169) EAT_LIGHT(101) MOVE(14) EAT_CORPSE(42) EAT_CORPSE(206) SENSE_MATCH(4) DIVIDE(166) IFLT(143) TURN(101) EAT_LIGHT(177)
- 3.4%: EAT_LIGHT(196) DIVIDE(58) LOADK(171) EAT_CORPSE(86) GUT(122) GUT(74) ATTACK(185) TURN(161)
- 3.2%: EAT_LIGHT(103) BITE(205) EAT_CORPSE(230) ATTACK(210) DIVIDE(29) TURN(253)
- 3.0%: EAT_LIGHT(103) GUT(196) BITE(205) DIVIDE(29) TURN(253)
- 2.7%: EAT_LIGHT(114) EAT_LIGHT(147) MOVE(229) EAT_LIGHT(112) IFLT(124) BITE(164) DIVIDE(196) EAT_CORPSE(216) TURN(34) EAT_LIGHT(206) SENSE_MATCH(61) IFLT(170) TURN(161)
- 2.4%: LOADK(38) DIVIDE(121) GUT(92) EAT_CORPSE(144) EAT_LIGHT(253) BITE(59) SENSE_LIGHT(181) TURN(191) IFGT(118)
- 2.2%: EAT_LIGHT(114) EAT_LIGHT(147) MOVE(229) EAT_LIGHT(112) IFLT(164) DIVIDE(10) EAT_CORPSE(216) TURN(34) EAT_LIGHT(206) SENSE_MATCH(61) RAND(170) MUL(161)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 96%, EAT_CORPSE 88%, TURN 84%, SENSE_MATCH 33%, IFLT 32%, MOVE 31%, MUL 17%, IFGT 16%, ATTACK 15%, SENSE_LIGHT 13%, LOADK 12%, RAND 12%, ADD 12%, SENSE_E 11%, SENSE_CORPSE 7%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 44.5%, effect 0.06 (t 0.7), carriers' births 16071: not told from zero
- BITE: carried 59.5%, effect 0.08 (t 1.3), carriers' births 22548: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: BITE at tick 200000 (2-bite.js)
