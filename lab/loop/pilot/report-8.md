# Report 8: world pilot (seed 2001) at tick 800000

Write module 8 into `mods/8-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1338 (inert twin 1334); mean program length 11.71 (twin 10.46); mean generation 4296.5
- distinct functional programs 203; the commonest holds 16.7%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26768.9 | corpses eaten 8791.3 | taken by attack 15832.9 (124.5 kills)
- module BROTH (op 32, since tick 100000): income 318.41, energy put in 0.00, executions 330316, carried by 20.5% now 8.3%, energy held in its fields 13.57
- module TANK (op 33, since tick 200000): income 39.98, energy put in 42.16, executions 135015, carried by 13.6% now 9.9%, energy held in its fields 31.25
- module PIPE (op 34, since tick 300000): income 5.13, energy put in 0.00, executions 53750, carried by 5.5% now 10.7%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 246713, carried by 20.3% now 20.0%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 1153.00, energy put in 1179.61, executions 68468, carried by 6.3% now 9.9%, energy held in its fields 76.99
- module TENDRIL (op 37, since tick 600000): income 2356.93, energy put in 0.00, executions 333652, carried by 23.4% now 23.7%, energy held in its fields 0
- module SIGNAL (op 38, since tick 700000): income 0.00, energy put in 41.58, executions 20100, carried by 1.9% now 4.7%, energy held in its fields 0

## Energy lying in the world now
- light 82.6, corpses 97, in organisms 1883.8

## The commonest programs now (functional: neutral markers dropped), share of the living
- 16.7%: MOVE(223) DIVIDE(74) TURN(63) IFLT(178) TURN(58) SENSE_KIN(73) EAT_CORPSE(24) EAT_LIGHT(27) EAT_LIGHT(231) EAT_LIGHT(245) IFGT(10)
- 6.0%: MOVE(127) EAT_LIGHT(46) EAT_CORPSE(50) DIVIDE(255) IFLT(127) TURN(101) EAT_CORPSE(211) SENSE_MATCH(0) EAT_LIGHT(27) EAT_LIGHT(11) IFGT(83)
- 4.7%: MOVE(33) DIVIDE(66) SENSE_LIGHT(95) IFLT(214) TANK(146) SENSE_KIN(254) EAT_CORPSE(77) EAT_LIGHT(37) EAT_LIGHT(43) EAT_LIGHT(133) IFGT(118)
- 3.4%: MOVE(33) DIVIDE(170) TURN(95) IFLT(186) TURN(250) SENSE_KIN(232) EAT_CORPSE(145) EAT_LIGHT(37) EAT_LIGHT(43) EAT_LIGHT(133) IFGT(225)
- 3.3%: TURN(140) TENDRIL(190) DIVIDE(227) EAT_CORPSE(171) DIVIDE(228) SMELL(20) TURN(127) ADD(76) DIVIDE(243) EAT_LIGHT(157) LOADK(56) SENSE_AHEAD(26) EAT_LIGHT(88)
- 2.5%: MOVE(33) DIVIDE(181) TURN(183) IFLT(250) TURN(58) SENSE_KIN(227) EAT_CORPSE(186) EAT_LIGHT(103) EAT_LIGHT(99) EAT_LIGHT(133) IFGT(135)
- 2.3%: TURN(140) TENDRIL(190) DIVIDE(244) EAT_CORPSE(171) SENSE_KIN(228) ATTACK(20) TURN(127) ADD(76) DIVIDE(243) EAT_LIGHT(206) SENSE_AHEAD(26) EAT_LIGHT(88)
- 2.2%: MOVE(198) EAT_LIGHT(24) EAT_CORPSE(194) DIVIDE(255) IFLT(131) TURN(197) SENSE_MATCH(0) EAT_LIGHT(39) EAT_LIGHT(180) IFGT(83)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, EAT_CORPSE 95%, TURN 91%, IFLT 80%, SENSE_KIN 59%, IFGT 55%, MOVE 54%, ATTACK 40%, SENSE_AHEAD 35%, SENSE_MATCH 14%, LOADK 12%, ADD 12%, SENSE_LIGHT 11%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
- 5: HOARD at tick 500000 (5-hoard.js)
- 6: TENDRIL at tick 600000 (6-tendril.js)
- 7: SIGNAL at tick 700000 (7-signal.js)
