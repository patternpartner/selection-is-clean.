# Report 9: world pilot (seed 2001) at tick 900000

Write module 9 into `mods/9-<name>.js` following `lab/loop/PROTOCOL.md`. The world resumes the moment it appears.

## The population
- alive 1521 (inert twin 1634); mean program length 10.6 (twin 8.91); mean generation 4757.5
- distinct functional programs 234; the commonest holds 10.4%

## Income, mean per 1,000 ticks over the last 100000 ticks
- light eaten 26834.9 | corpses eaten 19310.5 | taken by attack 13299.9 (154.7 kills)
- module BROTH (op 32, since tick 100000): income 62.06, energy put in 0.00, executions 147360, carried by 9.0% now 2.4%, energy held in its fields 19.61
- module TANK (op 33, since tick 200000): income 10.47, energy put in 45.35, executions 58830, carried by 3.5% now 2.0%, energy held in its fields 74.95
- module PIPE (op 34, since tick 300000): income 2.61, energy put in 0.00, executions 76383, carried by 4.9% now 7.9%, energy held in its fields 0
- module SMELL (op 35, since tick 400000): income 0.00, energy put in 0.00, executions 112869, carried by 6.2% now 10.4%, energy held in its fields 0
- module HOARD (op 36, since tick 500000): income 292.41, energy put in 327.34, executions 26082, carried by 1.8% now 1.0%, energy held in its fields 244.33
- module TENDRIL (op 37, since tick 600000): income 725.64, energy put in 0.00, executions 398675, carried by 24.3% now 11.4%, energy held in its fields 0
- module SIGNAL (op 38, since tick 700000): income 0.00, energy put in 59.66, executions 130680, carried by 10.2% now 6.3%, energy held in its fields 0
- module FAT (op 39, since tick 800000): income 2682.19, energy put in 2742.74, executions 111953, carried by 7.2% now 10.2%, energy held in its fields 28.3

## Energy lying in the world now
- light 74.5, corpses 871.2, in organisms 9360.3

## The commonest programs now (functional: neutral markers dropped), share of the living
- 10.4%: MOVE(198) EAT_LIGHT(46) EAT_CORPSE(194) DIVIDE(255) IFLT(21) TURN(101) SENSE_MATCH(0) EAT_LIGHT(39) EAT_LIGHT(39) IFGT(83)
- 9.3%: MOVE(157) DIVIDE(204) TURN(95) IFLT(245) TURN(146) SENSE_KIN(81) EAT_LIGHT(72) EAT_CORPSE(77) EAT_LIGHT(241) EAT_LIGHT(117) IFGT(183)
- 7.4%: MOVE(228) LOADK(40) EAT_LIGHT(52) EAT_CORPSE(114) DIVIDE(202) IFLT(181) SHARE(197) SENSE_MATCH(74) EAT_LIGHT(118) EAT_LIGHT(234) IFGT(151)
- 6.0%: MOVE(157) DIVIDE(204) TURN(95) IFLT(245) TURN(146) SENSE_KIN(81) ATTACK(72) EAT_CORPSE(77) EAT_LIGHT(241) EAT_LIGHT(117) IFGT(183)
- 3.2%: DIVIDE(147) TENDRIL(102) FAT(110) SUB(236) EAT_CORPSE(219) EAT_LIGHT(180) IFGT(29)
- 2.5%: SMELL(84) PIPE(68) DIVIDE(101) ADD(218) EAT_CORPSE(141) LOADK(157) EAT_CORPSE(124) DIVIDE(150) EAT_LIGHT(215)
- 2.5%: EAT_LIGHT(52) EAT_CORPSE(114) DIVIDE(202) ATTACK(80) IFLT(181) TURN(244) SENSE_MATCH(74) EAT_LIGHT(118) TURN(198) IFGT(151)
- 2.3%: MOVE(228) EAT_LIGHT(52) TURN(124) EAT_CORPSE(139) DIVIDE(202) MUL(159) TURN(197) SENSE_MATCH(74) EAT_LIGHT(118) EAT_LIGHT(234) IFGT(151)

## Instructions carried, share of the living
- EAT_LIGHT 100%, DIVIDE 100%, EAT_CORPSE 92%, IFGT 81%, TURN 65%, IFLT 65%, MOVE 56%, SENSE_MATCH 54%, ATTACK 24%, SENSE_KIN 23%, LOADK 22%, SHARE 15%, SUB 15%, MUL 14%, ADD 9%, SENSE_E 8%, JMP 7%, SENSE_AHEAD 7%

## Modules so far
- 1: BROTH at tick 100000 (1-broth.js)
- 2: TANK at tick 200000 (2-tank.js)
- 3: PIPE at tick 300000 (3-pipe.js)
- 4: SMELL at tick 400000 (4-smell.js)
- 5: HOARD at tick 500000 (5-hoard.js)
- 6: TENDRIL at tick 600000 (6-tendril.js)
- 7: SIGNAL at tick 700000 (7-signal.js)
- 8: FAT at tick 800000 (8-fat.js)
