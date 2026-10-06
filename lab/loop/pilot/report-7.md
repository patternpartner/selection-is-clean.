# Report 7: world pilot (seed 2001) at tick 700000

Write module 7 into `mods/7-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1285 (inert twin 1301); mean program length 11.16 (twin 12.22); mean generation 3788.8
- distinct functional programs 214; the commonest holds 11.6%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26905.7 | corpses eaten 15192.9 | taken by attack 15261.2 (128.3 kills)
- module BROTH (op 32, since tick 100000): income 344.96, energy put in 0.00, executions 185974, carried by 15.3% now 20.5%, energy held in its fields 6.65
- module TANK (op 33, since tick 200000): income 26.52, energy put in 67.15, executions 137292, carried by 8.2% now 0.0%, energy held in its fields 361.55
- module PIPE (op 34, since tick 300000): income 23.32, energy put in 0.00, executions 128623, carried by 10.3% now 7.3%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 119832, carried by 10.7% now 23.0%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 6209.11, energy put in 6245.59, executions 76510, carried by 6.7% now 3.4%, energy held in its fields 118.48
- module TENDRIL (op 37, since tick 600000): income 315.98, energy put in 0.00, executions 155402, carried by 11.0% now 11.1%, energy held in its fields 0

## Energy lying in the world now
- light 85.7, corpses 454.1, in organisms 3674.4

## The commonest programs now (functional: neutral markers dropped), share of the living
- 11.6%: MOVE(45) DIVIDE(181) TURN(183) IFLT(83) TURN(58) SENSE_KIN(161) EAT_CORPSE(208) EAT_LIGHT(150) EAT_LIGHT(101) EAT_LIGHT(22) IFGT(203)
- 4.4%: MOVE(33) DIVIDE(181) TURN(183) IFLT(250) TURN(58) SENSE_KIN(227) EAT_CORPSE(186) EAT_LIGHT(103) EAT_LIGHT(99) EAT_LIGHT(133) IFGT(135)
- 3.8%: RAND(33) DIVIDE(147) TURN(220) IFLT(127) SENSE_KIN(232) EAT_CORPSE(39) EAT_LIGHT(119) EAT_LIGHT(13)
- 3.0%: MOVE(198) EAT_LIGHT(249) EAT_CORPSE(236) DIVIDE(3) IFLT(145) TURN(197) EAT_CORPSE(127) SENSE_MATCH(0) EAT_LIGHT(39) EAT_LIGHT(180) IFGT(83)
- 2.6%: BROTH(74) DIVIDE(97) ATTACK(78) TURN(127) TURN(48) DIVIDE(107) EAT_CORPSE(50) EAT_CORPSE(145) EAT_LIGHT(200) SMELL(119) SENSE_AHEAD(14) SMELL(143)
- 2.5%: MOVE(198) EAT_LIGHT(165) EAT_CORPSE(236) DIVIDE(255) IFLT(2) TURN(197) EAT_CORPSE(127) SENSE_MATCH(0) EAT_LIGHT(86) EAT_LIGHT(180) IFGT(89)
- 2.3%: DIVIDE(181) TURN(36) ATTACK(140) EAT_LIGHT(108) SENSE_CORPSE(199) EAT_CORPSE(184) DIVIDE(45) ADD(228)
- 2.2%: MOVE(134) EAT_LIGHT(87) DIVIDE(255) IFLT(2) TURN(101) EAT_CORPSE(214) SENSE_MATCH(100) EAT_LIGHT(229) EAT_LIGHT(129) IFGT(83)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, TURN 98%, EAT_CORPSE 94%, IFGT 60%, SENSE_KIN 52%, IFLT 46%, MOVE 40%, ATTACK 36%, ADD 23%, SENSE_AHEAD 15%, SENSE_MATCH 13%, JMP 12%, SENSE_GRAD 12%, RAND 8%, SENSE_CORPSE 8%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
- 5: HOARD at tick 500000 (5-hoard.js)
- 6: TENDRIL at tick 600000 (6-tendril.js)
