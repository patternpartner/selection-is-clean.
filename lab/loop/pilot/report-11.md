# Report 11: world pilot (seed 2001) at tick 1100000

Write module 11 into `mods/11-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1316 (inert twin 1366); mean program length 9.78 (twin 9.53); mean generation 5827.1
- distinct functional programs 207; the commonest holds 14.9%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26681.0 | corpses eaten 5217.4 | taken by attack 21583.5 (100.3 kills)
- module BROTH (op 32, since tick 100000): income 67.66, energy put in 0.00, executions 115458, carried by 8.8% now 0.7%, energy held in its fields 0.51
- module TANK (op 33, since tick 200000): income 21.28, energy put in 30.22, executions 65971, carried by 6.3% now 0.5%, energy held in its fields 44.2
- module PIPE (op 34, since tick 300000): income 3.15, energy put in 0.00, executions 68523, carried by 6.4% now 3.6%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 114824, carried by 10.8% now 0.5%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 44.16, energy put in 68.68, executions 16948, carried by 1.4% now 0.2%, energy held in its fields 74.76
- module TENDRIL (op 37, since tick 600000): income 307.39, energy put in 0.00, executions 136937, carried by 10.6% now 2.7%, energy held in its fields 0
- module SIGNAL (op 38, since tick 700000): income 0.00, energy put in 59.32, executions 132984, carried by 9.7% now 1.5%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 1037.71, energy put in 1064.80, executions 26651, carried by 2.2% now 4.6%, energy held in its fields 14.02
- module CARRION (op 40, since tick 900000): income 0.00, energy put in 0.00, executions 145093, carried by 11.4% now 9.7%, energy held in its fields 0
- module GUT (op 41, since tick 1000000): income 6145.86, energy put in 0.00, executions 618991, carried by 45.4% now 55.7%, energy held in its fields 140.17

## Energy lying in the world now
- light 80.2, corpses 88.3, in organisms 2310.3

## The commonest programs now (functional: neutral markers dropped), share of the living
- 14.9%: MOVE(12) DIVIDE(52) TURN(95) IFLT(127) TURN(218) SENSE_KIN(181) EAT_LIGHT(245) EAT_CORPSE(135) EAT_LIGHT(82) EAT_LIGHT(161) IFGT(17)
- 5.6%: MOVE(96) EAT_CORPSE(118) EAT_LIGHT(100) EAT_LIGHT(1) DIVIDE(15) IFLT(190) TURN(181) SENSE_MATCH(151) EAT_LIGHT(198) EAT_LIGHT(121) IFGT(151)
- 4.2%: MOVE(163) EAT_CORPSE(161) EAT_LIGHT(245) EAT_LIGHT(1) DIVIDE(227) IFLT(197) TURN(181) EAT_LIGHT(203) EAT_LIGHT(128) SENSE_MATCH(96) IFGT(151)
- 4.2%: SENSE_LIGHT(144) GUT(146) SENSE_AHEAD(145) EAT_LIGHT(254) DIVIDE(209) TURN(57)
- 3.5%: MOVE(109) DIVIDE(75) TURN(95) IFLT(187) TURN(218) SENSE_KIN(152) EAT_LIGHT(100) GUT(182) EAT_LIGHT(162) EAT_LIGHT(150) IFGT(17)
- 3.1%: LOADK(63) DIVIDE(184) GUT(22) CARRION(128) MOV(102) TURN(167) EAT_LIGHT(0) IFLT(160)
- 2.8%: SENSE_LIGHT(144) TURN(241) SENSE_AHEAD(145) EAT_LIGHT(254) ATTACK(102) DIVIDE(209) TURN(57) EAT_CORPSE(40)
- 2.5%: SENSE_LIGHT(144) GUT(146) SENSE_AHEAD(145) EAT_LIGHT(254) ATTACK(102) DIVIDE(209) TURN(57)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 99%, TURN 95%, IFLT 55%, IFGT 51%, MOVE 50%, EAT_CORPSE 44%, SENSE_KIN 34%, SENSE_LIGHT 29%, ATTACK 28%, SENSE_MATCH 26%, SENSE_AHEAD 22%, MOV 13%, ADD 10%, LOADK 7%, SENSE_E 6%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
- 5: HOARD at tick 500000 (5-hoard.js)
- 6: TENDRIL at tick 600000 (6-tendril.js)
- 7: SIGNAL at tick 700000 (7-signal.js)
- 8: FAT at tick 800000 (8-fat.js)
- 9: CARRION at tick 900000 (9-carrion.js)
- 10: GUT at tick 1000000 (10-gut.js)
