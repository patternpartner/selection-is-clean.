# Report 4: world pilot (seed 2001) at tick 400000

Write module 4 into `mods/4-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1394 (inert twin 1406); mean program length 13.21 (twin 9.13); mean generation 2276.7
- distinct functional programs 234; the commonest holds 16.2%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26714.0 | corpses eaten 13954.2 | taken by attack 15060.1 (108.0 kills)
- module BROTH (op 32, since tick 100000): income 1101.11, energy put in 0.00, executions 361751, carried by 26.6% now 35.9%, energy held in its fields 4.85
- module TANK (op 33, since tick 200000): income 119.50, energy put in 92.07, executions 40800, carried by 4.6% now 3.9%, energy held in its fields 251.93
- module PIPE (op 34, since tick 300000): income 53.32, energy put in 0.00, executions 80734, carried by 6.6% now 9.0%, energy held in its fields 0

## Energy lying in the world now
- light 83.4, corpses 121.1, in organisms 2169.9

## The commonest programs now (functional: neutral markers dropped), share of the living
- 16.2%: MOVE(134) DIVIDE(74) TURN(63) IFLT(83) TURN(58) SENSE_MATCH(87) EAT_CORPSE(235) EAT_LIGHT(95) EAT_LIGHT(231) EAT_LIGHT(245) IFGT(238)
- 7.1%: MOVE(253) EAT_LIGHT(160) DIVIDE(108) IFLT(2) TURN(43) EAT_CORPSE(75) SENSE_MATCH(199) EAT_LIGHT(27) EAT_LIGHT(202) EAT_CORPSE(187) IFGT(111)
- 4.8%: MOVE(176) DIVIDE(74) TURN(63) IFLT(173) TURN(58) SENSE_MATCH(73) EAT_CORPSE(24) EAT_LIGHT(27) EAT_LIGHT(57) EAT_LIGHT(245) IFGT(101)
- 3.3%: SENSE_MATCH(150) EAT_CORPSE(31) SENSE_CORPSE(206) EAT_LIGHT(10) ATTACK(223) BROTH(254) ATTACK(154) SENSE_KIN(252) DIVIDE(109) DIVIDE(190) BROTH(23) EAT_CORPSE(77) DIVIDE(44) TURN(119)
- 2.4%: MOVE(77) EAT_LIGHT(51) DIVIDE(40) IFLT(2) TURN(43) SENSE_MATCH(199) EAT_LIGHT(41) EAT_LIGHT(90) EAT_CORPSE(55) IFGT(155)
- 2.4%: EAT_LIGHT(8) EAT_CORPSE(227) EAT_CORPSE(253) DIVIDE(85) ATTACK(182) TURN(193) SENSE_LIGHT(129) EAT_LIGHT(97)
- 2.4%: EAT_LIGHT(8) EAT_CORPSE(151) BROTH(124) IFGT(157) EAT_CORPSE(10) EAT_LIGHT(83) DIVIDE(29) ATTACK(161) TURN(193) DIVIDE(82) SENSE_LIGHT(114) ADD(163) SENSE_LIGHT(129)
- 2.0%: MOVE(210) DIVIDE(74) TURN(63) IFLT(178) TURN(58) SENSE_MATCH(73) EAT_CORPSE(116) EAT_LIGHT(27) EAT_LIGHT(57) EAT_LIGHT(106) IFGT(93)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 100%, TURN 99%, EAT_CORPSE 96%, IFGT 55%, SENSE_MATCH 52%, MOVE 44%, ATTACK 44%, IFLT 44%, SENSE_GRAD 32%, RAND 31%, LOADK 30%, SENSE_LIGHT 26%, SENSE_AHEAD 17%, SENSE_CORPSE 10%, ADD 9%, MUL 9%, MOV 6%, SENSE_KIN 6%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
