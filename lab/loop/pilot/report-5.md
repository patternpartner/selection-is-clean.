# Report 5: world pilot (seed 2001) at tick 500000

Write module 5 into `mods/5-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1435 (inert twin 1455); mean program length 14.11 (twin 8.39); mean generation 2792.2
- distinct functional programs 244; the commonest holds 21.0%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26573.0 | corpses eaten 7755.7 | taken by attack 16591.4 (79.8 kills)
- module BROTH (op 32, since tick 100000): income 625.11, energy put in 0.00, executions 334442, carried by 27.8% now 42.1%, energy held in its fields 24.96
- module TANK (op 33, since tick 200000): income 35.85, energy put in 27.36, executions 24479, carried by 2.0% now 3.5%, energy held in its fields 334.93
- module PIPE (op 34, since tick 300000): income 27.07, energy put in 0.00, executions 230092, carried by 22.5% now 8.9%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 122411, carried by 12.5% now 22.8%, energy held in its fields 0

## Energy lying in the world now
- light 96.7, corpses 45.3, in organisms 3513.5

## The commonest programs now (functional: neutral markers dropped), share of the living
- 21.0%: MOVE(134) DIVIDE(74) TURN(63) IFLT(83) TURN(58) SENSE_MATCH(87) EAT_CORPSE(235) EAT_LIGHT(95) EAT_LIGHT(231) EAT_LIGHT(245) IFGT(238)
- 4.7%: MOVE(239) EAT_LIGHT(228) DIVIDE(4) IFLT(14) TURN(213) EAT_CORPSE(197) SENSE_MATCH(29) EAT_LIGHT(229) EAT_LIGHT(202) EAT_CORPSE(18) IFGT(83)
- 2.2%: EAT_LIGHT(100) DIVIDE(244) SENSE_CORPSE(29) IFLT(18) EAT_CORPSE(85) MUL(220) DIVIDE(136) BROTH(196) ADD(58) DIVIDE(254) TURN(33)
- 2.1%: TURN(97) EAT_CORPSE(124) SENSE_LIGHT(155) EAT_LIGHT(103) SMELL(64) DIVIDE(244) BROTH(28) ATTACK(131) IFLT(18) BROTH(106) SENSE_LIGHT(57) DIVIDE(254) ATTACK(63) BROTH(239) TURN(12)
- 1.9%: EAT_CORPSE(124) SENSE_KIN(214) EAT_LIGHT(13) SUB(51) DIVIDE(244) SENSE_CORPSE(195) SENSE_GRAD(29) RAND(85) DIVIDE(19) SENSE_CORPSE(68) SENSE_AHEAD(252)
- 1.5%: EAT_CORPSE(124) SENSE_KIN(214) EAT_LIGHT(13) SUB(51) DIVIDE(244) SENSE_CORPSE(195) SENSE_GRAD(29) DIVIDE(19) SENSE_CORPSE(68)
- 1.5%: MOVE(56) EAT_LIGHT(160) DIVIDE(108) IFLT(201) TURN(43) EAT_CORPSE(75) SENSE_MATCH(199) EAT_LIGHT(27) EAT_LIGHT(202) EAT_CORPSE(187) IFGT(111)
- 1.5%: MOVE(134) DIVIDE(74) TURN(63) IFLT(83) TURN(58) SENSE_MATCH(87) EAT_CORPSE(235) EAT_LIGHT(106) EAT_LIGHT(245) IFGT(238)

## Instructions carried, share of the living
- DIVIDE 100%, EAT_LIGHT 99%, EAT_CORPSE 98%, TURN 87%, IFLT 78%, IFGT 49%, SENSE_MATCH 40%, MOVE 40%, ATTACK 34%, ADD 33%, SENSE_GRAD 30%, SENSE_CORPSE 25%, SENSE_LIGHT 22%, SUB 16%, SENSE_E 14%, MUL 13%, SENSE_AHEAD 13%, SENSE_KIN 12%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
