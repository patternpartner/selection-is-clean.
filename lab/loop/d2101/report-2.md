# Report 2: world d2101 (seed 2101) at tick 200000

Write module 2 into `mods/2-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1369 (inert twin 1433); mean program length 8.91 (twin 10.1); mean generation 1194.8
- distinct functional programs 228; the commonest holds 9.2%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 27121.7 | corpses eaten 8126.3 | taken by attack 14877.0 (83.2 kills)
- module GUT (op 32, since tick 100000): income 8823.52, energy put in 0.00, executions 1161985, carried by 59.4% now 58.2%, energy held in its fields 105.72

## Energy lying in the world now
- light 77.4, corpses 222.9, in organisms 2572

## The commonest programs now (functional: neutral markers dropped), share of the living
- 9.2%: EAT_LIGHT(225) EAT_LIGHT(59) EAT_LIGHT(184) MOVE(58) EAT_LIGHT(38) DIVIDE(73) EAT_CORPSE(76) EAT_CORPSE(206) SENSE_MATCH(218) IFLT(246) TURN(101)
- 3.7%: EAT_LIGHT(63) EAT_LIGHT(117) EAT_LIGHT(200) MOVE(80) EAT_LIGHT(38) MUL(83) DIVIDE(73) EAT_CORPSE(153) EAT_CORPSE(71) SENSE_MATCH(218) IFLT(14) ATTACK(237) TURN(101)
- 3.1%: GUT(117) SUB(210) SENSE_GRAD(117) TURN(194) EAT_LIGHT(2) DIVIDE(106)
- 3.0%: EAT_LIGHT(225) EAT_LIGHT(184) MOVE(58) EAT_LIGHT(151) DIVIDE(73) EAT_CORPSE(76) EAT_CORPSE(206) SENSE_MATCH(114) IFLT(246) TURN(101)
- 2.8%: MOV(187) EAT_LIGHT(168) EAT_CORPSE(99) DIVIDE(136) GUT(216) TURN(1)
- 2.8%: EAT_LIGHT(199) EAT_LIGHT(168) ATTACK(99) DIVIDE(136) TURN(1)
- 2.6%: EAT_LIGHT(199) EAT_LIGHT(88) EAT_CORPSE(99) DIVIDE(136) GUT(216) TURN(1)
- 2.5%: EAT_LIGHT(63) EAT_LIGHT(117) EAT_LIGHT(200) ADD(38) MUL(83) DIVIDE(73) EAT_CORPSE(153) EAT_CORPSE(71) SENSE_MATCH(218) IFLT(14) ATTACK(237) TURN(101)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 100%, TURN 92%, EAT_CORPSE 60%, IFLT 35%, MOVE 30%, ATTACK 29%, SENSE_MATCH 28%, SUB 18%, SENSE_LIGHT 15%, SENSE_GRAD 15%, SENSE_E 13%, SENSE_KIN 12%, RAND 9%, MUL 8%, SENSE_AHEAD 5%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- GUT: carried 55.4%, effect 0.28 (t 3.5), carriers' births 16716: SELECTED

## Modules so far
- 1: GUT at tick 100000 (1-gut.js)
