# Report 2: world d2102 (seed 2102) at tick 200000

Write module 2 into `mods/2-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1444 (inert twin 1461); mean program length 8.53 (twin 14.58); mean generation 1262.4
- distinct functional programs 225; the commonest holds 10.7%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 25962.8 | corpses eaten 14711.6 | taken by attack 15599.5 (130.8 kills)
- module FAT (op 32, since tick 100000): income 178.50, energy put in 220.61, executions 53671, carried by 3.2% now 8.7%, energy held in its fields 0

## Energy lying in the world now
- light 116.1, corpses 629.2, in organisms 7881.1

## The commonest programs now (functional: neutral markers dropped), share of the living
- 10.7%: EAT_LIGHT(0) DIVIDE(98) EAT_CORPSE(104) TURN(1) EAT_LIGHT(142) EAT_LIGHT(229) MOVE(111)
- 4.4%: IFGT(250) DIVIDE(14) MOV(13) EAT_CORPSE(180) EAT_LIGHT(231)
- 3.4%: DIVIDE(98) SENSE_MATCH(11) DIVIDE(97) TURN(170) EAT_CORPSE(128) ATTACK(87) TURN(74) EAT_LIGHT(231)
- 3.3%: IFLT(240) EAT_LIGHT(12) DIVIDE(98) EAT_CORPSE(128) TURN(177)
- 3.1%: EAT_LIGHT(12) DIVIDE(110) EAT_CORPSE(128) TURN(177) SENSE_KIN(130) EAT_LIGHT(152) EAT_LIGHT(42) MOVE(163)
- 1.9%: EAT_LIGHT(12) DIVIDE(98) EAT_CORPSE(128) FAT(190)
- 1.9%: EAT_LIGHT(0) DIVIDE(233) EAT_CORPSE(146) TURN(1)
- 1.9%: EAT_LIGHT(0) DIVIDE(14) EAT_LIGHT(50) EAT_CORPSE(138) TURN(1) EAT_LIGHT(97) MOVE(82)

## Instructions carried, share of the living
- DIVIDE 99%, EAT_LIGHT 98%, EAT_CORPSE 97%, TURN 56%, IFGT 28%, LOADK 27%, ATTACK 23%, MOVE 22%, IFLT 19%, MOV 16%, SENSE_KIN 16%, SENSE_GRAD 12%, SENSE_E 11%, SENSE_AHEAD 8%, SENSE_MATCH 7%, MUL 6%, SENSE_LIGHT 6%

## Selection now: each module armed against disarmed from this state (4 draws each, 2,000 ticks)
- s is the carriers' growth advantage per 1,000 ticks; effect is s armed minus s disarmed. SELECTED: every armed draw above every disarmed one; AGAINST: every one below.
- FAT: carried 10.5%, effect -0.21 (t -0.8), carriers' births 2273: not told from zero

## Modules so far
- 1: FAT at tick 100000 (1-fat.js)
