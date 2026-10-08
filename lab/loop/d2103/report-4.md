# Report 4: world d2103 (seed 2103) at tick 400000

Write module 4 into `mods/4-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1416 (inert twin 1446); mean program length 8.89 (twin 10.22); mean generation 2258.6
- distinct functional programs 242; the commonest holds 5.8%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27130.4 | corpses eaten 1469.4 | taken by attack 11444.9 (58.1 kills)
- module GUT (op 32, since tick 100000): income 9338.81, energy put in 0.00, executions 2243483, carried by 77.0% now 78.2%, energy held in its fields 89.35
- module CARRION (op 33, since tick 200000): income 0.00, energy put in 0.00, executions 121924, carried by 7.4% now 8.4%, energy held in its fields 0
- module SQUEEZE (op 34, since tick 300000): income 1470.12, energy put in 147.01, executions 246907, carried by 14.2% now 16.4%, energy held in its fields 0

## Energy lying in the world now
- light 87.1, corpses 37.5, in organisms 2774.8

## The commonest programs now (functional: neutral markers dropped), share of the living
- 5.8%: EAT_LIGHT(197) EAT_LIGHT(53) EAT_CORPSE(253) MOVE(55) EAT_LIGHT(4) EAT_LIGHT(83) DIVIDE(43) SENSE_MATCH(218) IFLT(117) TURN(3) EAT_CORPSE(112)
- 4.1%: EAT_LIGHT(123) ADD(150) DIVIDE(53) GUT(59) TURN(139) SENSE_E(167) EAT_CORPSE(127)
- 3.5%: EAT_LIGHT(253) EAT_LIGHT(48) DIVIDE(253) GUT(24) EAT_LIGHT(180) TURN(95) MOVE(234)
- 2.8%: EAT_LIGHT(136) DIVIDE(145) GUT(83) EAT_LIGHT(139) TURN(63) EAT_CORPSE(14)
- 2.8%: EAT_LIGHT(123) CARRION(157) SUB(215) TURN(150) ATTACK(221) DIVIDE(53) GUT(16) GUT(195) IFLT(160) TURN(248) EAT_CORPSE(127)
- 2.5%: EAT_LIGHT(123) SUB(215) TURN(150) ATTACK(221) DIVIDE(53) GUT(16) GUT(195) IFLT(160) TURN(248) EAT_CORPSE(127)
- 2.3%: EAT_LIGHT(136) DIVIDE(145) GUT(83) ADD(22) SENSE_MATCH(139) TURN(63) EAT_CORPSE(14)
- 2.3%: EAT_LIGHT(137) TURN(150) SENSE_GRAD(57) ATTACK(232) DIVIDE(53) GUT(191) TURN(139) SENSE_E(167) EAT_CORPSE(127) SENSE_KIN(216)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 98%, TURN 97%, EAT_CORPSE 81%, ATTACK 31%, IFLT 29%, SENSE_E 28%, MOVE 27%, SENSE_MATCH 21%, ADD 20%, SUB 17%, SENSE_KIN 8%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 79.5%, effect 0.44 (t 7.0), carriers' births 24644: SELECTED
- CARRION: carried 10.0%, effect -0.03 (t -0.2), carriers' births 2910: not told from zero
- SQUEEZE: carried 12.9%, effect 0.11 (t 1.0), carriers' births 4796: not told from zero

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
- 2: CARRION at tick 200000 (2-carrion.js)
- 3: SQUEEZE at tick 300000 (3-squeeze.js)
