# Report 10: world pilot (seed 2001) at tick 1000000

Write module 10 into `mods/10-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1388 (inert twin 1307); mean program length 9.69 (twin 11.42); mean generation 5268.3
- distinct functional programs 219; the commonest holds 14.4%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26877.8 | corpses eaten 17513.4 | taken by attack 17008.2 (105.6 kills)
- module BROTH (op 32, since tick 100000): income 23.78, energy put in 0.00, executions 75579, carried by 5.0% now 19.2%, energy held in its fields 67.65
- module TANK (op 33, since tick 200000): income 15.44, energy put in 41.23, executions 14007, carried by 1.0% now 1.7%, energy held in its fields 203.25
- module PIPE (op 34, since tick 300000): income 19.96, energy put in 0.00, executions 88934, carried by 5.6% now 9.2%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 173495, carried by 10.4% now 0.6%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 173.52, energy put in 209.64, executions 16798, carried by 1.2% now 3.3%, energy held in its fields 157.74
- module TENDRIL (op 37, since tick 600000): income 214.15, energy put in 0.00, executions 260342, carried by 15.6% now 13.3%, energy held in its fields 0
- module SIGNAL (op 38, since tick 700000): income 0.00, energy put in 58.94, executions 148734, carried by 8.9% now 19.6%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 369.56, energy put in 401.51, executions 88063, carried by 5.6% now 0.4%, energy held in its fields 0
- module CARRION (op 40, since tick 900000): income 0.00, energy put in 0.00, executions 99327, carried by 7.9% now 32.3%, energy held in its fields 0

## Energy lying in the world now
- light 82.2, corpses 1447.7, in organisms 5870.2

## The commonest programs now (functional: neutral markers dropped), share of the living
- 14.4%: MOVE(131) DIVIDE(164) TURN(95) IFLT(245) TURN(146) SENSE_KIN(81) EAT_LIGHT(10) EAT_CORPSE(233) EAT_LIGHT(241) EAT_LIGHT(117) IFGT(85)
- 5.8%: MOVE(228) EAT_CORPSE(215) EAT_LIGHT(52) EAT_CORPSE(114) DIVIDE(255) IFLT(181) TURN(197) SENSE_MATCH(144) EAT_LIGHT(39) EAT_LIGHT(234) IFGT(151)
- 4.5%: MOVE(228) EAT_CORPSE(215) EAT_LIGHT(72) EAT_CORPSE(114) DIVIDE(255) IFLT(195) TURN(197) SENSE_MATCH(144) EAT_LIGHT(39) EAT_LIGHT(234) IFGT(151)
- 3.4%: IFLT(3) EAT_LIGHT(52) SIGNAL(130) EAT_CORPSE(57) DIVIDE(97) IFGT(6) LOADK(254) LOADK(156)
- 3.4%: CARRION(216) BROTH(146) EAT_CORPSE(124) SUB(245) SENSE_GRAD(121) DIVIDE(28) EAT_LIGHT(254)
- 3.2%: DIVIDE(62) TURN(95) CARRION(33) ATTACK(1) TURN(146) TURN(56) EAT_LIGHT(82)
- 3.0%: IFLT(3) EAT_CORPSE(191) EAT_LIGHT(48) SIGNAL(130) EAT_CORPSE(57) DIVIDE(97) IFGT(6) MOV(254)
- 2.5%: CARRION(216) BROTH(146) EAT_CORPSE(124) SUB(245) PIPE(14) EAT_LIGHT(47) SENSE_GRAD(121) DIVIDE(28) RAND(46) EAT_LIGHT(254) TENDRIL(39)

## Instructions carried, share of the living
- EAT_LIGHT 99%, DIVIDE 99%, EAT_CORPSE 85%, IFGT 57%, IFLT 54%, TURN 54%, SENSE_GRAD 32%, MOVE 29%, LOADK 23%, SUB 23%, ATTACK 19%, SENSE_KIN 17%, SENSE_MATCH 15%, RAND 11%

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
